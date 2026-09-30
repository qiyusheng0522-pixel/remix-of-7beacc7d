import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============= 关节类型 =============
export type JointType = "knee" | "shoulder" | "hip" | "elbow";

export const jointLabels: Record<JointType, string> = {
  knee: "膝关节",
  shoulder: "肩关节",
  hip: "髋关节",
  elbow: "肘关节",
};

export function detectJoint(patient: Patient): JointType {
  const text = `${patient.diagnosis}${patient.surgeryName ?? ""}`;
  if (text.includes("肩")) return "shoulder";
  if (text.includes("髋")) return "hip";
  if (text.includes("肘")) return "elbow";
  return "knee"; // 膝 / 踝等下肢默认走膝关节表
}

// 表单为扁平的 key -> 文本值 结构
export type PreOpRehabAssessment = Record<string, string>;

// ============= 字段配置 =============
type Field =
  | { kind: "painScores"; key: string; label: string; items: string[] } // 勾选 + 每项 /10
  | { kind: "painLevel"; key: string; label: string; items: string[]; extra?: string } // 勾选 + 轻/中/重
  | { kind: "checks"; key: string; label: string; options: string[] } // 纯多选
  | { kind: "choice"; key: string; label: string; options: string[]; note?: string }
  | { kind: "lr"; key: string; label: string; options: string[]; note?: string } // 左右各选
  | { kind: "lrText"; key: string; label: string; note?: string; unit?: string } // 左右各填
  | { kind: "text"; key: string; label: string; placeholder?: string };

interface SectionDef {
  title: string;
  note?: string;
  fields: Field[];
}

const LEVELS = ["轻", "中", "重", "其他"];
const FREQ = ["不", "偶尔", "有时", "经常"];
const GRADE4 = ["0-无", "1-轻", "2-中", "3-重", "其他"];
const NORMAL_LIMITED = ["正常", "受限"];
const SLR_OPTS = ["1-独立完成", "2-少许辅助", "3-更多辅助", "4-无法完成"];
const MMT = ["0", "1", "2-", "2", "2+", "3-", "3", "3+", "4-", "4", "4+", "5-", "5"];

// ---- 膝关节 ----
const kneeSections: SectionDef[] = [
  {
    title: "疼痛",
    fields: [
      { kind: "painScores", key: "pain", label: "疼痛诱因与程度", items: ["下地步行", "NWB 活动", "持续", "夜间", "其他"] },
    ],
  },
  {
    title: "肿胀",
    fields: [
      { kind: "text", key: "swellingSite", label: "部位", placeholder: "如：髌上囊" },
      { kind: "choice", key: "swellingGrade", label: "分级", options: GRADE4 },
    ],
  },
  { title: "伸（左右都要填）", fields: [{ kind: "lrText", key: "extension", label: "伸膝角度", unit: "°" }] },
  { title: "屈（左右都要填）", fields: [{ kind: "lrText", key: "flexion", label: "屈膝角度", unit: "°" }] },
  {
    title: "踝关节 DF（默认正常）",
    fields: [{ kind: "choice", key: "dorsiflexion", label: "踝关节背伸", options: ["正常", "轻微受限", "明显受限"] }],
  },
  {
    title: "AMI（左右都要填，默认无）",
    fields: [
      { kind: "lr", key: "ami", label: "关节源性肌肉抑制", options: ["无", "1a 级", "1b 级", "2a 级", "2b 级", "3 级"] },
      { kind: "text", key: "amiNote", label: "备注（如处理后结果）" },
    ],
  },
  {
    title: "SLR（左右都要填，默认独立完成）",
    fields: [
      { kind: "lr", key: "slr", label: "直腿抬高", options: SLR_OPTS },
      { kind: "text", key: "extensionLag", label: "伸膝迟滞角度（°）" },
    ],
  },
  {
    title: "肌肉萎缩（左右都要填，默认无）",
    fields: [
      { kind: "lr", key: "atrophy", label: "肌肉萎缩", options: ["无", "轻", "中", "重", "其他"] },
      { kind: "text", key: "atrophyOther", label: "其他情况" },
    ],
  },
  {
    title: "其他",
    fields: [
      { kind: "lr", key: "deformity", label: "（1）畸形（左右都要填，默认正常）", options: ["正常", "膝内翻", "膝外翻"] },
      { kind: "choice", key: "laxity", label: "（2）多关节囊松弛（默认无）", options: ["无", "有"] },
      { kind: "text", key: "laxitySite", label: "松弛具体分值" },
      { kind: "text", key: "patellaMobility", label: "（3）髌骨活动水平" },
      { kind: "text", key: "other", label: "（4）其他" },
    ],
  },
];

// ---- 肩关节 ----
const shoulderSections: SectionDef[] = [
  {
    title: "疼痛",
    fields: [
      { kind: "painLevel", key: "pain", label: "疼痛情况", items: ["白天不动肩关节", "日常生活", "夜间"], extra: "夜间是否影响睡眠" },
    ],
  },
  {
    title: "功能",
    fields: [
      { kind: "choice", key: "funcLife", label: "是否影响生活", options: FREQ },
      { kind: "choice", key: "funcWork", label: "是否影响工作", options: FREQ },
      { kind: "choice", key: "funcMood", label: "是否影响心情", options: FREQ },
    ],
  },
  {
    title: "ROM（空格里都填度数，被动填 全肩/盂肱关节）",
    fields: [
      { kind: "lrText", key: "romFlexA", label: "前屈 · 主动", unit: "°" },
      { kind: "lrText", key: "romFlexP", label: "前屈 · 被动（全肩/盂肱）", unit: "°" },
      { kind: "lrText", key: "romExtA", label: "后伸 · 主动", unit: "°" },
      { kind: "lrText", key: "romAbdA", label: "外展 · 主动", unit: "°" },
      { kind: "lrText", key: "romAbdP", label: "外展 · 被动（全肩/盂肱）", unit: "°" },
      { kind: "lrText", key: "romErSide", label: "体侧外旋", unit: "°" },
      { kind: "lr", key: "romErRaise", label: "抬臂外旋", options: ["后脑勺，肘关节向前", "后脑勺，肘关节向后", "头顶，肘关节向前", "头顶，肘关节向后"] },
      { kind: "lr", key: "romIr", label: "内旋（背手位置）", options: ["髋侧", "臀部", "腰骶处", "腰部", "胸腰结合段", "胸段", "对侧肩胛内下角", "对侧肩胛骨"] },
      { kind: "choice", key: "endFeel", label: "终末端感受", options: ["轻松", "弹性", "紧", "僵", "硬"] },
      { kind: "choice", key: "endPain", label: "终末端疼痛", options: ["无", "轻", "中", "重", "其他"] },
    ],
  },
  {
    title: "肌力",
    fields: [
      { kind: "choice", key: "mmtAbd", label: "外展肌力", options: MMT },
      { kind: "text", key: "mmtOtherName", label: "其他肌肉（可增加肌群名称）", placeholder: "如：三角肌前束" },
      { kind: "choice", key: "mmtOther", label: "其他肌肉肌力分级", options: MMT },
    ],
  },
  { title: "其他", fields: [{ kind: "text", key: "other", label: "其他" }] },
];

// ---- 髋关节 ----
const hipSections: SectionDef[] = [
  {
    title: "疼痛",
    fields: [{ kind: "checks", key: "pain", label: "疼痛诱因", options: ["下地步行", "NWB 活动", "持续", "夜间", "其他"] }],
  },
  { title: "疼痛程度", fields: [{ kind: "text", key: "vas", label: "VAS（/10）", placeholder: "0–10" }] },
  { title: "屈（左右都要填）", fields: [{ kind: "lr", key: "flexion", label: "屈髋", options: NORMAL_LIMITED }, { kind: "lrText", key: "flexionAngle", label: "受限角度", unit: "°" }] },
  { title: "伸（左右都要填）", fields: [{ kind: "lr", key: "extension", label: "伸髋", options: NORMAL_LIMITED }, { kind: "lrText", key: "extensionAngle", label: "受限角度", unit: "°" }] },
  { title: "外展（左右都要填）", fields: [{ kind: "lr", key: "abduction", label: "外展", options: NORMAL_LIMITED }, { kind: "lrText", key: "abductionAngle", label: "受限角度", unit: "°" }] },
  { title: "内收（左右都要填）", fields: [{ kind: "lr", key: "adduction", label: "内收", options: NORMAL_LIMITED }, { kind: "lrText", key: "adductionAngle", label: "受限角度", unit: "°" }] },
  { title: "伸直外旋（左右都要填）", fields: [{ kind: "lr", key: "er", label: "伸直外旋", options: NORMAL_LIMITED }, { kind: "lrText", key: "erAngle", label: "受限角度", unit: "°" }] },
  { title: "伸直内旋（左右都要填）", fields: [{ kind: "lr", key: "ir", label: "伸直内旋", options: NORMAL_LIMITED }, { kind: "lrText", key: "irAngle", label: "受限角度", unit: "°" }] },
  {
    title: "SLR（左右都要填，默认独立完成）",
    note: "如果不能独立完成，要检查股四头肌的力量",
    fields: [{ kind: "lr", key: "slr", label: "直腿抬高", options: SLR_OPTS }],
  },
  {
    title: "踝 DF（左右都要填，默认正常）",
    fields: [{ kind: "lr", key: "dorsiflexion", label: "踝关节背伸", options: ["正常", "轻微受限", "明显受限"] }],
  },
  {
    title: "肌肉萎缩（左右都要填，默认正常）",
    fields: [{ kind: "lr", key: "atrophy", label: "肌肉萎缩", options: ["无", "轻", "中", "重", "其他"] }],
  },
  {
    title: "其他",
    fields: [
      { kind: "text", key: "deformity", label: "（1）畸形（含下肢不等长）" },
      { kind: "choice", key: "laxity", label: "（2）多关节囊松弛（默认无）", options: ["无", "有"] },
      { kind: "text", key: "laxitySite", label: "松弛具体分值" },
      { kind: "text", key: "activityLevel", label: "（3）此前身体活动水平" },
      { kind: "text", key: "other", label: "（4）其他" },
    ],
  },
];

// ---- 肘关节 ----
const elbowSections: SectionDef[] = [
  {
    title: "疼痛",
    fields: [{ kind: "checks", key: "pain", label: "疼痛诱因", options: ["活动", "持续", "夜间", "其他"] }],
  },
  { title: "疼痛程度", fields: [{ kind: "choice", key: "painGrade", label: "疼痛程度", options: GRADE4 }] },
  { title: "肿胀", fields: [{ kind: "choice", key: "swellingGrade", label: "肿胀", options: GRADE4 }] },
  {
    title: "ROM",
    fields: [
      { kind: "choice", key: "romFlex", label: "屈肘", options: NORMAL_LIMITED },
      { kind: "text", key: "romFlexAngle", label: "屈肘受限具体角度（°）" },
      { kind: "choice", key: "romExt", label: "伸肘", options: NORMAL_LIMITED },
      { kind: "text", key: "romExtAngle", label: "伸肘受限具体角度（°）" },
    ],
  },
  {
    title: "相邻关节",
    fields: [
      { kind: "choice", key: "adjShoulder", label: "肩关节", options: NORMAL_LIMITED },
      { kind: "text", key: "adjShoulderAngle", label: "肩关节受限具体角度（°）" },
      { kind: "choice", key: "adjWrist", label: "腕关节", options: NORMAL_LIMITED },
      { kind: "text", key: "adjWristAngle", label: "腕关节受限具体角度（°）" },
    ],
  },
  { title: "其他", fields: [{ kind: "text", key: "other", label: "其他" }] },
];

export const jointSections: Record<JointType, SectionDef[]> = {
  knee: kneeSections,
  shoulder: shoulderSections,
  hip: hipSections,
  elbow: elbowSections,
};

// ============= 每类关节一条示例数据 =============
export const jointDemoAssessments: Record<JointType, PreOpRehabAssessment> = {
  knee: {
    "pain:下地步行": "1", "painScore:下地步行": "6",
    "pain:夜间": "1", "painScore:夜间": "3",
    swellingSite: "髌上囊", swellingGrade: "2-中",
    "extension:L": "-5", "extension:R": "0",
    "flexion:L": "95", "flexion:R": "135",
    dorsiflexion: "正常",
    "ami:L": "1a 级", "ami:R": "无", amiNote: "电刺激后股四头肌收缩改善",
    "slr:L": "2-少许辅助", "slr:R": "1-独立完成", extensionLag: "5",
    "atrophy:L": "轻", "atrophy:R": "无",
    "deformity:L": "正常", "deformity:R": "正常",
    laxity: "无", patellaMobility: "正常", other: "",
  },
  shoulder: {
    "pain:白天不动肩关节": "1", "painLevel:白天不动肩关节": "中",
    "pain:日常生活": "1", "painLevel:日常生活": "重",
    "pain:夜间": "1", "painLevel:夜间": "中", painSleep: "有时",
    funcLife: "有时", funcWork: "经常", funcMood: "偶尔",
    "romFlexA:L": "170", "romFlexA:R": "120",
    "romFlexP:L": "175/170", "romFlexP:R": "130/125",
    "romExtA:L": "50", "romExtA:R": "35",
    "romAbdA:L": "170", "romAbdA:R": "100",
    "romAbdP:L": "175/170", "romAbdP:R": "115/105",
    "romErSide:L": "60", "romErSide:R": "40",
    "romErRaise:L": "头顶，肘关节向后", "romErRaise:R": "后脑勺，肘关节向后",
    "romIr:L": "胸段", "romIr:R": "腰骶处",
    endFeel: "紧", endPain: "中",
    mmtAbd: "4-", mmtOtherName: "三角肌前束", mmtOther: "4",
    other: "羽毛球扣杀诱发，夜间痛明显",
  },
  hip: {
    "pain:下地步行": "1", "pain:持续": "1",
    vas: "5",
    "flexion:L": "正常", "flexion:R": "受限", "flexionAngle:R": "90",
    "extension:L": "正常", "extension:R": "受限", "extensionAngle:R": "-10",
    "abduction:L": "正常", "abduction:R": "受限", "abductionAngle:R": "30",
    "adduction:L": "正常", "adduction:R": "正常",
    "er:L": "正常", "er:R": "受限", "erAngle:R": "15",
    "ir:L": "正常", "ir:R": "受限", "irAngle:R": "5",
    "slr:L": "1-独立完成", "slr:R": "1-独立完成",
    "dorsiflexion:L": "正常", "dorsiflexion:R": "正常",
    "atrophy:L": "无", "atrophy:R": "轻",
    deformity: "右下肢短缩约 1.5cm",
    laxity: "无",
    activityLevel: "发病前每周快走 3 次",
    other: "",
  },
  elbow: {
    "pain:活动": "1",
    painGrade: "2-中",
    swellingGrade: "1-轻",
    romFlex: "受限", romFlexAngle: "110",
    romExt: "正常",
    adjShoulder: "正常",
    adjWrist: "正常",
    other: "跌倒撑地致伤，旋前旋后基本正常",
  },
};

// ============= 基础控件 =============
function Section({ number, title, note, children }: { number: number; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border bg-card px-3 py-3 last:border-b-0">
      <h3 className="mb-2 text-xs font-semibold text-foreground">
        {number}. {title}
        {note && <span className="ml-1 font-normal text-info">（{note}）</span>}
      </h3>
      {children}
    </section>
  );
}

function Choices({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "flex min-h-9 items-center gap-2 rounded border px-2 py-1.5 text-[11px]",
            value === option ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground",
          )}
        >
          <input type="radio" checked={value === option} onChange={() => onChange(option)} className="accent-primary" />
          {option}
        </label>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block min-w-0 text-[11px] text-muted-foreground">
      <span className="mb-1 block">{label}</span>
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "填写"}
        className="h-9 w-full min-w-0 rounded border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

// ============= 主组件 =============
export function PreOpRehabAssessmentSheet({
  patient,
  initial,
  onClose,
  onSave,
}: {
  patient: Patient;
  initial?: PreOpRehabAssessment;
  onClose: () => void;
  onSave: (assessment: PreOpRehabAssessment) => void;
}) {
  const joint = detectJoint(patient);
  const sections = jointSections[joint];
  const [form, setForm] = useState<PreOpRehabAssessment>(() => ({ ...(initial ?? {}) }));
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const renderField = (field: Field) => {
    switch (field.kind) {
      case "painScores":
        return (
          <div key={field.key} className="space-y-2">
            <div className="text-[11px] text-muted-foreground">{field.label}（勾选后填写每项 0–10 分）</div>
            <div className="grid grid-cols-2 gap-1.5">
              {field.items.map((item) => (
                <div key={item} className="rounded border border-border px-2 py-1.5">
                  <label className="flex items-center gap-2 text-[11px]">
                    <input
                      type="checkbox"
                      checked={form[`${field.key}:${item}`] === "1"}
                      onChange={(e) => update(`${field.key}:${item}`, e.target.checked ? "1" : "")}
                      className="accent-primary"
                    />
                    {item}
                  </label>
                  {form[`${field.key}:${item}`] === "1" && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <input
                        aria-label={`${item}疼痛程度`}
                        type="number"
                        min="0"
                        max="10"
                        inputMode="numeric"
                        value={form[`${field.key}Score:${item}`] ?? ""}
                        onChange={(e) => update(`${field.key}Score:${item}`, e.target.value)}
                        placeholder="0–10"
                        className="h-8 w-full min-w-0 rounded border border-input bg-background px-2 text-xs outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">/10</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "painLevel":
        return (
          <div key={field.key} className="space-y-2">
            <div className="text-[11px] text-muted-foreground">{field.label}（勾选后选择 轻/中/重）</div>
            {field.items.map((item) => (
              <div key={item} className="rounded border border-border px-2 py-1.5">
                <label className="flex items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={form[`${field.key}:${item}`] === "1"}
                    onChange={(e) => update(`${field.key}:${item}`, e.target.checked ? "1" : "")}
                    className="accent-primary"
                  />
                  {item}
                </label>
                {form[`${field.key}:${item}`] === "1" && (
                  <div className="mt-1.5">
                    <Choices options={LEVELS} value={form[`${field.key}Level:${item}`] ?? ""} onChange={(v) => update(`${field.key}Level:${item}`, v)} />
                  </div>
                )}
              </div>
            ))}
            {field.extra && (
              <div className="pt-1">
                <div className="mb-1 text-[11px] text-muted-foreground">{field.extra}</div>
                <Choices options={FREQ} value={form[`${field.key}Sleep`] ?? ""} onChange={(v) => update(`${field.key}Sleep`, v)} />
              </div>
            )}
          </div>
        );
      case "checks":
        return (
          <div key={field.key}>
            <div className="mb-1 text-[11px] text-muted-foreground">{field.label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {field.options.map((option) => (
                <label key={option} className="flex min-h-9 items-center gap-2 rounded border border-border px-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={form[`${field.key}:${option}`] === "1"}
                    onChange={(e) => update(`${field.key}:${option}`, e.target.checked ? "1" : "")}
                    className="accent-primary"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      case "choice":
        return (
          <div key={field.key}>
            <div className="mb-1 text-[11px] text-muted-foreground">
              {field.label}
              {field.note && <span className="ml-1 text-info">（{field.note}）</span>}
            </div>
            <Choices options={field.options} value={form[field.key] ?? ""} onChange={(v) => update(field.key, v)} />
          </div>
        );
      case "lr":
        return (
          <div key={field.key} className="space-y-2">
            <div className="text-[11px] text-muted-foreground">
              {field.label}
              {field.note && <span className="ml-1 text-info">（{field.note}）</span>}
            </div>
            {(["L", "R"] as const).map((side) => (
              <div key={side}>
                <div className="mb-1 text-[11px] font-medium text-foreground">{side === "L" ? "L 侧（左）" : "R 侧（右）"}</div>
                <Choices options={field.options} value={form[`${field.key}:${side}`] ?? ""} onChange={(v) => update(`${field.key}:${side}`, v)} />
              </div>
            ))}
          </div>
        );
      case "lrText":
        return (
          <div key={field.key}>
            <div className="mb-1 text-[11px] text-muted-foreground">
              {field.label}
              {field.note && <span className="ml-1 text-info">（{field.note}）</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextField label={`L 侧（左）${field.unit ?? ""}`} value={form[`${field.key}:L`] ?? ""} onChange={(v) => update(`${field.key}:L`, v)} />
              <TextField label={`R 侧（右）${field.unit ?? ""}`} value={form[`${field.key}:R`] ?? ""} onChange={(v) => update(`${field.key}:R`, v)} />
            </div>
          </div>
        );
      case "text":
        return <TextField key={field.key} label={field.label} value={form[field.key] ?? ""} onChange={(v) => update(field.key, v)} placeholder={field.placeholder} />;
    }
  };

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-card px-3 py-2.5">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="返回">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 text-center text-[13px] font-semibold">术前康复评估 · {patient.name}</div>
        <Button size="sm" onClick={() => onSave(form)}>
          <Save />
          保存
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto bg-muted/30 pb-4">
        <div className="px-3 py-2 text-[11px] text-muted-foreground">
          {patient.bedNo}床 · {patient.surgeryName} · 患侧 {patient.side ?? "未标注"} ·{" "}
          <span className="font-medium text-primary">{jointLabels[joint]}评估表</span>
        </div>
        <div className="mx-3 overflow-hidden rounded-md border border-border">
          <div className="bg-muted px-3 py-2 text-xs font-bold text-foreground">术前康复评估（{jointLabels[joint]}）</div>
          {sections.map((section, index) => (
            <Section key={section.title} number={index + 1} title={section.title} note={section.note}>
              <div className="space-y-3">{section.fields.map(renderField)}</div>
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}
