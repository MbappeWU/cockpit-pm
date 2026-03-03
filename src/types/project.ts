import type { Difficulty, MilestoneType, Platform } from './common';

export interface ProjectMilestone {
  month: number;
  type: MilestoneType;
}

export interface VehicleProject {
  id: string;
  vehicleCode: string;
  platform: Platform;
  difficulty: Difficulty;
  upl: string;
  ste: string;
  year: number;
  milestones: ProjectMilestone[];
  status: 'active' | 'paused' | 'completed' | 'unstarted';
  notes: string;
}
