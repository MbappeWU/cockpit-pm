import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/app-store';
import { fetchSyncPayload } from '../../services/sync-service';
import { getPlatformStatus } from '../../services/platform-config';
import SectionHeader from '../../components/ui/SectionHeader';
import Badge from '../../components/ui/Badge';
import SyncIndicator from '../../components/ui/SyncIndicator';

interface Workflow {
  readonly title: string;
  readonly priority: string;
  readonly priorityColor: string;
  readonly trigger: string;
  readonly steps: readonly string[];
  readonly prompt: string;
}

const WORKFLOWS: readonly Workflow[] = [
  {
    title: "周一早会数据包",
    priority: "P0",
    priorityColor: "#f43f5e",
    trigger: "每周一 08:00 自动触发",
    steps: [
      "1. 拉取各车型本周里程碑状态",
      "2. 汇总OKR进度 & 风险KR",
      "3. 生成紧急行动Top5",
      "4. 输出Markdown到钉钉群",
    ],
    prompt: `你是座舱项目管理AI助手。请基于以下数据生成本周早会汇报:

## 输入数据
- OKR数据: {{okr}}
- 项目里程碑: {{milestones}}
- 紧急行动: {{urgentActions}}
- 团队完成率: {{completionRate}}

## 输出格式
### 📊 本周重点
- 里程碑状态: X绿/X黄/X红
- OKR整体进度: X%
- 紧急行动Top5

### ⚠️ 风险提醒
[列出风险KR和阻塞项]

### 📋 本周聚焦
[列出本周需要推动的3件事]

请用简洁的中文输出，适合在钉钉群消息中阅读。`,
  },
  {
    title: "绩效数据月度分析",
    priority: "P1",
    priorityColor: "#f59e0b",
    trigger: "每月最后一个工作日 17:00",
    steps: [
      "1. 抓取全员最新绩效等级",
      "2. 计算环比变化 & 分布",
      "3. 标记连续下滑成员",
      "4. 生成诊断报告发至邮箱",
    ],
    prompt: `你是HR数据分析AI。请基于以下绩效数据生成月度分析报告:

## 输入数据
- 团队成员绩效: {{perfData}}
- 历史趋势: {{perfHistory}}
- 专家评分: {{expertRatings}}

## 分析要求
1. 绩效分布统计(A/B/C各占比)
2. 环比变化趋势(哪些人上升/下滑)
3. 连续2个季度C及以下的预警名单
4. 专家履职完成度评估
5. 改善建议(具体到人)

## 输出格式
使用Markdown表格+要点形式，突出数据驱动的洞察。`,
  },
  {
    title: "项目风险预警",
    priority: "P0",
    priorityColor: "#f43f5e",
    trigger: "每日 09:00 自动扫描",
    steps: [
      "1. 检查未来2周里程碑",
      "2. 对比当前进度与计划",
      "3. 识别资源冲突",
      "4. 触发钉钉@相关人告警",
    ],
    prompt: `你是项目风险分析AI。请扫描以下项目数据并输出风险预警:

## 输入数据
- 项目列表: {{projects}}
- 当前日期: {{today}}
- 团队资源: {{resources}}

## 分析规则
1. 未来14天内有里程碑但进度<80% → 红色预警
2. 同一UPL负责>3个活跃项目 → 资源过载预警
3. 里程碑延期>7天 → 黄色预警
4. A/B级项目无UPL指定 → 管理盲区预警

## 输出
- 逐项列出风险项，标注等级(红/黄/蓝)
- 给出建议的缓解措施
- @相关负责人`,
  },
  {
    title: "OKR对齐检查",
    priority: "P1",
    priorityColor: "#f59e0b",
    trigger: "每两周五 16:00",
    steps: [
      "1. 拉取全部OKR及KR进度",
      "2. 检查KR owner活跃度",
      "3. 分析目标与行动对齐度",
      "4. 输出对齐报告到Notion",
    ],
    prompt: `你是OKR教练AI。请分析以下OKR数据的对齐情况:

## 输入数据
- OKR结构: {{okr}}
- 成员行动列表: {{memberActions}}
- KR进度: {{krProgress}}

## 分析维度
1. 每个KR是否有明确的owner在推动
2. Owner的行动项是否与KR目标对齐
3. 进度是否符合时间线预期(Q1末应达25%)
4. 哪些KR缺乏具体可衡量的行动

## 输出
- 对齐度评分(1-5)
- 未对齐的KR列表及原因
- 建议的调整动作`,
  },
];

interface DataSyncRow {
  readonly source: string;
  readonly target: string;
  readonly frequency: string;
  readonly status: 'active' | 'planned';
}

const DATA_SYNC_PLAN: readonly DataSyncRow[] = [
  { source: "memory-system", target: "项目洞察/决策/里程碑预警", frequency: "手动/CLI", status: "active" },
  { source: "飞书(Feishu)", target: "周例会纪要/风险台账/待办", frequency: "cockpit-weekly-report", status: "active" },
  { source: "JIRA", target: "Highest问题追踪/风险TOP10", frequency: "cockpit-daily-report", status: "active" },
  { source: "HR系统", target: "绩效数据", frequency: "每季度手动", status: "active" },
  { source: "飞书群", target: "风险日报卡片推送", frequency: "按workflow触发", status: "active" },
  { source: "Claude API", target: "AI诊断报告", frequency: "按需调用", status: "planned" },
];

export default function AutomationPage() {
  const syncMeta = useAppStore((s) => s.syncMeta);
  const pipelineStatus = useAppStore((s) => s.pipelineStatus);
  const mergeSyncData = useAppStore((s) => s.mergeSyncData);

  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [logExpanded, setLogExpanded] = useState(false);
  const platforms = useMemo(() => getPlatformStatus(), []);

  const handleSyncRow = useCallback(
    async (source: string) => {
      setSyncingSource(source);
      try {
        const payload = await fetchSyncPayload();
        mergeSyncData(payload);
      } catch (err) {
        alert(err instanceof Error ? err.message : '同步失败');
      } finally {
        setSyncingSource(null);
      }
    },
    [mergeSyncData],
  );

  const handleCopyPrompt = useCallback(async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败，请手动复制');
    }
  }, []);

  // Build execution log entries sorted by lastSyncedAt desc
  const logEntries = Object.values(syncMeta)
    .filter((m): m is typeof m & { lastSyncedAt: string } => m.lastSyncedAt !== null)
    .sort((a, b) => new Date(b.lastSyncedAt!).getTime() - new Date(a.lastSyncedAt!).getTime());

  return (
    <div>
      <SectionHeader title="自动化工作流" icon="⚡" count={WORKFLOWS.length} />

      {/* Workflow cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {WORKFLOWS.map((wf, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Badge text={wf.priority} color={wf.priorityColor} bg={wf.priorityColor} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {wf.title}
              </span>
            </div>

            {/* Trigger */}
            <div style={{ fontSize: 10, color: 'var(--color-cyan)', marginBottom: 10 }}>
              触发: {wf.trigger}
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 10 }}>
              {wf.steps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    padding: '3px 0',
                    paddingLeft: 8,
                    borderLeft: '2px solid var(--border-default)',
                    marginBottom: 2,
                  }}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Claude Prompt - expandable */}
            <details
              style={{
                background: 'var(--bg-surface-alt)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  padding: '8px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-purple)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Claude Prompt 模板</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyPrompt(wf.prompt);
                  }}
                  style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    borderRadius: 3,
                    border: '1px solid var(--color-cyan)',
                    background: 'transparent',
                    color: 'var(--color-cyan)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  复制 Prompt
                </button>
              </summary>
              <pre
                style={{
                  padding: '10px 12px',
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                  borderTop: '1px solid var(--border-default)',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                {wf.prompt}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* Data Sync Plan */}
      <SectionHeader title="数据同步计划" icon="🔄" count={DATA_SYNC_PLAN.length} />
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
              {['数据源', '目标', '频率', '状态', '同步'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA_SYNC_PLAN.map((row, idx) => {
              const meta = syncMeta[row.source];
              const isSyncing = syncingSource === row.source;

              return (
                <tr key={idx}>
                  <td
                    style={{
                      fontSize: 11,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {row.source}
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {row.target}
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {row.frequency}
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-default)',
                    }}
                  >
                    <Badge
                      text={row.status === 'active' ? '已启用' : '计划中'}
                      color={row.status === 'active' ? '#10b981' : '#64748b'}
                      bg={row.status === 'active' ? 'rgba(16,185,129,0.15)' : undefined}
                    />
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-default)',
                    }}
                  >
                    {row.status === 'active' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => handleSyncRow(row.source)}
                          disabled={isSyncing}
                          style={{
                            fontSize: 9,
                            padding: '3px 10px',
                            borderRadius: 4,
                            border: '1px solid var(--color-blue)',
                            background: isSyncing ? 'var(--border-default)' : 'transparent',
                            color: isSyncing ? 'var(--text-muted)' : 'var(--color-blue)',
                            cursor: isSyncing ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {isSyncing ? '同步中...' : '同步'}
                        </button>
                        {meta && (
                          <SyncIndicator
                            source={row.source}
                            lastSyncedAt={meta.lastSyncedAt}
                            onSync={() => handleSyncRow(row.source)}
                            loading={isSyncing}
                          />
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Platform Connection Status */}
      <SectionHeader title="平台连接状态" icon="🔗" count={platforms.length} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {platforms.map((p) => (
          <div
            key={p.name}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${p.configured ? 'rgba(16,185,129,0.3)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: p.configured ? '#10b981' : '#64748b',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {p.name}
              </span>
              <Badge
                text={p.configured ? '已连接' : '未配置'}
                color={p.configured ? '#10b981' : '#64748b'}
                bg={p.configured ? 'rgba(16,185,129,0.15)' : undefined}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {p.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Run Status */}
      {pipelineStatus && (
        <>
          <SectionHeader title="管道运行状态" icon="🚀" count={pipelineStatus.steps.length} />
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
              marginBottom: 24,
            }}
          >
            {/* Run meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                上次运行: {new Date(pipelineStatus.runAt).toLocaleString('zh-CN')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                耗时 {(pipelineStatus.totalDuration / 1000).toFixed(1)}s
              </span>
              {(() => {
                const failedCount = pipelineStatus.steps.filter((s) => s.status === 'failed').length;
                const allOk = failedCount === 0;
                return (
                  <Badge
                    text={allOk ? '全部成功' : `${failedCount} 步失败`}
                    color={allOk ? '#10b981' : '#ef4444'}
                    bg={allOk ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
                  />
                );
              })()}
            </div>

            {/* Step timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pipelineStatus.steps.map((step, idx) => {
                const STEP_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
                  success: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: '✓' },
                  failed: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: '✗' },
                  skipped: { bg: 'rgba(100,116,139,0.1)', color: '#64748b', icon: '—' },
                };
                const cfg = STEP_COLORS[step.status] ?? STEP_COLORS.skipped;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: cfg.bg,
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${cfg.color}`,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, minWidth: 16 }}>
                      {cfg.icon}
                    </span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {step.name}
                    </span>
                    {step.duration != null && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {(step.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                    <Badge
                      text={step.status === 'success' ? '成功' : step.status === 'failed' ? '失败' : '跳过'}
                      color={cfg.color}
                      bg={cfg.bg}
                    />
                  </div>
                );
              })}
            </div>

            {/* Show errors if any */}
            {pipelineStatus.steps.some((s) => s.error) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>
                  错误详情
                </div>
                {pipelineStatus.steps
                  .filter((s) => s.error)
                  .map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 10,
                        color: 'var(--text-secondary)',
                        padding: '4px 8px',
                        background: 'rgba(239,68,68,0.05)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 4,
                      }}
                    >
                      [{s.name}] {s.error}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Execution Log */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => setLogExpanded((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              transform: logExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▶
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
            执行日志
          </span>
          <Badge
            text={`${logEntries.length}`}
            color="var(--text-muted)"
          />
        </div>

        {logExpanded && (
          <div
            style={{
              padding: '0 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {logEntries.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 8 }}>
                暂无执行记录
              </div>
            ) : (
              logEntries.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '6px 10px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 10,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 100 }}>
                    {entry.source}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {entry.lastSyncedAt
                      ? new Date(entry.lastSyncedAt).toLocaleString('zh-CN')
                      : '—'}
                  </span>
                  <span style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {entry.recordCount} 条记录
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
