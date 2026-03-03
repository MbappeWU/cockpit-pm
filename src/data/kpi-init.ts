import type { BonusItem, KPIItem } from '../types/kpi';

export const KPI_ITEMS_INIT: KPIItem[] = [
  { dimension: "销量", name: "销量", weight: 20, target: "", challenge1: "", challenge2: "", current: "" },
  { dimension: "项目", name: "节点绿灯率", weight: 20, target: "85%", challenge1: "90%", challenge2: "95%", current: "" },
  { dimension: "体验", name: "逍遥NPS/满意度", weight: 30, target: "8.6/60%", challenge1: "8.7/62%", challenge2: "8.8/65%", current: "" },
  { dimension: "体验", name: "鸿蒙满意度", weight: 20, target: "8.0", challenge1: "8.3", challenge2: "8.5", current: "" },
  { dimension: "效率", name: "人力/项目", weight: 10, target: "<=18", challenge1: "<=17", challenge2: "<=16", current: "" },
];

export const BONUS_ITEMS_INIT: BonusItem[] = [
  { name: "国产化平台", score: 10, target: "立项+原型" },
  { name: "AI效率提升", score: 10, target: "代码+15%/缺陷-15%" },
];
