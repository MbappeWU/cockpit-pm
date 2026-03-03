import { useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { LEVEL_ORDER, STATUS_CONFIG, PRIORITY_CONFIG, PERF_PERIOD_KEYS } from '../../types/common';
import type { Member } from '../../types/member';
import type { Level, Status } from '../../types/common';
import type { MemberPerfReport } from '../../types/ai-types';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import PerfBadge from '../../components/ui/PerfBadge';

type Filter = '全部' | '专家' | '风险' | '新人';

const PERF_KEYS = PERF_PERIOD_KEYS;

function Stars({ rating, max = 4 }: { rating: number; max?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars: string[] = [];
  for (let i = 0; i < max; i++) {
    if (i < full) stars.push('★');
    else if (i === full && half) stars.push('☆');
    else stars.push('·');
  }
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2 }}>
      {stars.map((s, idx) => (
        <span key={idx} style={{ color: s === '★' ? '#f59e0b' : s === '☆' ? '#f59e0b' : '#334155' }}>
          {s}
        </span>
      ))}
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
        {rating}/{max}
      </span>
    </span>
  );
}

export default function TeamPage() {
  const members = useAppStore((s) => s.members);
  const perfReports = useAppStore((s) => s.perfReports);
  const addMember = useAppStore((s) => s.addMember);
  const removeMember = useAppStore((s) => s.removeMember);
  const addMemberAction = useAppStore((s) => s.addMemberAction);
  const updateMemberActionStatus = useAppStore((s) => s.updateMemberActionStatus);

  const [filter, setFilter] = useState<Filter>('全部');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState<Level>('P7');
  const [newActionText, setNewActionText] = useState('');

  const filtered = members
    .map((m, idx) => ({ member: m, originalIdx: idx }))
    .filter(({ member }) => {
      if (filter === '专家') return member.isExpert;
      if (filter === '风险') return member.performance?.latest === 'C' || member.performance?.latest === 'C-';
      if (filter === '新人') return member.joinDate >= '2025';
      return true;
    })
    .sort((a, b) => (LEVEL_ORDER[a.member.level] ?? 99) - (LEVEL_ORDER[b.member.level] ?? 99));

  const selected = selectedIdx < members.length ? members[selectedIdx] : null;

  function handleAddMember() {
    if (!newName.trim()) return;
    const member: Member = {
      name: newName.trim(),
      joinDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      age: null,
      level: newLevel,
      isExpert: false,
      role: '成员',
      topic: '',
      northStar: '',
      performance: { latest: 'C' },
      diagnosis: '',
      rating: { business: 0, capability: 0, training: 0 },
      actions: [],
    };
    addMember(member);
    setNewName('');
    setShowAddForm(false);
  }

  function handleAddAction() {
    if (!newActionText.trim()) return;
    addMemberAction(selectedIdx, {
      id: Date.now(),
      text: newActionText.trim(),
      due: '待定',
      status: 'pending',
      priority: 'medium',
    });
    setNewActionText('');
  }

  const FILTERS: Filter[] = ['全部', '专家', '风险', '新人'];

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 80px)' }}>
      {/* Left panel */}
      <div
        style={{
          width: 260,
          minWidth: 260,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 10px 6px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid var(--border-default)',
                background: filter === f ? 'var(--color-blue)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Member cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 10px' }}>
          {filtered.map(({ member, originalIdx }) => {
            const isSelected = originalIdx === selectedIdx;
            const latestPerf = member.performance?.latest ?? '-';
            return (
              <div
                key={member.name}
                onClick={() => setSelectedIdx(originalIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  marginBottom: 4,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: isSelected ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: member.isExpert ? 'rgba(139,92,246,0.2)' : 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: member.isExpert ? 'var(--color-purple)' : 'var(--text-muted)',
                  }}
                >
                  {member.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {member.name}
                    {member.isExpert && (
                      <span style={{ fontSize: 9, color: 'var(--color-purple)', marginLeft: 4 }}>
                        专家
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {member.level} / {member.role}
                  </div>
                </div>
                <PerfBadge grade={latestPerf} />
              </div>
            );
          })}

          {/* Add member button / form */}
          {showAddForm ? (
            <div style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginTop: 8 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="姓名"
                style={{
                  width: '100%',
                  fontSize: 11,
                  padding: '4px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              />
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as Level)}
                style={{
                  width: '100%',
                  fontSize: 11,
                  padding: '4px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                {['P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleAddMember}
                  style={{
                    flex: 1, fontSize: 10, padding: '4px 0', borderRadius: 4,
                    border: 'none', background: 'var(--color-blue)', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  确认
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1, fontSize: 10, padding: '4px 0', borderRadius: 4,
                    border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%', marginTop: 8, fontSize: 10, padding: '6px 0', borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-default)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              + 添加
            </button>
          )}
        </div>
      </div>

      {/* Right panel: detail */}
      <div
        style={{
          flex: 1,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        {selected ? (
          <div>
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: selected.isExpert ? 'rgba(139,92,246,0.2)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: selected.isExpert ? 'var(--color-purple)' : 'var(--text-muted)',
                }}
              >
                {selected.name.slice(0, 1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selected.name}
                  </span>
                  <Badge text={selected.level} color="var(--color-blue)" />
                  <Badge text={selected.role} color={selected.isExpert ? 'var(--color-purple)' : 'var(--text-muted)'} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  入职: {selected.joinDate} {selected.age ? ` | ${selected.age}岁` : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  课题: {selected.topic || '—'}
                </div>
                {selected.northStar && (
                  <div style={{ fontSize: 11, color: 'var(--color-cyan)', marginTop: 2 }}>
                    北极星: {selected.northStar}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(`确认移除 ${selected.name} ?`)) {
                    removeMember(selectedIdx);
                    setSelectedIdx(0);
                  }
                }}
                style={{
                  fontSize: 10, padding: '4px 10px', borderRadius: 4,
                  border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                  color: 'var(--color-red)', cursor: 'pointer',
                }}
              >
                移除
              </button>
            </div>

            {/* Performance timeline */}
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="绩效轨迹" icon="📊" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PERF_KEYS.map((key) => {
                  const grade = selected.performance?.[key] ?? '-';
                  return (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>{key}</div>
                      <PerfBadge grade={grade} />
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>最新</div>
                  <PerfBadge grade={selected.performance?.latest ?? '-'} />
                </div>
              </div>
            </div>

            {/* Expert ratings */}
            {selected.isExpert && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader title="专家评分" icon="⭐" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 60 }}>业务</span>
                    <Stars rating={selected.rating.business} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 60 }}>能力建设</span>
                    <Stars rating={selected.rating.capability} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 60 }}>人才培养</span>
                    <Stars rating={selected.rating.training} />
                  </div>
                </div>
              </div>
            )}

            {/* Diagnosis */}
            {selected.diagnosis && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader title="诊断" icon="🔍" />
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface-alt)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    lineHeight: 1.6,
                  }}
                >
                  {selected.diagnosis}
                </div>
              </div>
            )}

            {/* AI Performance Report */}
            {(() => {
              const report: MemberPerfReport | undefined = perfReports?.members?.find(
                (r) => r.memberName === selected.name,
              );
              if (!report) return null;

              const TREND_ICON: Record<string, string> = {
                improving: '↑',
                stable: '→',
                declining: '↓',
              };
              const TREND_COLOR: Record<string, string> = {
                improving: '#10b981',
                stable: '#f59e0b',
                declining: '#ef4444',
              };

              const DIM_LABELS: Record<string, string> = {
                actionCompletion: '行动完成率',
                okrContribution: 'OKR贡献',
                projectHealth: '项目健康度',
                perfTrend: '绩效趋势',
                expertRating: '专家履职',
              };

              return (
                <div style={{ marginBottom: 20 }}>
                  <SectionHeader title="AI 绩效报告" icon="🤖" />
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.06))',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 16,
                    }}
                  >
                    {/* Score + Grade + Trend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: report.compositeScore >= 70 ? '#10b981' : report.compositeScore >= 50 ? '#f59e0b' : '#ef4444',
                            lineHeight: 1,
                          }}
                        >
                          {report.compositeScore}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>综合评分</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Badge text={`建议: ${report.suggestedGrade}`} color="var(--color-purple)" bg="rgba(139,92,246,0.15)" />
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: TREND_COLOR[report.trend] ?? '#64748b',
                            }}
                          >
                            {TREND_ICON[report.trend] ?? ''}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {report.trend === 'improving' ? '上升趋势' : report.trend === 'declining' ? '下降趋势' : '平稳'}
                          </span>
                        </div>
                        {report.riskFlag && (
                          <Badge text="需关注" color="#ef4444" bg="rgba(239,68,68,0.15)" />
                        )}
                      </div>
                    </div>

                    {/* Dimensions mini grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      {Object.entries(report.dimensions)
                        .filter(([, v]) => v != null)
                        .map(([key, val]) => (
                          <div
                            key={key}
                            style={{
                              padding: '6px 8px',
                              background: 'var(--bg-surface)',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {val}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {DIM_LABELS[key] ?? key}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#10b981', marginBottom: 4 }}>
                          优势
                        </div>
                        {report.strengths.map((s, i) => (
                          <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '2px 0' }}>
                            + {s}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
                          待改善
                        </div>
                        {report.improvements.map((s, i) => (
                          <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '2px 0' }}>
                            - {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Summary */}
                    {report.aiSummary && (
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          padding: '6px 10px',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--color-purple)',
                        }}
                      >
                        {report.aiSummary}
                      </div>
                    )}

                    {/* Generated timestamp */}
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                      AI 评估于 {new Date(report.assessedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div>
              <SectionHeader title="行动追踪" icon="☰" count={selected.actions.length} />
              {selected.actions.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 0' }}>暂无行动项</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.actions.map((act, actIdx) => {
                    const priCfg = PRIORITY_CONFIG[act.priority];
                    const stCfg = STATUS_CONFIG[act.status];
                    const isDone = act.status === 'done';
                    return (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          background: 'var(--bg-surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() =>
                            updateMemberActionStatus(selectedIdx, actIdx, isDone ? 'pending' : 'done')
                          }
                          style={{ accentColor: priCfg?.color ?? '#3b82f6' }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 11,
                            color: 'var(--text-primary)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {act.text}
                        </span>
                        <Badge text={priCfg?.label ?? act.priority} color={priCfg?.color ?? '#64748b'} />
                        <select
                          value={act.status}
                          onChange={(e) =>
                            updateMemberActionStatus(selectedIdx, actIdx, e.target.value as Status)
                          }
                          style={{
                            fontSize: 9,
                            padding: '2px 4px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 4,
                            color: stCfg?.color ?? 'var(--text-secondary)',
                          }}
                        >
                          <option value="pending">待办</option>
                          <option value="in_progress">进行中</option>
                          <option value="done">完成</option>
                          <option value="blocked">阻塞</option>
                        </select>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 40 }}>{act.due}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add action inline */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                  placeholder="添加行动项..."
                  style={{
                    flex: 1,
                    fontSize: 11,
                    padding: '5px 10px',
                    background: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleAddAction}
                  style={{
                    fontSize: 10,
                    padding: '5px 12px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'var(--color-blue)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>
            请选择团队成员
          </div>
        )}
      </div>
    </div>
  );
}
