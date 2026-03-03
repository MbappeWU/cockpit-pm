# CLAUDE.md — 座舱项目管理系统 (cockpit-pm)

> v3.0 | React 19 + TypeScript + Vite 7 | Zustand + Immer

## 项目概述

智能座舱项目群管理系统，服务于汽车智能座舱团队（鸿蒙/VCOS双平台）。覆盖 OKR 跟踪、团队绩效、项目甘特图、KPI 考核、行动追踪、AI 风险分析等核心管理场景。

- **线上地址**: https://mbappewu.github.io/cockpit-pm/
- **GitHub**: https://github.com/MbappeWU/cockpit-pm
- **部署**: 推送 `main` 分支自动触发 GitHub Actions → GitHub Pages

## 快速命令

```bash
npm run dev           # 本地开发 http://localhost:5173
npm run build         # tsc 类型检查 + Vite 生产构建
npm run preview       # 预览生产构建

# 数据管道（需配置 .env）
npm run sync          # 同步 memory-system → public/sync/
npm run diagnose      # 运行诊断引擎 → diagnostics-latest.json
npm run pipeline      # 全流程: collect → analyze → push
npm run pipeline:collect   # 仅采集（飞书/JIRA/memory）
npm run pipeline:analyze   # 仅分析（风险/绩效引擎）
npm run pipeline:push      # 仅推送（飞书 webhook）
```

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7.3 (manualChunks 分包) |
| 状态 | Zustand 5 + Immer (localStorage 持久化) |
| 路由 | react-router-dom 7 (9 页面 React.lazy 懒加载) |
| 样式 | CSS 变量 tokens + CSS Modules (Sidebar) |
| 脚本运行时 | tsx (TypeScript CLI 执行器) |
| AI | Claude API (风险分析 + 绩效评估 + 日报生成) |
| 外部集成 | 飞书 API + JIRA API |
| 部署 | GitHub Actions → GitHub Pages |

## 目录结构

```
src/
├── types/           # 类型定义（全项目单一来源）
├── data/            # 初始化数据（members, projects, okr, kpi）
├── store/           # Zustand store + selectors
├── services/        # 数据获取（sync-service, platform-config）
├── theme/           # CSS tokens + global styles
├── components/      # 共享组件（ui/ + layout/）
└── features/        # 按功能模块组织的页面
    ├── dashboard/   # 总览仪表盘
    ├── okr/         # OKR 管理
    ├── team/        # 团队管理 + 花名册
    ├── projects/    # 项目甘特图
    ├── kpi/         # KPI 考核
    ├── actions/     # 行动追踪
    ├── diagnostics/ # 团队诊断
    └── automation/  # 自动化管道配置

scripts/
├── lib/             # 共享工具（data-loader, fs-utils, API clients）
├── collectors/      # 数据采集器（feishu, jira, memory）
├── analyzers/       # AI 分析引擎（risk, perf, digest）
├── pipeline.ts      # 管道编排入口
├── sync-memory.ts   # memory-system 同步
└── diagnose.ts      # 诊断引擎
```

## 路由

| 路径 | 页面 | 文件 |
|------|------|------|
| `/` | 总览仪表盘 | `features/dashboard/DashboardPage.tsx` |
| `/okr` | OKR 管理 | `features/okr/OKRPage.tsx` |
| `/team` | 团队管理 | `features/team/TeamPage.tsx` |
| `/roster` | 花名册 | `features/team/RosterTable.tsx` |
| `/projects` | 项目甘特图 | `features/projects/ProjectsPage.tsx` |
| `/kpi` | KPI 考核 | `features/kpi/KPIPage.tsx` |
| `/actions` | 行动追踪 | `features/actions/ActionsPage.tsx` |
| `/diagnostics` | 团队诊断 | `features/diagnostics/DiagnosticsPage.tsx` |
| `/automation` | 自动化管道 | `features/automation/AutomationPage.tsx` |

## Store 架构

Zustand store (`src/store/app-store.ts`) 使用 Immer 中间件 + localStorage 持久化。

**核心数据域:**
- `members: Member[]` — 23 人团队花名册（含绩效历史、专家评分、行动项）
- `okr: OKRData` — 3 个 Objective, 16 个 KR
- `projects: VehicleProject[]` — 24 个车型项目（4 平台）
- `myActions: ActionItem[]` — 个人行动项
- `kpiItems / kpiBonuses` — KPI 指标 + 奖金项

**同步数据域:**
- `milestoneAlerts` — 里程碑预警（从 memory-system 同步）
- `syncInsights / syncDecisions` — 项目洞察和关键决策
- `riskAssessments / perfReports / dailyDigest` — AI 分析结果（volatile, 不持久化）

**Selector 模式:**
- `src/store/selectors.ts` 使用窄类型接口 (`HasMembers`, `HasOKR`, `HasMyActions`)
- 页面组件中通过 `useMemo` 包装 selector 调用

## 设计 Token 体系

CSS 变量定义在 `src/theme/tokens.css`：

```css
/* 背景 */
--bg-base        --bg-surface      --bg-surface-alt   --bg-elevated

/* 文字 */
--text-primary   --text-secondary  --text-muted

/* 颜色 */
--color-blue     --color-green     --color-yellow     --color-red
--color-pink     --color-purple    --color-cyan

/* 间距 / 圆角 */
--space-xs/sm/md/lg/xl    --radius-sm/md/lg

/* 字体 */
--font-body (Noto Sans SC)    --font-mono (SF Mono)
```

**规则**: 不允许在组件中使用硬编码十六进制颜色，必须使用 CSS 变量或 `src/types/common.ts` 中的共享常量。

## 共享常量

`src/types/common.ts` 是类型和常量的单一来源：

- `STATUS_CONFIG` — 状态标签 + 颜色映射
- `PRIORITY_CONFIG` — 优先级配置
- `PERF_COLORS` — 绩效等级颜色
- `PERF_PERIOD_KEYS` — 绩效周期键 (`['2023', '24Q1', '24Q2', '25Q1', '25Q2']`)
- `RISK_LEVEL_COLORS` — 风险等级颜色
- `LEVEL_ORDER` — 职级排序

## 数据管道架构

```
memory-system (JSONL)
飞书 (API)           →  collectors  →  analyzers  →  public/sync/*.json  →  前端 fetch
JIRA (API)                              ↓
                                    Claude API
                                   (AI 增强)
```

脚本通过 `tsx` 运行（Node + TypeScript），共享 `scripts/lib/` 中的工具函数和 `src/types/` 中的类型定义。

## 编码约定

### 必须遵循

1. **不可变更新** — store 用 Immer，其余场景用展开操作符
2. **类型安全** — 所有函数签名必须有类型注解，禁止 `any`
3. **CSS 变量** — 颜色/间距/圆角一律用 token，不硬编码
4. **边界检查** — store 中所有 index-based mutation 必须做 bounds check
5. **懒加载** — 新页面必须用 `React.lazy()` 导入
6. **共享类型** — 前端和脚本共用 `src/types/` 下的类型定义

### 禁止

- `as AppState` 或其他不安全类型断言（用窄接口类型替代）
- 组件中直接使用 `console.log`（用 Error Boundary 处理异常）
- 在组件顶层调用 `useAppStore.getState()`（会导致 stale state）
- 脚本中重复定义已在 `src/types/` 中存在的类型
- 脚本中用正则解析 TypeScript 源码（用 `scripts/lib/data-loader.ts` 直接导入）

### 新增页面检查清单

- [ ] 在 `src/features/<name>/` 下创建组件
- [ ] `App.tsx` 中用 `React.lazy()` 导入并添加 `<Route>`
- [ ] `Sidebar.tsx` 中添加导航项
- [ ] 使用 `useShallow` 选取 store 切片
- [ ] selector 调用包裹 `useMemo`

### 新增脚本检查清单

- [ ] 类型从 `src/types/` 导入
- [ ] 工具函数从 `scripts/lib/fs-utils.ts` 导入
- [ ] 数据加载用 `scripts/lib/data-loader.ts`
- [ ] 在 `package.json` 中添加 npm script

## 环境变量

参见 `.env.example`：

| 变量 | 用途 | 必需 |
|------|------|------|
| `VITE_FEISHU_APP_ID` | 飞书应用 ID | 管道脚本需要 |
| `VITE_FEISHU_APP_SECRET` | 飞书应用密钥 | 管道脚本需要 |
| `VITE_JIRA_BASE_URL` | JIRA 服务地址 | 管道脚本需要 |
| `VITE_JIRA_TOKEN` | JIRA API Token | 管道脚本需要 |
| `ANTHROPIC_API_KEY` | Claude API 密钥 | AI 分析需要 |

前端纯静态，不依赖任何环境变量即可运行。管道脚本按需配置。

## GitHub Pages 部署

- `vite.config.ts` 中 `base: '/cockpit-pm/'` 匹配子路径
- `src/main.tsx` 中 `BrowserRouter basename={import.meta.env.BASE_URL}`
- `public/404.html` 处理 SPA 路由回退
- `.github/workflows/deploy.yml` 在 push main 时自动构建部署
