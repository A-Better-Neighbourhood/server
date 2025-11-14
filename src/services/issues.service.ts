/** @format */

import { Issue } from "@prisma/client";
import { prisma } from "../lib/db";
import { CreateReportType } from "../schemas/issues.schema";
import { ImageService } from "./image.service";
import { LocalStorageService } from "./storage";

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

  async createIssue(creatorId: string, data: CreateReportType): Promise<Issue> {
    const { buffer, mimeType, extension } = this.parseBase64Image(data.image);
    const originalName = `issue-${Date.now()}.${extension}`;

    const { url: imageUrl } = await this.imageService.uploadImage(
      buffer,
      originalName,
      mimeType,
      "issues"
    );

    return prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl,
        latitude: data.location[0],
        longitude: data.location[1],
        creator: {
          connect: { id: creatorId },
        },
      },
    });
  }

  async getIssues(): Promise<Issue[]> {
    return prisma.issue.findMany();
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
    return prisma.issue.update({
      where: { id: issueId },
      data: { status: "RESOLVED" },
    });
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
}

export const issuesService = new IssuesService();
