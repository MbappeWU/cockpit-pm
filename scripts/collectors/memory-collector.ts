/**
 * memory-collector.ts
 *
 * Refactored from sync-memory.ts — standard collector interface
 * for reading memory-system JSONL data.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readJsonlFile, determineSeverity, isProjectRelevantTag } from '../lib/fs-utils.js';
import type { MemoryInsight, DecisionEntry, MilestoneAlert } from '../../src/types/sync.js';

// Re-export types for downstream consumers
export type { MemoryInsight, DecisionEntry, MilestoneAlert } from '../../src/types/sync.js';

export interface MemoryCollectionResult {
  collectedAt: string;
  insights: MemoryInsight[];
  decisions: DecisionEntry[];
  milestoneAlerts: MilestoneAlert[];
}

const HOME = os.homedir();
const MEMORY_DATA_DIR = path.join(HOME, 'Downloads', 'memory-system', 'context', 'data');
const INBOX_DIR = path.join(HOME, 'Downloads', 'memory-system', 'context', '.inbox');

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

function loadInsights(): MemoryInsight[] {
  const notesPath = path.join(MEMORY_DATA_DIR, 'memory-notes.jsonl');
  const raw = readJsonlFile(notesPath) as Array<Record<string, unknown>>;

  return raw
    .filter((entry) => {
      const tags = entry.tags as string[] | undefined;
      return Array.isArray(tags) && tags.some(isProjectRelevantTag);
    })
    .map((entry) => ({
      date: String(entry.date ?? ''),
      insight: String(entry.insight ?? ''),
      tags: (entry.tags as string[]) ?? [],
      status: String(entry.status ?? 'active'),
    }));
}

function loadDecisions(): DecisionEntry[] {
  const decisionsPath = path.join(MEMORY_DATA_DIR, 'decisions.jsonl');
  const raw = readJsonlFile(decisionsPath) as Array<Record<string, unknown>>;

  return raw
    .filter((entry) => {
      const domain = entry.domain as string | undefined;
      return domain === 'project-mgmt' || domain === 'kpi';
    })
    .map((entry) => ({
      date: String(entry.date ?? ''),
      decision: String(entry.decision ?? ''),
      reason: String(entry.reason ?? ''),
      domain: String(entry.domain ?? ''),
    }));
}

function loadMilestoneAlerts(): MilestoneAlert[] {
  if (!fs.existsSync(INBOX_DIR)) {
    console.warn(`  [warn] Inbox directory not found: ${INBOX_DIR}`);
    return [];
  }

  const pulseFiles = fs.readdirSync(INBOX_DIR)
    .filter((f) => f.startsWith('project-pulse-') && f.endsWith('.md'))
    .sort();

  if (pulseFiles.length === 0) {
    console.warn('  [warn] No project-pulse-*.md files found');
    return [];
  }

  const latestFile = path.join(INBOX_DIR, pulseFiles[pulseFiles.length - 1]);
  console.log(`  [info] Reading pulse: ${latestFile}`);

  const content = fs.readFileSync(latestFile, 'utf-8');
  const alerts: MilestoneAlert[] = [];

  const TABLE_ROW_RE = /^\|[^|]+\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*[\d-]+\s*\|\s*(\d+)\s*天\s*\|/;

  for (const line of content.split('\n')) {
    const match = line.match(TABLE_ROW_RE);
    if (!match) continue;

    const daysUntil = parseInt(match[4], 10);
    if (isNaN(daysUntil)) continue;

    alerts.push({
      vehicleCode: match[1].trim(),
      platform: match[2].trim(),
      milestone: match[3].trim(),
      daysUntil,
      severity: determineSeverity(daysUntil),
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Main collector
// ---------------------------------------------------------------------------

export async function collectMemoryData(): Promise<MemoryCollectionResult> {
  console.log('[memory-collector] Reading memory-system data...');

  const insights = loadInsights();
  console.log(`[memory-collector] Insights: ${insights.length}`);

  const decisions = loadDecisions();
  console.log(`[memory-collector] Decisions: ${decisions.length}`);

  const milestoneAlerts = loadMilestoneAlerts();
  console.log(`[memory-collector] Milestone alerts: ${milestoneAlerts.length}`);

  return {
    collectedAt: new Date().toISOString(),
    insights,
    decisions,
    milestoneAlerts,
  };
}
