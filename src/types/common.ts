export type Status = 'pending' | 'in_progress' | 'done' | 'blocked';
export type OKRStatus = 'on_track' | 'at_risk' | 'off_track';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type MemberRole = '专家' | '骨干' | '骨干(课题)' | '成员';
export type Level = 'P5' | 'P6' | 'P7' | 'P8' | 'P9' | 'P10' | 'P11' | 'P12';
export type PerfGrade = 'A' | 'A+' | 'A-' | 'B+' | 'B' | 'B-' | 'C+🌟' | 'C+' | 'C' | 'C-' | '-' | '';
export type Platform = 'VCOS' | '鸿蒙' | '博泰' | '8155';
export type Difficulty = 'A' | 'B' | 'C' | 'D' | 'E';
export type MilestoneType = 'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6' | 'J7' | 'PVS' | 'PT' | 'ME+01' | 'SOP' | 'SOP+OTA' | 'OTA';

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待办', color: '#64748b' },
  in_progress: { label: '进行中', color: '#3b82f6' },
  done: { label: '完成', color: '#10b981' },
  blocked: { label: '阻塞', color: '#ef4444' },
  on_track: { label: '正常', color: '#10b981' },
  at_risk: { label: '风险', color: '#f59e0b' },
  off_track: { label: '偏离', color: '#ef4444' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  urgent: { label: '紧急', color: '#f43f5e' },
  high: { label: '高', color: '#f59e0b' },
  medium: { label: '中', color: '#3b82f6' },
  low: { label: '低', color: '#64748b' },
};

export const PERF_COLORS: Record<string, string> = {
  'A': '#10b981',
  'A+': '#10b981',
  'A-': '#34d399',
  'B+': '#3b82f6',
  'B': '#60a5fa',
  'B-': '#93c5fd',
  'C+🌟': '#f97316',
  'C+': '#f59e0b',
  'C': '#64748b',
  'C-': '#ef4444',
  '-': '#334155',
  '': '#334155',
};

export const LEVEL_ORDER: Record<string, number> = {
  P12: 0, P11: 1, P10: 2, P9: 3, P8: 4, P7: 5, P6: 6, P5: 7,
};

/** Historical performance period keys — shared between TeamPage and RosterTable */
export const PERF_PERIOD_KEYS = ['2023', '24Q1', '24Q2', '25Q1', '25Q2'] as const;

/** Risk level color map — used by DashboardPage, ProjectsPage, and analyzers */
export const RISK_LEVEL_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};
