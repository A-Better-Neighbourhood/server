/** @format */

import { Report } from "../generated/client/client";
import { prisma } from "../lib/db";
import { CreateReportType } from "../schemas/reports.schema";
import { ImageService } from "./image.service";
import { LocalStorageService } from "./storage";
import { modelService, ModelPredictionResult } from "./model/model.service";
import {
  deduplicationService,
  DeduplicationService,
} from "./deduplication.service";

export class ReportsService {
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

  async createReport(
    creatorId: string,
    data: CreateReportType
  ): Promise<{
    report: Report;
    isDuplicate: boolean;
    originalReport?: Report;
    merged?: boolean;
  }> {
    const { buffer, mimeType, extension } = this.parseBase64Image(data.image);
    const originalName = `report-${Date.now()}.${extension}`;

    // Upload image and generate hash
    const { url: imageUrl } = await this.imageService.uploadImage(
      buffer,
      originalName,
      mimeType,
      "reports"
    );

    // Check for duplicates before creating the report
    const duplicateCheck = await deduplicationService.checkForDuplicates(
      data.location[0],
      data.location[1]
    );

    // If duplicate found, merge with existing report
    // Note: deduplicationService returns originalReport for backward compatibility
    if (duplicateCheck.isDuplicate && duplicateCheck.originalreport) {
      const originalReport = duplicateCheck.originalreport as any;

      // Create the new report first (as duplicate)
      const duplicateReport = await prisma.report.create({
        data: {
          title: data.title,
          description: data.description,
          imageUrl: [imageUrl],
          latitude: data.location[0],
          longitude: data.location[1],
          isDuplicate: true,
          status: "ARCHIVED",
          parentReportId: originalReport.id,
          creatorId: creatorId,
        },
      });

      // Merge with original report using mergeReports (renamed to mergeReports conceptually)
      const mergedReport = (await deduplicationService.mergeReports(
        duplicateReport.id,
        originalReport.id,
        creatorId
      )) as any;

      // Log activities
      await this.logActivity(
        duplicateReport.id,
        "CREATED",
        `Report "${data.title}" was created and identified as duplicate`,
        creatorId
      );

      return {
        report: mergedReport,
        isDuplicate: true,
        originalReport: originalReport,
        merged: true,
      };
    }

    // Create new unique report
    const newReport = await prisma.report.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: [imageUrl],
        latitude: data.location[0],
        longitude: data.location[1],
        upvotes: 1, // Auto-upvote by creator
        creator: {
          connect: { id: creatorId },
        },
      },
    });

    // Analyze the image with the model (async, don't wait for it)
    modelService
      .analyzeImage(buffer, originalName, mimeType, newReport.id)
      .catch((error) => {
        console.error(
          `Failed to analyze image for report ${newReport.id}:`,
          error
        );
      });

    // Log the report creation activity
    await this.logActivity(
      newReport.id,
      "CREATED",
      `Report "${data.title}" was created`,
      creatorId
    );

    return {
      report: newReport,
      isDuplicate: false,
      merged: false,
    };
  }

  async getReports(): Promise<Report[]> {
    return prisma.report.findMany({
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

  async getReportById(reportId: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id: reportId },
      include: { creator: true },
    });
  }

  async updateReport(
    reportId: string,
    title: string,
    description: string
  ): Promise<Report> {
    return prisma.report.update({
      where: { id: reportId },
      data: { title, description },
    });
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return prisma.report.findMany({
      where: { creatorId: userId },
    });
  }

  async getUnresolvedReports(): Promise<Report[]> {
    return prisma.report.findMany({
      where: { status: "PENDING" },
    });
  }

  async getUserResolvedReports(userId: string): Promise<Report[]> {
    return prisma.report.findMany({
      where: { creatorId: userId, status: "RESOLVED" },
    });
  }

  async markReportAsResolved(reportId: string): Promise<Report> {
    const resolvedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
    });

    // Log the resolution activity
    await this.logActivity(
      reportId,
      "STATUS_UPDATED",
      "Report has been marked as resolved"
    );

    return resolvedReport;
  }

  async getUserUnresolvedReports(userId: string) {
    return prisma.report.findMany({
      where: {
        creatorId: userId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });
  }

  /**
   * Get model analysis result for a report (for debugging)
   */
  async getModelAnalysis(
    reportId: string
  ): Promise<ModelPredictionResult | null> {
    return modelService.getResultByReportId(reportId);
  }

  /**
   * Get annotated image path for a report (for debugging)
   */
  async getAnnotatedImagePath(reportId: string): Promise<string | null> {
    return modelService.getAnnotatedImagePath(reportId);
  }

  /**
   * Check if model API is healthy
   */
  async checkModelHealth(): Promise<boolean> {
    return modelService.checkHealth();
  }

  /**
   * Get nearby reports using PostGIS spatial query
   */
  async getNearbyReports(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<
    (Report & { distance: number; creator: { id: string; fullName: string } })[]
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

      // Use PostGIS ST_DWithin for efficient spatial query
      const nearbyReports = await prisma.$queryRaw<any[]>`
        SELECT 
          r.*,
          u.id as creator_id,
          u."fullName" as creator_name,
          ST_Distance(
            ST_GeogFromText('POINT(' || ${longitude} || ' ' || ${latitude} || ')'),
            ST_GeogFromText('POINT(' || r.longitude || ' ' || r.latitude || ')')
          ) / 1000 as distance
        FROM "reports" r
        JOIN "users" u ON r."creatorId" = u.id
        WHERE 
          r.status != 'RESOLVED'
          AND ST_DWithin(
            ST_GeogFromText('POINT(' || ${longitude} || ' ' || ${latitude} || ')'),
            ST_GeogFromText('POINT(' || r.longitude || ' ' || r.latitude || ')'),
            ${radiusKm * 1000}
          )
        ORDER BY distance ASC
      `;

      return nearbyReports.map((report: any) => ({
        ...report,
        distance: Math.round(report.distance * 100) / 100,
        creator: {
          id: report.creator_id,
          fullName: report.creator_name,
        },
      }));
    } catch (error) {
      console.error("Error fetching nearby reports:", error);
      throw error;
    }
  }

  /**
   * Log activity for a report
   */
  async logActivity(
    reportId: string,
    type: string,
    message: string,
    userId?: string
  ) {
    return prisma.activity.create({
      data: {
        reportId: reportId,
        type,
        message,
        createdById: userId || null,
      },
    });
  }

  /**
   * Get all activities for a specific report
   */
  async getReportActivities(reportId: string) {
    try {
      // First check if the report exists
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: { id: true },
      });

      if (!report) {
        throw new Error("Report not found");
      }

      // Get all activities for the report
      const activities = await prisma.activity.findMany({
        where: { reportId: reportId },
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
      console.error("Error fetching report activities:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a report
   */
  async addComment(reportId: string, userId: string, text: string) {
    return prisma.comment.create({
      data: {
        reportId: reportId,
        userId,
        text,
      },
    });
  }

  /**
   * Get all comments for a report
   */
  async getComments(reportId: string) {
    return prisma.comment.findMany({
      where: { reportId: reportId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  /**
   * Upvote a report
   */
  async upvoteReport(reportId: string, userId: string) {
    // Check if already upvoted
    const already = await prisma.upvote.findFirst({
      where: { reportId: reportId, userId },
    });

    if (already) return null; // user already upvoted

    await prisma.upvote.create({
      data: { reportId: reportId, userId },
    });

    // Increase count column if you maintain one
    return prisma.report.update({
      where: { id: reportId },
      data: {
        upvotes: { increment: 1 },
      },
    });
  }
}

export const reportService = new ReportsService();
