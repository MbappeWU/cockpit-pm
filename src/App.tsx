import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import { useAppStore } from './store/app-store';
import {
  fetchSyncPayload,
  fetchDiagnostics,
  fetchRiskAssessment,
  fetchPerfReport,
  fetchDailyDigest,
  fetchPipelineStatus,
} from './services/sync-service';

/* ── Route-level code splitting ────────────────────── */
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const OKRPage = lazy(() => import('./features/okr/OKRPage'));
const TeamPage = lazy(() => import('./features/team/TeamPage'));
const RosterTable = lazy(() => import('./features/team/RosterTable'));
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'));
const KPIPage = lazy(() => import('./features/kpi/KPIPage'));
const ActionsPage = lazy(() => import('./features/actions/ActionsPage'));
const DiagnosticsPage = lazy(() => import('./features/diagnostics/DiagnosticsPage'));
const AutomationPage = lazy(() => import('./features/automation/AutomationPage'));

/* ── Loading fallback ──────────────────────────────── */
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
      加载中...
    </div>
  );
}

export default function App() {
  // Auto-load sync data on mount — actions are stable Zustand refs, safe to call in effect
  useEffect(() => {
    const s = useAppStore.getState();
    fetchSyncPayload().then(s.mergeSyncData).catch(() => {});
    fetchDiagnostics().then(s.storeDiagnostics).catch(() => {});
    fetchRiskAssessment().then(s.storeRiskAssessments).catch(() => {});
    fetchPerfReport().then(s.storePerfReports).catch(() => {});
    fetchDailyDigest().then(s.storeDailyDigest).catch(() => {});
    fetchPipelineStatus().then(s.storePipelineStatus).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/okr" element={<OKRPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/roster" element={<RosterTable />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/kpi" element={<KPIPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="/automation" element={<AutomationPage />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
