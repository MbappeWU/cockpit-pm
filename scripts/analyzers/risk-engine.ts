/**
 * risk-engine.ts
 *
 * AI-powered project risk assessment engine.
 * 6 weighted dimensions → health score → Claude AI enrichment.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isClaudeAvailable, askClaudeJSON } from '../lib/claude-client.js';
import { loadProjects } from '../lib/data-loader.js';
import type { ProjectData } from '../lib/data-loader.js';
import type { MemoryCollectionResult } from '../collectors/memory-collector.js';
import type { FeishuCollectionResult } from '../collectors/feishu-collector.js';
import type { JiraCollectionResult } from '../collectors/jira-collector.js';

// Canonical types — single source of truth in src/types/ai-types.ts
export type { ProjectRiskAssessment, RiskAssessmentPayload } from '../../src/types/ai-types.js';
import type { ProjectRiskAssessment, RiskAssessmentPayload } from '../../src/types/ai-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Dimension calculators (each returns 0-100)
// ---------------------------------------------------------------------------

const DIFFICULTY_SCORES: Record<string, number> = {
  A: 20, B: 40, C: 60, D: 80, E: 100,
};

function calcMilestoneDimension(
  vehicleCode: string,
  alerts: MemoryCollectionResult['milestoneAlerts'],
): number {
  const relevant = alerts.filter(
    (a) => a.vehicleCode.toUpperCase().includes(vehicleCode.toUpperCase()),
  );

  if (relevant.length === 0) return 80; // No data → assume OK

  const minDays = Math.min(...relevant.map((a) => a.daysUntil));
  if (minDays < 14) return 10;
  if (minDays < 30) return 30;
  if (minDays < 60) return 50;
  if (minDays < 90) return 70;
  return 90;
}

function calcIssueDensity(
  vehicleCode: string,
  jira: JiraCollectionResult | null,
): number {
  if (!jira) return 70; // No JIRA data → neutral

  const related = jira.openIssues.filter(
    (i) =>
      i.summary.toUpperCase().includes(vehicleCode.toUpperCase()) ||
      i.project.toUpperCase().includes(vehicleCode.toUpperCase()),
  );

  const count = related.length;
  if (count === 0) return 90;
  if (count < 3) return 70;
  if (count < 8) return 50;
  if (count < 15) return 30;
  return 10;
}

function calcResourceCoverage(upl: string, ste: string): number {
  let score = 0;
  if (upl && upl !== '-') score += 50;
  if (ste && ste !== '-') score += 50;
  return score || 20; // At least 20 if both empty
}

function calcHistoricalRisk(
  vehicleCode: string,
  insights: MemoryCollectionResult['insights'],
): number {
  const RISK_KW = ['风险', '延期', '问题', '阻塞', '延迟', '滞后'];
  const related = insights.filter((i) => {
    const matchCode = i.tags.some(
      (t) => t.toUpperCase().includes(vehicleCode.toUpperCase()),
    );
    const matchRisk = RISK_KW.some((kw) => i.insight.includes(kw));
    return matchCode && matchRisk;
  });

  if (related.length === 0) return 90;
  if (related.length < 2) return 70;
  if (related.length < 5) return 40;
  return 15;
}

function calcDifficulty(difficulty: string): number {
  return DIFFICULTY_SCORES[difficulty] ?? 60;
}

function calcExternalDep(
  vehicleCode: string,
  feishu: FeishuCollectionResult | null,
): number {
  if (!feishu) return 70;

  const DEP_KW = ['供应商', '华为', '第三方', '外部', 'HiCar', '博泰'];
  const related = feishu.riskEntries.filter(
    (r) =>
      r.vehicleCode.toUpperCase().includes(vehicleCode.toUpperCase()) &&
      DEP_KW.some((kw) => r.description.includes(kw)),
  );

  if (related.length === 0) return 90;
  if (related.length < 2) return 60;
  return 30;
}

// ---------------------------------------------------------------------------
// Health score calculator
// ---------------------------------------------------------------------------

const WEIGHTS = {
  milestone: 0.30,
  issueDensity: 0.20,
  resourceCoverage: 0.15,
  historicalRisk: 0.15,
  difficulty: 0.10,
  externalDep: 0.10,
};

function toRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score < 30) return 'critical';
  if (score < 50) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

function assessProject(
  project: ProjectData,
  memory: MemoryCollectionResult,
  feishu: FeishuCollectionResult | null,
  jira: JiraCollectionResult | null,
): ProjectRiskAssessment {
  const dimensions = {
    milestone: calcMilestoneDimension(project.vehicleCode, memory.milestoneAlerts),
    issueDensity: calcIssueDensity(project.vehicleCode, jira),
    resourceCoverage: calcResourceCoverage(project.upl, project.ste),
    historicalRisk: calcHistoricalRisk(project.vehicleCode, memory.insights),
    difficulty: calcDifficulty(project.difficulty),
    externalDep: calcExternalDep(project.vehicleCode, feishu),
  };

  const healthScore = Math.round(
    dimensions.milestone * WEIGHTS.milestone +
    dimensions.issueDensity * WEIGHTS.issueDensity +
    dimensions.resourceCoverage * WEIGHTS.resourceCoverage +
    dimensions.historicalRisk * WEIGHTS.historicalRisk +
    dimensions.difficulty * WEIGHTS.difficulty +
    dimensions.externalDep * WEIGHTS.externalDep,
  );

  return {
    vehicleCode: project.vehicleCode,
    platform: project.platform,
    healthScore,
    riskLevel: toRiskLevel(healthScore),
    dimensions,
    topRisks: [],
    aiSummary: '',
    assessedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// AI enrichment
// ---------------------------------------------------------------------------

interface AIRiskResponse {
  adjustedScore?: number;
  riskLevel?: string;
  topRisks?: Array<{
    risk: string;
    impact: string;
    action: string;
    owner?: string;
  }>;
  summary?: string;
}

async function enrichWithAI(
  assessments: ProjectRiskAssessment[],
): Promise<ProjectRiskAssessment[]> {
  const available = await isClaudeAvailable();
  if (!available) {
    console.log('[risk-engine] Claude CLI not available, using rule scores only');
    return assessments.map((a) => ({
      ...a,
      aiSummary: `规则评分: ${a.healthScore}分 (${a.riskLevel})`,
      topRisks: generateRuleBasedRisks(a),
    }));
  }

  // Process top 10 riskiest projects with AI
  const sorted = [...assessments].sort((a, b) => a.healthScore - b.healthScore);
  const toEnrich = sorted.slice(0, 10);
  const rest = sorted.slice(10);

  console.log(`[risk-engine] Enriching ${toEnrich.length} projects with AI...`);

  const enriched: ProjectRiskAssessment[] = [];

  for (const assessment of toEnrich) {
    const prompt = buildRiskPrompt(assessment);

    try {
      const result = await askClaudeJSON<AIRiskResponse>(prompt);

      if (result.success && result.data) {
        const ai = result.data;
        enriched.push({
          ...assessment,
          healthScore: ai.adjustedScore ?? assessment.healthScore,
          riskLevel: (ai.riskLevel as ProjectRiskAssessment['riskLevel']) ?? assessment.riskLevel,
          topRisks: ai.topRisks ?? generateRuleBasedRisks(assessment),
          aiSummary: ai.summary ?? '',
        });
      } else {
        enriched.push({
          ...assessment,
          aiSummary: `AI分析失败: ${result.error?.slice(0, 80)}`,
          topRisks: generateRuleBasedRisks(assessment),
        });
      }
    } catch (err) {
      enriched.push({
        ...assessment,
        aiSummary: `AI调用异常`,
        topRisks: generateRuleBasedRisks(assessment),
      });
    }
  }

  // Add rule-based summaries for remaining projects
  for (const a of rest) {
    enriched.push({
      ...a,
      aiSummary: `规则评分: ${a.healthScore}分`,
      topRisks: generateRuleBasedRisks(a),
    });
  }

  return enriched;
}

function buildRiskPrompt(a: ProjectRiskAssessment): string {
  return `你是汽车智能座舱项目风险分析专家。请分析以下项目并直接输出JSON（不要markdown包裹）。

## 项目
车型: ${a.vehicleCode}, 平台: ${a.platform}

## 已计算的健康度
总分: ${a.healthScore}/100
维度明细:
- 里程碑紧迫度: ${a.dimensions.milestone}
- Issue密度: ${a.dimensions.issueDensity}
- 资源覆盖率: ${a.dimensions.resourceCoverage}
- 历史风险: ${a.dimensions.historicalRisk}
- 难度系数: ${a.dimensions.difficulty}
- 外部依赖: ${a.dimensions.externalDep}

请输出JSON:
{"adjustedScore": <你认为合理的分数0-100>, "riskLevel": "critical|high|medium|low", "topRisks": [{"risk": "描述", "impact": "影响", "action": "建议", "owner": "建议负责人"}], "summary": "一句话评估"}`;
}

function generateRuleBasedRisks(
  a: ProjectRiskAssessment,
): ProjectRiskAssessment['topRisks'] {
  const risks: ProjectRiskAssessment['topRisks'] = [];

  if (a.dimensions.milestone < 30) {
    risks.push({
      risk: '里程碑紧迫',
      impact: '项目可能无法按时交付',
      action: '立即审查里程碑计划，识别关键路径',
    });
  }
  if (a.dimensions.issueDensity < 40) {
    risks.push({
      risk: 'Issue堆积',
      impact: '未关闭问题过多影响进度',
      action: '组织专项清理，优先处理高优先级Issue',
    });
  }
  if (a.dimensions.resourceCoverage < 50) {
    risks.push({
      risk: '资源不足',
      impact: 'UPL/STE未指定，责任不清',
      action: '尽快明确项目负责人',
    });
  }
  if (a.dimensions.historicalRisk < 40) {
    risks.push({
      risk: '历史风险多发',
      impact: '项目存在反复出现的问题',
      action: '回溯历史风险，建立防范机制',
    });
  }

  return risks.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export async function runRiskEngine(
  memory: MemoryCollectionResult,
  feishu: FeishuCollectionResult | null,
  jira: JiraCollectionResult | null,
): Promise<RiskAssessmentPayload> {
  console.log('\n[risk-engine] Starting risk assessment...');

  const projects = loadProjects();
  console.log(`[risk-engine] Projects loaded: ${projects.length}`);

  if (projects.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      projects: [],
      overallHealth: 0,
      criticalCount: 0,
      aiGenerated: false,
    };
  }

  // Calculate rule-based scores
  const assessments = projects
    .filter((p) => p.status === 'active')
    .map((p) => assessProject(p, memory, feishu, jira));

  console.log(`[risk-engine] Active projects assessed: ${assessments.length}`);

  // Enrich with AI
  const enriched = await enrichWithAI(assessments);
  const aiGenerated = enriched.some((a) => a.aiSummary && !a.aiSummary.startsWith('规则评分'));

  const overallHealth = enriched.length > 0
    ? Math.round(enriched.reduce((s, a) => s + a.healthScore, 0) / enriched.length)
    : 0;

  const criticalCount = enriched.filter((a) => a.riskLevel === 'critical').length;

  const payload: RiskAssessmentPayload = {
    generatedAt: new Date().toISOString(),
    projects: enriched.sort((a, b) => a.healthScore - b.healthScore),
    overallHealth,
    criticalCount,
    aiGenerated,
  };

  // Write output
  const outputPath = path.join(PROJECT_ROOT, 'public', 'sync', 'risk-assessment.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[risk-engine] Output: ${outputPath}`);
  console.log(`[risk-engine] Overall health: ${overallHealth}, Critical: ${criticalCount}, AI: ${aiGenerated}`);

  return payload;
}
