import type { SyncPayload, DiagnosticResult } from '../types/sync';
import type {
  RiskAssessmentPayload,
  PerfReportPayload,
  DailyDigest,
  PipelineRunStatus,
} from '../types/ai-types';

const SYNC_BASE = '/sync';

function cacheBust(url: string): string {
  return `${url}?t=${Date.now()}`;
}

async function fetchSyncFile<T>(
  filename: string,
  label: string,
  runHint?: string,
): Promise<T> {
  const url = cacheBust(`${SYNC_BASE}/${filename}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `${label}未找到${runHint ? `，请先运行: ${runHint}` : ''}`
        : `${label}请求失败: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

export const fetchSyncPayload = (filename = 'memory-sync.json') =>
  fetchSyncFile<SyncPayload>(filename, '同步文件', 'npm run sync');

export const fetchDiagnostics = () =>
  fetchSyncFile<DiagnosticResult>('diagnostics-latest.json', '诊断文件', 'npm run diagnose');

export const fetchRiskAssessment = () =>
  fetchSyncFile<RiskAssessmentPayload>('risk-assessment.json', '风险评估文件', 'npm run pipeline:analyze');

export const fetchPerfReport = () =>
  fetchSyncFile<PerfReportPayload>('perf-report.json', '绩效报告文件', 'npm run pipeline:analyze');

export const fetchDailyDigest = () =>
  fetchSyncFile<DailyDigest>('daily-digest.json', '日报文件', 'npm run pipeline');

export const fetchPipelineStatus = () =>
  fetchSyncFile<PipelineRunStatus>('pipeline-status.json', '管道状态文件');
