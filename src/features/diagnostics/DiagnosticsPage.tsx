import { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/app-store';
import { selectPerfDistribution, selectRankedMembers, selectTeamCompletionRate } from '../../store/selectors';
import { PERF_COLORS } from '../../types/common';
import type { Member } from '../../types/member';
import type { OKRData } from '../../types/okr';
import type { MilestoneAlert } from '../../types/sync';
import { fetchDiagnostics } from '../../services/sync-service';
import SectionHeader from '../../components/ui/SectionHeader';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';

/* ───── Types ──────────────────────────────────────── */

interface Diagnostic {
  type: string;
  color: string;
  message: string;
}

interface DiagnosticDimension {
  id: string;
  title: string;
  icon: string;
  health: 'good' | 'warning' | 'critical';
  items: Diagnostic[];
  summary: string;
}

const HEALTH_BORDER: Record<string, string> = {
  good: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const HEALTH_LABEL: Record<string, string> = {
  good: '良好',
  warning: '关注',
  critical: '风险',
};

const PERF_SCORE_TABLE = 'A+=5.5  A=5  A-=4.5  B+=4  B=3.5  B-=3  C+=2.5  C=2  C-=1.5';

/* ───── Component ──────────────────────────────────── */

export default function DiagnosticsPage() {
  // Select only the slices this page needs (avoids full-store re-renders)
  const slice = useAppStore(useShallow((s) => ({
    members: s.members,
    okr: s.okr,
    milestoneAlerts: s.milestoneAlerts ?? [],
  })));
  const diagnosticResults = useAppStore((s) => s.diagnosticResults);
  const storeDiagnostics = useAppStore((s) => s.storeDiagnostics);

  // Memoised derived data — selectors accept narrow types, no unsafe casts
  const perfDist = useMemo(() => selectPerfDistribution(slice), [slice.members]);
  const ranked = useMemo(() => selectRankedMembers(slice), [slice.members]);
  const completionRate = useMemo(() => selectTeamCompletionRate(slice), [slice.members]);

  const [loading, setLoading] = useState(false);
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  // Expert averages
  const expertAvg = useMemo(() => {
    const experts = slice.members.filter((m) => m.isExpert);
    if (experts.length === 0) return { business: 0, capability: 0, training: 0 };
    return {
      business: experts.reduce((s, m) => s + m.rating.business, 0) / experts.length,
      capability: experts.reduce((s, m) => s + m.rating.capability, 0) / experts.length,
      training: experts.reduce((s, m) => s + m.rating.training, 0) / experts.length,
    };
  }, [slice.members]);

  // Max bar value for distribution chart
  const maxDist = useMemo(() => Math.max(...perfDist.map(([, count]) => count), 1), [perfDist]);

  // Dimension-based diagnostics
  const dimensions = useMemo(() => generateDimensionDiagnostics(slice), [slice.members, slice.okr, slice.milestoneAlerts]);

  const handleRefreshDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDiagnostics();
      storeDiagnostics(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : '诊断刷新失败');
    } finally {
      setLoading(false);
    }
  }, [storeDiagnostics]);

  return (
    <div>
      <SectionHeader title="团队诊断" icon="⊕" />

      {/* Top action bar - Diagnostics refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={handleRefreshDiagnostics}
          disabled={loading}
          style={{
            fontSize: 11,
            padding: '5px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-purple)',
            background: loading ? 'var(--border-default)' : 'transparent',
            color: loading ? 'var(--text-muted)' : 'var(--color-purple)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? '诊断中...' : '刷新诊断'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          上次运行: {diagnosticResults?.runAt ? new Date(diagnosticResults.runAt).toLocaleString('zh-CN') : '未运行'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          终端运行 npm run diagnose 获取最新诊断
        </span>
      </div>

      {/* Top cards row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Expert dimension cards */}
        {[
          { label: '业务', value: expertAvg.business, color: 'var(--color-blue)' },
          { label: '能力建设', value: expertAvg.capability, color: 'var(--color-yellow)' },
          { label: '人才培养', value: expertAvg.training, color: 'var(--color-purple)' },
        ].map((dim) => (
          <div
            key={dim.label}
            style={{
              flex: 1,
              minWidth: 140,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              专家平均 - {dim.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: dim.color }}>
                {dim.value.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/4</span>
            </div>
            <ProgressBar value={(dim.value / 4) * 100} color={dim.color} />
          </div>
        ))}

        <StatCard
          label="行动完成率"
          value={`${completionRate}%`}
          subtitle="团队整体"
          color="var(--color-green)"
        />
      </div>

      {/* Performance Distribution */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <SectionHeader title="绩效分布" icon="📊" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 10 }}>
          {perfDist.map(([grade, count]) => {
            const barColor = PERF_COLORS[grade] ?? '#334155';
            const heightPct = (count / maxDist) * 100;
            return (
              <div
                key={grade}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {count}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 40,
                    height: `${heightPct}%`,
                    minHeight: 4,
                    background: barColor,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }}
                />
                <span style={{ fontSize: 10, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>
                  {grade || '?'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimension Diagnostic Cards (Change 4) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {dimensions.map((dim) => (
          <DimensionCard key={dim.id} dimension={dim} />
        ))}
      </div>

      {/* AI Diagnostics from sync (fetched) */}
      {diagnosticResults && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <SectionHeader title="AI 诊断" icon="🧠" count={diagnosticResults.items.length} />

          {/* Summary bar */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 12,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            <span>红 {diagnosticResults.summary.red}</span>
            <span>黄 {diagnosticResults.summary.yellow}</span>
            <span>绿 {diagnosticResults.summary.green}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagnosticResults.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'center',
                }}
              >
                <Badge text={item.type} color={item.color} bg={item.color} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {item.message}
                </span>
                {item.source === 'ai' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: 'rgba(139,92,246,0.15)',
                      color: 'var(--color-purple)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    AI
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composite Ranking (Change 5: transparent scoring) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <SectionHeader title="综合排名" icon="🏆" count={ranked.length} />

        {/* Scoring formula explanation */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '8px 10px',
            marginBottom: 10,
            background: 'var(--bg-surface-alt)',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.7,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div>评分公式: 总分 = 绩效分(x3) + 行动完成率(x2) + 专家均分</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            绩效映射: {PERF_SCORE_TABLE}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ranked.map((member, idx) => {
            const maxScore = ranked[0]?.score ?? 1;
            const pct = maxScore > 0 ? (member.score / maxScore) * 100 : 0;
            const color = idx === 0 ? 'var(--color-green)' : idx < 3 ? 'var(--color-blue)' : idx < ranked.length / 2 ? 'var(--color-yellow)' : 'var(--text-muted)';
            const isExpanded = expandedRank === idx;
            const bd = member.breakdown;

            return (
              <div key={member.name}>
                <div
                  onClick={() => setExpandedRank(isExpanded ? null : idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '5px 0',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color,
                      minWidth: 20,
                      textAlign: 'right',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      minWidth: 56,
                    }}
                  >
                    {member.name}
                  </span>
                  {member.isExpert && (
                    <Badge text="专家" color="var(--color-purple)" />
                  )}
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={pct} color={color} height={5} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      minWidth: 40,
                      textAlign: 'right',
                    }}
                  >
                    {member.score.toFixed(1)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      transition: 'transform 0.15s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▸
                  </span>
                </div>

                {/* Expandable score breakdown (Change 5) */}
                {isExpanded && (
                  <div
                    style={{
                      marginLeft: 32,
                      padding: '6px 10px',
                      marginBottom: 4,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      lineHeight: 1.8,
                    }}
                  >
                    <div>
                      绩效分: {bd.perfGrade} = {bd.perfScore} x 3 = {(bd.perfScore * 3).toFixed(1)}
                    </div>
                    <div>
                      行动完成率: {bd.actRate.toFixed(1)} (完成 {bd.doneCount}/{bd.totalCount})
                    </div>
                    {member.isExpert && (
                      <div>
                        专家评分: {bd.expScore.toFixed(1)} (业务{bd.business} + 能力{bd.capability} + 培养{bd.training}) / 3
                      </div>
                    )}
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      总分: {member.score.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───── Dimension Card Sub-component ───────────────── */

function DimensionCard({ dimension }: { readonly dimension: DiagnosticDimension }) {
  const [expanded, setExpanded] = useState(true);
  const borderColor = HEALTH_BORDER[dimension.health];
  const healthLabel = HEALTH_LABEL[dimension.health];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
          marginBottom: expanded ? 8 : 0,
        }}
      >
        <span style={{ fontSize: 16 }}>{dimension.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
          {dimension.title}
        </span>
        <Badge text={healthLabel} color={borderColor} bg={borderColor} />
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▸
        </span>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: expanded ? 8 : 0 }}>
        {dimension.summary}
      </div>

      {/* Expandable items */}
      {expanded && dimension.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dimension.items.map((d, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 8,
                padding: '6px 8px',
                background: 'var(--bg-surface-alt)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Badge text={d.type} color={d.color} bg={d.color} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {d.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Diagnostics Generator (Change 4: dimension-based) ─── */

function generateDimensionDiagnostics(
  state: { readonly members: readonly Member[]; readonly okr: OKRData; readonly milestoneAlerts: readonly MilestoneAlert[] },
): DiagnosticDimension[] {
  const experts = state.members.filter((m) => m.isExpert);

  /* ── 1. 项目健康 ── */
  const projectItems: Diagnostic[] = [];
  const riskKRs = state.okr.objectives.flatMap((o) =>
    o.keyResults.filter((kr) => kr.status !== 'on_track'),
  );
  if (riskKRs.length > 0) {
    projectItems.push({
      type: '关注',
      color: '#3b82f6',
      message: `${riskKRs.length} 个KR处于风险/偏离状态: ${riskKRs.map((kr) => kr.id).join(', ')}`,
    });
  }
  // Milestone alerts from sync
  if (state.milestoneAlerts.length > 0) {
    for (const alert of state.milestoneAlerts) {
      projectItems.push({
        type: alert.severity === 'red' ? '风险' : '关注',
        color: alert.severity === 'red' ? '#ef4444' : '#f59e0b',
        message: `[${alert.vehicleCode}/${alert.platform}] ${alert.milestone} — ${alert.daysUntil}天后到期`,
      });
    }
  }

  const projectHealth: DiagnosticDimension['health'] =
    projectItems.some((i) => i.type === '风险') ? 'critical'
    : projectItems.length > 0 ? 'warning'
    : 'good';

  /* ── 2. 团队能力 ── */
  const teamItems: Diagnostic[] = [];
  const lowExperts = experts.filter(
    (m) => m.performance?.latest === 'C' || m.performance?.latest === 'C-',
  );
  if (lowExperts.length > 0) {
    teamItems.push({
      type: '警告',
      color: '#f59e0b',
      message: `${lowExperts.map((m) => m.name).join('、')} 最新绩效偏低，建议重点关注专家履职落地情况`,
    });
  }
  const avgCap = experts.length
    ? experts.reduce((s, m) => s + m.rating.capability, 0) / experts.length
    : 0;
  const avgTrain = experts.length
    ? experts.reduce((s, m) => s + m.rating.training, 0) / experts.length
    : 0;
  if (avgCap < 2) {
    teamItems.push({
      type: '风险',
      color: '#ef4444',
      message: `专家能力建设平均分仅${avgCap.toFixed(1)}/4，需加速推动经验萃取和知识沉淀`,
    });
  }
  if (avgTrain < 2) {
    teamItems.push({
      type: '风险',
      color: '#ef4444',
      message: `专家人才培养平均分仅${avgTrain.toFixed(1)}/4，建议明确导师制和培养计划`,
    });
  }
  const newMembers = state.members.filter((m) => m.joinDate >= '2025');
  if (newMembers.length > 0) {
    teamItems.push({
      type: '建议',
      color: '#06b6d4',
      message: `${newMembers.length} 位新入职成员(${newMembers.map((m) => m.name).join('、')})，建议制定30-60-90天融入计划`,
    });
  }

  const teamHealth: DiagnosticDimension['health'] =
    teamItems.some((i) => i.type === '风险') ? 'critical'
    : teamItems.length > 0 ? 'warning'
    : 'good';

  /* ── 3. 行动执行 ── */
  const actionItems: Diagnostic[] = [];
  const allActs = state.members.flatMap((m) => m.actions);
  const urgent = allActs.filter((a) => a.priority === 'urgent' && a.status !== 'done');
  if (urgent.length > 5) {
    actionItems.push({
      type: '紧急',
      color: '#f43f5e',
      message: `团队仍有 ${urgent.length} 项紧急行动未完成，建议每日跟踪`,
    });
  }
  const doneCount = allActs.filter((a) => a.status === 'done').length;
  const totalCount = allActs.length;
  const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  if (rate < 50 && totalCount > 0) {
    actionItems.push({
      type: '警告',
      color: '#f59e0b',
      message: `行动完成率仅${rate}%，低于50%基线，需加速推进`,
    });
  }
  const overdue = allActs.filter(
    (a) => a.status !== 'done' && a.due && a.due < new Date().toISOString().slice(0, 10),
  );
  if (overdue.length > 0) {
    actionItems.push({
      type: '逾期',
      color: '#ef4444',
      message: `${overdue.length} 项行动已逾期，请尽快处理`,
    });
  }

  const actionHealth: DiagnosticDimension['health'] =
    actionItems.some((i) => i.type === '紧急' || i.type === '逾期') ? 'critical'
    : actionItems.length > 0 ? 'warning'
    : 'good';

  /* ── 4. OKR 对齐 ── */
  const okrItems: Diagnostic[] = [];
  for (const kr of riskKRs) {
    const gap = 100 - kr.progress;
    okrItems.push({
      type: kr.status === 'off_track' ? '偏离' : '风险',
      color: kr.status === 'off_track' ? '#ef4444' : '#f59e0b',
      message: `${kr.id}: 进度 ${kr.progress}%，距目标差 ${gap}pp — ${kr.text}`,
    });
  }

  const okrHealth: DiagnosticDimension['health'] =
    okrItems.some((i) => i.type === '偏离') ? 'critical'
    : okrItems.length > 0 ? 'warning'
    : 'good';

  /* ── Assemble ── */
  return [
    {
      id: 'project-health',
      title: '项目健康',
      icon: '📊',
      health: projectHealth,
      items: projectItems,
      summary: projectItems.length === 0
        ? '项目里程碑和KR状态正常'
        : `${projectItems.length} 项需要关注`,
    },
    {
      id: 'team-capability',
      title: '团队能力',
      icon: '👥',
      health: teamHealth,
      items: teamItems,
      summary: teamItems.length === 0
        ? '专家履职和人才培养正常'
        : `${teamItems.length} 项能力建设风险`,
    },
    {
      id: 'action-execution',
      title: '行动执行',
      icon: '⚡',
      health: actionHealth,
      items: actionItems,
      summary: actionItems.length === 0
        ? `行动执行正常，完成率 ${rate}%`
        : `${actionItems.length} 项执行风险，完成率 ${rate}%`,
    },
    {
      id: 'okr-alignment',
      title: 'OKR 对齐',
      icon: '🎯',
      health: okrHealth,
      items: okrItems,
      summary: okrItems.length === 0
        ? '所有KR on_track'
        : `${okrItems.length} 个KR偏离或存在风险`,
    },
  ];
}
