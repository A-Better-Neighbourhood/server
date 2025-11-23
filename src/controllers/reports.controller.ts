/** @format */

import { RequestHandler } from "express";
import { reportsService } from "../services/reports.service";
import { CreateReportSchema } from "../schemas/reports.schema";
import { ResponseHandler } from "../utils/response";
import { ZodError } from "zod";

export const getReports: RequestHandler = async (req, res) => {
  try {
    const reports = await reportsService.getReports();

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
    const report = await reportsService.getReportById(reportId);

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

    const newReport = await reportsService.createReport(userId, {
      title,
      description,
      image,
      location,
    });

    return ResponseHandler.success(
      res,
      newReport,
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
    const reports = await reportsService.getUserReports(userId);

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
    const reports = await reportsService.getUnresolvedReports();
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
    const reports = await reportsService.getUserResolvedReports(userId);
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
    const report = await reportsService.markReportAsResolved(reportId);
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
    const reports = await reportsService.getUserUnresolvedReports(userId);
    return ResponseHandler.success(
      res,
      reports,
      "User unresolved reports retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};
