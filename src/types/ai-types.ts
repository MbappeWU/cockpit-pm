/** AI 风险评估 — 单项目 */
export interface ProjectRiskAssessment {
  vehicleCode: string;
  platform: string;
  healthScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  dimensions: {
    milestone: number;
    issueDensity: number;
    resourceCoverage: number;
    historicalRisk: number;
    difficulty: number;
    externalDep: number;
  };
  topRisks: Array<{
    risk: string;
    impact: string;
    action: string;
    owner?: string;
  }>;
  aiSummary: string;
  assessedAt: string;
}

/** AI 风险评估 — 全量输出 */
export interface RiskAssessmentPayload {
  generatedAt: string;
  projects: ProjectRiskAssessment[];
  overallHealth: number;
  criticalCount: number;
  aiGenerated: boolean;
}

/** AI 绩效报告 — 单人 */
export interface MemberPerfReport {
  memberName: string;
  level: string;
  compositeScore: number; // 0-100
  suggestedGrade: string;
  trend: 'improving' | 'stable' | 'declining';
  dimensions: {
    actionCompletion: number;
    okrContribution: number;
    projectHealth: number;
    perfTrend: number;
    expertRating?: number;
  };
  strengths: string[];
  improvements: string[];
  riskFlag: boolean;
  aiSummary: string;
  assessedAt: string;
}

/** AI 绩效报告 — 全量输出 */
export interface PerfReportPayload {
  generatedAt: string;
  members: MemberPerfReport[];
  aiGenerated: boolean;
}

/** 变更条目 */
export interface ChangeItem {
  type: 'jira' | 'feishu' | 'milestone' | 'member';
  description: string;
  timestamp: string;
}

/** 到期条目 */
export interface DeadlineItem {
  type: 'milestone' | 'action';
  description: string;
  dueDate: string;
  owner?: string;
}

/** 日报摘要 */
export interface DailyDigest {
  date: string;
  changes: ChangeItem[];
  riskTop5: ProjectRiskAssessment[];
  attentionMembers: MemberPerfReport[];
  upcomingDeadlines: DeadlineItem[];
  aiInsights: string[];
  generatedAt: string;
}

/** 管道运行状态 */
export interface PipelineRunStatus {
  runAt: string;
  steps: Array<{
    name: string;
    status: 'success' | 'failed' | 'skipped';
    duration?: number;
    error?: string;
  }>;
  totalDuration: number;
}

/** 飞书采集结果 */
export interface FeishuCollectionResult {
  collectedAt: string;
  riskEntries: ProjectRiskEntry[];
  meetingActions: MeetingAction[];
  todoItems: FeishuTodoItem[];
}

export interface ProjectRiskEntry {
  vehicleCode: string;
  riskType: string;
  severity: string;
  owner: string;
  status: string;
  description: string;
}

export interface MeetingAction {
  decision: string;
  assignee: string;
  deadline: string;
  source: string;
}

export interface FeishuTodoItem {
  member: string;
  task: string;
  status: string;
  dueDate: string;
}

/** JIRA 采集结果 */
export interface JiraCollectionResult {
  collectedAt: string;
  openIssues: JiraIssueItem[];
  highPriorityCount: number;
  issuesByProject: Record<string, number>;
  issuesByAssignee: Record<string, number>;
}

export interface JiraIssueItem {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  updated: string;
}
