/**
 * diagnose.ts
 *
 * Reads synced data from public/sync/memory-sync.json and raw JSONL files,
 * applies diagnostic rules, and outputs a diagnostics report.
 *
 * Usage: npx tsx scripts/diagnose.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readJsonlFile, daysBetween, isWithinRecentDays } from './lib/fs-utils.js';
import type {
  MemoryInsight, DecisionEntry, MilestoneAlert, SyncPayload,
  DiagnosticItem, DiagnosticResult,
} from '../src/types/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawMemoryNote {
  date: string;
  type: string;
  ttl: string | null;
  insight: string;
  tags: string[];
  status: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HOME = os.homedir();
const MEMORY_DATA_DIR = path.join(HOME, 'Downloads', 'memory-system', 'context', 'data');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_FILE = path.join(PROJECT_ROOT, 'public', 'sync', 'memory-sync.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'sync');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'diagnostics-latest.json');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_KEYWORDS = ['风险', '延期', '问题', '阻塞', '瓶颈', '延迟', '滞后'];
const RECENT_DAYS = 7;
const TTL_WARNING_DAYS = 14;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSyncPayload(): SyncPayload | null {
  if (!fs.existsSync(SYNC_FILE)) {
    console.warn('  [warn] Sync file not found, run sync-memory first: ' + SYNC_FILE);
    return null;
  }

  try {
    const content = fs.readFileSync(SYNC_FILE, 'utf-8');
    return JSON.parse(content) as SyncPayload;
  } catch (err) {
    console.warn('  [warn] Failed to parse sync file:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Rules
// ---------------------------------------------------------------------------

function diagnoseAlerts(alerts: MilestoneAlert[]): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];

  for (const alert of alerts) {
    if (alert.severity === 'red') {
      items.push({
        type: '紧急',
        color: 'red',
        message: `${alert.vehicleCode} ${alert.milestone} 仅剩 ${alert.daysUntil} 天`,
        source: 'static',
        relatedTo: alert.vehicleCode,
      });
    } else if (alert.severity === 'yellow') {
      items.push({
        type: '警告',
        color: 'yellow',
        message: `${alert.vehicleCode} ${alert.milestone} 剩余 ${alert.daysUntil} 天，需关注`,
        source: 'static',
        relatedTo: alert.vehicleCode,
      });
    }
  }

  return items;
}

function diagnoseInsights(insights: MemoryInsight[]): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];

  for (const insight of insights) {
    const hasProjectTag = insight.tags.includes('project-mgmt');
    if (!hasProjectTag) continue;

    const hasRiskKeyword = RISK_KEYWORDS.some((kw) => insight.insight.includes(kw));
    if (hasRiskKeyword) {
      items.push({
        type: '关注',
        color: 'yellow',
        message: insight.insight.length > 80
          ? insight.insight.slice(0, 80) + '...'
          : insight.insight,
        source: 'ai',
        relatedTo: insight.tags.find((t) => /^h\d+/i.test(t)) ?? undefined,
      });
    }
  }

  return items;
}

function diagnoseRecentDecisions(decisions: DecisionEntry[], now: Date): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];

  for (const decision of decisions) {
    if (decision.domain !== 'project-mgmt' && decision.domain !== 'kpi') continue;
    if (!isWithinRecentDays(decision.date, RECENT_DAYS, now)) continue;

    items.push({
      type: '建议',
      color: 'green',
      message: `新决策: ${decision.decision.length > 80 ? decision.decision.slice(0, 80) + '...' : decision.decision}`,
      source: 'ai',
    });
  }

  return items;
}

function diagnoseVolatileTtl(now: Date): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];
  const notesPath = path.join(MEMORY_DATA_DIR, 'memory-notes.jsonl');
  const raw = readJsonlFile(notesPath) as RawMemoryNote[];

  for (const note of raw) {
    if (note.type !== 'volatile') continue;
    if (note.status !== 'active') continue;
    if (!note.ttl) continue;

    const daysLeft = daysBetween(note.ttl, now);
    if (daysLeft > 0 && daysLeft <= TTL_WARNING_DAYS) {
      items.push({
        type: '警告',
        color: 'yellow',
        message: `记忆即将过期 (${daysLeft}天): ${note.insight.length > 60 ? note.insight.slice(0, 60) + '...' : note.insight}`,
        source: 'static',
        relatedTo: note.tags?.find((t) => /^h\d+/i.test(t)) ?? undefined,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('diagnose: Running project diagnostics...\n');

  const now = new Date();
  const syncData = readSyncPayload();
  const allItems: DiagnosticItem[] = [];

  // Rule 1: Milestone alerts (red)
  const alertItems = diagnoseAlerts(syncData?.milestoneAlerts ?? []);
  allItems.push(...alertItems);
  console.log(`  Milestone alert items: ${alertItems.length}`);

  // Rule 2: Risk-related insights
  const insightItems = diagnoseInsights(syncData?.insights ?? []);
  allItems.push(...insightItems);
  console.log(`  Risk insight items: ${insightItems.length}`);

  // Rule 3: Recent project-mgmt decisions
  const decisionItems = diagnoseRecentDecisions(syncData?.decisions ?? [], now);
  allItems.push(...decisionItems);
  console.log(`  Recent decision items: ${decisionItems.length}`);

  // Rule 4: Volatile entries with TTL expiring soon
  const ttlItems = diagnoseVolatileTtl(now);
  allItems.push(...ttlItems);
  console.log(`  TTL warning items: ${ttlItems.length}`);

  // Default: if no issues found, add a "good" item
  if (allItems.length === 0) {
    allItems.push({
      type: '良好',
      color: 'green',
      message: '所有项目状态正常，无异常检出',
      source: 'static',
    });
  }

  // Calculate summary counts
  const red = allItems.filter((i) => i.type === '紧急' || i.color === 'red').length;
  const yellow = allItems.filter((i) =>
    i.color === 'yellow' && i.type !== '紧急'
  ).length;
  const green = allItems.filter((i) =>
    i.color === 'green' || (i.type !== '紧急' && i.type !== '警告' && i.type !== '关注')
  ).length;

  const result: DiagnosticResult = {
    runAt: now.toISOString(),
    items: allItems,
    summary: { red, yellow, green },
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  console.log(
    `\n\uD83D\uDD0D Diagnostics complete: ${red} \uD83D\uDD34 ${yellow} \uD83D\uDFE1 ${green} \uD83D\uDFE2 \u2192 public/sync/diagnostics-latest.json`
  );
}

main();
