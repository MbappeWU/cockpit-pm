import type { OKRData } from '../types/okr';

export const OKR_INIT: OKRData = {
  owner: "武磊之",
  version: "01-22",
  objectives: [
    {
      id: "O1",
      title: "高质量实现软件开发，软件交付计划符合率100%",
      weight: 33.3,
      keyResults: [
        { id: "O1-KR1", text: "鸿蒙座舱100%按计划MRD与CRB", owners: ["刘钊","凡智","刘冰","罗宽"], progress: 0, status: "on_track" },
        { id: "O1-KR2", text: "逍遥座舱100%按计划MRD与CRB", owners: ["刘启辉","丁磊","鞠华玮","柳林","范云","易休"], progress: 0, status: "on_track" },
        { id: "O1-KR3", text: "发布PM岗位标准化SOP通过评审", owners: ["刘钊","刘启辉","杨焕","丁磊"], progress: 0, status: "on_track" },
        { id: "O1-KR4", text: "IPD全过程评审流程H77B落地", owners: ["曹旭"], progress: 0, status: "on_track" },
        { id: "O1-KR5", text: "项目复盘体系重复问题率<10%", owners: ["鞠华玮"], progress: 0, status: "at_risk" },
        { id: "O1-KR6", text: "座舱软件平台化基线管理方案", owners: ["李富豪"], progress: 0, status: "on_track" },
      ],
    },
    {
      id: "O2",
      title: "全面开展体系力建设，研发效率提升10%",
      weight: 33.3,
      keyResults: [
        { id: "O2-KR1", text: "敏捷优化方案落地看板实时状态", owners: ["丁佳妮","姜智尧"], progress: 0, status: "on_track" },
        { id: "O2-KR2", text: "玄武平台座舱全链路交付跑通", owners: ["刘启辉"], progress: 0, status: "on_track" },
        { id: "O2-KR3", text: "AI项目助手落地1个高价值场景", owners: ["罗宽"], progress: 0, status: "at_risk" },
        { id: "O2-KR4", text: "数据决策地图至少落地1项", owners: ["范云"], progress: 0, status: "at_risk" },
      ],
    },
    {
      id: "O3",
      title: "建成行业最具战斗力的团队",
      weight: 33.3,
      keyResults: [
        { id: "O3-KR1", text: "更新2026关键技术清单", owners: ["鞠华玮"], progress: 0, status: "on_track" },
        { id: "O3-KR2", text: "AI助手需求锁定+5个助手开发", owners: ["杨立辉","罗宽","朱青棚"], progress: 0, status: "on_track" },
        { id: "O3-KR3", text: "至少1次跨团队交流摸底满意率", owners: ["刘嘉诚"], progress: 0, status: "on_track" },
        { id: "O3-KR4", text: "锁定培训计划参与率>90%", owners: ["凡智"], progress: 0, status: "on_track" },
        { id: "O3-KR5", text: "Q1提交4篇以上专利获受理", owners: ["凡智"], progress: 0, status: "on_track" },
        { id: "O3-KR6", text: "愿景文化宣传全员100%掌握", owners: ["王夕"], progress: 0, status: "on_track" },
      ],
    },
  ],
};
