/**
 * claude-client.ts
 *
 * Claude Code CLI wrapper — calls `claude -p` via child_process.
 * Falls back gracefully when the CLI is unavailable.
 */

import { execFile } from 'node:child_process';

const TIMEOUT_MS = 120_000; // 2 minutes
const MAX_BUFFER = 2 * 1024 * 1024; // 2 MB

export interface ClaudeResponse {
  success: boolean;
  text: string;
  error?: string;
}

/** Check if `claude` CLI is available on PATH */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', ['claude'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Send a prompt to Claude Code CLI and get the response.
 * Uses `claude -p "<prompt>" --output-format text`
 */
export async function askClaude(prompt: string): Promise<ClaudeResponse> {
  return new Promise((resolve) => {
    execFile(
      'claude',
      ['-p', prompt, '--output-format', 'text'],
      {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        env: { ...process.env },
      },
      (err, stdout, stderr) => {
        if (err) {
          resolve({
            success: false,
            text: '',
            error: `Claude CLI error: ${err.message}${stderr ? ` | ${stderr.slice(0, 200)}` : ''}`,
          });
        } else {
          resolve({
            success: true,
            text: stdout.trim(),
          });
        }
      },
    );
  });
}

/**
 * Send a prompt to Claude Code CLI and parse JSON from the response.
 * The prompt should instruct Claude to output valid JSON.
 * Extracts JSON from markdown code blocks if present.
 */
export async function askClaudeJSON<T = unknown>(
  prompt: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const resp = await askClaude(prompt);

  if (!resp.success) {
    return { success: false, error: resp.error };
  }

  try {
    // Try direct parse first
    const data = JSON.parse(resp.text) as T;
    return { success: true, data };
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = resp.text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (jsonMatch?.[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]) as T;
        return { success: true, data };
      } catch {
        // fall through
      }
    }

    // Try finding JSON object/array in text
    const objectMatch = resp.text.match(/\{[\s\S]*\}/);
    const arrayMatch = resp.text.match(/\[[\s\S]*\]/);
    const rawJson = objectMatch?.[0] ?? arrayMatch?.[0];

    if (rawJson) {
      try {
        const data = JSON.parse(rawJson) as T;
        return { success: true, data };
      } catch {
        // fall through
      }
    }

    return {
      success: false,
      error: `Failed to parse JSON from Claude response: ${resp.text.slice(0, 200)}...`,
    };
  }
}
