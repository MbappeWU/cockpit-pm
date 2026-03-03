import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/app-store';
import { RISK_LEVEL_COLORS } from '../../types/common';
import type { Platform, Difficulty } from '../../types/common';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import EditableText from '../../components/ui/EditableText';
import SyncIndicator from '../../components/ui/SyncIndicator';
import { fetchSyncPayload } from '../../services/sync-service';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const CURRENT_MONTH = 3; // March

const MILESTONE_COLORS: Record<string, string> = {
  J1: '#3b82f6', J2: '#3b82f6', J3: '#3b82f6', J4: '#3b82f6',
  J5: '#3b82f6', J6: '#3b82f6', J7: '#3b82f6',
  SOP: '#10b981', 'SOP+OTA': '#10b981',
  OTA: '#06b6d4',
  PVS: '#f59e0b', PT: '#f59e0b', 'ME+01': '#f59e0b',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  VCOS: '#3b82f6',
  '鸿蒙': '#f43f5e',
  '博泰': '#f59e0b',
  '8155': '#8b5cf6',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  A: '#ef4444', B: '#f59e0b', C: '#3b82f6', D: '#64748b', E: '#334155',
};

const PLATFORM_OPTIONS: (Platform | '全部')[] = ['全部', 'VCOS', '鸿蒙', '博泰', '8155'];
const DIFFICULTY_OPTIONS: (Difficulty | '全部')[] = ['全部', 'A', 'B', 'C', 'D', 'E'];
const PLATFORM_VALUES: Platform[] = ['VCOS', '鸿蒙', '博泰', '8155'];
const DIFFICULTY_VALUES: Difficulty[] = ['A', 'B', 'C', 'D', 'E'];

export default function ProjectsPage() {
  const projects = useAppStore((s) => s.projects);
  const riskAssessments = useAppStore((s) => s.riskAssessments);
  const syncMeta = useAppStore((s) => s.syncMeta);
  const updateProject = useAppStore((s) => s.updateProject);
  const addProject = useAppStore((s) => s.addProject);
  const removeProject = useAppStore((s) => s.removeProject);
  const mergeSyncData = useAppStore((s) => s.mergeSyncData);

  const [platformFilter, setPlatformFilter] = useState<Platform | '全部'>('全部');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | '全部'>('全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Add project form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicleCode, setNewVehicleCode] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('VCOS');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('C');

  const filtered = projects.filter((p) => {
    if (platformFilter !== '全部' && p.platform !== platformFilter) return false;
    if (difficultyFilter !== '全部' && p.difficulty !== difficultyFilter) return false;
    return true;
  });

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const payload = await fetchSyncPayload();
      mergeSyncData(payload);
    } catch (err) {
      alert(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [mergeSyncData]);

  const handleAddProject = useCallback(() => {
    const code = newVehicleCode.trim();
    if (!code) return;
    addProject({
      id: `proj-${Date.now()}`,
      vehicleCode: code,
      platform: newPlatform,
      difficulty: newDifficulty,
      upl: '',
      ste: '',
      year: new Date().getFullYear(),
      milestones: [],
      status: 'unstarted',
      notes: '',
    });
    setNewVehicleCode('');
    setShowAddForm(false);
  }, [newVehicleCode, newPlatform, newDifficulty, addProject]);

  const handleRemoveProject = useCallback(
    (id: string, name: string) => {
      if (window.confirm(`确认删除项目「${name}」？此操作不可撤销。`)) {
        removeProject(id);
        if (expandedId === id) setExpandedId(null);
      }
    },
    [removeProject, expandedId],
  );

  return (
    <div>
      <SectionHeader title="项目甘特图" icon="▦" count={filtered.length} />

      {/* Sync indicator */}
      <div style={{ marginBottom: 12 }}>
        <SyncIndicator
          source="memory-system"
          lastSyncedAt={syncMeta['memory-system']?.lastSyncedAt ?? null}
          onSync={handleSync}
          loading={syncing}
        />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>平台:</span>
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid var(--border-default)',
                background: platformFilter === p
                  ? (p === '全部' ? 'var(--color-blue)' : PLATFORM_COLORS[p as Platform] ?? 'var(--color-blue)')
                  : 'transparent',
                color: platformFilter === p ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>难度:</span>
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              style={{
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid var(--border-default)',
                background: difficultyFilter === d
                  ? (d === '全部' ? 'var(--color-blue)' : DIFFICULTY_COLORS[d as Difficulty] ?? 'var(--color-blue)')
                  : 'transparent',
                color: difficultyFilter === d ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Add project toggle */}
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          style={{
            fontSize: 10,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid var(--color-green)',
            background: showAddForm ? 'var(--color-green)' : 'transparent',
            color: showAddForm ? '#fff' : 'var(--color-green)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showAddForm ? '取消' : '+ 添加项目'}
        </button>
      </div>

      {/* Add project inline form */}
      {showAddForm && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 16,
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={newVehicleCode}
            onChange={(e) => setNewVehicleCode(e.target.value)}
            placeholder="车型代号"
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              width: 120,
            }}
          />
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value as Platform)}
            style={{
              fontSize: 10,
              padding: '4px 6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {PLATFORM_VALUES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={newDifficulty}
            onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
            style={{
              fontSize: 10,
              padding: '4px 6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {DIFFICULTY_VALUES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            onClick={handleAddProject}
            disabled={!newVehicleCode.trim()}
            style={{
              fontSize: 10,
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              background: newVehicleCode.trim() ? 'var(--color-green)' : 'var(--border-default)',
              color: '#fff',
              cursor: newVehicleCode.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            确认添加
          </button>
        </div>
      )}

      {/* Gantt Chart */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px repeat(12, 1fr)',
            borderBottom: '1px solid var(--border-default)',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-surface)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              borderRight: '1px solid var(--border-default)',
            }}
          >
            车型 / 平台
          </div>
          {MONTHS.map((m, idx) => (
            <div
              key={m}
              style={{
                padding: '8px 4px',
                fontSize: 9,
                fontWeight: 600,
                color: idx + 1 === CURRENT_MONTH ? 'var(--color-pink)' : 'var(--text-muted)',
                textAlign: 'center',
                borderRight: '1px solid var(--border-default)',
                background: idx + 1 === CURRENT_MONTH ? 'rgba(244,63,94,0.04)' : 'transparent',
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Project rows */}
        {filtered.map((project) => {
          const isExpanded = expandedId === project.id;
          return (
            <div key={project.id}>
              <div
                onClick={() => toggleExpand(project.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px repeat(12, 1fr)',
                  borderBottom: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Label column */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRight: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {project.vehicleCode}
                  </span>
                  <Badge
                    text={project.platform}
                    color={PLATFORM_COLORS[project.platform]}
                    bg={PLATFORM_COLORS[project.platform]}
                  />
                  <Badge
                    text={project.difficulty}
                    color={DIFFICULTY_COLORS[project.difficulty]}
                  />
                </div>

                {/* Month cells */}
                {MONTHS.map((_, monthIdx) => {
                  const month = monthIdx + 1;
                  const ms = project.milestones.filter((m) => m.month === month);
                  const isCurrentMonth = month === CURRENT_MONTH;

                  return (
                    <div
                      key={monthIdx}
                      style={{
                        padding: '6px 2px',
                        borderRight: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                        position: 'relative',
                        background: isCurrentMonth ? 'rgba(244,63,94,0.04)' : 'transparent',
                      }}
                    >
                      {/* Current month indicator line */}
                      {isCurrentMonth && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'var(--color-pink)',
                            borderRight: '1px dashed var(--color-pink)',
                            opacity: 0.6,
                          }}
                        />
                      )}
                      {ms.map((milestone, msIdx) => (
                        <span
                          key={msIdx}
                          style={{
                            fontSize: 7,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 4px',
                            borderRadius: 3,
                            background: MILESTONE_COLORS[milestone.type] ?? '#64748b',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                          }}
                        >
                          {milestone.type}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Expanded detail */}
              {isExpanded && (() => {
                const riskData = riskAssessments?.projects.find(
                  (r) => r.vehicleCode === project.vehicleCode && r.platform === project.platform,
                );

                return (
                <div
                  style={{
                    padding: '10px 16px',
                    background: 'var(--bg-surface-alt)',
                    borderBottom: '1px solid var(--border-default)',
                    fontSize: 11,
                  }}
                >
                  {/* AI Risk Assessment */}
                  {riskData && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 10,
                        padding: '8px 10px',
                        background: `${RISK_LEVEL_COLORS[riskData.riskLevel] ?? '#64748b'}10`,
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `3px solid ${RISK_LEVEL_COLORS[riskData.riskLevel] ?? '#64748b'}`,
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>健康度</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: RISK_LEVEL_COLORS[riskData.riskLevel] ?? '#64748b' }}>
                          {riskData.healthScore}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {riskData.aiSummary && (
                          <div style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {riskData.aiSummary}
                          </div>
                        )}
                        {riskData.topRisks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {riskData.topRisks.map((r, ri) => (
                              <div key={ri} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                <span style={{ color: RISK_LEVEL_COLORS[riskData.riskLevel] ?? '#64748b', fontWeight: 600 }}>!</span> {r.risk} — {r.action}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: 9 }}>
                        {Object.entries(riskData.dimensions).map(([k, v]) => (
                          <div key={k} style={{ textAlign: 'center', padding: '2px 4px' }}>
                            <div style={{ color: 'var(--text-muted)' }}>{k === 'milestone' ? '里程碑' : k === 'issueDensity' ? 'Issue' : k === 'resourceCoverage' ? '资源' : k === 'historicalRisk' ? '历史' : k === 'difficulty' ? '难度' : '外部'}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: (v as number) < 40 ? '#ef4444' : 'var(--text-primary)' }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>UPL: </span>
                    <EditableText
                      value={project.upl}
                      onCommit={(v) => updateProject(project.id, { upl: v })}
                      placeholder="未指定"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>STE: </span>
                    <EditableText
                      value={project.ste}
                      onCommit={(v) => updateProject(project.id, { ste: v })}
                      placeholder="未指定"
                    />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>状态: </span>
                    <Badge
                      text={project.status}
                      color={project.status === 'active' ? '#10b981' : project.status === 'paused' ? '#f59e0b' : '#64748b'}
                    />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>里程碑数: </span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {project.milestones.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>备注: </span>
                    <EditableText
                      value={project.notes}
                      onCommit={(v) => updateProject(project.id, { notes: v })}
                      placeholder="无备注"
                      color="var(--color-yellow)"
                      multiline
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProject(project.id, project.vehicleCode);
                    }}
                    style={{
                      fontSize: 9,
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--color-red)',
                      background: 'transparent',
                      color: 'var(--color-red)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      marginLeft: 'auto',
                    }}
                  >
                    删除
                  </button>
                  </div>
                </div>
                );
              })()}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            无匹配项目
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>图例:</span>
        {Object.entries(MILESTONE_COLORS)
          .filter(([key]) => ['J5', 'SOP', 'OTA', 'PVS'].includes(key))
          .map(([key, color]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                {key === 'J5' ? 'J-nodes' : key === 'PVS' ? 'PVS/PT/ME+01' : key}
              </span>
            </div>
          ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'var(--color-pink)',
              display: 'inline-block',
              opacity: 0.6,
            }}
          />
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>当前月</span>
        </div>
      </div>
    </div>
  );
}
