import { useState, useEffect, useCallback } from "react";

const MEMBERS_INIT = [
  {name:"刘钊",join:"2024.8.21",age:38,lv:"P10",exp:true,role:"专家",topic:"鸿蒙全系车型交付管理",ns:"鸿蒙全系按期交付率100%",perf:{"2023":"-","24Q1":"B","24Q2":"A+","25Q1":"B","25Q2":"B+","25Q3":"","25Q4":"","latest":"A"},diag:"项目全景管控细致，77B最大风险。专家履职几乎未覆盖",rat:{b:3,c:1.5,t:1.5},acts:[{id:1,tx:"77B时间推动：3月高峰会确认",due:"3月底",st:"pending",pr:"high"},{id:2,tx:"77机芯T12+基价延期影响评估",due:"本周",st:"pending",pr:"urgent"},{id:3,tx:"小改款策略明确(97F/37C/53C)",due:"3月底",st:"pending",pr:"high"},{id:4,tx:"补齐专家履职计划",due:"本周",st:"pending",pr:"urgent"},{id:5,tx:"车型一览表更新版发送",due:"本周",st:"pending",pr:"medium"}]},
  {name:"刘启辉",join:"2021.3.10",age:35,lv:"P10",exp:true,role:"专家",topic:"VCOS平台化共版+能力建设",ns:"9610平台软件复用率",perf:{"2023":"C","24Q1":"A","24Q2":"B+","25Q1":"B","25Q2":"B+","25Q3":"","25Q4":"","latest":"A"},diag:"课题方案最成熟。经验萃取和人才培养有历史欠账，AI零动作",rat:{b:4,c:2,t:2},acts:[{id:1,tx:"输出平台化方案文档",due:"3月底",st:"pending",pr:"high"},{id:2,tx:"推动电器确认矩阵共版",due:"3月中旬",st:"pending",pr:"high"},{id:3,tx:"补齐年度工作看板",due:"本周",st:"pending",pr:"urgent"},{id:4,tx:"专业能力建设文档分工",due:"4月15日",st:"pending",pr:"medium"},{id:5,tx:"UPL checklist补齐",due:"4月底",st:"pending",pr:"medium"},{id:6,tx:"人才培养系统自查",due:"本周",st:"pending",pr:"urgent"},{id:7,tx:"resource团队分工重排",due:"新人到岗前",st:"pending",pr:"medium"},{id:8,tx:"Claude Code安装使用",due:"两周内",st:"pending",pr:"high"}]},
  {name:"柳林",join:"2021.3.5",age:42,lv:"P9",exp:true,role:"专家",topic:"MTP+8295推广+对外创收",ns:"座舱对外创收:目标1亿",perf:{"2023":"C","24Q1":"C","24Q2":"C+🌟","25Q1":"C+","25Q2":"C","25Q3":"","25Q4":"","latest":"C"},diag:"方向丰富需包装统一课题",rat:{b:2.5,c:1.5,t:1.5},acts:[{id:1,tx:"包装创收1亿统一课题",due:"3月底",st:"pending",pr:"high"},{id:2,tx:"跟进电器研究会结果",due:"本周",st:"pending",pr:"urgent"},{id:3,tx:"8295推广与柳七沟通",due:"3月中旬",st:"pending",pr:"medium"},{id:4,tx:"各级申报时间梳理",due:"4月中旬",st:"pending",pr:"medium"},{id:5,tx:"补齐专家履职计划",due:"本周",st:"pending",pr:"urgent"}]},
  {name:"鞠华玮",join:"2021.10.20",age:41,lv:"P9",exp:true,role:"专家",topic:"质量体系+重复问题率<10%",ns:"重复率:40%到<10%",perf:{"2023":"B","24Q1":"B","24Q2":"C","25Q1":"C","25Q2":"C","25Q3":"","25Q4":"","latest":"C"},diag:"10%指标无统计口径，一个多月无实质动作",rat:{b:2.5,c:2,t:1.5},acts:[{id:1,tx:"第三方定义统计重复率",due:"3月15日",st:"pending",pr:"urgent"},{id:2,tx:"可执行方案一页纸",due:"3月底",st:"pending",pr:"high"},{id:3,tx:"16949培训落地",due:"4月中旬",st:"pending",pr:"medium"},{id:4,tx:"影响分析抽检机制",due:"4月底",st:"pending",pr:"medium"},{id:5,tx:"补齐专家履职计划",due:"本周",st:"pending",pr:"urgent"}]},
  {name:"王政",join:"2024.06.30",age:45,lv:"P9",exp:true,role:"专家",topic:"待补充汇报",ns:"待确认",perf:{"2023":"B","24Q1":"B","24Q2":"C","25Q1":"C","25Q2":"C+🌟","25Q3":"","25Q4":"","latest":"C"},diag:"未汇报需单独安排听证",rat:{b:0,c:0,t:0},acts:[{id:1,tx:"安排单独汇报",due:"下周",st:"pending",pr:"high"}]},
  {name:"罗宽",join:"2024.4.13",age:34,lv:"P8",exp:false,role:"骨干(课题)",topic:"AI助手课题",ns:"AI减负:0%到10%到扩展",perf:{"2023":"-","24Q1":"C","24Q2":"B","25Q1":"C","25Q2":"C","25Q3":"","25Q4":"","latest":"C"},diag:"GR准确度OK但推广未打通",rat:{b:2.5,c:0,t:0},acts:[{id:1,tx:"330冲刺GR闭环推广全RT",due:"3.30",st:"pending",pr:"urgent"},{id:2,tx:"数据底座技术架构对接",due:"3.15",st:"pending",pr:"urgent"},{id:3,tx:"PRD功能集成方案",due:"3月底",st:"pending",pr:"high"},{id:4,tx:"个人AI能力提升",due:"两周内",st:"pending",pr:"high"},{id:5,tx:"资源调配到37/77",due:"本周",st:"pending",pr:"urgent"},{id:6,tx:"630推广路线图",due:"5月底",st:"pending",pr:"medium"}]},
  {name:"易休",join:"2024.11.20",age:33,lv:"P8",exp:false,role:"骨干",topic:"逍遥座舱车型交付",ns:"",perf:{"24Q2":"C","25Q1":"C+🌟","25Q2":"C","latest":"C"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"丁磊",join:"2024.5.19",age:37,lv:"P7",exp:false,role:"骨干",topic:"H47 VCOS A级UPL",ns:"H47按期交付",perf:{"24Q1":"B","24Q2":"C","25Q1":"C","25Q2":"B","latest":"B"},diag:"A级唯一项目负责人",rat:{b:0,c:0,t:0},acts:[]},
  {name:"范云",join:"2024.04.24",age:34,lv:"P7",exp:false,role:"骨干(课题)",topic:"数据驱动产品改善",ns:"模块覆盖率:10%到95%",perf:{"2023":"B","24Q1":"A","24Q2":"B","25Q1":"C+🌟","25Q2":"C","latest":"C"},diag:"方向对但推进太慢",rat:{b:2,c:0,t:0},acts:[{id:1,tx:"定义核心指标+路线图",due:"本周",st:"pending",pr:"urgent"},{id:2,tx:"第一个模块埋点全流程",due:"3月底",st:"pending",pr:"high"},{id:3,tx:"管理例会讲数据问题",due:"3月中旬",st:"pending",pr:"high"},{id:4,tx:"5月全模块埋点治理",due:"5月底",st:"pending",pr:"medium"},{id:5,tx:"月度覆盖率报送",due:"每月底",st:"pending",pr:"medium"}]},
  {name:"张博",join:"2021.3.10",age:35,lv:"P7",exp:false,role:"成员",topic:"RT E-车控/仪表",ns:"",perf:{"2023":"B","24Q1":"C","24Q2":"C","25Q1":"B","25Q2":"C+","latest":"B"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"刘冰",join:"2024.5.27",age:31,lv:"P7",exp:false,role:"成员",topic:"H67鸿蒙UPL",ns:"H67按期SOP",perf:{"24Q1":"B","24Q2":"C","25Q1":"C","25Q2":"B","latest":"B"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"曹旭",join:"2024.11.20",age:35,lv:"P7",exp:false,role:"骨干",topic:"IPD评审+37/77项目",ns:"H77B IPD评审落地",perf:{"24Q2":"C+🌟","25Q1":"C","25Q2":"C","latest":"C"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"凡智",join:"2024.1.17",age:37,lv:"P6",exp:false,role:"成员",topic:"培训+专利+鸿蒙车型",ns:"培训率>90%+Q1 4篇专利",perf:{"24Q1":"C","24Q2":"B","25Q1":"C+","25Q2":"C","latest":"B"},diag:"承担多项OKR KR",rat:{b:0,c:0,t:0},acts:[]},
  {name:"刘嘉诚",join:"2025.3.26",age:29,lv:"P5",exp:false,role:"成员",topic:"导航+跨团队交流",ns:"满意率调研",perf:{"25Q1":"C","25Q2":"C","latest":"C"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"杨焕",join:"2022.03.02",age:30,lv:"P6",exp:false,role:"成员",topic:"岗位SOP协同",ns:"",perf:{"2023":"B","24Q1":"B","24Q2":"C","25Q1":"C","25Q2":"C+🌟","latest":"B"},diag:"",rat:{b:0,c:0,t:0},acts:[]},
  {name:"李富豪",join:"2025.8.3",age:null,lv:"P7",exp:false,role:"成员",topic:"平台化基线管理",ns:"基线方案完成",perf:{"latest":"C+🌟"},diag:"新人承担O1-KR6",rat:{b:0,c:0,t:0},acts:[]},
  {name:"周杰",join:"2025.9.1",age:null,lv:"P7",exp:false,role:"成员",topic:"RT E-生态",ns:"",perf:{"latest":"C"},diag:"新入职",rat:{b:0,c:0,t:0},acts:[]},
  {name:"张幂",join:"2025.11",age:null,lv:"P7",exp:false,role:"成员",topic:"RT E-仪表",ns:"",perf:{"latest":"C"},diag:"新入职",rat:{b:0,c:0,t:0},acts:[]},
  {name:"王夕",join:"2025.12",age:null,lv:"P7",exp:false,role:"成员",topic:"愿景文化+RTE-视觉",ns:"全员掌握愿景文化",perf:{"latest":"C"},diag:"新入职承担O3-KR6",rat:{b:0,c:0,t:0},acts:[]},
];

const OKR_INIT = {owner:"武磊之",ver:"01-22",objs:[
  {id:"O1",t:"高质量实现软件开发，软件交付计划符合率100%",w:33.3,krs:[
    {id:"O1-KR1",tx:"鸿蒙座舱100%按计划MRD与CRB",ow:["刘钊","凡智","刘冰","罗宽"],p:0,st:"on_track"},
    {id:"O1-KR2",tx:"逍遥座舱100%按计划MRD与CRB",ow:["刘启辉","丁磊","鞠华玮","柳林","范云","易休"],p:0,st:"on_track"},
    {id:"O1-KR3",tx:"发布PM岗位标准化SOP通过评审",ow:["刘钊","刘启辉","杨焕","丁磊"],p:0,st:"on_track"},
    {id:"O1-KR4",tx:"IPD全过程评审流程H77B落地",ow:["曹旭"],p:0,st:"on_track"},
    {id:"O1-KR5",tx:"项目复盘体系重复问题率<10%",ow:["鞠华玮"],p:0,st:"at_risk"},
    {id:"O1-KR6",tx:"座舱软件平台化基线管理方案",ow:["李富豪"],p:0,st:"on_track"},
  ]},
  {id:"O2",t:"全面开展体系力建设，研发效率提升10%",w:33.3,krs:[
    {id:"O2-KR1",tx:"敏捷优化方案落地看板实时状态",ow:["丁佳妮","姜智尧"],p:0,st:"on_track"},
    {id:"O2-KR2",tx:"玄武平台座舱全链路交付跑通",ow:["刘启辉"],p:0,st:"on_track"},
    {id:"O2-KR3",tx:"AI项目助手落地1个高价值场景",ow:["罗宽"],p:0,st:"at_risk"},
    {id:"O2-KR4",tx:"数据决策地图至少落地1项",ow:["范云"],p:0,st:"at_risk"},
  ]},
  {id:"O3",t:"建成行业最具战斗力的团队",w:33.3,krs:[
    {id:"O3-KR1",tx:"更新2026关键技术清单",ow:["鞠华玮"],p:0,st:"on_track"},
    {id:"O3-KR2",tx:"AI助手需求锁定+5个助手开发",ow:["杨立辉","罗宽","朱青棚"],p:0,st:"on_track"},
    {id:"O3-KR3",tx:"至少1次跨团队交流摸底满意率",ow:["刘嘉诚"],p:0,st:"on_track"},
    {id:"O3-KR4",tx:"锁定培训计划参与率>90%",ow:["凡智"],p:0,st:"on_track"},
    {id:"O3-KR5",tx:"Q1提交4篇以上专利获受理",ow:["凡智"],p:0,st:"on_track"},
    {id:"O3-KR6",tx:"愿景文化宣传全员100%掌握",ow:["王夕"],p:0,st:"on_track"},
  ]},
]};

const DEFAULT = {
  v:"2026-03-02", members:MEMBERS_INIT, okr:OKR_INIT,
  kpi:{items:[
    {d:"销量",n:"销量",w:20,tgt:"",c1:"",c2:"",cur:""},
    {d:"项目",n:"节点绿灯率",w:20,tgt:"85%",c1:"90%",c2:"95%",cur:""},
    {d:"体验",n:"逍遥NPS/满意度",w:30,tgt:"8.6/60%",c1:"8.7/62%",c2:"8.8/65%",cur:""},
    {d:"体验",n:"鸿蒙满意度",w:20,tgt:"8.0",c1:"8.3",c2:"8.5",cur:""},
    {d:"效率",n:"人力/项目",w:10,tgt:"<=18",c1:"<=17",c2:"<=16",cur:""},
  ],bonus:[{n:"国产化平台",s:10,t:"立项+原型"},{n:"AI效率提升",s:10,t:"代码+15%/缺陷-15%"}]},
  myActs:[
    {id:1,tx:"收齐4位专家履职计划",due:"本周",st:"pending",pr:"urgent"},
    {id:2,tx:"指定第三方统计重复率",due:"本周",st:"pending",pr:"urgent"},
    {id:3,tx:"确认罗宽330目标",due:"本周",st:"pending",pr:"urgent"},
    {id:4,tx:"收平台化方案+推电器",due:"3月底",st:"pending",pr:"high"},
    {id:5,tx:"范云上管理例会",due:"3月中旬",st:"pending",pr:"high"},
    {id:6,tx:"刘钊鸿蒙计划+77B",due:"3月底",st:"pending",pr:"high"},
    {id:7,tx:"柳林MTP+创收1亿",due:"3月底",st:"pending",pr:"high"},
    {id:8,tx:"王政补充汇报",due:"下周",st:"pending",pr:"high"},
    {id:9,tx:"Claude Code分享会",due:"两周内",st:"pending",pr:"high"},
    {id:10,tx:"资源重分配罗宽到37/77",due:"本周",st:"pending",pr:"urgent"},
  ],
  issues:[
    {id:1,i:"专家只汇报业务萃取培养遗漏",a:"本周收齐计划",st:"pending"},
    {id:2,i:"指标定义不清",a:"3.15前明确",st:"pending"},
    {id:3,i:"AI工具两个月零动作",a:"两周内分享会",st:"pending"},
    {id:4,i:"课题推进偏慢",a:"按月有产出",st:"pending"},
    {id:5,i:"培养记录缺失",a:"本周自查",st:"pending"},
  ],
  vision:"打造AI+项目管理团队，以标准化流程与智能化工具释放全员时间、激发创造力，达成行业最高效的高价值产品交付。",
  culture:["价值驱动","责任担当","结果导向","高效交付"],
};

const SK = "cockpit-v2";
const X = {bg:"#0a0f1a",sf:"#111827",sa:"#0d1117",bd:"#1e293b",tx:"#e2e8f0",sb:"#94a3b8",mt:"#64748b",bl:"#3b82f6",gn:"#10b981",yl:"#f59e0b",rd:"#ef4444",pk:"#f43f5e",pp:"#8b5cf6",cn:"#06b6d4"};
const PC = {"A":"#10b981","A-":"#34d399","B+":"#3b82f6","B":"#60a5fa","C+🌟":"#f97316","C+":"#f59e0b","C":"#64748b","C-":"#ef4444","-":"#334155"};
const SC = {pending:{l:"待办",c:"#64748b"},in_progress:{l:"进行中",c:"#3b82f6"},done:{l:"完成",c:"#10b981"},blocked:{l:"阻塞",c:"#ef4444"},on_track:{l:"正常",c:"#10b981"},at_risk:{l:"风险",c:"#f59e0b"},off_track:{l:"偏离",c:"#ef4444"}};
const PR = {urgent:{l:"紧急",c:"#f43f5e"},high:{l:"高",c:"#f59e0b"},medium:{l:"中",c:"#3b82f6"},low:{l:"低",c:"#64748b"}};

function Badge({t, c, bg}) {
  return (
    <span style={{display:"inline-block",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:600,color:c,background:bg||"transparent",border:bg?"none":"1px solid "+c,whiteSpace:"nowrap"}}>{t}</span>
  );
}

function ProgBar({v, c, h}) {
  const color = c || X.bl;
  const height = h || 5;
  return (
    <div style={{width:"100%",height:height,background:"#1e293b",borderRadius:height/2,overflow:"hidden"}}>
      <div style={{width:Math.min(100,v)+"%",height:"100%",background:color,borderRadius:height/2,transition:"width .4s"}} />
    </div>
  );
}

function StatCard({l, v, s, c}) {
  const color = c || X.bl;
  return (
    <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:8,padding:"12px 16px",flex:1,minWidth:110}}>
      <div style={{fontSize:9,color:X.mt,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
      <div style={{fontSize:24,fontWeight:700,color:color,fontFamily:"monospace"}}>{v}</div>
      {s && <div style={{fontSize:10,color:X.sb,marginTop:2}}>{s}</div>}
    </div>
  );
}

function SectionHead({t, i, n}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
      <span style={{fontSize:15}}>{i}</span>
      <h2 style={{fontSize:14,fontWeight:700,color:X.tx,margin:0}}>{t}</h2>
      {n !== undefined && <span style={{fontSize:9,color:X.mt,background:"#1e293b",padding:"1px 7px",borderRadius:10}}>{n}</span>}
    </div>
  );
}

function PerfBadge({v}) {
  if (!v || v === "-") {
    return <span style={{color:"#334155"}}>—</span>;
  }
  return <span style={{color:PC[v]||X.mt,fontWeight:600,fontSize:11}}>{v}</span>;
}

function Dash({d, sd}) {
  const allActs = d.members.flatMap(function(m) { return m.acts; });
  const urgents = d.myActs.filter(function(a) { return a.pr === "urgent" && a.st !== "done"; }).concat(
    d.members.flatMap(function(m) { return m.acts.filter(function(a) { return a.pr === "urgent" && a.st !== "done"; }).map(function(a) { return Object.assign({}, a, {_m: m.name}); }); })
  );
  const riskKRs = d.okr.objs.flatMap(function(o) { return o.krs.filter(function(k) { return k.st !== "on_track"; }); });
  const totalKR = d.okr.objs.reduce(function(s, o) { return s + o.krs.length; }, 0);
  const okrP = totalKR ? Math.round(d.okr.objs.reduce(function(s, o) { return s + o.krs.reduce(function(ss, k) { return ss + k.p; }, 0); }, 0) / totalKR) : 0;
  const compRate = allActs.length ? Math.round(allActs.filter(function(a) { return a.st === "done"; }).length / allActs.length * 100) : 0;

  function toggleUrg(a) {
    var nd = JSON.parse(JSON.stringify(d));
    if (a._m) {
      var m = nd.members.find(function(x) { return x.name === a._m; });
      if (m) { var act = m.acts.find(function(x) { return x.id === a.id; }); if (act) act.st = act.st === "done" ? "pending" : "done"; }
    } else {
      var act2 = nd.myActs.find(function(x) { return x.id === a.id; }); if (act2) act2.st = act2.st === "done" ? "pending" : "done";
    }
    sd(nd);
  }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <StatCard l="OKR" v={okrP + "%"} s={"3O/" + totalKR + "KR"} />
        <StatCard l="紧急" v={urgents.length} c={X.pk} s="本周" />
        <StatCard l="风险KR" v={riskKRs.length} c={X.yl} />
        <StatCard l="团队" v={d.members.length} c={X.pp} s={"专家" + d.members.filter(function(m){return m.exp}).length} />
        <StatCard l="完成率" v={compRate + "%"} c={X.gn} />
      </div>
      {urgents.length > 0 && (
        <div style={{background:"linear-gradient(135deg,#1a0a1e,#0f172a)",border:"1px solid #f43f5e33",borderRadius:9,padding:16,marginBottom:16}}>
          <SectionHead t="紧急行动" i="🔥" n={urgents.length} />
          {urgents.slice(0, 10).map(function(a, i) {
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:3,background:X.sa,borderRadius:4,border:"1px solid "+X.bd}}>
                <input type="checkbox" checked={a.st==="done"} onChange={function(){toggleUrg(a)}} style={{accentColor:X.pk}} />
                <span style={{flex:1,fontSize:11,color:X.tx}}>{a.tx}</span>
                {a._m && <Badge t={a._m} c={X.bl} />}
                <span style={{fontSize:9,color:X.mt}}>{a.due}</span>
              </div>
            );
          })}
        </div>
      )}
      {riskKRs.length > 0 && (
        <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:16}}>
          <SectionHead t="风险KR" i="⚠️" n={riskKRs.length} />
          {riskKRs.map(function(k, i) {
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:"1px solid "+X.bd}}>
                <Badge t={k.id} c={SC[k.st].c} bg={SC[k.st].c + "20"} />
                <span style={{flex:1,fontSize:11,color:X.tx}}>{k.tx}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{background:"linear-gradient(135deg,#0c1929,#0f172a)",border:"1px solid #3b82f633",borderRadius:9,padding:16}}>
        <div style={{fontSize:9,color:X.bl,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>团队愿景</div>
        <div style={{fontSize:12,color:X.tx,lineHeight:1.6,marginBottom:8}}>{d.vision}</div>
        <div style={{display:"flex",gap:5}}>{d.culture.map(function(c, i) { return <Badge key={i} t={c} c={X.bl} bg={X.bl + "20"} />; })}</div>
      </div>
    </div>
  );
}

function OKRPage({d, sd}) {
  const [exp, setExp] = useState(null);
  function upKR(oi, ki, f, v) { var nd = JSON.parse(JSON.stringify(d)); nd.okr.objs[oi].krs[ki][f] = v; sd(nd); }
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:X.mt,padding:"2px 7px",background:"#1e293b",borderRadius:3}}>张贵海(部长)</span>
        <span style={{color:X.mt}}>→</span>
        <span style={{fontSize:10,color:X.bl,padding:"2px 7px",background:X.bl+"20",borderRadius:3,fontWeight:600}}>武磊之 v{d.okr.ver}</span>
        <span style={{color:X.mt}}>→</span>
        <span style={{fontSize:10,color:X.mt,padding:"2px 7px",background:"#1e293b",borderRadius:3}}>团队成员</span>
      </div>
      {d.okr.objs.map(function(o, oi) {
        var p = o.krs.length ? Math.round(o.krs.reduce(function(s, k) { return s + k.p; }, 0) / o.krs.length) : 0;
        var isOpen = exp === oi;
        return (
          <div key={oi} style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:12}}>
            <div onClick={function() { setExp(isOpen ? null : oi); }} style={{cursor:"pointer",display:"flex",alignItems:"flex-start",gap:9}}>
              <span style={{fontSize:12,fontWeight:800,color:X.bl,background:X.bl+"20",padding:"3px 8px",borderRadius:4}}>{o.id}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:X.tx,marginBottom:5}}>{o.t}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <ProgBar v={p} /><span style={{fontSize:10,color:X.sb}}>{p}%</span><span style={{fontSize:9,color:X.mt}}>权重{o.w}%</span>
                </div>
              </div>
              <span style={{color:X.mt,fontSize:10}}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div style={{marginTop:12,borderTop:"1px solid "+X.bd,paddingTop:12}}>
                {o.krs.map(function(k, ki) {
                  return (
                    <div key={ki} style={{padding:"9px 0",borderBottom:"1px solid "+X.bd}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:5}}>
                        <span style={{fontSize:9,color:X.bl,fontFamily:"monospace"}}>{k.id}</span>
                        <span style={{flex:1,fontSize:11,color:X.tx}}>{k.tx}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:40}}>
                        <div style={{display:"flex",gap:2}}>
                          {["on_track","at_risk","off_track"].map(function(s) {
                            return <button key={s} onClick={function(){upKR(oi,ki,"st",s)}} style={{padding:"1px 5px",fontSize:8,border:"1px solid "+SC[s].c+"40",borderRadius:3,cursor:"pointer",color:k.st===s?"#fff":SC[s].c,background:k.st===s?SC[s].c+"30":"transparent"}}>{SC[s].l}</button>;
                          })}
                        </div>
                        <input type="range" min={0} max={100} step={5} value={k.p} onChange={function(e){upKR(oi,ki,"p",+e.target.value)}} style={{flex:1,accentColor:X.bl,height:3}} />
                        <span style={{fontSize:10,color:X.sb,fontFamily:"monospace",width:28,textAlign:"right"}}>{k.p}%</span>
                        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>{k.ow.map(function(name, i) { return <span key={i} style={{fontSize:8,color:X.mt,background:"#1e293b",padding:"0 4px",borderRadius:2}}>{name}</span>; })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TeamPage({d, sd}) {
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nn, setNN] = useState("");
  const [nl, setNL] = useState("P7");
  const [nt, setNT] = useState("");
  const [flt, setFlt] = useState("all");

  function addMember() {
    if (!nn.trim()) return;
    var nd = JSON.parse(JSON.stringify(d));
    nd.members.push({name:nn.trim(),join:new Date().toISOString().slice(0,10),age:null,lv:nl,exp:parseInt(nl.slice(1))>=9,role:parseInt(nl.slice(1))>=9?"专家":"成员",topic:nt||"待分配",ns:"",perf:{latest:"-"},diag:"",rat:{b:0,c:0,t:0},acts:[]});
    sd(nd); setNN(""); setNT(""); setShowAdd(false);
  }
  function removeMember(i) {
    if (!confirm("删除 " + d.members[i].name + "?")) return;
    var nd = JSON.parse(JSON.stringify(d)); nd.members.splice(i, 1); sd(nd);
    if (sel === i) setSel(null); else if (sel > i) setSel(sel - 1);
  }
  function addAction(mi) {
    var t = prompt("输入行动事项："); if (!t) return;
    var nd = JSON.parse(JSON.stringify(d));
    var mx = nd.members[mi].acts.reduce(function(m, a) { return Math.max(m, a.id); }, 0);
    nd.members[mi].acts.push({id:mx+1,tx:t,due:"待定",st:"pending",pr:"medium"}); sd(nd);
  }
  function updAct(mi, ai, f, v) { var nd = JSON.parse(JSON.stringify(d)); nd.members[mi].acts[ai][f] = v; sd(nd); }

  var filtered = d.members;
  if (flt === "expert") filtered = filtered.filter(function(m) { return m.exp; });
  else if (flt === "risk") filtered = filtered.filter(function(m) { return m.acts.some(function(a) { return a.pr === "urgent" && a.st !== "done"; }); });
  else if (flt === "new") filtered = filtered.filter(function(m) { return m.join >= "2025"; });
  var lo = {P12:0,P11:1,P10:2,P9:3,P8:4,P7:5,P6:6,P5:7};
  filtered = filtered.slice().sort(function(a, b) { return (lo[a.lv]||9) - (lo[b.lv]||9); });
  var m = (sel !== null && sel < d.members.length) ? d.members[sel] : null;

  return (
    <div style={{display:"flex",gap:12,height:"calc(100vh - 170px)",minHeight:480}}>
      <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",gap:3,marginBottom:6,flexWrap:"wrap"}}>
          {[["all","全部"],["expert","专家"],["risk","风险"],["new","新人"]].map(function(arr) {
            return <button key={arr[0]} onClick={function(){setFlt(arr[0])}} style={{fontSize:9,padding:"2px 6px",border:"1px solid "+(flt===arr[0]?X.bl:X.bd),borderRadius:3,background:flt===arr[0]?X.bl+"20":"transparent",color:flt===arr[0]?X.bl:X.mt,cursor:"pointer"}}>{arr[1]}</button>;
          })}
          <div style={{flex:1}} />
          <button onClick={function(){setShowAdd(!showAdd)}} style={{fontSize:9,padding:"2px 6px",border:"1px solid "+X.gn+"40",borderRadius:3,background:"transparent",color:X.gn,cursor:"pointer"}}>+添加</button>
        </div>
        {showAdd && (
          <div style={{padding:8,marginBottom:6,background:X.sa,borderRadius:5,border:"1px solid "+X.bd}}>
            <input value={nn} onChange={function(e){setNN(e.target.value)}} placeholder="姓名" style={{width:"100%",background:"#1e293b",border:"1px solid "+X.bd,borderRadius:3,color:X.tx,padding:"3px 6px",fontSize:11,marginBottom:3,boxSizing:"border-box"}} />
            <select value={nl} onChange={function(e){setNL(e.target.value)}} style={{width:"100%",background:"#1e293b",border:"1px solid "+X.bd,borderRadius:3,color:X.tx,padding:3,fontSize:10,marginBottom:3}}>
              {["P5","P6","P7","P8","P9","P10","P11"].map(function(l){ return <option key={l} value={l}>{l}</option>; })}
            </select>
            <input value={nt} onChange={function(e){setNT(e.target.value)}} placeholder="职责方向" style={{width:"100%",background:"#1e293b",border:"1px solid "+X.bd,borderRadius:3,color:X.tx,padding:"3px 6px",fontSize:11,marginBottom:4,boxSizing:"border-box"}} />
            <button onClick={addMember} style={{width:"100%",padding:4,background:X.gn,color:"#fff",border:"none",borderRadius:3,fontSize:10,cursor:"pointer"}}>确认</button>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto"}}>
          {filtered.map(function(mb) {
            var ri = d.members.indexOf(mb);
            var isSel = sel === ri;
            return (
              <div key={mb.name} onClick={function(){setSel(ri)}} style={{padding:"9px 12px",marginBottom:5,borderRadius:6,cursor:"pointer",background:isSel?"#1a2235":X.sf,border:"1px solid "+(isSel?X.bl:X.bd)}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600,color:X.tx}}>{mb.name}</span>
                  <div style={{display:"flex",gap:3,alignItems:"center"}}><Badge t={mb.lv} c={mb.exp?X.pp:X.mt} /><PerfBadge v={mb.perf && mb.perf.latest} /></div>
                </div>
                <div style={{fontSize:9,color:X.sb}}>{mb.topic}</div>
                {mb.acts.length > 0 && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}><ProgBar v={mb.acts.filter(function(a){return a.st==="done"}).length/mb.acts.length*100} h={3} c={X.gn} /><span style={{fontSize:8,color:X.mt}}>{mb.acts.filter(function(a){return a.st==="done"}).length}/{mb.acts.length}</span></div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {m ? (
          <div>
            <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><h3 style={{margin:0,fontSize:16,fontWeight:700,color:X.tx}}>{m.name}</h3><Badge t={m.lv} c={X.pp} bg={X.pp+"20"} /><Badge t={m.role} c={m.exp?X.bl:X.mt} /></div>
                <button onClick={function(){removeMember(sel)}} style={{fontSize:9,color:X.rd,background:"none",border:"1px solid "+X.rd+"40",borderRadius:3,padding:"2px 6px",cursor:"pointer"}}>删除</button>
              </div>
              <div style={{fontSize:11,color:X.sb,marginBottom:4}}>{m.topic}</div>
              {m.ns && <div style={{fontSize:10,color:X.bl,marginBottom:6}}>⭐ {m.ns}</div>}
              <div style={{display:"flex",gap:10,marginBottom:8}}>
                {m.join && <span style={{fontSize:10,color:X.mt}}>入职:{m.join}</span>}
                {m.age && <span style={{fontSize:10,color:X.mt}}>年龄:{m.age}</span>}
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:X.mt,marginBottom:3}}>绩效轨迹</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {Object.entries(m.perf || {}).filter(function(arr){return arr[1]}).map(function(arr) {
                    return <div key={arr[0]} style={{textAlign:"center",padding:"3px 6px",background:X.sa,borderRadius:3,minWidth:40}}><div style={{fontSize:7,color:X.mt,marginBottom:1}}>{arr[0]}</div><PerfBadge v={arr[1]} /></div>;
                  })}
                </div>
              </div>
              {m.exp && m.rat.b > 0 && (
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  {[["业务",m.rat.b],["能力建设",m.rat.c],["人才培养",m.rat.t]].map(function(arr) {
                    var v = arr[1]; var stars = "★".repeat(Math.floor(v)) + (v%1>=0.5?"☆":"") + "☆".repeat(Math.max(0,4-Math.ceil(v)));
                    return <div key={arr[0]}><div style={{fontSize:8,color:X.mt}}>{arr[0]}</div><div style={{fontSize:12,color:v>=3?X.gn:v>=2?X.yl:X.rd}}>{stars}</div></div>;
                  })}
                </div>
              )}
              {m.diag && <div style={{padding:"7px 10px",background:X.sa,borderRadius:4,fontSize:10,color:X.sb,borderLeft:"3px solid "+X.yl}}>{m.diag}</div>}
            </div>
            <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <SectionHead t="行动跟踪" i="📋" n={m.acts.length} />
                <button onClick={function(){addAction(sel)}} style={{fontSize:9,color:X.gn,background:"none",border:"1px solid "+X.gn+"40",borderRadius:3,padding:"2px 6px",cursor:"pointer"}}>+添加</button>
              </div>
              {m.acts.length === 0 && <div style={{fontSize:11,color:X.mt,textAlign:"center",padding:16}}>暂无行动</div>}
              {m.acts.map(function(a, ai) {
                return (
                  <div key={ai} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",marginBottom:3,background:X.sa,borderRadius:4,border:"1px solid "+X.bd,opacity:a.st==="done"?0.5:1}}>
                    <input type="checkbox" checked={a.st==="done"} onChange={function(){updAct(sel,ai,"st",a.st==="done"?"pending":"done")}} style={{accentColor:X.gn}} />
                    <span style={{flex:1,fontSize:11,color:X.tx,textDecoration:a.st==="done"?"line-through":"none"}}>{a.tx}</span>
                    <Badge t={PR[a.pr].l} c={PR[a.pr].c} />
                    <select value={a.st} onChange={function(e){updAct(sel,ai,"st",e.target.value)}} style={{background:X.sa,border:"1px solid "+X.bd,borderRadius:2,color:X.sb,fontSize:9,padding:"1px 3px"}}>
                      <option value="pending">待办</option><option value="in_progress">进行中</option><option value="done">完成</option><option value="blocked">阻塞</option>
                    </select>
                    <span style={{fontSize:9,color:X.mt,minWidth:44,textAlign:"right"}}>{a.due}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:X.mt,fontSize:12}}>← 选择成员查看详情</div>
        )}
      </div>
    </div>
  );
}

function RosterPage({d}) {
  var headers = ["#","姓名","入职","年龄","职级","2023","24Q1","24Q2","25Q1","25Q2","最新","方向"];
  return (
    <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,overflowX:"auto"}}>
      <SectionHead t="花名册+绩效全景" i="👥" n={d.members.length} />
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
        <thead><tr style={{borderBottom:"2px solid "+X.bd}}>{headers.map(function(h){return <th key={h} style={{padding:"5px 7px",textAlign:"left",color:X.mt,fontWeight:600,fontSize:9,whiteSpace:"nowrap"}}>{h}</th>;})}</tr></thead>
        <tbody>{d.members.map(function(m, i) {
          return (
            <tr key={i} style={{borderBottom:"1px solid "+X.bd,background:m.exp?X.pp+"08":"transparent"}}>
              <td style={{padding:6,color:X.mt}}>{i+1}</td>
              <td style={{padding:6,color:X.tx,fontWeight:600}}>{m.name}</td>
              <td style={{padding:6,color:X.mt,fontSize:9}}>{m.join}</td>
              <td style={{padding:6,color:X.mt}}>{m.age||"-"}</td>
              <td style={{padding:6}}><Badge t={m.lv} c={m.exp?X.pp:X.mt} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf["2023"]} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf["24Q1"]} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf["24Q2"]} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf["25Q1"]} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf["25Q2"]} /></td>
              <td style={{padding:6}}><PerfBadge v={m.perf.latest} /></td>
              <td style={{padding:6,color:X.sb,fontSize:9,maxWidth:160}}>{m.topic}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

function KPIPage({d, sd}) {
  function updKPI(i, v) { var nd = JSON.parse(JSON.stringify(d)); nd.kpi.items[i].cur = v; sd(nd); }
  return (
    <div>
      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:16,overflowX:"auto"}}>
        <SectionHead t="2026智能座舱KPI" i="📊" />
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr style={{borderBottom:"2px solid "+X.bd}}>
            {["维度","指标","权重","目标","挑战1","挑战2","当前"].map(function(h){return <th key={h} style={{padding:"5px 7px",textAlign:"left",color:X.mt,fontWeight:600,fontSize:9}}>{h}</th>;})}
          </tr></thead>
          <tbody>{d.kpi.items.map(function(it, i) {
            return (
              <tr key={i} style={{borderBottom:"1px solid "+X.bd}}>
                <td style={{padding:7,color:X.bl,fontWeight:600}}>{it.d}</td>
                <td style={{padding:7,color:X.tx}}>{it.n}</td>
                <td style={{padding:7,color:X.yl,fontWeight:700}}>{it.w}%</td>
                <td style={{padding:7,color:X.sb}}>{it.tgt||"-"}</td>
                <td style={{padding:7,color:X.sb}}>{it.c1||"-"}</td>
                <td style={{padding:7,color:X.sb}}>{it.c2||"-"}</td>
                <td style={{padding:7}}><input value={it.cur} onChange={function(e){updKPI(i,e.target.value)}} placeholder="填入" style={{background:X.sa,border:"1px solid "+X.bd,borderRadius:2,color:X.tx,padding:"2px 5px",fontSize:10,width:60}} /></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16}}>
        <SectionHead t="加分项" i="⭐" />
        {d.kpi.bonus.map(function(b, i) {
          return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid "+X.bd}}><Badge t={"+"+b.s+"分"} c={X.gn} bg={X.gn+"20"} /><span style={{fontWeight:600,color:X.tx,fontSize:11}}>{b.n}</span><span style={{color:X.sb,fontSize:10,flex:1}}>{b.t}</span></div>;
        })}
      </div>
    </div>
  );
}

function ActsPage({d, sd}) {
  function updMy(i, f, v) { var nd = JSON.parse(JSON.stringify(d)); nd.myActs[i][f] = v; sd(nd); }
  return (
    <div>
      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:16}}>
        <SectionHead t="我的关键行动" i="🎯" n={d.myActs.length} />
        {d.myActs.map(function(a, i) {
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",marginBottom:3,background:X.sa,borderRadius:4,border:"1px solid "+(a.pr==="urgent"?X.pk+"40":X.bd),opacity:a.st==="done"?0.5:1}}>
              <input type="checkbox" checked={a.st==="done"} onChange={function(){updMy(i,"st",a.st==="done"?"pending":"done")}} style={{accentColor:X.gn}} />
              <span style={{flex:1,fontSize:11,color:X.tx,textDecoration:a.st==="done"?"line-through":"none"}}>{a.tx}</span>
              <Badge t={PR[a.pr].l} c={PR[a.pr].c} />
              <select value={a.st} onChange={function(e){updMy(i,"st",e.target.value)}} style={{background:X.sa,border:"1px solid "+X.bd,borderRadius:2,color:X.sb,fontSize:9,padding:"1px 3px"}}>
                <option value="pending">待办</option><option value="in_progress">进行中</option><option value="done">完成</option><option value="blocked">阻塞</option>
              </select>
              <span style={{fontSize:9,color:X.mt,minWidth:44,textAlign:"right"}}>{a.due}</span>
            </div>
          );
        })}
      </div>
      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16}}>
        <SectionHead t="共性问题" i="🔍" n={d.issues.length} />
        {d.issues.map(function(is, i) {
          return (
            <div key={i} style={{padding:10,marginBottom:4,background:X.sa,borderRadius:4,border:"1px solid "+X.bd}}>
              <div style={{display:"flex",gap:7}}>
                <input type="checkbox" checked={is.st==="done"} onChange={function(){var nd=JSON.parse(JSON.stringify(d));nd.issues[i].st=is.st==="done"?"pending":"done";sd(nd);}} style={{marginTop:2,accentColor:X.gn}} />
                <div>
                  <div style={{fontSize:11,color:X.tx,fontWeight:600,marginBottom:2,textDecoration:is.st==="done"?"line-through":"none"}}>{is.i}</div>
                  <div style={{fontSize:10,color:X.bl}}>→ {is.a}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiagPage({d}) {
  var exps = d.members.filter(function(m){return m.exp && m.rat.b > 0});
  var avgB = exps.length ? exps.reduce(function(s,m){return s+m.rat.b},0)/exps.length : 0;
  var avgC = exps.length ? exps.reduce(function(s,m){return s+m.rat.c},0)/exps.length : 0;
  var avgT = exps.length ? exps.reduce(function(s,m){return s+m.rat.t},0)/exps.length : 0;
  var allActs = d.members.flatMap(function(m){return m.acts});
  var cr = allActs.length ? Math.round(allActs.filter(function(a){return a.st==="done"}).length/allActs.length*100) : 0;
  var cCnt = d.members.filter(function(m){return m.perf && (m.perf.latest==="C"||m.perf.latest==="C-")}).length;
  var riskKR = d.okr.objs.flatMap(function(o){return o.krs.filter(function(k){return k.st!=="on_track"})});

  var recs = [];
  if (avgT < 2) recs.push({lv:"urgent",tt:"专家人才培养最大短板",dt:"均分"+avgT.toFixed(1)+"/4。年底聘期有降级风险。本周发模板收齐三维度计划。"});
  if (riskKR.length >= 3) recs.push({lv:"urgent",tt:riskKR.length+"个KR风险",dt:riskKR.map(function(k){return k.id}).join("/")+". 3.15前闭环指标定义。"});
  if (cCnt > d.members.length * 0.4) recs.push({lv:"urgent",tt:"团队绩效偏低",dt:cCnt+"/"+d.members.length+"人为C级. 识别共性原因，连续C启动PIP。"});
  recs.push({lv:"high",tt:"AI工具需管理者示范",dt:"两周内亲自讲Claude Code。设每人最低使用要求。"});
  recs.push({lv:"high",tt:"罗宽330冲刺风险高",dt:"GR闭环需全RT开通，仅剩4周。数据底座未对接。"});
  recs.push({lv:"medium",tt:"平台化方案是战略价值点",dt:"刘启辉课题与张总方向一致。加速3月底方案。"});
  recs.push({lv:"medium",tt:"关注绩效分化",dt:"重点：柳林P9连续C、鞠华玮P9课题进展慢。"});
  recs.push({lv:"high",tt:"77B全年最大不确定性",dt:"华为时间未确认。刘钊本周完成影响评估。"});

  var pDist = {};
  d.members.forEach(function(m){var p = m.perf ? m.perf.latest : "-"; if (!p) p = "-"; pDist[p] = (pDist[p]||0) + 1;});
  var distOrder = ["A","A-","B+","B","B-","C+🌟","C+","C","C-","-"];
  var distEntries = Object.entries(pDist).sort(function(a,b){return distOrder.indexOf(a[0])-distOrder.indexOf(b[0])});

  var ps = {"A":5,"A-":4.5,"B+":4,"B":3.5,"B-":3,"C+🌟":2.8,"C+":2.5,"C":2,"C-":1.5,"-":0};
  var ranked = d.members.map(function(m) {
    var perfS = ps[m.perf ? m.perf.latest : "-"] || 0;
    var actR = m.acts.length ? m.acts.filter(function(a){return a.st==="done"}).length / m.acts.length * 2 : 0;
    var expS = m.exp ? (m.rat.b + m.rat.c + m.rat.t) / 3 : 0;
    return Object.assign({}, m, {score: perfS * 3 + actR + expS});
  }).sort(function(a,b){return b.score - a.score});

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[["业务(专家)",avgB],["能力建设",avgC],["人才培养",avgT]].map(function(arr) {
          var v = arr[1];
          return (
            <div key={arr[0]} style={{flex:1,minWidth:140,padding:12,background:X.sf,border:"1px solid "+X.bd,borderRadius:7}}>
              <div style={{fontSize:9,color:X.mt,marginBottom:3}}>{arr[0]}</div>
              <div style={{fontSize:20,fontWeight:700,color:v>=3?X.gn:v>=2?X.yl:X.rd,fontFamily:"monospace"}}>{v.toFixed(1)}<span style={{fontSize:10,color:X.mt}}>/4</span></div>
              <ProgBar v={v/4*100} h={3} c={v>=3?X.gn:v>=2?X.yl:X.rd} />
            </div>
          );
        })}
        <StatCard l="完成率" v={cr+"%"} c={cr>60?X.gn:X.yl} />
      </div>

      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16,marginBottom:16}}>
        <SectionHead t="绩效分布" i="📈" />
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {distEntries.map(function(arr) {
            return <div key={arr[0]} style={{textAlign:"center",padding:"6px 12px",background:X.sa,borderRadius:5,minWidth:44}}><div style={{fontSize:18,fontWeight:700,color:PC[arr[0]]||X.mt}}>{arr[1]}</div><div style={{fontSize:9,color:PC[arr[0]]||X.mt,fontWeight:600}}>{arr[0]}</div></div>;
          })}
        </div>
        <div style={{marginTop:8,fontSize:10,color:X.sb}}>团队{d.members.length}人 | 专家{d.members.filter(function(m){return m.exp}).length} | 新人(25+){d.members.filter(function(m){return m.join>="2025"}).length}</div>
      </div>

      <div style={{background:"linear-gradient(135deg,#0c1929,#111827)",border:"1px solid "+X.bl+"33",borderRadius:9,padding:16,marginBottom:16}}>
        <SectionHead t="AI诊断建议" i="🤖" n={recs.length} />
        <div style={{fontSize:9,color:X.mt,marginBottom:10}}>基于OKR/绩效/行动完成率/团队结构自动生成</div>
        {recs.map(function(r, i) {
          return (
            <div key={i} style={{padding:"10px 12px",marginBottom:6,background:X.sa,borderRadius:6,borderLeft:"3px solid "+(PR[r.lv]?PR[r.lv].c:X.bl)}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><Badge t={PR[r.lv]?PR[r.lv].l:r.lv} c={PR[r.lv]?PR[r.lv].c:X.bl} /><span style={{fontSize:12,fontWeight:600,color:X.tx}}>{r.tt}</span></div>
              <div style={{fontSize:10,color:X.sb,lineHeight:1.5}}>{r.dt}</div>
            </div>
          );
        })}
      </div>

      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16}}>
        <SectionHead t="综合排名" i="🏆" />
        {ranked.map(function(m, i) {
          var colors = [X.gn, X.bl, X.cn];
          var color = i < 3 ? colors[i] : X.mt;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:2,background:X.sa,borderRadius:4}}>
              <span style={{fontSize:13,fontWeight:800,color:color,width:22}}>#{i+1}</span>
              <span style={{fontSize:11,fontWeight:600,color:X.tx,width:46}}>{m.name}</span>
              <Badge t={m.lv} c={m.exp?X.pp:X.mt} />
              <PerfBadge v={m.perf?m.perf.latest:"-"} />
              <div style={{flex:1}}><ProgBar v={m.score/17*100} h={4} c={color} /></div>
              <span style={{fontSize:10,color:X.sb,fontFamily:"monospace"}}>{m.score.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutoPage({d}) {
  var workflows = [
    {tt:"周回顾SOP",pr:"high",tg:"每周五16:00",steps:"1.更新行动状态\n2.更新OKR进度\n3.粘贴变化到Claude\n4.获取诊断\n5.截图到周报",prompt:"请基于项目文件分析本周进展：\n[粘贴变化]\n\n输出：\n1.健康度(1-10)\n2.下周TOP3\n3.需介入风险\n4.异常预警"},
    {tt:"月度绩效预警",pr:"high",tg:"每月最后一周",steps:"1.汇总完成率\n2.识别低绩效\n3.Claude分析\n4.面谈材料",prompt:"分析成员绩效：\n成员:[名字]\n历史:[数据]\n\n输出：\n1.趋势\n2.根因\n3.改进建议\n4.管理动作"},
    {tt:"季度OKR复盘",pr:"medium",tg:"3/6/9/12月末",steps:"1.导出OKR\n2.对比KPI\n3.Claude报告",prompt:"Q[X]复盘：\nO1[%] O2[%] O3[%]\nKPI:[数据]\n\n输出：\n1.总评\n2.亮点\n3.问题\n4.下季度"},
    {tt:"专家聘期考评",pr:"medium",tg:"到期前2月",steps:"1.导出三维度\n2.汇总产出\n3.生成材料",prompt:"专家:[名字] [P级]\n业务:[X/4] 能力:[X/4] 培养:[X/4]\n\n输出：\n1.续聘/降级建议\n2.一页纸\n3.补救建议"},
  ];
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#0c1929,#111827)",border:"1px solid "+X.cn+"33",borderRadius:9,padding:16,marginBottom:16}}>
        <SectionHead t="自动化工作流" i="⚡" />
        <div style={{fontSize:11,color:X.sb,marginBottom:12}}>每个工作流含触发条件、步骤和Claude Prompt模板</div>
        {workflows.map(function(w, i) {
          return (
            <div key={i} style={{marginBottom:12,background:X.sf,border:"1px solid "+X.bd,borderRadius:8,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+X.bd}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <Badge t={PR[w.pr].l} c={PR[w.pr].c} />
                  <span style={{fontSize:13,fontWeight:600,color:X.tx}}>{w.tt}</span>
                </div>
                <div style={{fontSize:10,color:X.mt}}>触发：{w.tg}</div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <pre style={{fontSize:10,color:X.sb,whiteSpace:"pre-wrap",margin:"0 0 8px"}}>{w.steps}</pre>
                <details>
                  <summary style={{fontSize:10,color:X.bl,cursor:"pointer"}}>📋 Claude Prompt模板</summary>
                  <pre style={{background:X.sa,padding:10,borderRadius:5,fontSize:10,color:X.tx,whiteSpace:"pre-wrap",lineHeight:1.4,border:"1px solid "+X.bd,marginTop:6}}>{w.prompt}</pre>
                </details>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:X.sf,border:"1px solid "+X.bd,borderRadius:9,padding:16}}>
        <SectionHead t="数据同步方案" i="🔄" />
        <div style={{fontSize:11,color:X.sb,lineHeight:1.7}}>
          <p style={{margin:"0 0 8px"}}><strong style={{color:X.tx}}>当前(MVP)：</strong>手动更新 + 周回顾Claude分析</p>
          <p style={{margin:"0 0 8px"}}><strong style={{color:X.tx}}>可扩展：</strong></p>
          <div style={{paddingLeft:10,borderLeft:"2px solid "+X.bl+"33"}}>
            <p style={{margin:"0 0 6px"}}><strong style={{color:X.cn}}>飞书Webhook</strong> — OKR变更推送</p>
            <p style={{margin:"0 0 6px"}}><strong style={{color:X.cn}}>Claude Code定时</strong> — launchd周五生成诊断</p>
            <p style={{margin:"0 0 6px"}}><strong style={{color:X.cn}}>OpenClaw Skill</strong> — 开发团队诊断Skill</p>
            <p style={{margin:0}}><strong style={{color:X.cn}}>数据导出</strong> — persistent storage可JSON导出</p>
          </div>
        </div>
      </div>
    </div>
  );
}

var NAVS = [
  {k:"dash",l:"总览",i:"◉"},{k:"okr",l:"OKR",i:"⊞"},{k:"team",l:"团队",i:"◎"},
  {k:"roster",l:"花名册",i:"▤"},{k:"kpi",l:"KPI",i:"▥"},{k:"acts",l:"行动",i:"☰"},
  {k:"diag",l:"诊断",i:"⊕"},{k:"auto",l:"自动化",i:"⚡"},
];

export default function App() {
  const [d, setD] = useState(DEFAULT);
  const [pg, setPg] = useState("dash");
  const [rdy, setRdy] = useState(false);

  useEffect(function() {
    (async function() {
      try { var r = await window.storage.get(SK); if (r && r.value) setD(JSON.parse(r.value)); } catch(e) {}
      setRdy(true);
    })();
  }, []);

  var sd = useCallback(async function(nd) {
    nd.v = new Date().toISOString().slice(0, 10);
    setD(nd);
    try { await window.storage.set(SK, JSON.stringify(nd)); } catch(e) {}
  }, []);

  function reset() {
    if (confirm("确认重置所有数据？")) {
      setD(DEFAULT);
      (async function() { try { await window.storage.set(SK, JSON.stringify(DEFAULT)); } catch(e) {} })();
    }
  }

  if (!rdy) {
    return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:X.bg,color:X.tx}}>加载中...</div>;
  }

  var nav = NAVS.find(function(n){return n.k === pg});
  return (
    <div style={{display:"flex",height:"100vh",background:X.bg,color:X.tx,fontFamily:"'Noto Sans SC',-apple-system,sans-serif"}}>
      <nav style={{width:160,flexShrink:0,background:X.sf,borderRight:"1px solid "+X.bd,display:"flex",flexDirection:"column",padding:"12px 0"}}>
        <div style={{padding:"5px 14px 16px",borderBottom:"1px solid "+X.bd,marginBottom:4}}>
          <div style={{fontSize:12,fontWeight:800,color:X.bl,letterSpacing:1}}>COCKPIT</div>
          <div style={{fontSize:8,color:X.mt}}>团队管理 v2.0</div>
        </div>
        {NAVS.map(function(n) {
          return (
            <button key={n.k} onClick={function(){setPg(n.k)}} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",margin:"1px 5px",background:pg===n.k?X.bl+"15":"transparent",border:"none",borderRadius:4,cursor:"pointer",color:pg===n.k?X.bl:X.sb,fontSize:11,fontWeight:pg===n.k?600:400,textAlign:"left"}}>
              <span style={{fontSize:12,width:16,textAlign:"center"}}>{n.i}</span>{n.l}
            </button>
          );
        })}
        <div style={{flex:1}} />
        <div style={{padding:"8px 14px",borderTop:"1px solid "+X.bd}}>
          <div style={{fontSize:8,color:X.mt}}>更新:{d.v} | {d.members.length}人</div>
          <button onClick={reset} style={{fontSize:8,color:X.mt,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:2,textDecoration:"underline"}}>重置数据</button>
        </div>
      </nav>
      <main style={{flex:1,overflowY:"auto",padding:"18px 24px"}}>
        <div style={{maxWidth:1050,margin:"0 auto"}}>
          <h1 style={{fontSize:16,fontWeight:700,color:X.tx,margin:"0 0 14px"}}>{nav && nav.i} {nav && nav.l}</h1>
          {pg === "dash" && <Dash d={d} sd={sd} />}
          {pg === "okr" && <OKRPage d={d} sd={sd} />}
          {pg === "team" && <TeamPage d={d} sd={sd} />}
          {pg === "roster" && <RosterPage d={d} />}
          {pg === "kpi" && <KPIPage d={d} sd={sd} />}
          {pg === "acts" && <ActsPage d={d} sd={sd} />}
          {pg === "diag" && <DiagPage d={d} />}
          {pg === "auto" && <AutoPage d={d} />}
        </div>
      </main>
    </div>
  );
}
