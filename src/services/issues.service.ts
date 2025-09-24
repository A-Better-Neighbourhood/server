/** @format */

export class IssuesService {
  async createIssue(title: string, description: string) {}
  async getIssues() {
    return;
  }
  async getIssueById(issueId: number) {}
  async updateIssue(issueId: number, title: string, description: string) {}
}

export const issuesService = new IssuesService();
