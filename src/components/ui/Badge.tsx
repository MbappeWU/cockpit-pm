interface BadgeProps {
  text: string;
  color: string;
  bg?: string;
}

export default function Badge({ text, color, bg }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 600,
        color: bg ? '#fff' : color,
        background: bg ?? 'transparent',
        border: bg ? 'none' : `1px solid ${color}`,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
