/**
 * sync-memory.ts
 *
 * Syncs project-management-relevant data from ~/Downloads/memory-system
 * into public/sync/memory-sync.json for the cockpit PM dashboard.
 *
 * Usage: npx tsx scripts/sync-memory.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readJsonlFile, determineSeverity, isProjectRelevantTag } from './lib/fs-utils.js';
import type { MemoryInsight, DecisionEntry, MilestoneAlert, SyncPayload } from '../src/types/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HOME = os.homedir();
const MEMORY_DATA_DIR = path.join(HOME, 'Downloads', 'memory-system', 'context', 'data');
const INBOX_DIR = path.join(HOME, 'Downloads', 'memory-system', 'context', '.inbox');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'sync');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'memory-sync.json');

// ---------------------------------------------------------------------------
// Step 1: Read and filter memory notes
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

// ---------------------------------------------------------------------------
// Step 2: Read and filter decisions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Step 3: Parse latest project-pulse file for milestone alerts
// ---------------------------------------------------------------------------

function loadMilestoneAlerts(): MilestoneAlert[] {
  if (!fs.existsSync(INBOX_DIR)) {
    console.warn(`  [warn] Inbox directory not found: ${INBOX_DIR}`);
    return [];
  }

  const pulseFiles = fs.readdirSync(INBOX_DIR)
    .filter((f) => f.startsWith('project-pulse-') && f.endsWith('.md'))
    .sort();

  if (pulseFiles.length === 0) {
    console.warn('  [warn] No project-pulse-*.md files found in inbox');
    return [];
  }

  const latestFile = path.join(INBOX_DIR, pulseFiles[pulseFiles.length - 1]);
  console.log(`  [info] Reading pulse file: ${latestFile}`);

  const content = fs.readFileSync(latestFile, 'utf-8');
  const alerts: MilestoneAlert[] = [];

  // Parse the milestone table rows
  // Format: | 🟡 关注 | H66 (H56N) | 鸿蒙 | J4 | 2026-04-30 | 59 天 |
  // Skip header row by requiring digits in the date/days columns
  const TABLE_ROW_RE = /^\|[^|]+\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*[\d-]+\s*\|\s*(\d+)\s*天\s*\|/;

  for (const line of content.split('\n')) {
    const match = line.match(TABLE_ROW_RE);
    if (!match) continue;

    const vehicleCode = match[1].trim();
    const platform = match[2].trim();
    const milestone = match[3].trim();
    const daysUntil = parseInt(match[4], 10);

    if (isNaN(daysUntil)) continue;

    alerts.push({
      vehicleCode,
      platform,
      milestone,
      daysUntil,
      severity: determineSeverity(daysUntil),
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('sync-memory: Starting sync from memory-system...\n');

  const insights = loadInsights();
  console.log(`  Insights loaded: ${insights.length}`);

  const decisions = loadDecisions();
  console.log(`  Decisions loaded: ${decisions.length}`);

  const milestoneAlerts = loadMilestoneAlerts();
  console.log(`  Milestone alerts loaded: ${milestoneAlerts.length}\n`);

  const payload: SyncPayload = {
    generatedAt: new Date().toISOString(),
    source: 'memory-system',
    insights,
    decisions,
    milestoneAlerts,
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(
    `\u2705 Sync complete: ${insights.length} insights, ${decisions.length} decisions, ${milestoneAlerts.length} alerts \u2192 public/sync/memory-sync.json`
  );
}

main();
