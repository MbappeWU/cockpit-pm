interface SectionHeaderProps {
  title: string;
  icon: string;
  count?: number;
}

export default function SectionHeader({ title, icon, count }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            padding: '1px 7px',
            borderRadius: 10,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
