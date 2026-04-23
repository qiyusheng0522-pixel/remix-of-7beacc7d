// 患者历史档案（护理 / 用药 / 就诊 / 评估）模拟数据
export interface NursingRecord {
  date: string;
  shift: "白班" | "夜班";
  vitals: string;
  note: string;
}
export interface MedicationRecord {
  date: string;
  drug: string;
  dose: string;
  route: string;
}
export interface VisitRecord {
  date: string;
  type: "门诊" | "住院" | "随访";
  diagnosis: string;
  doctor: string;
}
export interface PreRehabAssessment {
  date: string;
  rom: string; // 关节活动度
  strength: string; // 肌力
  pain: string; // 疼痛 VAS
  function: string; // 功能评分
  note: string;
}
export interface SurgeryAssessment {
  date: string;
  anesthesia: string;
  bleeding: string;
  duration: string;
  complications: string;
  doctorAdvice: string; // 医生建议（推送给治疗师）
}
export interface PatientArchive {
  nursing: NursingRecord[];
  medication: MedicationRecord[];
  visits: VisitRecord[];
  allergies: string[];
  history: string[];
  preRehab: PreRehabAssessment;
  precautions: string[];
  surgery?: SurgeryAssessment;
}

const defaultArchive: PatientArchive = {
  allergies: ["青霉素 (皮试阳性)"],
  history: ["既往运动损伤史 2 次（同侧膝扭伤）", "无慢性病，无手术史"],
  nursing: [
    { date: "04-22 06:00", shift: "夜班", vitals: "T 36.7 / P 78 / BP 122/76", note: "夜间睡眠可，患肢冰敷" },
    { date: "04-21 20:00", shift: "白班", vitals: "T 36.5 / P 82 / BP 118/72", note: "晚间疼痛 VAS 3，可耐受" },
    { date: "04-21 08:00", shift: "白班", vitals: "T 36.6 / P 76 / BP 120/74", note: "完成术前康复宣教，皮试阴性" },
  ],
  medication: [
    { date: "04-22", drug: "塞来昔布", dose: "200mg", route: "口服 bid" },
    { date: "04-21", drug: "头孢呋辛", dose: "1.5g", route: "静滴 q12h" },
    { date: "04-21", drug: "依诺肝素", dose: "4000IU", route: "皮下 qd" },
  ],
  visits: [
    { date: "2024-04-12", type: "门诊", diagnosis: "运动损伤评估 · ACL 重建术前", doctor: "王主任" },
    { date: "2024-04-19", type: "住院", diagnosis: "拟行 ACL 重建术", doctor: "朱医生" },
    { date: "2023-09-08", type: "门诊", diagnosis: "膝扭伤复诊", doctor: "王主任" },
  ],
  preRehab: {
    date: "2024-04-21",
    rom: "屈膝 0-95° / 伸膝 0°",
    strength: "股四头肌 4/5 · 腘绳肌 4/5",
    pain: "VAS 4/10（活动时）",
    function: "IKDC 58 / Lysholm 62",
    note: "建议术前继续 SLR 训练，加强股四头肌力量；术前禁止剧烈跳跃运动。",
  },
  precautions: [
    "术后 2 周内患肢严格不负重，使用支具固定于伸直位",
    "冰敷每次 20 分钟，每日 4-6 次，持续 3 天",
    "术后 24 小时开始踝泵 + 股四头肌等长收缩",
    "禁止主动屈膝训练（需治疗师指导下被动屈膝）",
    "如出现 38℃ 以上发热、伤口渗液立即就诊",
  ],
  surgery: {
    date: "2024-04-23",
    anesthesia: "全麻 + 股神经阻滞",
    bleeding: "约 50 ml",
    duration: "78 min",
    complications: "无",
    doctorAdvice:
      "术中重建张力良好，建议术后第 1 日开始 CPM 0-30°，每周递增 15°；术后 2 周内严格佩戴支具；4 周后开始部分负重；6 周内禁止旋转扭转动作。",
  },
};

export function getArchive(_id: string): PatientArchive {
  return defaultArchive;
}

// AI 自动回复词典
export const aiReplyTemplates: { match: RegExp; reply: string }[] = [
  { match: /疼|痛|vas/i, reply: "您好，请描述疼痛位置和程度（0-10 分）。如疼痛 ≥6 分，建议立刻按铃通知护士站，我们会安排医生评估止痛方案。" },
  { match: /发烧|发热|体温/i, reply: "请测量当前体温并告知。术后 38℃ 以内常见，>38.5℃ 需立即上报。建议多饮水，物理降温。" },
  { match: /出血|渗血|引流/i, reply: "请观察敷料及引流量。如 1 小时内引流 >100ml 或敷料明显浸湿，请立即按铃，护士会到床旁评估。" },
  { match: /何时|什么时候|多久/i, reply: "根据康复计划：术后第 1 日开始 SLR 训练，第 3 日尝试床旁站立，第 5-7 日扶助行器行走。具体以治疗师评估为准。" },
  { match: /饮食|吃|喝/i, reply: "术后 6 小时可进流食，无恶心呕吐后逐步过渡至半流食、普食。建议高蛋白、富含维生素 C，避免辛辣。" },
  { match: /出院/i, reply: "出院需满足：体温正常 3 天、伤口愈合良好、可独立完成基本康复动作。预计您术后第 5-7 日出院，治疗师会进行康复出院评估。" },
];

export function aiAutoReply(text: string): string {
  for (const t of aiReplyTemplates) {
    if (t.match.test(text)) return t.reply;
  }
  return "已收到您的消息，护士会在 5 分钟内回复。如紧急请按床旁呼叫铃。";
}
