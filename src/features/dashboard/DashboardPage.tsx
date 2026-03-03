import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/app-store';
import {
  selectUrgentActions,
  selectRiskKRs,
  selectOKRProgress,
  selectTotalKRCount,
  selectTeamCompletionRate,
} from '../../store/selectors';
import { STATUS_CONFIG, RISK_LEVEL_COLORS } from '../../types/common';
import type { ProjectRiskAssessment } from '../../types/ai-types';
import StatCard from '../../components/ui/StatCard';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';

const SEVERITY_CONFIG = {
  red: { label: '紧急', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  yellow: { label: '关注', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  green: { label: '正常', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
} as const;

export default function DashboardPage() {
  // Select only the slices this page needs (avoids full-store re-renders)
  const {
    members, okr, myActions, vision, culture,
    milestoneAlerts, syncInsights, syncDecisions, syncMeta,
    riskAssessments, perfReports, dailyDigest,
  } = useAppStore(useShallow((s) => ({
    members: s.members,
    okr: s.okr,
    myActions: s.myActions,
    vision: s.vision,
    culture: s.culture,
    milestoneAlerts: s.milestoneAlerts ?? [],
    syncInsights: s.syncInsights ?? [],
    syncDecisions: s.syncDecisions ?? [],
    syncMeta: s.syncMeta ?? {},
    riskAssessments: s.riskAssessments,
    perfReports: s.perfReports,
    dailyDigest: s.dailyDigest,
  })));
  const updateMyActionStatus = useAppStore((s) => s.updateMyActionStatus);

  // Memoised derived data — selectors now accept narrow types, no unsafe casts
  const urgentActions = useMemo(() => selectUrgentActions({ members, myActions }), [members, myActions]);
  const riskKRs = useMemo(() => selectRiskKRs({ okr }), [okr]);
  const okrProgress = useMemo(() => selectOKRProgress({ okr }), [okr]);
  const totalKRs = useMemo(() => selectTotalKRCount({ okr }), [okr]);
  const completionRate = useMemo(() => selectTeamCompletionRate({ members }), [members]);
  const memberCount = members.length;

  const redAlerts = useMemo(() => milestoneAlerts.filter((a) => a.severity === 'red'), [milestoneAlerts]);
  const yellowAlerts = useMemo(() => milestoneAlerts.filter((a) => a.severity === 'yellow'), [milestoneAlerts]);
  const lastSync = syncMeta['memory-system']?.lastSyncedAt;

  return (
    <div>
      {/* Stat Cards Row — responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="OKR 整体进度"
          value={`${okrProgress}%`}
          subtitle={`${totalKRs} 个 KR`}
          color="var(--color-blue)"
        />
        <StatCard
          label="紧急事项"
          value={urgentActions.length}
          subtitle="待处理"
          color="var(--color-pink)"
        />
        <StatCard
          label="风险 KR"
          value={riskKRs.length}
          subtitle="at_risk / off_track"
          color="var(--color-yellow)"
        />
        <StatCard
          label="里程碑预警"
          value={redAlerts.length}
          subtitle={`${yellowAlerts.length} 项关注`}
          color="var(--color-red)"
        />
        <StatCard
          label="团队人数"
          value={memberCount}
          subtitle="在岗"
          color="var(--color-cyan)"
        />
        <StatCard
          label="行动完成率"
          value={`${completionRate}%`}
          subtitle="团队整体"
          color="var(--color-green)"
        />
      </div>

      {/* Milestone Alerts — from sync data */}
      {milestoneAlerts.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.04))',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <SectionHeader title="里程碑预警" icon="🚨" count={milestoneAlerts.length} />
          {lastSync && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
              数据来源: memory-system | 同步: {new Date(lastSync).toLocaleString('zh-CN')}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[...milestoneAlerts]
              .sort((a, b) => a.daysUntil - b.daysUntil)
              .map((alert, idx) => {
                const cfg = SEVERITY_CONFIG[alert.severity];
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      background: cfg.bg,
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${cfg.color}`,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Badge text={cfg.label} color={cfg.color} bg={cfg.color} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 70 }}>
                      {alert.vehicleCode}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {alert.platform}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>
                      {alert.milestone}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: alert.daysUntil <= 14 ? 'var(--color-red)' : 'var(--text-muted)',
                      }}
                    >
                      {alert.daysUntil}天
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Urgent Actions */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(244,63,94,0.02))',
          border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <SectionHeader title="紧急行动" icon="🔥" count={urgentActions.length} />
        {urgentActions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
            暂无紧急事项
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urgentActions.map((action, idx) => {
              const isDone = action.status === 'done';
              return (
                <div
                  key={action.id + '-' + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isDone ? 0.5 : 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {
                      if (!('memberName' in action)) {
                        const myIdx = myActions.findIndex((a) => a.id === action.id);
                        if (myIdx !== -1) {
                          updateMyActionStatus(myIdx, isDone ? 'pending' : 'done');
                        }
                      }
                    }}
                    style={{ accentColor: 'var(--color-pink)' }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      minWidth: 200,
                    }}
                  >
                    {action.text}
                  </span>
                  {'memberName' in action && (
                    <Badge
                      text={(action as { memberName: string }).memberName}
                      color="var(--color-purple)"
                      bg="rgba(139,92,246,0.15)"
                    />
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {action.due}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sync Insights & Decisions — responsive two column */}
      {(syncInsights.length > 0 || syncDecisions.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Insights */}
          {syncInsights.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
              }}
            >
              <SectionHeader title="项目洞察" icon="💡" count={syncInsights.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
                {syncInsights.map((ins, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--color-cyan)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {ins.insight}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {ins.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 9,
                            color: 'var(--color-cyan)',
                            background: 'rgba(6,182,212,0.1)',
                            padding: '1px 6px',
                            borderRadius: 3,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {ins.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {syncDecisions.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
              }}
            >
              <SectionHeader title="关键决策" icon="📋" count={syncDecisions.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
                {syncDecisions.map((dec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--color-purple)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {dec.decision}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                      原因: {dec.reason}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                      {dec.date} | {dec.domain}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk KRs */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <SectionHeader title="风险 KR" icon="⚠️" count={riskKRs.length} />
        {riskKRs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
            全部正常
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riskKRs.map((kr) => {
              const statusCfg = STATUS_CONFIG[kr.status];
              return (
                <div
                  key={kr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Badge
                    text={statusCfg?.label ?? kr.status}
                    color={statusCfg?.color ?? '#f59e0b'}
                    bg={statusCfg?.color ?? '#f59e0b'}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {kr.id}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', minWidth: 200 }}>
                    {kr.text}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {kr.progress}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Project Health Heatmap */}
      {riskAssessments && riskAssessments.projects.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <SectionHeader
            title="项目健康度"
            icon="🏥"
            count={riskAssessments.projects.length}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: riskAssessments.overallHealth >= 60 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {riskAssessments.overallHealth}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>整体健康度</span>
            {riskAssessments.criticalCount > 0 && (
              <Badge text={`${riskAssessments.criticalCount} 严重`} color="#ef4444" bg="#ef4444" />
            )}
            {riskAssessments.aiGenerated && (
              <Badge text="AI" color="#8b5cf6" bg="rgba(139,92,246,0.15)" />
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 6,
            }}
          >
            {riskAssessments.projects.map((p: ProjectRiskAssessment) => (
              <div
                key={p.vehicleCode + p.platform}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: `${RISK_LEVEL_COLORS[p.riskLevel] ?? '#64748b'}15`,
                  borderLeft: `3px solid ${RISK_LEVEL_COLORS[p.riskLevel] ?? '#64748b'}`,
                  cursor: 'default',
                }}
                title={p.aiSummary || `${p.vehicleCode}: ${p.healthScore}分`}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {p.vehicleCode}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  {p.platform}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: RISK_LEVEL_COLORS[p.riskLevel] ?? '#64748b',
                    marginTop: 2,
                  }}
                >
                  {p.healthScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Digest — AI Insights */}
      {dailyDigest && dailyDigest.aiInsights.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <SectionHeader title="AI 管理建议" icon="🤖" />
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 10 }}>
            {dailyDigest.date} | 由管道自动生成
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dailyDigest.aiInsights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(139,92,246,0.06)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--color-purple)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}
              >
                {insight}
              </div>
            ))}
          </div>
          {dailyDigest.upcomingDeadlines.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                本周到期 ({dailyDigest.upcomingDeadlines.length})
              </div>
              {dailyDigest.upcomingDeadlines.slice(0, 5).map((d, idx) => (
                <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                  {d.description} — {d.dueDate} {d.owner ? `(${d.owner})` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Performance Attention */}
      {perfReports && perfReports.members.some((m) => m.riskFlag) && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <SectionHeader
            title="需关注成员"
            icon="👀"
            count={perfReports.members.filter((m) => m.riskFlag).length}
          />
          {perfReports.aiGenerated && (
            <Badge text="AI 评估" color="#8b5cf6" bg="rgba(139,92,246,0.15)" />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {perfReports.members
              .filter((m) => m.riskFlag)
              .slice(0, 5)
              .map((m) => (
                <div
                  key={m.memberName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${m.trend === 'declining' ? '#ef4444' : '#f59e0b'}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 60 }}>
                    {m.memberName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.level}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: m.compositeScore < 45 ? '#ef4444' : '#f59e0b',
                    }}
                  >
                    {m.compositeScore}分
                  </span>
                  <Badge
                    text={m.suggestedGrade}
                    color={m.compositeScore < 45 ? '#ef4444' : '#f59e0b'}
                    bg={m.compositeScore < 45 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {m.trend === 'declining' ? '📉' : m.trend === 'improving' ? '📈' : '➡️'}
                  </span>
                  {m.improvements.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1, minWidth: 200 }}>
                      {m.improvements[0]}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Vision Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <SectionHeader title="愿景 & 文化" icon="🌟" />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
          {vision}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {culture.map((tag) => (
            <Badge key={tag} text={tag} color="var(--color-blue)" bg="rgba(59,130,246,0.15)" />
          ))}
        </div>
      </div>
    </div>
  );
}
