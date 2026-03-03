interface SyncIndicatorProps {
  readonly source: string;
  readonly lastSyncedAt: string | null;
  readonly onSync: () => void;
  readonly loading?: boolean;
}

function formatSyncTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function SyncIndicator({
  source,
  lastSyncedAt,
  onSync,
  loading = false,
}: SyncIndicatorProps) {
  const timeText = lastSyncedAt ? formatSyncTime(lastSyncedAt) : '未同步';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 9,
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>
        {source}: {timeText}
      </span>
      <button
        onClick={onSync}
        disabled={loading}
        style={{
          fontSize: 9,
          padding: '2px 6px',
          borderRadius: 4,
          border: '1px solid var(--color-blue)',
          background: 'transparent',
          color: loading ? 'var(--text-muted)' : 'var(--color-blue)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '...' : '🔄'}
      </button>
    </div>
  );
}
