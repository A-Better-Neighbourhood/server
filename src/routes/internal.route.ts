/** @format */

import { Router } from "express";
import { RequestHandler } from "express";
import { deduplicationService } from "../services/deduplication.service";
import { ResponseHandler } from "../utils/response";
import { prisma } from "../lib/db";
import { z } from "zod";

const DedupeCheckSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
});

const DedupeMergeSchema = z.object({
  sourceId: z.string().min(1, "Source issue ID is required"),
  targetId: z.string().min(1, "Target issue ID is required"),
});

/**
 * Internal endpoint to check if a report is a duplicate
 * POST /internal/dedupe/check
 */
export const checkDuplicate: RequestHandler = async (req, res) => {
  try {
    const { reportId } = DedupeCheckSchema.parse(req.body);

    // Get the report details to check for duplicates
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return ResponseHandler.notFound(res, "Report not found");
    }

    // Extract image hash (assuming it's stored in imageHashes array)
    const imageHash = report.imageHashes?.[0] || "";

    const result = await deduplicationService.checkForDuplicates(
      report.latitude,
      report.longitude,
      imageHash,
      report.title,
      report.description || undefined
    );

    return ResponseHandler.success(res, result, "Duplicate check completed");
  } catch (error: any) {
    if (error.name === "ZodError") {
      return ResponseHandler.badRequest(
        res,
        "Invalid request data",
        error.errors
      );
    }
    console.error("Check duplicate error:", error);
    return ResponseHandler.serverError(res);
  }
};

/**
 * Internal endpoint to merge two issues
 * POST /internal/dedupe/merge
 */
export const mergeIssues: RequestHandler = async (req, res) => {
  try {
    const { sourceId, targetId } = DedupeMergeSchema.parse(req.body);

    const mergedIssue = await deduplicationService.mergeReports(
      sourceId,
      targetId
    );

    return ResponseHandler.success(
      res,
      mergedIssue,
      "Issues merged successfully"
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return ResponseHandler.badRequest(
        res,
        "Invalid request data",
        error.errors
      );
    }
    if (error.message === "Issue not found for merging") {
      return ResponseHandler.notFound(res, error.message);
    }
    console.error("Merge issues error:", error);
    return ResponseHandler.serverError(res);
  }
};

const internalRouter = Router();

internalRouter.post("/dedupe/check", checkDuplicate);
internalRouter.post("/dedupe/merge", mergeIssues);

export { internalRouter };
