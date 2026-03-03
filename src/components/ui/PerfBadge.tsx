import { PERF_COLORS } from '../../types/common';

interface PerfBadgeProps {
  grade: string;
}

export default function PerfBadge({ grade }: PerfBadgeProps) {
  if (!grade || grade === '-') {
    return (
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
    );
  }

  const color = PERF_COLORS[grade] ?? 'var(--text-muted)';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: '#fff',
        background: color,
        lineHeight: 1.5,
      }}
    >
      {grade}
    </span>
  );
}
