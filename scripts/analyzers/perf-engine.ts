/**
 * perf-engine.ts
 *
 * AI-powered member performance assessment engine.
 * Weighted dimensions (expert vs non-expert) → composite score → Claude AI enrichment.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isClaudeAvailable, askClaudeJSON } from '../lib/claude-client.js';
import { loadMembers, buildMemberProjectMap } from '../lib/data-loader.js';
import type { MemberData } from '../lib/data-loader.js';

// Canonical types — single source of truth in src/types/ai-types.ts
export type { MemberPerfReport, PerfReportPayload } from '../../src/types/ai-types.js';
import type { MemberPerfReport, PerfReportPayload, RiskAssessmentPayload } from '../../src/types/ai-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const PERF_SCORES: Record<string, number> = {
  'A+': 95, 'A': 90, 'A-': 85, 'B+': 78, 'B': 72, 'B-': 65,
  'C+🌟': 60, 'C+': 55, 'C': 48, 'C-': 40, '-': 0, '': 0,
};

// ---------------------------------------------------------------------------
// Dimension calculators (each returns 0-100)
// ---------------------------------------------------------------------------

function calcActionCompletion(actions: MemberData['actions']): number {
  if (actions.length === 0) return 50;
  const done = actions.filter((a) => a.status === 'done').length;
  return Math.round((done / actions.length) * 100);
}

function calcOKRContribution(_member: MemberData): number {
  // Without per-member OKR ownership data, use a neutral score
  // This can be enhanced when KR→member mapping is available
  return 60;
}


function calcProjectHealth(
  member: MemberData,
  risks: RiskAssessmentPayload | null,
  memberProjectMap: Map<string, string[]>,
): number {
  if (!risks || risks.projects.length === 0) return 60;

  // Match by UPL/STE assignment from projects-init data
  const vehicleCodes = memberProjectMap.get(member.name) ?? [];
  if (vehicleCodes.length === 0) return 70; // No direct projects

  const related = risks.projects.filter((p) =>
    vehicleCodes.includes(p.vehicleCode),
  );
  if (related.length === 0) return 70;

  return Math.round(
    related.reduce((s, p) => s + p.healthScore, 0) / related.length,
  );
}

function calcPerfTrend(perf: Record<string, string>): {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
} {
  const entries = Object.entries(perf);
  if (entries.length === 0) return { score: 50, trend: 'stable' };

  const latest = entries[entries.length - 1]?.[1] ?? '';
  const latestScore = PERF_SCORES[latest] ?? 50;

  if (entries.length >= 2) {
    const previous = entries[entries.length - 2]?.[1] ?? '';
    const prevScore = PERF_SCORES[previous] ?? 50;

    if (latestScore > prevScore + 5) return { score: latestScore, trend: 'improving' };
    if (latestScore < prevScore - 5) return { score: latestScore, trend: 'declining' };
  }

  return { score: latestScore, trend: 'stable' };
}

function calcExpertRating(rating: MemberData['rating']): number {
  const avg = (rating.business + rating.capability + rating.training) / 3;
  return Math.round(avg * 20); // 0-5 → 0-100
}

// ---------------------------------------------------------------------------
// Composite score
// ---------------------------------------------------------------------------

const EXPERT_WEIGHTS = {
  actionCompletion: 0.20,
  okrContribution: 0.20,
  projectHealth: 0.20,
  perfTrend: 0.15,
  expertRating: 0.25,
};

const NON_EXPERT_WEIGHTS = {
  actionCompletion: 0.30,
  okrContribution: 0.25,
  projectHealth: 0.25,
  perfTrend: 0.20,
};

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 82) return 'A';
  if (score >= 75) return 'A-';
  if (score >= 68) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 52) return 'B-';
  if (score >= 45) return 'C+';
  if (score >= 38) return 'C';
  return 'C-';
}

function assessMember(
  member: MemberData,
  risks: RiskAssessmentPayload | null,
  memberProjectMap: Map<string, string[]>,
): MemberPerfReport {
  const actionCompletion = calcActionCompletion(member.actions);
  const okrContribution = calcOKRContribution(member);
  const projectHealth = calcProjectHealth(member, risks, memberProjectMap);
  const { score: perfTrendScore, trend } = calcPerfTrend(member.performance);
  const expertRating = member.isExpert ? calcExpertRating(member.rating) : undefined;

  const weights = member.isExpert ? EXPERT_WEIGHTS : NON_EXPERT_WEIGHTS;

  let compositeScore = Math.round(
    actionCompletion * weights.actionCompletion +
    okrContribution * weights.okrContribution +
    projectHealth * weights.projectHealth +
    perfTrendScore * weights.perfTrend +
    (expertRating !== undefined ? expertRating * (EXPERT_WEIGHTS.expertRating) : 0),
  );

  compositeScore = Math.max(0, Math.min(100, compositeScore));

  return {
    memberName: member.name,
    level: member.level,
    compositeScore,
    suggestedGrade: scoreToGrade(compositeScore),
    trend,
    dimensions: {
      actionCompletion,
      okrContribution,
      projectHealth,
      perfTrend: perfTrendScore,
      expertRating,
    },
    strengths: [],
    improvements: [],
    riskFlag: compositeScore < 45 || trend === 'declining',
    aiSummary: '',
    assessedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// AI enrichment
// ---------------------------------------------------------------------------

interface AIPerfResponse {
  adjustedScore?: number;
  grade?: string;
  strengths?: string[];
  improvements?: string[];
  riskFlag?: boolean;
  summary?: string;
}

async function enrichWithAI(
  reports: MemberPerfReport[],
): Promise<MemberPerfReport[]> {
  const available = await isClaudeAvailable();
  if (!available) {
    console.log('[perf-engine] Claude CLI not available, using rule scores only');
    return reports.map((r) => ({
      ...r,
      aiSummary: `规则评分: ${r.compositeScore}分 (${r.suggestedGrade})`,
      strengths: generateRuleStrengths(r),
      improvements: generateRuleImprovements(r),
    }));
  }

  // AI-enrich flagged members and top/bottom performers
  const flagged = reports.filter((r) => r.riskFlag);
  const sorted = [...reports].sort((a, b) => b.compositeScore - a.compositeScore);
  const toEnrich = new Set<string>([
    ...flagged.map((r) => r.memberName),
    ...sorted.slice(0, 3).map((r) => r.memberName),
    ...sorted.slice(-3).map((r) => r.memberName),
  ]);

  console.log(`[perf-engine] Enriching ${toEnrich.size} members with AI...`);

  const enriched: MemberPerfReport[] = [];

  for (const report of reports) {
    if (!toEnrich.has(report.memberName)) {
      enriched.push({
        ...report,
        aiSummary: `规则评分: ${report.compositeScore}分`,
        strengths: generateRuleStrengths(report),
        improvements: generateRuleImprovements(report),
      });
      continue;
    }

    const prompt = buildPerfPrompt(report);

    try {
      const result = await askClaudeJSON<AIPerfResponse>(prompt);

      if (result.success && result.data) {
        const ai = result.data;
        enriched.push({
          ...report,
          compositeScore: ai.adjustedScore ?? report.compositeScore,
          suggestedGrade: ai.grade ?? report.suggestedGrade,
          strengths: ai.strengths ?? generateRuleStrengths(report),
          improvements: ai.improvements ?? generateRuleImprovements(report),
          riskFlag: ai.riskFlag ?? report.riskFlag,
          aiSummary: ai.summary ?? '',
        });
      } else {
        enriched.push({
          ...report,
          aiSummary: `AI分析失败`,
          strengths: generateRuleStrengths(report),
          improvements: generateRuleImprovements(report),
        });
      }
    } catch {
      enriched.push({
        ...report,
        aiSummary: `AI调用异常`,
        strengths: generateRuleStrengths(report),
        improvements: generateRuleImprovements(report),
      });
    }
  }

  return enriched;
}

function buildPerfPrompt(r: MemberPerfReport): string {
  return `你是项目管理团队绩效分析专家。请评估以下成员并直接输出JSON（不要markdown包裹）。

## 成员数据
姓名: ${r.memberName}, 职级: ${r.level}
综合评分: ${r.compositeScore}/100, 趋势: ${r.trend}
维度: 行动完成率=${r.dimensions.actionCompletion}, OKR贡献=${r.dimensions.okrContribution}, 项目健康=${r.dimensions.projectHealth}, 绩效趋势=${r.dimensions.perfTrend}${r.dimensions.expertRating !== undefined ? `, 专家评分=${r.dimensions.expertRating}` : ''}

输出JSON:
{"adjustedScore": <number>, "grade": "A|B+|B|C+|C", "strengths": ["强项1","强项2"], "improvements": ["改进1","改进2"], "riskFlag": <boolean>, "summary": "一句话评估"}`;
}

function generateRuleStrengths(r: MemberPerfReport): string[] {
  const strengths: string[] = [];
  if (r.dimensions.actionCompletion >= 80) strengths.push('行动执行力强');
  if (r.dimensions.projectHealth >= 70) strengths.push('负责项目健康度良好');
  if (r.dimensions.perfTrend >= 75) strengths.push('绩效表现稳定');
  if (r.dimensions.expertRating && r.dimensions.expertRating >= 70) {
    strengths.push('专家履职评分较高');
  }
  if (r.trend === 'improving') strengths.push('绩效趋势上升');
  return strengths.length > 0 ? strengths : ['数据不足，待进一步观察'];
}

function generateRuleImprovements(r: MemberPerfReport): string[] {
  const improvements: string[] = [];
  if (r.dimensions.actionCompletion < 50) improvements.push('提高行动完成率');
  if (r.dimensions.projectHealth < 50) improvements.push('关注负责项目的健康度');
  if (r.dimensions.perfTrend < 50) improvements.push('绩效需要提升');
  if (r.dimensions.expertRating !== undefined && r.dimensions.expertRating < 50) {
    improvements.push('加强专家能力建设');
  }
  if (r.trend === 'declining') improvements.push('绩效趋势下降，需关注');
  return improvements;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export async function runPerfEngine(
  risks: RiskAssessmentPayload | null,
): Promise<PerfReportPayload> {
  console.log('\n[perf-engine] Starting performance assessment...');

  const members = loadMembers();
  console.log(`[perf-engine] Members loaded: ${members.length}`);

  if (members.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      members: [],
      aiGenerated: false,
    };
  }

  // Build member→project mapping from UPL/STE fields
  const memberProjectMap = buildMemberProjectMap();

  // Calculate rule-based scores
  const reports = members.map((m) => assessMember(m, risks, memberProjectMap));

  // Enrich with AI
  const enriched = await enrichWithAI(reports);
  const aiGenerated = enriched.some((r) => r.aiSummary && !r.aiSummary.startsWith('规则评分'));

  const payload: PerfReportPayload = {
    generatedAt: new Date().toISOString(),
    members: enriched.sort((a, b) => b.compositeScore - a.compositeScore),
    aiGenerated,
  };

  // Write output
  const outputPath = path.join(PROJECT_ROOT, 'public', 'sync', 'perf-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[perf-engine] Output: ${outputPath}`);
  console.log(`[perf-engine] Members assessed: ${enriched.length}, AI: ${aiGenerated}`);

  return payload;
}
