/**
 * jira-collector.ts
 *
 * Collects JIRA issue data for cockpit projects.
 */

import { createJiraClient, type JiraIssue } from '../lib/jira-client.js';

export interface JiraCollectionResult {
  collectedAt: string;
  openIssues: JiraIssue[];
  highPriorityCount: number;
  issuesByProject: Record<string, number>;
  issuesByAssignee: Record<string, number>;
  weeklyDelta: {
    created: number;
    resolved: number;
  };
}

// JIRA project keys related to cockpit
const PROJECT_KEYS = ['COCKPIT', 'HMI', 'IVI', 'ADAS'];
const HIGH_PRIORITIES = ['Highest', 'High', 'Blocker', 'Critical'];

export async function collectJiraData(): Promise<JiraCollectionResult | null> {
  const client = createJiraClient();
  if (!client) {
    console.log('[jira-collector] No JIRA credentials, skipping');
    return null;
  }

  console.log('[jira-collector] Fetching open issues...');

  // Build JQL for all cockpit-related projects
  const projectFilter = PROJECT_KEYS.map((k) => `project = ${k}`).join(' OR ');
  const jql = `(${projectFilter}) AND status != Done ORDER BY updated DESC`;

  const issues = await client.searchIssues(jql, 200);
  console.log(`[jira-collector] Open issues: ${issues.length}`);

  // Aggregate by project
  const issuesByProject: Record<string, number> = {};
  for (const issue of issues) {
    issuesByProject[issue.project] = (issuesByProject[issue.project] ?? 0) + 1;
  }

  // Aggregate by assignee
  const issuesByAssignee: Record<string, number> = {};
  for (const issue of issues) {
    if (issue.assignee && issue.assignee !== '未分配') {
      issuesByAssignee[issue.assignee] =
        (issuesByAssignee[issue.assignee] ?? 0) + 1;
    }
  }

  // Count high priority
  const highPriorityCount = issues.filter((i) =>
    HIGH_PRIORITIES.includes(i.priority),
  ).length;

  // Weekly delta: issues created/resolved in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  let created = 0;
  let resolved = 0;

  try {
    const createdJql = `(${projectFilter}) AND created >= "${weekAgoStr}"`;
    const createdIssues = await client.searchIssues(createdJql, 200);
    created = createdIssues.length;

    const resolvedJql = `(${projectFilter}) AND resolved >= "${weekAgoStr}"`;
    const resolvedIssues = await client.searchIssues(resolvedJql, 200);
    resolved = resolvedIssues.length;
  } catch {
    console.warn('[jira-collector] Failed to fetch weekly delta');
  }

  console.log(`[jira-collector] High priority: ${highPriorityCount}, Weekly: +${created} -${resolved}`);

  return {
    collectedAt: new Date().toISOString(),
    openIssues: issues,
    highPriorityCount,
    issuesByProject,
    issuesByAssignee,
    weeklyDelta: { created, resolved },
  };
}
