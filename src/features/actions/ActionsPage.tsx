import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/app-store';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../types/common';
import type { Status, Priority } from '../../types/common';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import EditableText from '../../components/ui/EditableText';

export default function ActionsPage() {
  const myActions = useAppStore((s) => s.myActions);
  const issues = useAppStore((s) => s.issues);
  const updateMyActionStatus = useAppStore((s) => s.updateMyActionStatus);
  const updateActionText = useAppStore((s) => s.updateActionText);
  const addMyAction = useAppStore((s) => s.addMyAction);
  const removeMyAction = useAppStore((s) => s.removeMyAction);
  const updateIssueStatus = useAppStore((s) => s.updateIssueStatus);

  // Add action form state
  const [newActionText, setNewActionText] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<Priority>('medium');

  const handleAddAction = useCallback(() => {
    const text = newActionText.trim();
    if (!text) return;
    addMyAction({
      id: Date.now(),
      text,
      due: '待定',
      status: 'pending',
      priority: newActionPriority,
    });
    setNewActionText('');
  }, [newActionText, newActionPriority, addMyAction]);

  const handleRemoveAction = useCallback(
    (idx: number, text: string) => {
      if (window.confirm(`确认删除行动「${text}」？`)) {
        removeMyAction(idx);
      }
    },
    [removeMyAction],
  );

  return (
    <div>
      {/* My Actions */}
      <SectionHeader title="我的关键行动" icon="☰" count={myActions.length} />
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 14,
          marginBottom: 24,
        }}
      >
        {myActions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>暂无行动项</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myActions.map((action, idx) => {
              const priCfg = PRIORITY_CONFIG[action.priority];
              const stCfg = STATUS_CONFIG[action.status];
              const isDone = action.status === 'done';

              return (
                <div
                  key={action.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isDone ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() =>
                      updateMyActionStatus(idx, isDone ? 'pending' : 'done')
                    }
                    style={{ accentColor: priCfg?.color ?? '#3b82f6' }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    <EditableText
                      value={action.text}
                      onCommit={(t) => updateActionText(idx, t)}
                      fontSize={11}
                    />
                  </span>
                  <Badge
                    text={priCfg?.label ?? action.priority}
                    color={priCfg?.color ?? '#64748b'}
                  />
                  <select
                    value={action.status}
                    onChange={(e) =>
                      updateMyActionStatus(idx, e.target.value as Status)
                    }
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 4,
                      color: stCfg?.color ?? 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="pending">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">完成</option>
                    <option value="blocked">阻塞</option>
                  </select>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      minWidth: 48,
                      textAlign: 'right',
                    }}
                  >
                    {action.due}
                  </span>
                  <button
                    onClick={() => handleRemoveAction(idx, action.text)}
                    title="删除"
                    style={{
                      fontSize: 11,
                      padding: '0 4px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-red)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      lineHeight: 1,
                      opacity: 0.6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add action row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <input
            type="text"
            value={newActionText}
            onChange={(e) => setNewActionText(e.target.value)}
            placeholder="添加新行动..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
            style={{
              flex: 1,
              fontSize: 11,
              padding: '5px 8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={newActionPriority}
            onChange={(e) => setNewActionPriority(e.target.value as Priority)}
            style={{
              fontSize: 9,
              padding: '4px 6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
          </select>
          <button
            onClick={handleAddAction}
            disabled={!newActionText.trim()}
            style={{
              fontSize: 10,
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              background: newActionText.trim() ? 'var(--color-blue)' : 'var(--border-default)',
              color: '#fff',
              cursor: newActionText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            添加
          </button>
        </div>

        {/* Summary */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-default)',
            fontSize: 10,
            color: 'var(--text-muted)',
          }}
        >
          <span>
            总计 {myActions.length} |{' '}
            <span style={{ color: 'var(--color-green)' }}>
              完成 {myActions.filter((a) => a.status === 'done').length}
            </span>{' '}
            |{' '}
            <span style={{ color: 'var(--color-pink)' }}>
              紧急 {myActions.filter((a) => a.priority === 'urgent' && a.status !== 'done').length}
            </span>
          </span>
        </div>
      </div>

      {/* Issues */}
      <SectionHeader title="共性问题" icon="⚠️" count={issues.length} />
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 14,
        }}
      >
        {issues.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>暂无共性问题</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {issues.map((issue, idx) => {
              const isDone = issue.status === 'done';
              const stCfg = STATUS_CONFIG[issue.status];

              return (
                <div
                  key={issue.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isDone ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() =>
                      updateIssueStatus(idx, isDone ? 'pending' : 'done')
                    }
                    style={{ accentColor: 'var(--color-yellow)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        marginBottom: 2,
                      }}
                    >
                      {issue.issue}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-cyan)' }}>
                      行动: {issue.action}
                    </div>
                  </div>
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      updateIssueStatus(idx, e.target.value as Status)
                    }
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 4,
                      color: stCfg?.color ?? 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="pending">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">完成</option>
                    <option value="blocked">阻塞</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
