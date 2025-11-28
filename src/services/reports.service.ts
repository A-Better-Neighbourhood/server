/** @format */

import { Report } from "../generated/client/client.js";
import { prisma } from "../lib/db";
import { CreateReportType } from "../schemas/reports.schema";
import { ImageService } from "./image.service";
import { LocalStorageService } from "./storage";

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
  ): Promise<Report> {
    const { buffer, mimeType, extension } = this.parseBase64Image(data.image);
    const originalName = `report-${Date.now()}.${extension}`;

    const { url: imageUrl } = await this.imageService.uploadImage(
      buffer,
      originalName,
      mimeType,
      "reports"
    );

    return prisma.report.create({
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

  async getReports(): Promise<Report[]> {
    return prisma.report.findMany();
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
    return prisma.report.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
    });
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
}

export const reportsService = new ReportsService();
