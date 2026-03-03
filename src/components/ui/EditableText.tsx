import { useState, useRef, useEffect, useCallback } from 'react';

interface EditableTextProps {
  readonly value: string;
  readonly onCommit: (value: string) => void;
  readonly placeholder?: string;
  readonly fontSize?: number;
  readonly color?: string;
  readonly multiline?: boolean;
}

export default function EditableText({
  value,
  onCommit,
  placeholder = '—',
  fontSize = 11,
  color = 'var(--text-primary)',
  multiline = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onCommit(trimmed);
    }
    setEditing(false);
  }, [draft, value, onCommit]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel();
      }
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        commit();
      }
      // For multiline, Ctrl/Cmd+Enter commits
      if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        commit();
      }
    },
    [cancel, commit, multiline],
  );

  const sharedInputStyle: React.CSSProperties = {
    fontSize,
    color,
    fontFamily: 'inherit',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--color-blue)',
    outline: 'none',
    padding: '1px 2px',
    margin: '-1px -2px',
    width: '100%',
    resize: multiline ? 'vertical' : 'none',
    lineHeight: 1.4,
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={3}
          style={{ ...sharedInputStyle, minHeight: 40 }}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={sharedInputStyle}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize,
        color: value ? color : 'var(--text-muted)',
        cursor: 'text',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderBottom: hovered ? '1px dashed var(--border-default)' : '1px dashed transparent',
        transition: 'border-color 0.15s',
        lineHeight: 1.4,
        minWidth: 20,
      }}
    >
      {value || placeholder}
      {hovered && (
        <span style={{ fontSize: 9, opacity: 0.5, flexShrink: 0 }}>
          ✎
        </span>
      )}
    </span>
  );
}
