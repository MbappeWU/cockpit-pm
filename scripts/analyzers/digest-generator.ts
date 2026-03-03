/**
 * digest-generator.ts
 *
 * Generates daily digest combining risk assessments, perf reports,
 * upcoming deadlines, and AI insights.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isClaudeAvailable, askClaudeJSON } from '../lib/claude-client.js';
import type { RiskAssessmentPayload } from './risk-engine.js';
import type { PerfReportPayload } from './perf-engine.js';
import type { MemoryCollectionResult } from '../collectors/memory-collector.js';
import type { FeishuCollectionResult } from '../collectors/feishu-collector.js';
import type { JiraCollectionResult } from '../collectors/jira-collector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChangeItem {
  type: 'jira' | 'feishu' | 'milestone' | 'member';
  description: string;
  timestamp: string;
}

export interface DeadlineItem {
  type: 'milestone' | 'action';
  description: string;
  dueDate: string;
  owner?: string;
}

export interface DailyDigest {
  date: string;
  changes: ChangeItem[];
  riskTop5: RiskAssessmentPayload['projects'];
  attentionMembers: PerfReportPayload['members'];
  upcomingDeadlines: DeadlineItem[];
  aiInsights: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

function detectChanges(
  memory: MemoryCollectionResult,
  feishu: FeishuCollectionResult | null,
  jira: JiraCollectionResult | null,
): ChangeItem[] {
  const changes: ChangeItem[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // JIRA changes
  if (jira) {
    if (jira.weeklyDelta.created > 0) {
      changes.push({
        type: 'jira',
        description: `JIRA 本周新增 ${jira.weeklyDelta.created} 个Issue，关闭 ${jira.weeklyDelta.resolved} 个`,
        timestamp: jira.collectedAt,
      });
    }
    if (jira.highPriorityCount > 0) {
      changes.push({
        type: 'jira',
        description: `${jira.highPriorityCount} 个高优先级Issue待处理`,
        timestamp: jira.collectedAt,
      });
    }
  }

  // Feishu changes
  if (feishu) {
    if (feishu.meetingActions.length > 0) {
      changes.push({
        type: 'feishu',
        description: `从会议纪要提取 ${feishu.meetingActions.length} 条行动项`,
        timestamp: feishu.collectedAt,
      });
    }
    if (feishu.riskEntries.length > 0) {
      const critical = feishu.riskEntries.filter((r) => r.severity === 'critical');
      if (critical.length > 0) {
        changes.push({
          type: 'feishu',
          description: `飞书风险表有 ${critical.length} 条严重风险`,
          timestamp: feishu.collectedAt,
        });
      }
    }
  }

  // Milestone changes from memory
  const urgentAlerts = memory.milestoneAlerts.filter((a) => a.severity === 'red');
  if (urgentAlerts.length > 0) {
    changes.push({
      type: 'milestone',
      description: `${urgentAlerts.length} 个里程碑紧急（<30天）`,
      timestamp: memory.collectedAt,
    });
  }

  // Recent decisions
  const recentDecisions = memory.decisions.filter((d) => {
    const dDate = new Date(d.date);
    return dDate >= oneDayAgo;
  });
  if (recentDecisions.length > 0) {
    changes.push({
      type: 'member',
      description: `新增 ${recentDecisions.length} 条管理决策`,
      timestamp: memory.collectedAt,
    });
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Deadline extraction
// ---------------------------------------------------------------------------

function extractDeadlines(
  memory: MemoryCollectionResult,
  feishu: FeishuCollectionResult | null,
): DeadlineItem[] {
  const deadlines: DeadlineItem[] = [];

  // Milestone deadlines within 7 days
  for (const alert of memory.milestoneAlerts) {
    if (alert.daysUntil <= 7) {
      deadlines.push({
        type: 'milestone',
        description: `${alert.vehicleCode} ${alert.milestone}`,
        dueDate: `${alert.daysUntil}天后`,
        owner: alert.platform,
      });
    }
  }

  // Feishu todo deadlines
  if (feishu) {
    for (const todo of feishu.todoItems) {
      if (todo.dueDate && todo.status !== '完成') {
        const dueDate = new Date(todo.dueDate);
        const daysUntil = Math.ceil(
          (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntil >= 0 && daysUntil <= 7) {
          deadlines.push({
            type: 'action',
            description: todo.task.slice(0, 100),
            dueDate: todo.dueDate,
            owner: todo.member,
          });
        }
      }
    }
  }

  return deadlines.sort((a, b) => {
    const daysA = parseInt(a.dueDate) || 999;
    const daysB = parseInt(b.dueDate) || 999;
    return daysA - daysB;
  });
}

// ---------------------------------------------------------------------------
// AI insights
// ---------------------------------------------------------------------------

async function generateAIInsights(
  risks: RiskAssessmentPayload | null,
  perfs: PerfReportPayload | null,
  changes: ChangeItem[],
): Promise<string[]> {
  const available = await isClaudeAvailable();
  if (!available) {
    return generateRuleInsights(risks, perfs);
  }

  const criticalProjects = risks?.projects.filter((p) => p.riskLevel === 'critical') ?? [];
  const flaggedMembers = perfs?.members.filter((m) => m.riskFlag) ?? [];

  const prompt = `你是智能座舱项目管理顾问。请根据以下数据生成3条策略性管理建议。直接输出JSON数组（不要markdown包裹）。

## 当前状态
- 总体健康度: ${risks?.overallHealth ?? 'N/A'}/100
- 严重风险项目数: ${criticalProjects.length}
- 需关注人员: ${flaggedMembers.length}
- 今日变化: ${changes.map((c) => c.description).join('; ')}

## 严重风险项目
${criticalProjects.slice(0, 5).map((p) => `- ${p.vehicleCode} (${p.platform}): ${p.healthScore}分`).join('\n')}

## 需关注人员
${flaggedMembers.slice(0, 5).map((m) => `- ${m.memberName}: ${m.compositeScore}分, ${m.trend}`).join('\n')}

请输出JSON: ["建议1", "建议2", "建议3"]`;

  try {
    const result = await askClaudeJSON<string[]>(prompt);
    if (result.success && Array.isArray(result.data)) {
      return result.data.slice(0, 5);
    }
  } catch {
    // fall through
  }

  return generateRuleInsights(risks, perfs);
}

function generateRuleInsights(
  risks: RiskAssessmentPayload | null,
  perfs: PerfReportPayload | null,
): string[] {
  const insights: string[] = [];

  if (risks) {
    const critical = risks.projects.filter((p) => p.riskLevel === 'critical');
    if (critical.length > 0) {
      insights.push(
        `${critical.length}个项目处于严重风险状态，建议本周重点跟进：${critical.slice(0, 3).map((p) => p.vehicleCode).join('、')}`,
      );
    }
    if (risks.overallHealth < 60) {
      insights.push('整体项目健康度偏低，建议安排全面风险审查');
    }
  }

  if (perfs) {
    const declining = perfs.members.filter((m) => m.trend === 'declining');
    if (declining.length > 0) {
      insights.push(
        `${declining.length}名成员绩效趋势下降，建议一对一沟通了解原因`,
      );
    }
  }

  if (insights.length === 0) {
    insights.push('当前项目和团队状态整体可控，继续保持');
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export async function generateDigest(
  memory: MemoryCollectionResult,
  feishu: FeishuCollectionResult | null,
  jira: JiraCollectionResult | null,
  risks: RiskAssessmentPayload | null,
  perfs: PerfReportPayload | null,
): Promise<DailyDigest> {
  console.log('\n[digest] Generating daily digest...');

  const changes = detectChanges(memory, feishu, jira);
  const deadlines = extractDeadlines(memory, feishu);
  const aiInsights = await generateAIInsights(risks, perfs, changes);

  const riskTop5 = risks
    ? [...risks.projects].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5)
    : [];

  const attentionMembers = perfs
    ? perfs.members.filter((m) => m.riskFlag).slice(0, 5)
    : [];

  const digest: DailyDigest = {
    date: new Date().toISOString().slice(0, 10),
    changes,
    riskTop5,
    attentionMembers,
    upcomingDeadlines: deadlines,
    aiInsights,
    generatedAt: new Date().toISOString(),
  };

  // Write output
  const outputPath = path.join(PROJECT_ROOT, 'public', 'sync', 'daily-digest.json');
  fs.writeFileSync(outputPath, JSON.stringify(digest, null, 2), 'utf-8');
  console.log(`[digest] Output: ${outputPath}`);
  console.log(`[digest] Changes: ${changes.length}, Deadlines: ${deadlines.length}, Insights: ${aiInsights.length}`);

  return digest;
}

/** Format digest as markdown for Feishu push */
export function formatDigestMarkdown(digest: DailyDigest): string {
  const lines: string[] = [];

  lines.push(`## 🚗 座舱项目日报 ${digest.date}\n`);

  if (digest.changes.length > 0) {
    lines.push('### 📋 今日变化');
    for (const c of digest.changes) {
      const icon = c.type === 'jira' ? '🔧' : c.type === 'feishu' ? '📝' : c.type === 'milestone' ? '🎯' : '👤';
      lines.push(`- ${icon} ${c.description}`);
    }
    lines.push('');
  }

  if (digest.riskTop5.length > 0) {
    lines.push('### ⚠️ 风险 TOP5');
    for (const p of digest.riskTop5) {
      const icon = p.riskLevel === 'critical' ? '🔴' : p.riskLevel === 'high' ? '🟡' : '🟢';
      lines.push(`- ${icon} **${p.vehicleCode}** (${p.platform}): ${p.healthScore}分 — ${p.aiSummary || p.riskLevel}`);
    }
    lines.push('');
  }

  if (digest.attentionMembers.length > 0) {
    lines.push('### 👀 需关注人员');
    for (const m of digest.attentionMembers) {
      lines.push(`- ${m.memberName} (${m.level}): ${m.compositeScore}分 ${m.trend === 'declining' ? '📉' : '⚠️'}`);
    }
    lines.push('');
  }

  if (digest.upcomingDeadlines.length > 0) {
    lines.push('### ⏰ 本周到期');
    for (const d of digest.upcomingDeadlines) {
      lines.push(`- ${d.description} — ${d.dueDate}${d.owner ? ` (${d.owner})` : ''}`);
    }
    lines.push('');
  }

  if (digest.aiInsights.length > 0) {
    lines.push('### 💡 AI 建议');
    for (const insight of digest.aiInsights) {
      lines.push(`- ${insight}`);
    }
  }

  return lines.join('\n');
}
