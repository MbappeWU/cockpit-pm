/**
 * data-loader.ts
 *
 * Shared data loader — imports actual TypeScript init files
 * instead of fragile regex parsing of source code.
 */

import { PROJECTS_INIT } from '../../src/data/projects-init.js';
import { MEMBERS_INIT } from '../../src/data/members-init.js';
import type { VehicleProject } from '../../src/types/project.js';
import type { Member } from '../../src/types/member.js';

/* ── Projects ──────────────────────────────────────────────── */

export interface ProjectData {
  id: string;
  vehicleCode: string;
  platform: string;
  difficulty: string;
  upl: string;
  ste: string;
  milestones: Array<{ month: number; type: string }>;
  status: string;
  notes: string;
}

/** Convert typed VehicleProject to script-local ProjectData */
function toProjectData(p: VehicleProject): ProjectData {
  return {
    id: p.id,
    vehicleCode: p.vehicleCode,
    platform: p.platform,
    difficulty: p.difficulty,
    upl: p.upl,
    ste: p.ste,
    milestones: p.milestones,
    status: p.status,
    notes: p.notes,
  };
}

export function loadProjects(): ProjectData[] {
  return PROJECTS_INIT.map(toProjectData);
}

/* ── Members ───────────────────────────────────────────────── */

export interface MemberData {
  name: string;
  level: string;
  isExpert: boolean;
  joinDate: string;
  performance: Record<string, string>;
  rating: { business: number; capability: number; training: number };
  actions: Array<{ status: string; priority: string }>;
}

/** Convert typed Member to script-local MemberData */
function toMemberData(m: Member): MemberData {
  return {
    name: m.name,
    level: m.level,
    isExpert: m.isExpert,
    joinDate: m.joinDate,
    performance: m.performance,
    rating: m.rating,
    actions: m.actions.map((a) => ({ status: a.status, priority: a.priority })),
  };
}

export function loadMembers(): MemberData[] {
  return MEMBERS_INIT.map(toMemberData);
}

/* ── Member → Project mapping ──────────────────────────────── */

/** Build map: memberName → vehicleCodes (from UPL/STE fields) */
export function buildMemberProjectMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const p of PROJECTS_INIT) {
    for (const name of [p.upl, p.ste]) {
      if (!name) continue;
      const list = map.get(name) ?? [];
      list.push(p.vehicleCode);
      map.set(name, list);
    }
  }
  return map;
}
