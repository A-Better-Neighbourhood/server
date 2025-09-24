/** @format */

import { Issue } from "../generated/prisma";
import { prisma } from "../lib/db";
import { CreateReportType } from "../schemas/issues.schema";

export class IssuesService {
  async createIssue(creatorId: string, data: CreateReportType): Promise<Issue> {
    return prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.image,
        latitude: data.location[0],
        longitude: data.location[1],
        creator: {
          connect: { id: creatorId },
        },
      },
    });
  }

  async getIssues(): Promise<Issue[]> {
    return prisma.issue.findMany();
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return prisma.issue.findUnique({
      where: { id: issueId },
      include: { creator: true },
    });
  }

  async updateIssue(
    issueId: string,
    title: string,
    description: string
  ): Promise<Issue> {
    return prisma.issue.update({
      where: { id: issueId },
      data: { title, description },
    });
  }

  async getUserIssues(userId: string): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { creatorId: userId },
    });
  }

  async getUnresolvedIssues(): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { status: "PENDING" },
    });
  }

  async getUserResolvedIssues(userId: string): Promise<Issue[]> {
    return prisma.issue.findMany({
      where: { creatorId: userId, status: "RESOLVED" },
    });
  }

  async markIssueAsResolved(issueId: string): Promise<Issue> {
    return prisma.issue.update({
      where: { id: issueId },
      data: { status: "RESOLVED" },
    });
  }

  async getUserUnresolvedIssues(userId: string) {
    return prisma.issue.findMany({
      where: {
        creatorId: userId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });
  }
}

export const issuesService = new IssuesService();
