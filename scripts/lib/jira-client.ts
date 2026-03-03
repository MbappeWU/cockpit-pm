/**
 * jira-client.ts
 *
 * JIRA REST API v2 client (Basic Auth with personal access token).
 */

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  updated: string;
  issueType: string;
}

export interface BoardSummary {
  projectKey: string;
  openCount: number;
  inProgressCount: number;
  highPriorityCount: number;
}

export class JiraClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  /** Search issues using JQL */
  async searchIssues(
    jql: string,
    maxResults = 50,
  ): Promise<JiraIssue[]> {
    const url = `${this.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,priority,assignee,project,updated,issuetype`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      console.warn(`[jira] Search failed: ${resp.status} ${resp.statusText}`);
      return [];
    }

    const data = (await resp.json()) as {
      issues?: Array<Record<string, unknown>>;
    };

    return (data.issues ?? []).map((issue) => {
      const fields = issue.fields as Record<string, unknown> | undefined;
      const status = fields?.status as Record<string, unknown> | undefined;
      const priority = fields?.priority as Record<string, unknown> | undefined;
      const assignee = fields?.assignee as Record<string, unknown> | undefined;
      const project = fields?.project as Record<string, unknown> | undefined;
      const issueType = fields?.issuetype as Record<string, unknown> | undefined;

      return {
        key: String(issue.key ?? ''),
        summary: String(fields?.summary ?? ''),
        status: String(status?.name ?? ''),
        priority: String(priority?.name ?? ''),
        assignee: String(assignee?.displayName ?? '未分配'),
        project: String(project?.key ?? ''),
        updated: String(fields?.updated ?? ''),
        issueType: String(issueType?.name ?? ''),
      };
    });
  }

  /** Get project board summary */
  async getProjectBoard(projectKey: string): Promise<BoardSummary> {
    const openJql = `project = ${projectKey} AND status != Done ORDER BY updated DESC`;
    const issues = await this.searchIssues(openJql, 200);

    const highPriorities = ['Highest', 'High', 'Blocker', 'Critical'];
    const inProgressStatuses = ['In Progress', '进行中', 'Doing'];

    return {
      projectKey,
      openCount: issues.length,
      inProgressCount: issues.filter((i) =>
        inProgressStatuses.some((s) => i.status.includes(s)),
      ).length,
      highPriorityCount: issues.filter((i) =>
        highPriorities.includes(i.priority),
      ).length,
    };
  }
}

/** Create a JiraClient from environment variables */
export function createJiraClient(): JiraClient | null {
  const baseUrl =
    process.env.JIRA_BASE_URL ?? process.env.VITE_JIRA_BASE_URL ?? '';
  const token =
    process.env.JIRA_TOKEN ?? process.env.VITE_JIRA_TOKEN ?? '';

  if (!baseUrl || !token) {
    console.warn('[jira] Missing JIRA_BASE_URL or JIRA_TOKEN');
    return null;
  }

  return new JiraClient(baseUrl, token);
}
