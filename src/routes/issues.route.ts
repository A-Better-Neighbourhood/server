/** @format */

import { authMiddleware } from "./../middlewares/auth.middleware";
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
  getNearbyIssues,
  getIssueActivities,
  addComment,
  getComments,
  upvoteIssue
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
issuesRouter.get("/nearby", getNearbyIssues);
issuesRouter.get("/:id/activities", getIssueActivities);
issuesRouter.post("/:id/comments", authMiddleware, addComment);
issuesRouter.get("/:id/comments", getComments);
issuesRouter.post("/:id/upvote", authMiddleware, upvoteIssue);





export { issuesRouter };
