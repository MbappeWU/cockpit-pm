/**
 * feishu-client.ts
 *
 * Feishu (Lark) Open API v3 client.
 * Ported from ~/Downloads/feishu_step2_step3.py
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const BASE = 'https://open.feishu.cn/open-apis';
const TOKEN_CACHE_PATH = path.join(
  process.env.HOME ?? '/tmp',
  '.feishu-token-cache.json',
);
const TOKEN_TTL_MS = 90 * 60 * 1000; // 1.5 hours

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface FeishuApiResponse {
  code: number;
  msg?: string;
  data?: Record<string, unknown>;
}

export interface SheetData {
  title: string;
  sheetId: string;
  rows: string[][];
  rowCount: number;
}

export interface DocResult {
  token: string;
  title: string;
  type: string;
  keyword: string;
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

function loadCachedToken(): string | null {
  try {
    if (!fs.existsSync(TOKEN_CACHE_PATH)) return null;
    const cache: TokenCache = JSON.parse(
      fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'),
    );
    if (Date.now() < cache.expiresAt) return cache.token;
  } catch {
    // cache corrupt, ignore
  }
  return null;
}

function saveCachedToken(token: string): void {
  const cache: TokenCache = {
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  try {
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache), 'utf-8');
  } catch {
    // non-critical
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiGet(
  url: string,
  token: string,
): Promise<FeishuApiResponse> {
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json() as Promise<FeishuApiResponse>;
}

async function apiPost(
  url: string,
  body: unknown,
  token: string,
): Promise<FeishuApiResponse> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json() as Promise<FeishuApiResponse>;
}

// ---------------------------------------------------------------------------
// FeishuClient
// ---------------------------------------------------------------------------

export class FeishuClient {
  private token = '';
  private appId: string;
  private appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /** Authenticate and cache the tenant_access_token */
  async authenticate(): Promise<void> {
    const cached = loadCachedToken();
    if (cached) {
      this.token = cached;
      return;
    }

    const resp = await fetch(
      `${BASE}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      },
    );

    const data = (await resp.json()) as {
      code?: number;
      tenant_access_token?: string;
    };

    if (!data.tenant_access_token) {
      throw new Error(
        `Feishu auth failed: ${JSON.stringify(data).slice(0, 200)}`,
      );
    }

    this.token = data.tenant_access_token;
    saveCachedToken(this.token);
  }

  /** Read all sheets from a spreadsheet */
  async getSheetData(sheetToken: string): Promise<SheetData[]> {
    await this.ensureAuth();

    const meta = await apiGet(
      `${BASE}/sheets/v2/spreadsheets/${sheetToken}/metainfo`,
      this.token,
    );

    if (meta.code !== 0) {
      console.warn(`[feishu] Sheet meta error: ${meta.msg}`);
      return [];
    }

    const sheets = (meta.data?.sheets as Array<Record<string, unknown>>) ?? [];
    const results: SheetData[] = [];

    for (const s of sheets) {
      const sid = String(s.sheetId ?? '');
      const title = String(s.title ?? '');

      const dataResp = await apiGet(
        `${BASE}/sheets/v2/spreadsheets/${sheetToken}/values/${sid}`,
        this.token,
      );

      const rows: string[][] = [];
      if (dataResp.code === 0) {
        const vr = dataResp.data?.valueRange as Record<string, unknown> | undefined;
        const values = (vr?.values as unknown[][]) ?? [];
        for (const row of values) {
          const nonEmpty = row.filter(
            (c) => c !== null && c !== undefined && String(c).trim(),
          );
          if (nonEmpty.length > 0) {
            rows.push(row.map((c) => (c != null ? String(c) : '')));
          }
        }
      }

      results.push({ title, sheetId: sid, rows, rowCount: rows.length });
    }

    return results;
  }

  /** Search for documents by keywords */
  async searchDocs(keywords: string[]): Promise<DocResult[]> {
    await this.ensureAuth();

    const found: DocResult[] = [];
    const seenTokens = new Set<string>();

    for (const kw of keywords) {
      const sr = await apiPost(
        `${BASE}/suite/docs-api/search/object`,
        {
          search_key: kw,
          count: 10,
          offset: 0,
          owner_ids: [],
          docs_types: [1, 2, 3, 7, 8, 9, 10, 11, 12, 15, 16, 22],
        },
        this.token,
      );

      if (sr.code === 0) {
        const docs =
          (sr.data?.docs_entities as Array<Record<string, unknown>>) ?? [];
        for (const d of docs) {
          const dt = String(d.docs_token ?? '');
          if (dt && !seenTokens.has(dt)) {
            seenTokens.add(dt);
            found.push({
              token: dt,
              title: String(d.title ?? ''),
              type: String(d.docs_type ?? ''),
              keyword: kw,
            });
          }
        }
      }

      if (found.length >= 20) break;
    }

    return found;
  }

  /** Read raw content of a docx document */
  async getDocContent(docToken: string): Promise<string> {
    await this.ensureAuth();

    const raw = await apiGet(
      `${BASE}/docx/v1/documents/${docToken}/raw_content`,
      this.token,
    );

    if (raw.code === 0) {
      return String(raw.data?.content ?? '');
    }

    return '';
  }

  /** List files in a folder */
  async listFolder(
    folderToken: string,
    pageSize = 50,
  ): Promise<Array<{ name: string; token: string; type: string }>> {
    await this.ensureAuth();

    const resp = await apiGet(
      `${BASE}/drive/v1/files?folder_token=${folderToken}&page_size=${pageSize}&order_by=EditedTime&direction=DESC`,
      this.token,
    );

    if (resp.code !== 0) return [];

    const files = (resp.data?.files as Array<Record<string, unknown>>) ?? [];
    return files.map((f) => ({
      name: String(f.name ?? ''),
      token: String(f.token ?? ''),
      type: String(f.type ?? ''),
    }));
  }

  private async ensureAuth(): Promise<void> {
    if (!this.token) {
      await this.authenticate();
    }
  }
}

/** Create a FeishuClient from environment variables */
export function createFeishuClient(): FeishuClient | null {
  const appId = process.env.FEISHU_APP_ID ?? process.env.VITE_FEISHU_APP_ID ?? '';
  const appSecret = process.env.FEISHU_APP_SECRET ?? process.env.VITE_FEISHU_APP_SECRET ?? '';

  if (!appId || !appSecret) {
    console.warn('[feishu] Missing FEISHU_APP_ID or FEISHU_APP_SECRET');
    return null;
  }

  return new FeishuClient(appId, appSecret);
}
