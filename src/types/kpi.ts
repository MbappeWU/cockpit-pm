export interface KPIItem {
  dimension: string;
  name: string;
  weight: number;
  target: string;
  challenge1: string;
  challenge2: string;
  current: string;
}

export interface BonusItem {
  name: string;
  score: number;
  target: string;
}
