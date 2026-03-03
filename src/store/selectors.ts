import type { Member, ActionItem } from '../types/member';
import type { OKRData, KeyResult } from '../types/okr';
import { PERF_COLORS } from '../types/common';

/* ── Narrow input types — no more `as AppState` casts ──────── */

interface HasMembers { readonly members: readonly Member[] }
interface HasOKR { readonly okr: OKRData }
interface HasMyActions { readonly myActions: readonly ActionItem[] }

/* ── Selectors ─────────────────────────────────────────────── */

export function selectUrgentActions(
  state: HasMembers & HasMyActions,
): (ActionItem & { memberName?: string })[] {
  const myUrgents = state.myActions
    .filter((a) => a.priority === 'urgent' && a.status !== 'done');
  const teamUrgents = state.members.flatMap((m) =>
    m.actions
      .filter((a) => a.priority === 'urgent' && a.status !== 'done')
      .map((a) => ({ ...a, memberName: m.name })),
  );
  return [...myUrgents, ...teamUrgents];
}

export function selectRiskKRs(state: HasOKR): KeyResult[] {
  return state.okr.objectives.flatMap((o) =>
    o.keyResults.filter((kr) => kr.status !== 'on_track'),
  );
}

export function selectOKRProgress(state: HasOKR): number {
  const allKRs = state.okr.objectives.flatMap((o) => o.keyResults);
  if (allKRs.length === 0) return 0;
  return Math.round(allKRs.reduce((sum, kr) => sum + kr.progress, 0) / allKRs.length);
}

export function selectTotalKRCount(state: HasOKR): number {
  return state.okr.objectives.reduce((sum, o) => sum + o.keyResults.length, 0);
}

export function selectTeamCompletionRate(state: HasMembers): number {
  const allActs = state.members.flatMap((m) => m.actions);
  if (allActs.length === 0) return 0;
  return Math.round(
    (allActs.filter((a) => a.status === 'done').length / allActs.length) * 100,
  );
}

export function selectPerfDistribution(state: HasMembers): [string, number][] {
  const dist: Record<string, number> = {};
  for (const m of state.members) {
    const grade = m.performance?.latest || '-';
    dist[grade] = (dist[grade] || 0) + 1;
  }
  const order = Object.keys(PERF_COLORS);
  return Object.entries(dist).sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b),
  );
}

const PERF_SCORES: Record<string, number> = {
  'A+': 5.5, 'A': 5, 'A-': 4.5, 'B+': 4, 'B': 3.5, 'B-': 3,
  'C+🌟': 2.8, 'C+': 2.5, 'C': 2, 'C-': 1.5, '-': 0, '': 0,
};

export interface RankBreakdown {
  perfGrade: string;
  perfScore: number;
  doneCount: number;
  totalCount: number;
  actRate: number;
  expScore: number;
  business: number;
  capability: number;
  training: number;
}

export function selectRankedMembers(state: HasMembers) {
  return [...state.members]
    .map((m) => {
      const perfScore = PERF_SCORES[m.performance?.latest || '-'] ?? 0;
      const doneCount = m.actions.filter((a) => a.status === 'done').length;
      const totalCount = m.actions.length;
      const actRate = totalCount ? (doneCount / totalCount) * 2 : 0;
      const expScore = m.isExpert
        ? (m.rating.business + m.rating.capability + m.rating.training) / 3
        : 0;
      const score = perfScore * 3 + actRate + expScore;
      return {
        ...m,
        score,
        breakdown: {
          perfGrade: m.performance?.latest || '-',
          perfScore,
          doneCount,
          totalCount,
          actRate,
          expScore,
          business: m.rating.business,
          capability: m.rating.capability,
          training: m.rating.training,
        } satisfies RankBreakdown,
      };
    })
    .sort((a, b) => b.score - a.score);
}
