import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Member, ActionItem } from '../types/member';
import type { OKRData } from '../types/okr';
import type { KPIItem, BonusItem } from '../types/kpi';
import type { VehicleProject } from '../types/project';
import type { Status, OKRStatus } from '../types/common';
import type { Issue } from '../data/defaults';
import type { SyncMeta, SyncPayload, MilestoneAlert, DiagnosticResult, MemoryInsight, DecisionEntry } from '../types/sync';
import type { RiskAssessmentPayload, PerfReportPayload, DailyDigest, PipelineRunStatus } from '../types/ai-types';
import { MEMBERS_INIT } from '../data/members-init';
import { OKR_INIT } from '../data/okr-init';
import { KPI_ITEMS_INIT, BONUS_ITEMS_INIT } from '../data/kpi-init';
import { PROJECTS_INIT } from '../data/projects-init';
import { MY_ACTIONS_INIT, ISSUES_INIT, VISION, CULTURE } from '../data/defaults';

export interface AppState {
  version: string;
  members: Member[];
  okr: OKRData;
  kpiItems: KPIItem[];
  kpiBonuses: BonusItem[];
  projects: VehicleProject[];
  myActions: ActionItem[];
  issues: Issue[];
  vision: string;
  culture: string[];
  // v2.1: Sync infrastructure
  syncMeta: Record<string, SyncMeta>;
  diagnosticResults: DiagnosticResult | null;
  milestoneAlerts: MilestoneAlert[];
  syncInsights: MemoryInsight[];
  syncDecisions: DecisionEntry[];
  // v3.0: AI analysis results
  riskAssessments: RiskAssessmentPayload | null;
  perfReports: PerfReportPayload | null;
  dailyDigest: DailyDigest | null;
  pipelineStatus: PipelineRunStatus | null;
}

interface AppActions {
  // Member actions
  addMember: (member: Member) => void;
  removeMember: (index: number) => void;
  updateMemberField: (index: number, field: keyof Member, value: string | number | boolean | null) => void;
  addMemberAction: (memberIndex: number, action: ActionItem) => void;
  updateMemberActionStatus: (memberIndex: number, actionIndex: number, status: Status) => void;

  // OKR actions
  updateKRProgress: (objIndex: number, krIndex: number, progress: number) => void;
  updateKRStatus: (objIndex: number, krIndex: number, status: OKRStatus) => void;
  updateKRText: (objIndex: number, krIndex: number, text: string) => void;

  // KPI actions
  updateKPICurrent: (index: number, value: string) => void;
  updateKPIField: (index: number, field: keyof KPIItem, value: string) => void;

  // Project actions
  addProject: (project: VehicleProject) => void;
  updateProject: (projectId: string, updates: Partial<VehicleProject>) => void;
  removeProject: (projectId: string) => void;

  // My actions - enhanced
  updateMyActionStatus: (index: number, status: Status) => void;
  updateActionText: (index: number, text: string) => void;
  addMyAction: (action: ActionItem) => void;
  removeMyAction: (index: number) => void;

  // Issues
  updateIssueStatus: (index: number, status: Status) => void;

  // v2.1: Sync & Diagnostics
  mergeSyncData: (payload: SyncPayload) => void;
  storeDiagnostics: (result: DiagnosticResult) => void;

  // v3.0: AI analysis
  storeRiskAssessments: (data: RiskAssessmentPayload) => void;
  storePerfReports: (data: PerfReportPayload) => void;
  storeDailyDigest: (data: DailyDigest) => void;
  storePipelineStatus: (data: PipelineRunStatus) => void;

  // Data management
  resetData: () => void;
  importData: (data: AppState) => void;
}

const DEFAULT_STATE: AppState = {
  version: "2026-03-02",
  members: [...MEMBERS_INIT],
  okr: { ...OKR_INIT, objectives: OKR_INIT.objectives.map(o => ({ ...o, keyResults: [...o.keyResults] })) },
  kpiItems: [...KPI_ITEMS_INIT],
  kpiBonuses: [...BONUS_ITEMS_INIT],
  projects: [...PROJECTS_INIT],
  myActions: [...MY_ACTIONS_INIT],
  issues: [...ISSUES_INIT],
  vision: VISION,
  culture: [...CULTURE],
  syncMeta: {},
  diagnosticResults: null,
  milestoneAlerts: [],
  syncInsights: [],
  syncDecisions: [],
  riskAssessments: null,
  perfReports: null,
  dailyDigest: null,
  pipelineStatus: null,
};

function stamp(state: { version: string }) {
  state.version = new Date().toISOString().slice(0, 10);
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set) => ({
      ...DEFAULT_STATE,

      // ─── Member ───────────────────────────────
      addMember: (member) =>
        set((state) => { state.members.push(member); stamp(state); }),

      removeMember: (index) =>
        set((state) => {
          if (index < 0 || index >= state.members.length) return;
          state.members.splice(index, 1); stamp(state);
        }),

      updateMemberField: (index, field, value) =>
        set((state) => {
          if (index < 0 || index >= state.members.length) return;
          (state.members[index] as Record<string, unknown>)[field] = value; stamp(state);
        }),

      addMemberAction: (memberIndex, action) =>
        set((state) => {
          if (memberIndex < 0 || memberIndex >= state.members.length) return;
          state.members[memberIndex].actions.push(action); stamp(state);
        }),

      updateMemberActionStatus: (memberIndex, actionIndex, status) =>
        set((state) => {
          if (memberIndex < 0 || memberIndex >= state.members.length) return;
          if (actionIndex < 0 || actionIndex >= state.members[memberIndex].actions.length) return;
          state.members[memberIndex].actions[actionIndex].status = status; stamp(state);
        }),

      // ─── OKR ──────────────────────────────────
      updateKRProgress: (objIndex, krIndex, progress) =>
        set((state) => {
          const obj = state.okr.objectives[objIndex];
          if (!obj || krIndex < 0 || krIndex >= obj.keyResults.length) return;
          obj.keyResults[krIndex].progress = progress; stamp(state);
        }),

      updateKRStatus: (objIndex, krIndex, status) =>
        set((state) => {
          const obj = state.okr.objectives[objIndex];
          if (!obj || krIndex < 0 || krIndex >= obj.keyResults.length) return;
          obj.keyResults[krIndex].status = status; stamp(state);
        }),

      updateKRText: (objIndex, krIndex, text) =>
        set((state) => {
          const obj = state.okr.objectives[objIndex];
          if (!obj || krIndex < 0 || krIndex >= obj.keyResults.length) return;
          obj.keyResults[krIndex].text = text; stamp(state);
        }),

      // ─── KPI ──────────────────────────────────
      updateKPICurrent: (index, value) =>
        set((state) => {
          if (index < 0 || index >= state.kpiItems.length) return;
          state.kpiItems[index].current = value; stamp(state);
        }),

      updateKPIField: (index, field, value) =>
        set((state) => {
          if (index < 0 || index >= state.kpiItems.length) return;
          const item = state.kpiItems[index];
          if (field in item && typeof item[field] === 'string') {
            (item as Record<string, unknown>)[field] = value;
          }
          stamp(state);
        }),

      // ─── Projects ─────────────────────────────
      addProject: (project) =>
        set((state) => { state.projects.push(project); stamp(state); }),

      updateProject: (projectId, updates) =>
        set((state) => {
          const idx = state.projects.findIndex((p) => p.id === projectId);
          if (idx !== -1) Object.assign(state.projects[idx], updates);
          stamp(state);
        }),

      removeProject: (projectId) =>
        set((state) => {
          const idx = state.projects.findIndex((p) => p.id === projectId);
          if (idx !== -1) state.projects.splice(idx, 1);
          stamp(state);
        }),

      // ─── My Actions (enhanced) ────────────────
      updateMyActionStatus: (index, status) =>
        set((state) => {
          if (index < 0 || index >= state.myActions.length) return;
          state.myActions[index].status = status; stamp(state);
        }),

      updateActionText: (index, text) =>
        set((state) => {
          if (index < 0 || index >= state.myActions.length) return;
          state.myActions[index].text = text; stamp(state);
        }),

      addMyAction: (action) =>
        set((state) => { state.myActions.push(action); stamp(state); }),

      removeMyAction: (index) =>
        set((state) => {
          if (index < 0 || index >= state.myActions.length) return;
          state.myActions.splice(index, 1); stamp(state);
        }),

      // ─── Issues ───────────────────────────────
      updateIssueStatus: (index, status) =>
        set((state) => {
          if (index < 0 || index >= state.issues.length) return;
          state.issues[index].status = status; stamp(state);
        }),

      // ─── Sync & Diagnostics ───────────────────
      mergeSyncData: (payload) =>
        set((state) => {
          // Merge project updates by id
          if (payload.projects) {
            for (const update of payload.projects) {
              const idx = state.projects.findIndex((p) => p.id === update.id);
              if (idx !== -1) {
                Object.assign(state.projects[idx], update);
              }
            }
          }
          // Store insights and decisions
          if (payload.insights) {
            state.syncInsights = payload.insights;
          }
          if (payload.decisions) {
            state.syncDecisions = payload.decisions;
          }
          // Store milestone alerts
          if (payload.milestoneAlerts) {
            state.milestoneAlerts = payload.milestoneAlerts;
          }
          // Update sync meta
          state.syncMeta[payload.source] = {
            lastSyncedAt: new Date().toISOString(),
            source: payload.source,
            recordCount:
              (payload.insights?.length ?? 0) +
              (payload.decisions?.length ?? 0) +
              (payload.milestoneAlerts?.length ?? 0),
          };
          stamp(state);
        }),

      storeDiagnostics: (result) =>
        set((state) => {
          state.diagnosticResults = result;
          stamp(state);
        }),

      // ─── v3.0: AI Analysis ─────────────────────
      storeRiskAssessments: (data) =>
        set((state) => { state.riskAssessments = data; stamp(state); }),

      storePerfReports: (data) =>
        set((state) => { state.perfReports = data; stamp(state); }),

      storeDailyDigest: (data) =>
        set((state) => { state.dailyDigest = data; stamp(state); }),

      storePipelineStatus: (data) =>
        set((state) => { state.pipelineStatus = data; stamp(state); }),

      // ─── Data Management ──────────────────────
      resetData: () => set(() => ({ ...DEFAULT_STATE })),

      importData: (data) => set(() => ({ ...data })),
    })),
    {
      name: 'cockpit-pm-store',
      partialize: (state) => {
        // Exclude volatile AI cache data from localStorage — fetched on demand
        const {
          riskAssessments: _a,
          perfReports: _b,
          dailyDigest: _c,
          pipelineStatus: _d,
          ...persisted
        } = state;
        return persisted as typeof state;
      },
    }
  )
);
