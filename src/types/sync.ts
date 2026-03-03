import type { VehicleProject } from './project';

/** 每个数据源的同步元数据 */
export interface SyncMeta {
  lastSyncedAt: string | null;
  source: string;
  recordCount: number;
}

/** CLI 脚本输出的同步载荷 */
export interface SyncPayload {
  generatedAt: string;
  source: string;
  projects?: (Partial<VehicleProject> & { id: string })[];
  insights?: MemoryInsight[];
  decisions?: DecisionEntry[];
  milestoneAlerts?: MilestoneAlert[];
}

/** memory-notes.jsonl 中的项目相关洞察 */
export interface MemoryInsight {
  date: string;
  insight: string;
  tags: string[];
  status: string;
}

/** decisions.jsonl 中的决策条目 */
export interface DecisionEntry {
  date: string;
  decision: string;
  reason: string;
  domain: string;
}

/** 里程碑预警（从 project-pulse 解析） */
export interface MilestoneAlert {
  vehicleCode: string;
  platform: string;
  milestone: string;
  daysUntil: number;
  severity: 'red' | 'yellow' | 'green';
}

/** 诊断引擎输出结果 */
export interface DiagnosticResult {
  runAt: string;
  items: DiagnosticItem[];
  summary: { red: number; yellow: number; green: number };
}

/** 单条诊断项 */
export interface DiagnosticItem {
  type: '风险' | '警告' | '紧急' | '关注' | '建议' | '良好';
  color: string;
  message: string;
  source: 'static' | 'ai';
  relatedTo?: string;
}
