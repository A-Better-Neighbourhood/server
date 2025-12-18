/** @format */

import { prisma } from "../lib/db";
import { Report } from "../generated/client/client";

export class DeduplicationService {
  private readonly DEDUPLICATION_RADIUS_KM = 0.005; // 5 meters

  /**
   * Check if a new report is similar to existing reports
   * @param latitude Report latitude
   * @param longitude Report longitude
   * @param category Report category
   * @returns Object indicating if duplicate found and the original report
   */
  async checkForDuplicates(
    latitude: number,
    longitude: number,
    category: string
  ): Promise<{
    isDuplicate: boolean;
    originalReport?: Report;
    similarity?: number;
  }> {
    try {
      // Find candidate nearby reports using geospatial query filtered by category
      const nearbyReports = await this.findNearbyReports(
        latitude,
        longitude,
        category
      );

      if (nearbyReports.length === 0) {
        return { isDuplicate: false };
      }

      // Find the earliest created report (original)
      const originalReport = nearbyReports.reduce((earliest, current) => {
        return new Date(current.createdAt) < new Date(earliest.createdAt)
          ? current
          : earliest;
      });

      return {
        isDuplicate: true,
        originalReport,
      };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      throw error;
    }
  }

  /**
   * Merge a duplicate report into an original report
   * @param duplicateReportId ID of the duplicate report
   * @param originalReportId ID of the original report
   * @param mergedBy Optional user ID who performed the merge
   * @returns Updated original report
   */
  async mergeReports(
    duplicateReportId: string,
    originalReportId: string,
    mergedBy?: string
  ): Promise<Report> {
    try {
      // Fetch both reports
      const duplicateReport = await prisma.report.findUnique({
        where: { id: duplicateReportId },
      });

      const originalReport = await prisma.report.findUnique({
        where: { id: originalReportId },
      });

      if (!duplicateReport || !originalReport) {
        throw new Error("Report not found");
      }

      // Begin transaction to merge reports
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mark duplicate as archived
        await tx.report.update({
          where: { id: duplicateReportId },
          data: {
            status: "ARCHIVED",
            isDuplicate: true,
            originalReportId: originalReportId,
            mergedAt: new Date(),
          },
        });

        // 2. Merge images from duplicate to original
        const mergedImages = [
          ...originalReport.imageUrl,
          ...duplicateReport.imageUrl,
        ];

        // 3. Update original report with merged data and increment duplicate count
        const updatedOriginal = await tx.report.update({
          where: { id: originalReportId },
          data: {
            imageUrl: mergedImages,
            duplicateCount: {
              increment: 1,
            },
          },
        });

        // 4. Transfer all upvotes from duplicate to original
        await tx.upvote.updateMany({
          where: { reportId: duplicateReportId },
          data: { reportId: originalReportId },
        });

        // 5. Create activities for both reports
        await tx.activity.createMany({
          data: [
            {
              reportId: originalReportId,
              type: "DUPLICATE_MERGED",
              actorType: "SYSTEM",
              content: `Duplicate report merged (ID: ${duplicateReportId})`,
              createdById: mergedBy,
            },
            {
              reportId: duplicateReportId,
              type: "MARKED_AS_DUPLICATE",
              actorType: "SYSTEM",
              content: `Report marked as duplicate of ${originalReportId}`,
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
   * @param latitude Search center latitude
   * @param longitude Search center longitude
   * @param category Report category to filter by
   * @returns Array of nearby reports that are not resolved, archived, or already duplicates
   */
  private async findNearbyReports(
    latitude: number,
    longitude: number,
    category: string
  ): Promise<Report[]> {
    // Convert radius from km to meters for PostGIS
    const radiusInMeters = this.DEDUPLICATION_RADIUS_KM * 1000;

    // Use PostGIS ST_DWithin for efficient geospatial filtering
    // ST_DWithin with geography type automatically uses meters for distance
    const nearbyReports = await prisma.$queryRaw<Report[]>`
      SELECT * FROM "reports" 
      WHERE status NOT IN ('RESOLVED', 'ARCHIVED')
        AND "isDuplicate" = false
        AND category = ${category}
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusInMeters}
        )
      ORDER BY "createdAt" ASC
    `;

    return nearbyReports;
  }
}

export const deduplicationService = new DeduplicationService();
