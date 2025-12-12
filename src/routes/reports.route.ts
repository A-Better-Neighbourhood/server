/** @format */

import { authMiddleware } from "./../middlewares/auth.middleware";
import { Router } from "express";
import {
  getReports,
  getReportById,
  createReport,
  getUserReports,
  updateReport,
  getUnresolvedReports,
  getUserResolvedReports,
  markReportAsResolved,
  getUserUnresolvedReports,
  getModelAnalysis,
  getModelHealth,
  getNearbyReports,
  getReportActivities,
  addComment,
  upvoteReport,
} from "../controllers/reports.controller";

const reportsRouter = Router();

// public routes
reportsRouter.get("/", getReports);
reportsRouter.get("/unresolved", getUnresolvedReports);
reportsRouter.get("/nearby", getNearbyReports);
reportsRouter.get("/:reportId", getReportById);
reportsRouter.get("/:id/activities", getReportActivities);

// protected routes
reportsRouter.post("/", authMiddleware, createReport);
reportsRouter.get("/user", authMiddleware, getUserReports);
reportsRouter.get("/user/resolved", authMiddleware, getUserResolvedReports);
reportsRouter.get("/user/unresolved", authMiddleware, getUserUnresolvedReports);
reportsRouter.patch("/:reportId", authMiddleware, updateReport);
reportsRouter.patch("/:reportId/resolve", authMiddleware, markReportAsResolved);
reportsRouter.post("/:id/comments", authMiddleware, addComment);
reportsRouter.post("/:id/upvote", authMiddleware, upvoteReport);

// Debug routes (development only)
reportsRouter.get("/debug/:reportId/analysis", getModelAnalysis);
reportsRouter.get("/debug/model/health", getModelHealth);

export { reportsRouter };
