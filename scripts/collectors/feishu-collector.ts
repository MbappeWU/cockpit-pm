/**
 * feishu-collector.ts
 *
 * Collects data from Feishu: risk sheets, meeting docs, todo lists.
 */

import { createFeishuClient, type SheetData } from '../lib/feishu-client.js';

// Feishu sheet/folder tokens (from existing feishu_step2_step3.py)
const MAIN_SHEET_TOKEN = 'PXdGsXLnhh9g8ltgQ27cY2j4nKe';
const TODO_SHEET_TOKEN = 'EfqNsxfnVhWnpwtNuJpcfPjAnIh';
const MEETING_FOLDER_TOKEN = 'OI7KfNpL1lZOHfdn5Cic4D7onih';
const SEARCH_KEYWORDS = ['座舱周例会', '座舱 例会纪要', '智能纪要 座舱'];

// Vehicle codes for filtering
const VEHICLE_CODES = [
  'H47', 'H56', 'H56E', 'H56DZ', 'H67', 'H66', 'H77',
  'H93', 'H96', 'M65', 'B27', 'R83',
];

export interface FeishuCollectionResult {
  collectedAt: string;
  riskEntries: ProjectRiskEntry[];
  meetingActions: MeetingAction[];
  todoItems: FeishuTodoItem[];
  rawSheets: SheetData[];
}

export interface ProjectRiskEntry {
  vehicleCode: string;
  riskType: string;
  severity: string;
  owner: string;
  status: string;
  description: string;
}

export interface MeetingAction {
  decision: string;
  assignee: string;
  deadline: string;
  source: string;
}

export interface FeishuTodoItem {
  member: string;
  task: string;
  status: string;
  dueDate: string;
}

// ---------------------------------------------------------------------------
// Sheet parsing helpers
// ---------------------------------------------------------------------------

function findVehicleCode(text: string): string {
  for (const code of VEHICLE_CODES) {
    if (text.toUpperCase().includes(code)) return code;
  }
  return '';
}

function parseRiskEntries(sheets: SheetData[]): ProjectRiskEntry[] {
  const entries: ProjectRiskEntry[] = [];

  for (const sheet of sheets) {
    const titleLower = sheet.title.toLowerCase();
    // Look for sheets that might contain risk info
    if (
      !titleLower.includes('风险') &&
      !titleLower.includes('risk') &&
      !titleLower.includes('问题') &&
      !titleLower.includes('跟踪')
    ) {
      continue;
    }

    for (let i = 1; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      if (row.length < 3) continue;

      const text = row.join(' ');
      const vehicleCode = findVehicleCode(text);

      entries.push({
        vehicleCode,
        riskType: row[1]?.trim() ?? '',
        severity: detectSeverity(text),
        owner: extractOwner(row),
        status: row[row.length - 1]?.trim() ?? '',
        description: row.slice(1, 4).join(' | ').trim(),
      });
    }
  }

  return entries;
}

function detectSeverity(text: string): string {
  if (/紧急|严重|阻塞|blocker|critical/i.test(text)) return 'critical';
  if (/高|重要|high/i.test(text)) return 'high';
  if (/中|medium/i.test(text)) return 'medium';
  return 'low';
}

function extractOwner(row: string[]): string {
  // Look for Chinese names (2-4 characters) in common positions
  for (const cell of row) {
    const nameMatch = cell.match(/^[\u4e00-\u9fa5]{2,4}$/);
    if (nameMatch) return nameMatch[0];
  }
  return '';
}

function parseTodoItems(sheets: SheetData[]): FeishuTodoItem[] {
  const items: FeishuTodoItem[] = [];

  for (const sheet of sheets) {
    for (let i = 1; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      if (row.length < 2) continue;

      items.push({
        member: row[0]?.trim() ?? '',
        task: row[1]?.trim() ?? '',
        status: row.length > 2 ? (row[2]?.trim() ?? '') : '',
        dueDate: row.length > 3 ? (row[3]?.trim() ?? '') : '',
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Meeting doc parsing
// ---------------------------------------------------------------------------

function parseMeetingActions(content: string, source: string): MeetingAction[] {
  const actions: MeetingAction[] = [];

  // Match patterns like: "决策：xxx" or "行动项：xxx" or "TODO: xxx"
  const patterns = [
    /(?:决策|决定|结论)[：:]\s*(.+)/g,
    /(?:行动项|待办|TODO|Action)[：:]\s*(.+)/g,
    /(?:负责人|Owner)[：:]\s*(.+)/g,
  ];

  const lines = content.split('\n');
  for (const line of lines) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        // Try to extract assignee and deadline from the line
        const nameMatch = line.match(/[\u4e00-\u9fa5]{2,4}/);
        const dateMatch = line.match(/\d{1,2}[月/.-]\d{1,2}|\d{4}[年/.-]\d{1,2}[月/.-]\d{1,2}/);

        actions.push({
          decision: match[1].trim().slice(0, 200),
          assignee: nameMatch?.[0] ?? '',
          deadline: dateMatch?.[0] ?? '',
          source,
        });
      }
    }
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Main collector
// ---------------------------------------------------------------------------

export async function collectFeishuData(): Promise<FeishuCollectionResult | null> {
  const client = createFeishuClient();
  if (!client) {
    console.log('[feishu-collector] No Feishu credentials, skipping');
    return null;
  }

  console.log('[feishu-collector] Authenticating...');
  await client.authenticate();
  console.log('[feishu-collector] Authenticated');

  // 1. Read main project sheet
  console.log('[feishu-collector] Reading main sheet...');
  const mainSheets = await client.getSheetData(MAIN_SHEET_TOKEN);
  console.log(`[feishu-collector] Main sheet: ${mainSheets.length} tabs, ${mainSheets.reduce((s, t) => s + t.rowCount, 0)} rows`);

  // 2. Parse risk entries from sheets
  const riskEntries = parseRiskEntries(mainSheets);
  console.log(`[feishu-collector] Risk entries: ${riskEntries.length}`);

  // 3. Read todo sheet
  console.log('[feishu-collector] Reading todo sheet...');
  const todoSheets = await client.getSheetData(TODO_SHEET_TOKEN);
  const todoItems = parseTodoItems(todoSheets);
  console.log(`[feishu-collector] Todo items: ${todoItems.length}`);

  // 4. Search and read meeting docs
  console.log('[feishu-collector] Searching meeting docs...');
  const docs = await client.searchDocs(SEARCH_KEYWORDS);
  console.log(`[feishu-collector] Found ${docs.length} docs`);

  const meetingActions: MeetingAction[] = [];
  let docsRead = 0;

  for (const doc of docs) {
    if (doc.type !== 'docx' && doc.type !== 'doc') continue;
    if (docsRead >= 5) break;

    const content = await client.getDocContent(doc.token);
    if (content.length > 50) {
      const actions = parseMeetingActions(content, doc.title);
      meetingActions.push(...actions);
      docsRead++;
    }
  }
  console.log(`[feishu-collector] Meeting actions: ${meetingActions.length}`);

  return {
    collectedAt: new Date().toISOString(),
    riskEntries,
    meetingActions,
    todoItems,
    rawSheets: mainSheets,
  };
}
