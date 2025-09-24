/** @format */

import { RequestHandler } from "express";
import { issuesService } from "../services/issues.service";
import { CreateReportSchema } from "../schemas/issues.schema";

/** @format */
export const getIssues: RequestHandler = async (req, res) => {
  try {
    const issues = await issuesService.getIssues();

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getIssueById: RequestHandler = async (req, res) => {
  const { issueId } = req.params;
  try {
    const issue = await issuesService.getIssueById(issueId);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const createIssue: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title, description, image, location } = CreateReportSchema.parse(
    req.body
  );

  try {
    const newIssue = await issuesService.createIssue(userId, {
      title,
      description,
      image,
      location,
    });

    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getUserIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const issues = await issuesService.getUserIssues(userId);

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const updateIssue: RequestHandler = async (req, res) => {};

export const getUnresolvedIssues: RequestHandler = async (req, res) => {
  try {
    const issues = await issuesService.getUnresolvedIssues();
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getUserResolvedIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const issues = await issuesService.getUserResolvedIssues(userId);
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
export const markIssueAsResolved: RequestHandler = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const issue = await issuesService.markIssueAsResolved(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getUserUnresolvedIssues: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const issues = await issuesService.getUserUnresolvedIssues(userId);
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
