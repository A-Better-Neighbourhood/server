/** @format */

import { Issue } from "@prisma/client";
import { prisma } from "../lib/db";
import { issuesService } from "./issues.service";

export class DeduplicationService {
  private readonly DEDUPLICATION_RADIUS_KM = 0.05; // 50 meters
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold

  /**
   * Check if a new report is similar to existing issues
   */
  async checkForDuplicates(
    latitude: number,
    longitude: number,
    imageHash: string,
    title: string,
    description?: string
  ): Promise<{
    isDuplicate: boolean;
    originalIssue?: Issue;
    similarity?: number;
  }> {
    try {
      // Step 1: Find candidate nearby issues using geospatial query
      const nearbyIssues = await this.findNearbyIssues(latitude, longitude);

      if (nearbyIssues.length === 0) {
        return { isDuplicate: false };
      }

      // Step 2: Check image similarity using pHash
      const similarIssue = await this.findSimilarIssue(
        nearbyIssues,
        imageHash,
        title,
        description
      );

      if (similarIssue) {
        return {
          isDuplicate: true,
          originalIssue: similarIssue.issue,
          similarity: similarIssue.similarity,
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      throw error;
    }
  }

  /**
   * Merge a duplicate issue into an original issue
   */
  async mergeIssues(
    duplicateIssueId: string,
    originalIssueId: string,
    mergedBy?: string
  ): Promise<Issue> {
    try {
      const duplicateIssue = await prisma.issue.findUnique({
        where: { id: duplicateIssueId },
      });

      const originalIssue = await prisma.issue.findUnique({
        where: { id: originalIssueId },
      });

      if (!duplicateIssue || !originalIssue) {
        throw new Error("Issue not found for merging");
      }

      // Begin transaction to merge issues
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mark duplicate as archived
        await tx.issue.update({
          where: { id: duplicateIssueId },
          data: {
            status: "ARCHIVED",
            isDuplicate: true,
            parentIssueId: originalIssueId,
          },
        });

        // 2. Update original issue with merged data
        const originalImages = Array.isArray(originalIssue.imageUrl)
          ? originalIssue.imageUrl
          : [originalIssue.imageUrl];

        const duplicateImages = Array.isArray(duplicateIssue.imageUrl)
          ? duplicateIssue.imageUrl
          : [duplicateIssue.imageUrl];

        const mergedImages = [...originalImages, ...duplicateImages];
        const mergedUpvotes = originalIssue.upvotes + duplicateIssue.upvotes;
        const mergedIssueIds = [
          ...(originalIssue.mergedIssueIds || []),
          duplicateIssueId,
        ];

        const updatedOriginal = await tx.issue.update({
          where: { id: originalIssueId },
          data: {
            imageUrl: JSON.stringify(mergedImages),
            upvotes: mergedUpvotes,
            mergedIssueIds: mergedIssueIds,
          },
        });

        // 3. Log activities for both issues
        await tx.activity.createMany({
          data: [
            {
              issueId: originalIssueId,
              type: "ISSUE_MERGED",
              message: `Issue merged with duplicate report (ID: ${duplicateIssueId})`,
              createdById: mergedBy,
            },
            {
              issueId: duplicateIssueId,
              type: "DUPLICATE_ARCHIVED",
              message: `Issue marked as duplicate of ${originalIssueId}`,
              createdById: mergedBy,
            },
          ],
        });

        return updatedOriginal;
      });

      return result;
    } catch (error) {
      console.error("Error merging issues:", error);
      throw error;
    }
  }

  /**
   * Find issues within deduplication radius using PostGIS
   */
  private async findNearbyIssues(
    latitude: number,
    longitude: number
  ): Promise<Issue[]> {
    // Convert radius from km to meters for PostGIS
    const radiusInMeters = this.DEDUPLICATION_RADIUS_KM * 1000;

    // Use PostGIS ST_DWithin for efficient geospatial filtering
    const nearbyIssues = await prisma.$queryRaw<Issue[]>`
      SELECT * FROM "Issue" 
      WHERE status NOT IN ('RESOLVED', 'ARCHIVED')
        AND "isDuplicate" = false
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radiusInMeters}
        )
    `;

    return nearbyIssues;
  }

  /**
   * Find similar issue based on image hash and text similarity
   */
  private async findSimilarIssue(
    candidateIssues: Issue[],
    newImageHash: string,
    newTitle: string,
    newDescription?: string
  ): Promise<{ issue: Issue; similarity: number } | null> {
    let bestMatch: { issue: Issue; similarity: number } | null = null;

    for (const issue of candidateIssues) {
      // Check image similarity using pHash
      const imageSimilarity = this.calculateImageSimilarity(
        newImageHash,
        issue.imageHashes
      );

      // Check text similarity
      const textSimilarity = this.calculateTextSimilarity(
        newTitle,
        newDescription || "",
        issue.title,
        issue.description || ""
      );

      // Combined similarity score (weighted: 70% image, 30% text)
      const combinedSimilarity = imageSimilarity * 0.7 + textSimilarity * 0.3;

      if (
        combinedSimilarity >= this.SIMILARITY_THRESHOLD &&
        (!bestMatch || combinedSimilarity > bestMatch.similarity)
      ) {
        bestMatch = { issue, similarity: combinedSimilarity };
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
