export type Role = "secretary" | "doctor-on-duty" | "surgical-team" | "therapist";

export type Department = "inpatient" | "outpatient";

export type PatientStatus =
  | "outpatient-pending" // 门诊待入院
  | "admitted" // 已入院
  | "pre-op-checked" // 术前检查完成
  | "in-surgery" // 今日手术
  | "post-op" // 术后观察
  | "rehab" // 康复中
  | "discharged" // 已出院
  | "follow-up"; // 随访中

export interface Patient {
  id: string;
  outpatientId: string;
  name: string;
  age: number;
  gender: "男" | "女";
  phone: string;
  diagnosis: string;
  surgeryName?: string;
  side?: "左" | "右" | "双";
  director: string; // 主任
  responsibleDoctor?: string;
  responsibleTherapist?: string;
  bedNo?: string;
  scheduledAdmission?: string; // 拟入院日期
  admissionDate?: string;
  surgeryDate?: string;
  dischargeDate?: string;
  status: PatientStatus;
  department: Department;
  urgent?: boolean;
  infectious?: boolean;
  communicationDifficult?: boolean;
  isNew?: boolean;
  preOpAbnormal?: boolean;
  preOpFindings?: { label: string; value: string; abnormal: boolean }[];
  notes?: string;
  followUpStatus?: "pending" | "done" | "needs-second";
  followUpResult?: string;
  /** 门诊就诊类型：首诊 / 复诊 */
  visitType?: "first" | "revisit";
  /** 术前症状指标（疼痛 / 肿胀 / ROM 等，用于明日手术 AI 术前评估） */
  preOpSymptoms?: {
    painVAS?: number; // 0-10
    swelling?: "无" | "轻" | "中" | "重";
    rom?: string; // 例如 "0-95°"
    strength?: string;
    dailyFunction?: string;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  patientName?: string;
  bedNo?: string;
  priority: "high" | "medium" | "low";
  type: string;
  due?: string;
  done?: boolean;
}
