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
  upvoteIssue,
} from "../controllers/issues.controller";

const issuesRouter = Router();

issuesRouter.get("/", getIssues);
issuesRouter.post("/", authMiddleware, createIssue);
issuesRouter.get("/user", authMiddleware, getUserIssues);
issuesRouter.get("/user/resolved", authMiddleware, getUserResolvedIssues);
issuesRouter.get("/user/unresolved", authMiddleware, getUserUnresolvedIssues);
issuesRouter.get("/unresolved", authMiddleware, getUnresolvedIssues);
issuesRouter.get("/nearby", authMiddleware, getNearbyIssues);
issuesRouter.get("/:issueId", authMiddleware, getIssueById);
issuesRouter.patch("/:issueId", authMiddleware, updateIssue); //Isme Kya update krna Do it YourSelf
issuesRouter.patch("/:issueId/resolve", authMiddleware, markIssueAsResolved); 
issuesRouter.get("/:id/activities", authMiddleware, getIssueActivities);
issuesRouter.post("/:id/comments", authMiddleware, addComment);
issuesRouter.get("/:id/comments", authMiddleware, getComments);
issuesRouter.post("/:id/upvote", authMiddleware, upvoteIssue);

export { issuesRouter };
