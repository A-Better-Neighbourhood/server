/** @format */

import { prisma } from "../lib/db";
import { Report } from "../generated/client/client";

export class DeduplicationService {
  private readonly DEDUPLICATION_RADIUS_KM = 0.05; // 50 meters

  /**
   * Check if a new report is similar to existing reports
   */
  async checkForDuplicates(
    latitude: number,
    longitude: number
  ): Promise<{
    isDuplicate: boolean;
    originalreport?: Report;
    similarity?: number;
  }> {
    try {
      // Step 1: Find candidate nearby reports using geospatial query
      const nearbyreports = await this.findNearbyReports(latitude, longitude);

      if (nearbyreports.length === 0) {
        return { isDuplicate: false };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      throw error;
    }
  }

  /**
   * Merge a duplicate report into an original report
   */
  async mergeReports(
    duplicateReportId: string,
    originalReportId: string,
    mergedBy?: string
  ): Promise<Report> {
    try {
      const duplicateReport = await prisma.report.findUnique({
        where: { id: duplicateReportId },
      });

      const originalReport = await prisma.report.findUnique({
        where: { id: originalReportId },
      });

      if (!duplicateReport || !originalReport) {
        throw new Error("report not found for merging");
      }

      // Begin transaction to merge reports
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mark duplicate as archived
        await tx.report.update({
          where: { id: duplicateReportId },
          data: {
            status: "ARCHIVED",
            isDuplicate: true,
            parentReportId: originalReportId,
          },
        });

        // 2. Update original report with merged data
        const originalImages = Array.isArray(originalReport.imageUrl)
          ? originalReport.imageUrl
          : [originalReport.imageUrl];

        const duplicateImages = Array.isArray(duplicateReport.imageUrl)
          ? duplicateReport.imageUrl
          : [duplicateReport.imageUrl];
        const mergedImages = [...originalImages, ...duplicateImages];
        const mergedUpvotes = originalReport.upvotes + duplicateReport.upvotes;
        const mergedReportIds = [
          ...(originalReport.mergedReportIds || []),
          duplicateReportId,
        ];

        const updatedOriginal = await tx.report.update({
          where: { id: originalReportId },
          data: {
            imageUrl: JSON.stringify(mergedImages),
            upvotes: mergedUpvotes,
            mergedReportIds: mergedReportIds,
          },
        });

        // 3. Log activities for both reports
        await tx.activity.createMany({
          data: [
            {
              reportId: originalReportId,
              type: "ISSUE_MERGED",
              message: `report merged with duplicate report (ID: ${duplicateReportId})`,
              createdById: mergedBy,
            },
            {
              reportId: duplicateReportId,
              type: "DUPLICATE_ARCHIVED",
              message: `report marked as duplicate of ${originalReportId}`,
              createdById: mergedBy,
            },
          ],
        });

        return updatedOriginal;
      });

      return result;
    } catch (error) {
      console.error("Error merging reports:", error);
      throw error;
    }
  }

  /**
   * Find reports within deduplication radius using PostGIS
   */
  private async findNearbyReports(
    latitude: number,
    longitude: number
  ): Promise<Report[]> {
    // Convert radius from km to meters for PostGIS
    const radiusInMeters = this.DEDUPLICATION_RADIUS_KM * 1000;

    // Use PostGIS ST_DWithin for efficient geospatial filtering
    const nearbyReports = await prisma.$queryRaw<Report[]>`
      SELECT * FROM "reports" 
      WHERE status NOT IN ('RESOLVED', 'ARCHIVED')
        AND "isDuplicate" = false
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radiusInMeters}
        )
    `;

    return nearbyReports;
  }
}

export const deduplicationService = new DeduplicationService();
