import type { Level, MemberRole, PerfGrade, Priority, Status } from './common';

export interface ActionItem {
  id: number;
  text: string;
  due: string;
  status: Status;
  priority: Priority;
}

export interface ExpertRating {
  business: number;
  capability: number;
  training: number;
}

export interface Member {
  name: string;
  joinDate: string;
  age: number | null;
  level: Level;
  isExpert: boolean;
  role: MemberRole;
  topic: string;
  northStar: string;
  performance: Record<string, PerfGrade>;
  diagnosis: string;
  rating: ExpertRating;
  actions: ActionItem[];
}
