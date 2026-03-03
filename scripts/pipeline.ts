/**
 * pipeline.ts
 *
 * Orchestrates the full data pipeline:
 *   collect → analyze → generate → push
 *
 * Usage:
 *   npm run pipeline           # Full pipeline
 *   npm run pipeline:collect   # Data collection only
 *   npm run pipeline:analyze   # Analysis only (needs prior collection)
 *   npm run pipeline:push      # Push report only (needs prior analysis)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
config({ path: path.join(PROJECT_ROOT, '.env') });

import { collectMemoryData, type MemoryCollectionResult } from './collectors/memory-collector.js';
import { collectFeishuData, type FeishuCollectionResult } from './collectors/feishu-collector.js';
import { collectJiraData, type JiraCollectionResult } from './collectors/jira-collector.js';
import { runRiskEngine, type RiskAssessmentPayload } from './analyzers/risk-engine.js';
import { runPerfEngine, type PerfReportPayload } from './analyzers/perf-engine.js';
import { generateDigest, type DailyDigest } from './analyzers/digest-generator.js';
import { pushDigestToFeishu } from './push-feishu.js';

// ---------------------------------------------------------------------------
// Pipeline step tracking
// ---------------------------------------------------------------------------

interface StepResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

const steps: StepResult[] = [];

async function runStep<T>(
  name: string,
  fn: () => Promise<T>,
  skip = false,
): Promise<T | null> {
  if (skip) {
    steps.push({ name, status: 'skipped', duration: 0 });
    console.log(`\n⏭️  [${name}] Skipped`);
    return null;
  }

  const start = Date.now();
  console.log(`\n▶️  [${name}] Starting...`);

  try {
    const result = await fn();
    const duration = Date.now() - start;
    steps.push({ name, status: 'success', duration });
    console.log(`✅ [${name}] Done (${(duration / 1000).toFixed(1)}s)`);
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    steps.push({ name, status: 'failed', duration, error });
    console.error(`❌ [${name}] Failed: ${error}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Ensure output directory
// ---------------------------------------------------------------------------

function ensureOutputDir(): void {
  const syncDir = path.join(PROJECT_ROOT, 'public', 'sync');
  if (!fs.existsSync(syncDir)) {
    fs.mkdirSync(syncDir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const mode = process.argv[2] ?? 'full';
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════');
  console.log(`  🚀 Cockpit PM Pipeline — mode: ${mode}`);
  console.log(`  📅 ${new Date().toLocaleString('zh-CN')}`);
  console.log('═══════════════════════════════════════════');

  ensureOutputDir();

  // ---------------------------------------------------------------------------
  // Step 1: Collect data
  // ---------------------------------------------------------------------------

  let memory: MemoryCollectionResult | null = null;
  let feishu: FeishuCollectionResult | null = null;
  let jira: JiraCollectionResult | null = null;

  if (['full', 'collect'].includes(mode)) {
    memory = await runStep('Memory采集', () => collectMemoryData());

    feishu = await runStep(
      '飞书采集',
      () => collectFeishuData(),
      !process.env.FEISHU_APP_ID && !process.env.VITE_FEISHU_APP_ID,
    );

    jira = await runStep(
      'JIRA采集',
      () => collectJiraData(),
      !process.env.JIRA_TOKEN && !process.env.VITE_JIRA_TOKEN,
    );

    // Write merged collection data
    if (memory) {
      const syncPayload = {
        generatedAt: new Date().toISOString(),
        source: 'pipeline',
        insights: memory.insights,
        decisions: memory.decisions,
        milestoneAlerts: memory.milestoneAlerts,
      };
      const syncPath = path.join(PROJECT_ROOT, 'public', 'sync', 'memory-sync.json');
      fs.writeFileSync(syncPath, JSON.stringify(syncPayload, null, 2), 'utf-8');
    }
  } else {
    // Load existing sync data for analyze/push modes
    const syncPath = path.join(PROJECT_ROOT, 'public', 'sync', 'memory-sync.json');
    if (fs.existsSync(syncPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(syncPath, 'utf-8'));
        memory = {
          collectedAt: data.generatedAt,
          insights: data.insights ?? [],
          decisions: data.decisions ?? [],
          milestoneAlerts: data.milestoneAlerts ?? [],
        };
      } catch { /* continue */ }
    }
  }

  // Ensure memory has default value
  if (!memory) {
    memory = {
      collectedAt: new Date().toISOString(),
      insights: [],
      decisions: [],
      milestoneAlerts: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Step 2: Analyze
  // ---------------------------------------------------------------------------

  let risks: RiskAssessmentPayload | null = null;
  let perfs: PerfReportPayload | null = null;

  if (['full', 'analyze'].includes(mode)) {
    risks = await runStep('风险评估', () =>
      runRiskEngine(memory!, feishu, jira),
    );

    perfs = await runStep('绩效评估', () => runPerfEngine(risks));
  } else {
    // Load existing analysis data
    const riskPath = path.join(PROJECT_ROOT, 'public', 'sync', 'risk-assessment.json');
    const perfPath = path.join(PROJECT_ROOT, 'public', 'sync', 'perf-report.json');

    if (fs.existsSync(riskPath)) {
      try {
        risks = JSON.parse(fs.readFileSync(riskPath, 'utf-8'));
      } catch { /* continue */ }
    }
    if (fs.existsSync(perfPath)) {
      try {
        perfs = JSON.parse(fs.readFileSync(perfPath, 'utf-8'));
      } catch { /* continue */ }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Generate digest
  // ---------------------------------------------------------------------------

  let digest: DailyDigest | null = null;

  if (['full', 'analyze', 'push'].includes(mode)) {
    digest = await runStep('日报生成', () =>
      generateDigest(memory!, feishu, jira, risks, perfs),
    );
  }

  // ---------------------------------------------------------------------------
  // Step 4: Push
  // ---------------------------------------------------------------------------

  if (['full', 'push'].includes(mode) && digest) {
    await runStep(
      '飞书推送',
      () => pushDigestToFeishu(digest!),
      !process.env.FEISHU_WEBHOOK_URL,
    );
  }

  // ---------------------------------------------------------------------------
  // Write pipeline status
  // ---------------------------------------------------------------------------

  const totalDuration = Date.now() - startTime;
  const status = {
    runAt: new Date().toISOString(),
    mode,
    steps,
    totalDuration,
  };

  const statusPath = path.join(PROJECT_ROOT, 'public', 'sync', 'pipeline-status.json');
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 Pipeline Summary');
  console.log('═══════════════════════════════════════════');

  for (const step of steps) {
    const icon = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
    const time = step.duration > 0 ? ` (${(step.duration / 1000).toFixed(1)}s)` : '';
    console.log(`  ${icon} ${step.name}${time}${step.error ? ` — ${step.error}` : ''}`);
  }

  console.log(`\n  ⏱️  Total: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`  📁 Output: public/sync/`);

  // Exit with error code if any step failed
  if (steps.some((s) => s.status === 'failed')) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Pipeline crashed:', err);
  process.exit(2);
});
