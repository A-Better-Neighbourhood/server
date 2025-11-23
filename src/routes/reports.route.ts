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
} from "../controllers/reports.controller";

const reportsRouter = Router();

reportsRouter.get("/", getReports);
reportsRouter.get("/:reportId", getReportById);
reportsRouter.post("/", authMiddleware, createReport);
reportsRouter.get("/user", getUserReports);
reportsRouter.patch("/:reportId", updateReport);
reportsRouter.get("/unresolved", getUnresolvedReports);
reportsRouter.get("/user/resolved", getUserResolvedReports);
reportsRouter.patch("/:reportId/resolve", markReportAsResolved);
reportsRouter.get("/user/unresolved", getUserUnresolvedReports);

export { reportsRouter };
