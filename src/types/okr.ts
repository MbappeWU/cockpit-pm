import type { OKRStatus } from './common';

export interface KeyResult {
  id: string;
  text: string;
  owners: string[];
  progress: number;
  status: OKRStatus;
}

export interface Objective {
  id: string;
  title: string;
  weight: number;
  keyResults: KeyResult[];
}

export interface OKRData {
  owner: string;
  version: string;
  objectives: Objective[];
}
