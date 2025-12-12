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

reportsRouter.get("/", getReports);
reportsRouter.post("/", authMiddleware, createReport);
reportsRouter.get("/user", authMiddleware, getUserReports);
reportsRouter.get("/user/resolved", authMiddleware, getUserResolvedReports);
reportsRouter.get("/user/unresolved", authMiddleware, getUserUnresolvedReports);
reportsRouter.get("/unresolved", authMiddleware, getUnresolvedReports);
reportsRouter.get("/nearby", authMiddleware, getNearbyReports);
reportsRouter.get("/:reportId", authMiddleware, getReportById);
reportsRouter.patch("/:reportId", authMiddleware, updateReport);
reportsRouter.patch("/:reportId/resolve", authMiddleware, markReportAsResolved);
reportsRouter.get("/:id/activities", authMiddleware, getReportActivities);
reportsRouter.post("/:id/comments", authMiddleware, addComment);
reportsRouter.post("/:id/upvote", authMiddleware, upvoteReport);

// Debug routes (development only)
reportsRouter.get("/debug/:reportId/analysis", getModelAnalysis);
reportsRouter.get("/debug/model/health", getModelHealth);

export { reportsRouter };
