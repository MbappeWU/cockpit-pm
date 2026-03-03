import { useAppStore } from '../../store/app-store';
import { LEVEL_ORDER, PERF_PERIOD_KEYS } from '../../types/common';
import PerfBadge from '../../components/ui/PerfBadge';
import SectionHeader from '../../components/ui/SectionHeader';
import EditableText from '../../components/ui/EditableText';

const PERF_COLS = PERF_PERIOD_KEYS;

export default function RosterTable() {
  const members = useAppStore((s) => s.members);
  const updateMemberField = useAppStore((s) => s.updateMemberField);

  // Keep track of original indices so edits target the right member
  const sorted = members
    .map((m, originalIndex) => ({ ...m, originalIndex }))
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    color: 'var(--text-muted)',
    padding: '8px 6px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-default)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    fontSize: 12,
    padding: '7px 6px',
    borderBottom: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <SectionHeader title="团队花名册" icon="▤" count={members.length} />

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>姓名</th>
              <th style={thStyle}>入职</th>
              <th style={thStyle}>年龄</th>
              <th style={thStyle}>职级</th>
              {PERF_COLS.map((col) => (
                <th key={col} style={{ ...thStyle, textAlign: 'center' }}>
                  {col}
                </th>
              ))}
              <th style={{ ...thStyle, textAlign: 'center' }}>最新</th>
              <th style={thStyle}>方向</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, idx) => {
              const isExpert = m.isExpert;
              const rowBg = isExpert ? 'rgba(139,92,246,0.04)' : 'transparent';
              const oi = m.originalIndex;

              return (
                <tr key={m.name} style={{ background: rowBg }}>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 11 }}>
                    {idx + 1}
                  </td>
                  <td style={tdStyle}>
                    <EditableText
                      value={m.name}
                      onCommit={(v) => updateMemberField(oi, 'name', v)}
                      fontSize={12}
                      color="var(--text-primary)"
                    />
                    {isExpert && (
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--color-purple)',
                          marginLeft: 4,
                          fontWeight: 700,
                        }}
                      >
                        专家
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <EditableText
                      value={m.joinDate}
                      onCommit={(v) => updateMemberField(oi, 'joinDate', v)}
                      fontSize={11}
                      color="var(--text-secondary)"
                    />
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {m.age ?? '—'}
                  </td>
                  <td style={tdStyle}>
                    <EditableText
                      value={m.level}
                      onCommit={(v) => updateMemberField(oi, 'level', v)}
                      fontSize={11}
                      color="var(--color-blue)"
                    />
                  </td>
                  {PERF_COLS.map((col) => (
                    <td key={col} style={{ ...tdStyle, textAlign: 'center' }}>
                      <PerfBadge grade={m.performance?.[col] ?? '-'} />
                    </td>
                  ))}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <PerfBadge grade={m.performance?.latest ?? '-'} />
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <EditableText
                      value={m.topic || ''}
                      onCommit={(v) => updateMemberField(oi, 'topic', v)}
                      fontSize={11}
                      color="var(--text-secondary)"
                      placeholder="—"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
