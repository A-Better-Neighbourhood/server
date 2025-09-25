/** @format */

import { authMiddleware } from "./../middlewares/auth.middleware";
/** @format */

import { Router } from "express";
import {
  getIssues,
  getIssueById,
  createIssue,
  getUserIssues,
  updateIssue,
  getUnresolvedIssues,
  getUserResolvedIssues,
  markIssueAsResolved,
  getUserUnresolvedIssues,
} from "../controllers/issues.controller";

const issuesRouter = Router();

issuesRouter.get("/", getIssues);
issuesRouter.get("/:issueId", getIssueById);
issuesRouter.post("/", authMiddleware, createIssue);
issuesRouter.get("/user", getUserIssues);
issuesRouter.patch("/:issueId", updateIssue);
issuesRouter.get("/unresolved", getUnresolvedIssues);
issuesRouter.get("/user/resolved", getUserResolvedIssues);
issuesRouter.patch("/:issueId/resolve", markIssueAsResolved);
issuesRouter.get("/user/unresolved", getUserUnresolvedIssues);

export { issuesRouter };
