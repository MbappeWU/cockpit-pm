import { useAppStore } from '../../store/app-store';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import EditableText from '../../components/ui/EditableText';

export default function KPIPage() {
  const kpiItems = useAppStore((s) => s.kpiItems);
  const kpiBonuses = useAppStore((s) => s.kpiBonuses);
  const updateKPICurrent = useAppStore((s) => s.updateKPICurrent);
  const updateKPIField = useAppStore((s) => s.updateKPIField);

  const thStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    color: 'var(--text-muted)',
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-default)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    fontSize: 11,
    padding: '8px 10px',
    borderBottom: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
  };

  // Group KPI items by dimension for row spanning
  const dimensionGroups: { dimension: string; startIdx: number; count: number }[] = [];
  let lastDim = '';
  for (let i = 0; i < kpiItems.length; i++) {
    if (kpiItems[i].dimension !== lastDim) {
      dimensionGroups.push({ dimension: kpiItems[i].dimension, startIdx: i, count: 1 });
      lastDim = kpiItems[i].dimension;
    } else {
      dimensionGroups[dimensionGroups.length - 1].count++;
    }
  }

  function isGroupStart(idx: number): boolean {
    return dimensionGroups.some((g) => g.startIdx === idx);
  }

  function getGroupCount(idx: number): number {
    const g = dimensionGroups.find((g) => g.startIdx === idx);
    return g?.count ?? 1;
  }

  return (
    <div>
      <SectionHeader title="KPI 指标" icon="▥" count={kpiItems.length} />

      {/* KPI Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
          marginBottom: 24,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>维度</th>
              <th style={thStyle}>指标</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>权重</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>目标</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>挑战1</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>挑战2</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>当前</th>
            </tr>
          </thead>
          <tbody>
            {kpiItems.map((item, idx) => {
              const showDimension = isGroupStart(idx);
              const groupCount = getGroupCount(idx);

              return (
                <tr key={idx}>
                  {showDimension && (
                    <td
                      rowSpan={groupCount}
                      style={{
                        ...tdStyle,
                        fontWeight: 700,
                        fontSize: 10,
                        color: 'var(--color-blue)',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        background: 'rgba(59,130,246,0.04)',
                        borderRight: '1px solid var(--border-default)',
                        minWidth: 60,
                      }}
                    >
                      {item.dimension}
                    </td>
                  )}
                  <td style={tdStyle}>{item.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {item.weight}%
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <EditableText
                      value={item.target}
                      onCommit={(v) => updateKPIField(idx, 'target', v)}
                      placeholder="—"
                      color="var(--text-secondary)"
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-yellow)' }}>
                    <EditableText
                      value={item.challenge1}
                      onCommit={(v) => updateKPIField(idx, 'challenge1', v)}
                      placeholder="—"
                      color="var(--color-yellow)"
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-pink)' }}>
                    <EditableText
                      value={item.challenge2}
                      onCommit={(v) => updateKPIField(idx, 'challenge2', v)}
                      placeholder="—"
                      color="var(--color-pink)"
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      value={item.current}
                      onChange={(e) => updateKPICurrent(idx, e.target.value)}
                      placeholder="—"
                      style={{
                        width: 70,
                        fontSize: 11,
                        padding: '3px 6px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 4,
                        color: 'var(--color-green)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bonus Items */}
      <SectionHeader title="加分项" icon="🎯" count={kpiBonuses.length} />
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {kpiBonuses.map((bonus, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              flex: '1 1 200px',
              minWidth: 200,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {bonus.name}
              </span>
              <Badge
                text={`+${bonus.score}分`}
                color="var(--color-green)"
                bg="rgba(16,185,129,0.15)"
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              目标: {bonus.target}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
