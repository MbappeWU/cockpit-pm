import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/app-store';
import styles from './Sidebar.module.css';

const NAVS = [
  { path: '/', label: '总览', icon: '◉' },
  { path: '/okr', label: 'OKR', icon: '⊞' },
  { path: '/team', label: '团队', icon: '◎' },
  { path: '/roster', label: '花名册', icon: '▤' },
  { path: '/projects', label: '项目', icon: '▦' },
  { path: '/kpi', label: 'KPI', icon: '▥' },
  { path: '/actions', label: '行动', icon: '☰' },
  { path: '/diagnostics', label: '诊断', icon: '⊕' },
  { path: '/automation', label: '自动化', icon: '⚡' },
];

export default function Sidebar() {
  const version = useAppStore((s) => s.version);
  const memberCount = useAppStore((s) => s.members.length);
  const resetData = useAppStore((s) => s.resetData);

  function handleExport() {
    const s = useAppStore.getState(); // read fresh state at click-time
    const data = {
      version: s.version, members: s.members, okr: s.okr,
      kpiItems: s.kpiItems, kpiBonuses: s.kpiBonuses, projects: s.projects,
      myActions: s.myActions, issues: s.issues, vision: s.vision, culture: s.culture,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cockpit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          useAppStore.getState().importData(data);
        } catch {
          alert('导入失败：JSON格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleReset() {
    if (confirm('确认重置所有数据？此操作不可撤销。')) {
      resetData();
    }
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoTitle}>COCKPIT</div>
        <div className={styles.logoSub}>项目管理 v2.0</div>
      </div>
      <div className={styles.navList}>
        {NAVS.map((nav) => (
          <NavLink
            key={nav.path}
            to={nav.path}
            end={nav.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}>{nav.icon}</span>
            {nav.label}
          </NavLink>
        ))}
      </div>
      <div className={styles.footer}>
        <div className={styles.footerInfo}>更新:{version} | {memberCount}人</div>
        <div className={styles.footerActions}>
          <button onClick={handleExport} className={styles.footerBtn}>导出</button>
          <button onClick={handleImport} className={styles.footerBtn}>导入</button>
          <button onClick={handleReset} className={styles.footerBtnDanger}>重置</button>
        </div>
      </div>
    </nav>
  );
}
