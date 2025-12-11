/** @format */

import { RequestHandler } from "express";
import { reportService } from "../services/reports.service";
import {
  CreateReportSchema,
  NearbyIssuesSchema,
} from "../schemas/reports.schema";
import { ResponseHandler } from "../utils/response";
import { ZodError } from "zod";

export const getReports: RequestHandler = async (req, res) => {
  try {
    const reports = await reportService.getReports();

    return ResponseHandler.success(
      res,
      reports,
      "Reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getReportById: RequestHandler = async (req, res) => {
  const { reportId } = req.params;
  try {
    const report = await reportService.getReportById(reportId);

    if (!report) {
      return ResponseHandler.notFound(res, "Report not found");
    }

    return ResponseHandler.success(
      res,
      report,
      "Report retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const createReport: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const { title, description, image, location } = CreateReportSchema.parse(
      req.body
    );

    const result = await reportService.createReport(userId, {
      title,
      description,
      image,
      location,
    });

    if (result.isDuplicate) {
      return ResponseHandler.success(
        res,
        {
          report: result.report,
          deduplication: {
            isDuplicate: true,
            originalReport: result.originalReport,
            merged: result.merged,
          },
        },
        "Report created and merged with existing duplicate",
        201
      );
    }

    return ResponseHandler.success(
      res,
      {
        report: result.report,
        deduplication: {
          isDuplicate: false,
          merged: false,
        },
      },
      "Report created successfully",
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseHandler.badRequest(res, "Validation error", error.issues);
    }
    console.log(error);
    return ResponseHandler.serverError(res);
  }
};

export const getUserReports: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const reports = await reportService.getUserReports(userId);

    return ResponseHandler.success(
      res,
      reports,
      "User reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const updateReport: RequestHandler = async (req, res) => {};

export const getUnresolvedReports: RequestHandler = async (req, res) => {
  try {
    const reports = await reportService.getUnresolvedReports();
    return ResponseHandler.success(
      res,
      reports,
      "Unresolved reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getUserResolvedReports: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }
  try {
    const reports = await reportService.getUserResolvedReports(userId);
    return ResponseHandler.success(
      res,
      reports,
      "User resolved reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};
export const markReportAsResolved: RequestHandler = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const report = await reportService.markReportAsResolved(reportId);
    if (!report) {
      return ResponseHandler.notFound(res, "Report not found");
    }
    return ResponseHandler.success(
      res,
      report,
      "Report marked as resolved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getUserUnresolvedReports: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }
  try {
    const reports = await reportService.getUserUnresolvedReports(userId);
    return ResponseHandler.success(
      res,
      reports,
      "User unresolved reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

// Debug endpoints (only in development)
export const getModelAnalysis: RequestHandler = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return ResponseHandler.notFound(
      res,
      "Endpoint not available in production"
    );
  }

  const { reportId } = req.params;
  try {
    const analysis = await reportService.getModelAnalysis(reportId);
    if (!analysis) {
      return ResponseHandler.notFound(
        res,
        "Model analysis not found for this report"
      );
    }

    return ResponseHandler.success(
      res,
      analysis,
      "Model analysis retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getModelHealth: RequestHandler = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return ResponseHandler.notFound(
      res,
      "Endpoint not available in production"
    );
  }

  try {
    const isHealthy = await reportService.checkModelHealth();
    return ResponseHandler.success(
      res,
      { healthy: isHealthy },
      isHealthy ? "Model API is healthy" : "Model API is not responding"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getNearbyReports: RequestHandler = async (req, res) => {
  try {
    // Validate and parse query parameters
    const { lat, lng, radius } = NearbyIssuesSchema.parse(req.query);

    // Call service to get nearby reports
    const nearbyReports = await reportService.getNearbyReports(
      lat,
      lng,
      radius
    );

    // Return formatted response
    return ResponseHandler.success(
      res,
      {
        reports: nearbyReports,
        metadata: {
          location: { latitude: lat, longitude: lng },
          radiusKm: radius,
          count: nearbyReports.length,
        },
      },
      `Found ${nearbyReports.length} report${
        nearbyReports.length !== 1 ? "s" : ""
      } within ${radius}km`
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseHandler.badRequest(
        res,
        "Invalid query parameters",
        error.issues
      );
    }
    console.error("Get nearby reports error:", error);
    return ResponseHandler.serverError(res);
  }
};

export const getReportActivities: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ResponseHandler.badRequest(res, "Report ID is required");
    }

    const activities = await reportService.getReportActivities(id);

    return ResponseHandler.success(
      res,
      activities,
      "Report activities retrieved successfully"
    );
  } catch (error: any) {
    console.error("Get report activities error:", error);

    if (error.message === "Report not found") {
      return ResponseHandler.notFound(res, "Report not found");
    }

    return ResponseHandler.serverError(res);
  }
};

export const addComment: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  const { id: reportId } = req.params;
  const { text } = req.body;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  if (!text || text.trim() === "") {
    return ResponseHandler.badRequest(res, "Comment text is required");
  }

  try {
    const comment = await reportService.addComment(reportId, userId, text);

    return ResponseHandler.success(
      res,
      comment,
      "Comment added successfully",
      201
    );
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res);
  }
};

export const getComments: RequestHandler = async (req, res) => {
  const { id: reportId } = req.params;

  try {
    const comments = await reportService.getComments(reportId);

    return ResponseHandler.success(
      res,
      comments,
      "Comments retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const upvoteReport: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: reportId } = req.params;

    if (!userId) {
      return ResponseHandler.unauthorized(res);
    }

    const updatedReport = await reportService.upvoteReport(reportId, userId);

    if (updatedReport === null) {
      return ResponseHandler.badRequest(
        res,
        "You have already upvoted this report"
      );
    }

    return ResponseHandler.success(
      res,
      updatedReport,
      "Report upvoted successfully"
    );
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res);
  }
};
