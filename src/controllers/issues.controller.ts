/** @format */

import { RequestHandler } from "express";
import { issuesService } from "../services/issues.service";
import {
  CreateReportSchema,
  NearbyIssuesSchema,
} from "../schemas/issues.schema";
import { ResponseHandler } from "../utils/response";
import { ZodError } from "zod";

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

    const result = await issuesService.createIssue(userId, {
      title,
      description,
      image,
      location,
    });

    if (result.isDuplicate) {
      return ResponseHandler.success(
        res,
        {
          issue: result.issue,
          deduplication: {
            isDuplicate: true,
            originalIssue: result.originalIssue,
            merged: result.merged,
          },
        },
        "Issue created and merged with existing duplicate",
        201
      );
    }

    return ResponseHandler.success(
      res,
      {
        issue: result.issue,
        deduplication: {
          isDuplicate: false,
          merged: false,
        },
      },
      "Issue created successfully",
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

export const getNearbyIssues: RequestHandler = async (req, res) => {
  try {
    // Validate and parse query parameters
    const { lat, lng, radius } = NearbyIssuesSchema.parse(req.query);

    // Call service to get nearby issues
    const nearbyIssues = await issuesService.getNearbyIssues(lat, lng, radius);

    // Return formatted response
    return ResponseHandler.success(
      res,
      {
        issues: nearbyIssues,
        metadata: {
          location: { latitude: lat, longitude: lng },
          radiusKm: radius,
          count: nearbyIssues.length,
        },
      },
      `Found ${nearbyIssues.length} issue${
        nearbyIssues.length !== 1 ? "s" : ""
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
    console.error("Get nearby issues error:", error);
    return ResponseHandler.serverError(res);
  }
};

export const getIssueActivities: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ResponseHandler.badRequest(res, "Issue ID is required");
    }

    const activities = await issuesService.getIssueActivities(id);

    return ResponseHandler.success(
      res,
      activities,
      "Issue activities retrieved successfully"
    );
  } catch (error: any) {
    console.error("Get issue activities error:", error);

    if (error.message === "Issue not found") {
      return ResponseHandler.notFound(res, "Issue not found");
    }

    return ResponseHandler.serverError(res);
  }
};

export const addComment: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  const { id: issueId } = req.params;
  const { text } = req.body;

  if (!userId) {
    return ResponseHandler.unauthorized(res);
  }

  if (!text || text.trim() === "") {
    return ResponseHandler.badRequest(res, "Comment text is required");
  }

  try {
    const comment = await issuesService.addComment(issueId, userId, text);

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
  const { id: issueId } = req.params;

  try {
    const comments = await issuesService.getComments(issueId);

    return ResponseHandler.success(
      res,
      comments,
      "Comments retrieved successfully"
    );
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};

export const upvoteIssue: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: issueId } = req.params;

    if (!userId) {
      return ResponseHandler.unauthorized(res);
    }

    const updatedIssue = await issuesService.upvoteIssue(issueId, userId);

    if (updatedIssue === null) {
      return ResponseHandler.badRequest(res, "You have already upvoted this issue");
    }

    return ResponseHandler.success(
      res,
      updatedIssue,
      "Issue upvoted successfully"
    );
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res);
  }
};


