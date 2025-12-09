/** @format */

import { Issue } from "@prisma/client";
import { prisma } from "../lib/db";
import { CreateReportType } from "../schemas/issues.schema";
import { ImageService } from "./image.service";
import { LocalStorageService } from "./storage";
import { deduplicationService, DeduplicationService } from "./deduplication.service";

export class IssuesService {
  private imageService: ImageService;

  constructor() {
    const localStorage = new LocalStorageService("uploads", "/uploads");
    this.imageService = new ImageService(localStorage);
  }

  /**
   * Parse base64 image string and extract buffer and metadata
   */
  private parseBase64Image(base64String: string): {
    buffer: Buffer;
    mimeType: string;
    extension: string;
  } {
    const matches = base64String.match(
      /^data:image\/([a-zA-Z+]+);base64,(.+)$/
    );

    if (matches) {
      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      const extension = matches[1].replace("+", "");

      return { buffer, mimeType, extension };
    }

    const buffer = Buffer.from(base64String, "base64");
    return {
      buffer,
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  }

  async createIssue(creatorId: string, data: CreateReportType): Promise<{
    issue: Issue;
    isDuplicate: boolean;
    originalIssue?: Issue;
    merged?: boolean;
  }> {
    const { buffer, mimeType, extension } = this.parseBase64Image(data.image);
    const originalName = `issue-${Date.now()}.${extension}`;

    // Upload image and generate hash
    const { url: imageUrl } = await this.imageService.uploadImage(
      buffer,
      originalName,
      mimeType,
      "issues"
    );

    const imageHash = DeduplicationService.generateImageHash(buffer);

    // Check for duplicates before creating the issue
    const duplicateCheck = await deduplicationService.checkForDuplicates(
      data.location[0], // latitude
      data.location[1], // longitude
      imageHash,
      data.title,
      data.description
    );

    // If duplicate found, merge with existing issue
    if (duplicateCheck.isDuplicate && duplicateCheck.originalIssue) {
      // Create the new issue first (as duplicate)
      const duplicateIssue = await prisma.issue.create({
        data: {
          title: data.title,
          description: data.description,
          imageUrl: JSON.stringify([imageUrl]),
          latitude: data.location[0],
          longitude: data.location[1],
          imageHashes: [imageHash],
          isDuplicate: true,
          status: "ARCHIVED",
          parentIssueId: duplicateCheck.originalIssue.id,
          creator: {
            connect: { id: creatorId },
          },
        },
      });

      // Merge with original issue
      const mergedIssue = await deduplicationService.mergeIssues(
        duplicateIssue.id,
        duplicateCheck.originalIssue.id,
        creatorId
      );

      // Log activities
      await this.logActivity(
        duplicateIssue.id,
        "CREATED",
        `Issue "${data.title}" was created and identified as duplicate`,
        creatorId
      );

      return {
        issue: mergedIssue,
        isDuplicate: true,
        originalIssue: duplicateCheck.originalIssue,
        merged: true,
      };
    }

    // Create new unique issue
    const newIssue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: JSON.stringify([imageUrl]),
        latitude: data.location[0],
        longitude: data.location[1],
        imageHashes: [imageHash],
        upvotes: 1, // Auto-upvote by creator
        creator: {
          connect: { id: creatorId },
        },
      },
    });

    // Log the issue creation activity
    await this.logActivity(
      newIssue.id,
      "CREATED",
      `Issue "${data.title}" was created`,
      creatorId
    );

    return {
      issue: newIssue,
      isDuplicate: false,
      merged: false,
    };
  }

  async getIssues(): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: {
        isDuplicate: false, // Exclude duplicates from public view
        status: {
          not: "ARCHIVED", // Also exclude archived issues
        },
      },
      include: {
        creator: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return prisma.issue.findUnique({
      where: { id: issueId },
      include: { creator: true },
    });
  }

  async updateIssue(
    issueId: string,
    title: string,
    description: string
  ): Promise<Issue> {
    return prisma.issue.update({
      where: { id: issueId },
      data: { title, description },
    });
  }

  async getUserIssues(userId: string): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { creatorId: userId },
    });
  }

  async getUnresolvedIssues(): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { status: "PENDING" },
    });
  }

  async getUserResolvedIssues(userId: string): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { creatorId: userId, status: "RESOLVED" },
    });
  }

  async markIssueAsResolved(issueId: string): Promise<Issue> {
    const resolvedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { status: "RESOLVED" },
    });

    // Log the resolution activity
    await this.logActivity(
      issueId,
      "STATUS_UPDATED",
      "Issue has been marked as resolved"
    );

    return resolvedIssue;
  }

  async getUserUnresolvedIssues(userId: string) {
    return prisma.issue.findMany({
      where: {
        creatorId: userId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });
  }

  async getNearbyIssues(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<
    (Issue & { distance: number; creator: { id: string; fullName: string } })[]
  > {
    try {
      // Validate input parameters
      if (!latitude || !longitude) {
        throw new Error("Latitude and longitude are required");
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error("Latitude must be between -90 and 90");
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error("Longitude must be between -180 and 180");
      }

      if (radiusKm <= 0 || radiusKm > 100) {
        throw new Error("Radius must be between 0.1 and 100 kilometers");
      }

      // Get all unresolved issues with creator information
      const allIssues = await prisma.issue.findMany({
        where: {
          status: {
            not: "RESOLVED", // Exclude resolved issues
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc", // Most recent first
        },
      });

      // Calculate distance using Haversine formula and filter within radius
      const nearbyIssues = allIssues
        .map((issue) => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            issue.latitude,
            issue.longitude
          );
          return {
            ...issue,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          };
        })
        .filter((issue) => issue.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

      return nearbyIssues;
    } catch (error) {
      console.error("Error fetching nearby issues:", error);
      throw error;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async logActivity(
    issueId: string,
    type: string,
    message: string,
    userId?: string
  ) {
    return prisma.activity.create({
      data: {
        issueId,
        type,
        message,
        createdById: userId || null,
      },
    });
  }

  /**
   * Get all activities for a specific issue
   */
  async getIssueActivities(issueId: string) {
    try {
      // First check if the issue exists
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: { id: true },
      });

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Get all activities for the issue
      const activities = await prisma.activity.findMany({
        where: { issueId },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc", // Most recent first
        },
      });

      return activities;
    } catch (error) {
      console.error("Error fetching issue activities:", error);
      throw error;
    }
  }

  async addComment(issueId: string, userId: string, text: string) {
    return prisma.comment.create({
      data: {
        issueId,
        userId,
        text,
      },
    });
  }

  async getComments(issueId: string) {
    return prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  async upvoteIssue(issueId: string, userId: string) {
  // Check if already upvoted
  const already = await prisma.upvote.findFirst({
    where: { issueId, userId },
  });

  if (already) return null; // user already upvoted

  await prisma.upvote.create({
    data: { issueId, userId },
  });

  // Increase count column if you maintain one
  return prisma.issue.update({
    where: { id: issueId },
    data: {
      upvoteCount: { increment: 1 },
    },
  });
}




}

export const issuesService = new IssuesService();
