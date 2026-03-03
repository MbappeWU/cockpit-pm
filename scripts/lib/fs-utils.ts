/**
 * fs-utils.ts
 *
 * Shared file utilities for CLI scripts.
 * Extracts readJsonlFile, determineSeverity, date helpers that were duplicated
 * across sync-memory.ts, diagnose.ts, and memory-collector.ts.
 */

import * as fs from 'node:fs';

/* ── JSONL reader ──────────────────────────────────────────── */

export function readJsonlFile(filePath: string): unknown[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  [warn] File not found, skipping: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const results: unknown[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('{"_schema"')) continue;

    try {
      results.push(JSON.parse(trimmed));
    } catch {
      console.warn(`  [warn] Skipping malformed JSON line: ${trimmed.slice(0, 80)}...`);
    }
  }

  return results;
}

/* ── Severity ──────────────────────────────────────────────── */

export function determineSeverity(daysUntil: number): 'red' | 'yellow' | 'green' {
  if (daysUntil < 30) return 'red';
  if (daysUntil < 60) return 'yellow';
  return 'green';
}

/* ── Date helpers ──────────────────────────────────────────── */

export function daysBetween(dateStr: string, reference: Date): number {
  const target = new Date(dateStr);
  const diffMs = target.getTime() - reference.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isWithinRecentDays(dateStr: string, days: number, now: Date): boolean {
  const entryDate = new Date(dateStr);
  const diffMs = now.getTime() - entryDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/* ── Tag helpers ───────────────────────────────────────────── */

const VEHICLE_CODE_RE = /^h\d+/i;

export function isProjectRelevantTag(tag: string): boolean {
  return tag === 'project-mgmt' || VEHICLE_CODE_RE.test(tag);
}
