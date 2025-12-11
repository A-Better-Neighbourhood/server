/** @format */

import { prisma } from "../lib/db";
import { Report } from "../generated/client/client";

export class DeduplicationService {
  private readonly DEDUPLICATION_RADIUS_KM = 0.05; // 50 meters
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold

  /**
   * Check if a new report is similar to existing reports
   */
  async checkForDuplicates(
    latitude: number,
    longitude: number,
    imageHash: string,
    title: string,
    description?: string
  ): Promise<{
    isDuplicate: boolean;
    originalreport?: Report;
    similarity?: number;
  }> {
    try {
      // Step 1: Find candidate nearby reports using geospatial query
      const nearbyreports = await this.findNearbyreports(latitude, longitude);

      if (nearbyreports.length === 0) {
        return { isDuplicate: false };
      }

      // Step 2: Check image similarity using pHash
      const similarreport = await this.findSimilarreport(
        nearbyreports,
        imageHash,
        title,
        description
      );

      if (similarreport) {
        return {
          isDuplicate: true,
          originalreport: similarreport.report,
          similarity: similarreport.similarity,
        };
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
  private async findNearbyreports(
    latitude: number,
    longitude: number
  ): Promise<Report[]> {
    // Convert radius from km to meters for PostGIS
    const radiusInMeters = this.DEDUPLICATION_RADIUS_KM * 1000;

    // Use PostGIS ST_DWithin for efficient geospatial filtering
    const nearbyreports = await prisma.$queryRaw<Report[]>`
      SELECT * FROM "report" 
      WHERE status NOT IN ('RESOLVED', 'ARCHIVED')
        AND "isDuplicate" = false
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radiusInMeters}
        )
    `;

    return nearbyreports;
  }

  /**
   * Find similar report based on image hash and text similarity
   */
  private async findSimilarreport(
    candidateReports: Report[],
    newImageHash: string,
    newTitle: string,
    newDescription?: string
  ): Promise<{ report: Report; similarity: number } | null> {
    let bestMatch: { report: Report; similarity: number } | null = null;

    for (const report of candidateReports) {
      // Check image similarity using pHash
      const imageSimilarity = this.calculateImageSimilarity(
        newImageHash,
        report.imageHashes
      );

      // Check text similarity
      const textSimilarity = this.calculateTextSimilarity(
        newTitle,
        newDescription || "",
        report.title,
        report.description || ""
      );

      // Combined similarity score (weighted: 70% image, 30% text)
      const combinedSimilarity = imageSimilarity * 0.7 + textSimilarity * 0.3;

      if (
        combinedSimilarity >= this.SIMILARITY_THRESHOLD &&
        (!bestMatch || combinedSimilarity > bestMatch.similarity)
      ) {
        bestMatch = { report, similarity: combinedSimilarity };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate image similarity using pHash comparison
   */
  private calculateImageSimilarity(
    newHash: string,
    existingHashes: string[]
  ): number {
    if (!existingHashes.length) return 0;

    let maxSimilarity = 0;
    for (const hash of existingHashes) {
      const similarity = this.compareHashes(newHash, hash);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Compare two pHash values (simplified - in production use proper pHash library)
   */
  private compareHashes(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;

    let matches = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }

    return matches / hash1.length;
  }

  /**
   * Calculate text similarity using basic string comparison
   */
  private calculateTextSimilarity(
    title1: string,
    desc1: string,
    title2: string,
    desc2: string
  ): number {
    const text1 = (title1 + " " + desc1).toLowerCase();
    const text2 = (title2 + " " + desc2).toLowerCase();

    return this.jaccardSimilarity(text1, text2);
  }

  /**
   * Jaccard similarity for text comparison
   */
  private jaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(" "));
    const set2 = new Set(str2.split(" "));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Generate a simple hash for images (placeholder - use proper pHash in production)
   */
  static generateImageHash(imageBuffer: Buffer): string {
    // This is a simplified hash - in production, use proper pHash libraries
    const crypto = require("crypto");
    return crypto.createHash("md5").update(imageBuffer).digest("hex");
  }
}

export const deduplicationService = new DeduplicationService();
