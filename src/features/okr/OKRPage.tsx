import { useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { STATUS_CONFIG } from '../../types/common';
import type { OKRStatus } from '../../types/common';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EditableText from '../../components/ui/EditableText';

const STATUS_BUTTONS: { value: OKRStatus; label: string; color: string }[] = [
  { value: 'on_track', label: '正常', color: '#10b981' },
  { value: 'at_risk', label: '风险', color: '#f59e0b' },
  { value: 'off_track', label: '偏离', color: '#ef4444' },
];

export default function OKRPage() {
  const okr = useAppStore((s) => s.okr);
  const updateKRProgress = useAppStore((s) => s.updateKRProgress);
  const updateKRStatus = useAppStore((s) => s.updateKRStatus);
  const updateKRText = useAppStore((s) => s.updateKRText);

  const [expandedObj, setExpandedObj] = useState<Record<string, boolean>>({
    O1: true,
    O2: true,
    O3: true,
  });

  function toggleObj(id: string) {
    setExpandedObj((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-secondary)' }}>张贵海(部长)</span>
        <span style={{ margin: '0 6px' }}>&rarr;</span>
        <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>武磊之</span>
        <span style={{ margin: '0 6px' }}>&rarr;</span>
        <span style={{ color: 'var(--text-muted)' }}>团队成员</span>
      </div>

      <SectionHeader title={`OKR ${okr.version}`} icon="⊞" count={okr.objectives.length} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {okr.objectives.map((obj, objIdx) => {
          const avgProgress = obj.keyResults.length
            ? Math.round(
                obj.keyResults.reduce((s, kr) => s + kr.progress, 0) / obj.keyResults.length
              )
            : 0;
          const isExpanded = expandedObj[obj.id] ?? false;

          return (
            <div
              key={obj.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Objective Header */}
              <div
                onClick={() => toggleObj(obj.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--color-blue)',
                    background: 'rgba(59,130,246,0.12)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {obj.id}
                </span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {obj.title}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  权重 {obj.weight}%
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {avgProgress}%
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  ▶
                </span>
              </div>

              {/* Key Results */}
              {isExpanded && (
                <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {obj.keyResults.map((kr, krIdx) => {
                    const statusCfg = STATUS_CONFIG[kr.status];
                    return (
                      <div
                        key={kr.id}
                        style={{
                          background: 'var(--bg-surface-alt)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                        }}
                      >
                        {/* KR top row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-muted)',
                              minWidth: 52,
                            }}
                          >
                            {kr.id}
                          </span>
                          <span style={{ flex: 1 }}>
                            <EditableText
                              value={kr.text}
                              onCommit={(t) => updateKRText(objIdx, krIdx, t)}
                              fontSize={11}
                            />
                          </span>
                        </div>

                        {/* KR controls row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {/* Status toggle buttons */}
                          <div style={{ display: 'flex', gap: 4 }}>
                            {STATUS_BUTTONS.map((btn) => (
                              <button
                                key={btn.value}
                                onClick={() => updateKRStatus(objIdx, krIdx, btn.value)}
                                style={{
                                  fontSize: 9,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  border: `1px solid ${btn.color}`,
                                  background:
                                    kr.status === btn.value
                                      ? btn.color
                                      : 'transparent',
                                  color:
                                    kr.status === btn.value ? '#fff' : btn.color,
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          {/* Range slider */}
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={kr.progress}
                            onChange={(e) =>
                              updateKRProgress(objIdx, krIdx, Number(e.target.value))
                            }
                            style={{ flex: 1, minWidth: 80, accentColor: statusCfg?.color ?? '#3b82f6' }}
                          />

                          {/* Progress display */}
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: statusCfg?.color ?? 'var(--text-primary)',
                              minWidth: 36,
                              textAlign: 'right',
                            }}
                          >
                            {kr.progress}%
                          </span>

                          {/* Owner tags */}
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {kr.owners.map((owner) => (
                              <Badge
                                key={owner}
                                text={owner}
                                color="var(--color-purple)"
                                bg="rgba(139,92,246,0.15)"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: 6 }}>
                          <ProgressBar
                            value={kr.progress}
                            color={statusCfg?.color ?? 'var(--color-blue)'}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
