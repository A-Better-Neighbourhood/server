/** @format */

import { RequestHandler } from "express";
import { issuesService } from "../services/issues.service";
import { CreateReportSchema } from "../schemas/issues.schema";
import { ResponseHandler } from "../utils/response";

export const getIssues: RequestHandler = async (req, res) => {
  try {
    const issues = await issuesService.getIssues();

    return ResponseHandler.success(
      res,
      issues,
      "Issues retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getIssueById: RequestHandler = async (req, res) => {
  const { issueId } = req.params;
  try {
    const issue = await issuesService.getIssueById(issueId);

    if (!issue) {
      return ResponseHandler.notFound(res, "Issue not found");
    }

    return ResponseHandler.success(res, issue, "Issue retrieved successfully");
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const createIssue: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const { title, description, image, location } = CreateReportSchema.parse(
      req.body
    );

    const newIssue = await issuesService.createIssue(userId, {
      title,
      description,
      image,
      location,
    });

    return ResponseHandler.success(
      res,
      newIssue,
      "Issue created successfully",
      201
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getUserIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const issues = await issuesService.getUserIssues(userId);

    return ResponseHandler.success(
      res,
      issues,
      "User issues retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const updateIssue: RequestHandler = async (req, res) => {};

export const getUnresolvedIssues: RequestHandler = async (req, res) => {
  try {
    const issues = await issuesService.getUnresolvedIssues();
    return ResponseHandler.success(
      res,
      issues,
      "Unresolved issues retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getUserResolvedIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }
  try {
    const issues = await issuesService.getUserResolvedIssues(userId);
    return ResponseHandler.success(
      res,
      issues,
      "User resolved issues retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};
export const markIssueAsResolved: RequestHandler = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  try {
    const issue = await issuesService.markIssueAsResolved(issueId);
    if (!issue) {
      return ResponseHandler.notFound(res, "Issue not found");
    }
    return ResponseHandler.success(
      res,
      issue,
      "Issue marked as resolved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const getUserUnresolvedIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }
  try {
    const issues = await issuesService.getUserUnresolvedIssues(userId);
    return ResponseHandler.success(
      res,
      issues,
      "User unresolved issues retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};
