import type { ActionItem } from '../types/member';
import type { Status } from '../types/common';

export interface Issue {
  id: number;
  issue: string;
  action: string;
  status: Status;
}

export const MY_ACTIONS_INIT: ActionItem[] = [
  { id: 1, text: "收齐4位专家履职计划", due: "本周", status: "pending", priority: "urgent" },
  { id: 2, text: "指定第三方统计重复率", due: "本周", status: "pending", priority: "urgent" },
  { id: 3, text: "确认罗宽330目标", due: "本周", status: "pending", priority: "urgent" },
  { id: 4, text: "收平台化方案+推电器", due: "3月底", status: "pending", priority: "high" },
  { id: 5, text: "范云上管理例会", due: "3月中旬", status: "pending", priority: "high" },
  { id: 6, text: "刘钊鸿蒙计划+77B", due: "3月底", status: "pending", priority: "high" },
  { id: 7, text: "柳林MTP+创收1亿", due: "3月底", status: "pending", priority: "high" },
  { id: 8, text: "王政补充汇报", due: "下周", status: "pending", priority: "high" },
  { id: 9, text: "Claude Code分享会", due: "两周内", status: "pending", priority: "high" },
  { id: 10, text: "资源重分配罗宽到37/77", due: "本周", status: "pending", priority: "urgent" },
];

export const ISSUES_INIT: Issue[] = [
  { id: 1, issue: "专家只汇报业务萃取培养遗漏", action: "本周收齐计划", status: "pending" },
  { id: 2, issue: "指标定义不清", action: "3.15前明确", status: "pending" },
  { id: 3, issue: "AI工具两个月零动作", action: "两周内分享会", status: "pending" },
  { id: 4, issue: "课题推进偏慢", action: "按月有产出", status: "pending" },
  { id: 5, issue: "培养记录缺失", action: "本周自查", status: "pending" },
];

export const VISION = "打造AI+项目管理团队，以标准化流程与智能化工具释放全员时间、激发创造力，达成行业最高效的高价值产品交付。";

export const CULTURE: string[] = ["价值驱动", "责任担当", "结果导向", "高效交付"];
