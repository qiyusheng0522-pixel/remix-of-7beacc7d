import { useState } from "react";
import { ArrowLeft, Mic, Save, Sparkles } from "lucide-react";
import type { Patient } from "@/lib/types";

interface RehabRecord {
  date: string;
  painDesc: string;
  painLevel: number;
  bleeding: string;
  swelling: string;
  extension: string; // 伸
  flexion: string; // 屈
  bedSitExtend: string; // 床边坐-伸膝
  standing: string; // 站
  walking: string; // 走
  other: string;
}

const todayStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function RehabRecordSheet({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (r: RehabRecord) => void;
}) {
  const [rec, setRec] = useState<RehabRecord>({
    date: todayStr(),
    painDesc: "",
    painLevel: 3,
    bleeding: "无",
    swelling: "轻度",
    extension: "0°",
    flexion: "60°",
    bedSitExtend: "可独立",
    standing: "5 分钟扶助行器",
    walking: "10 米扶助行器",
    other: "",
  });
  const [voiceField, setVoiceField] = useState<string | null>(null);

  const update = (k: keyof RehabRecord, v: string | number) => setRec((r) => ({ ...r, [k]: v }));

  const triggerVoice = (field: string, sample: string) => {
    setVoiceField(field);
    setTimeout(() => {
      update(field as keyof RehabRecord, sample);
      setVoiceField(null);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">院内康复记录 · {patient.name}</div>
        <button
          onClick={() => onSave(rec)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground active:opacity-90"
        >
          <Save className="h-3 w-3" />保存
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* 患者条 */}
        <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
          <div className="flex items-center gap-2">
            {patient.bedNo && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                {patient.bedNo}床
              </span>
            )}
            <span className="font-bold text-foreground">{patient.name}</span>
            <span className="text-muted-foreground">{patient.surgeryName ?? patient.diagnosis}</span>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            <Sparkles className="mr-0.5 inline h-3 w-3" />支持语音/文本输入，按住"麦克风"图标说话
          </div>
        </div>

        {/* 日期 自动生成 */}
        <Section title="记录日期">
          <div className="rounded-xl border bg-muted/30 px-3 py-2 text-[12px] font-mono">{rec.date} · 自动生成</div>
        </Section>

        {/* 疼痛 */}
        <Section title="疼痛">
          <Field
            label="疼痛描述"
            value={rec.painDesc}
            placeholder="如：屈膝时膝前内侧针刺样痛"
            onChange={(v) => update("painDesc", v)}
            onVoice={() => triggerVoice("painDesc", "屈膝活动时膝前内侧轻微针刺样痛，静息时缓解")}
            recording={voiceField === "painDesc"}
            multiline
          />
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>疼痛程度（VAS 0-10）</span>
              <span className="font-bold text-foreground">{rec.painLevel}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={rec.painLevel}
              onChange={(e) => update("painLevel", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>无痛 0</span>
              <span>剧痛 10</span>
            </div>
          </div>
        </Section>

        {/* 渗血 / 肿胀 */}
        <Section title="伤口情况">
          <div className="grid grid-cols-2 gap-2">
            <Picker label="渗血" value={rec.bleeding} options={["无", "少量", "中量", "大量"]} onChange={(v) => update("bleeding", v)} />
            <Picker label="肿胀" value={rec.swelling} options={["无", "轻度", "中度", "重度"]} onChange={(v) => update("swelling", v)} />
          </div>
        </Section>

        {/* 关节活动度 */}
        <Section title="关节活动度（ROM）">
          <div className="grid grid-cols-2 gap-2">
            <Field label="伸（°）" value={rec.extension} placeholder="如 0°" onChange={(v) => update("extension", v)} />
            <Field label="屈（°）" value={rec.flexion} placeholder="如 60°" onChange={(v) => update("flexion", v)} />
          </div>
        </Section>

        {/* 功能性训练 */}
        <Section title="功能性训练">
          <Field
            label="床边坐-伸膝"
            value={rec.bedSitExtend}
            placeholder="如：可独立完成 10 次"
            onChange={(v) => update("bedSitExtend", v)}
            onVoice={() => triggerVoice("bedSitExtend", "可独立完成 10 次伸膝，无明显代偿")}
            recording={voiceField === "bedSitExtend"}
          />
          <Field
            label="站"
            value={rec.standing}
            placeholder="如：扶助行器 5 分钟"
            onChange={(v) => update("standing", v)}
            onVoice={() => triggerVoice("standing", "扶助行器站立 5 分钟，无头晕，患肢部分负重")}
            recording={voiceField === "standing"}
          />
          <Field
            label="走"
            value={rec.walking}
            placeholder="如：扶助行器 10 米"
            onChange={(v) => update("walking", v)}
            onVoice={() => triggerVoice("walking", "扶助行器行走 10 米，步态尚可，无明显跛行")}
            recording={voiceField === "walking"}
          />
        </Section>

        {/* 其他 */}
        <Section title="其他">
          <Field
            label="其他记录"
            value={rec.other}
            placeholder="如患者主诉、康复计划调整等"
            onChange={(v) => update("other", v)}
            onVoice={() => triggerVoice("other", "患者主诉夜间睡眠改善，明日加入闭链训练")}
            recording={voiceField === "other"}
            multiline
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 px-1 text-[11px] font-semibold text-foreground">{title}</div>
      <div className="rounded-2xl border bg-card p-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  onVoice,
  recording,
  multiline,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onVoice?: () => void;
  recording?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 text-[10px] text-muted-foreground">{label}</div>
      <div className="flex items-start gap-1.5">
        {multiline ? (
          <textarea
            rows={2}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[60px] flex-1 rounded-lg border bg-muted/20 p-2 text-[12px] outline-none focus:border-primary"
          />
        ) : (
          <input
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 flex-1 rounded-lg border bg-muted/20 px-2 text-[12px] outline-none focus:border-primary"
          />
        )}
        {onVoice && (
          <button
            onClick={onVoice}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              recording ? "animate-pulse bg-destructive text-destructive-foreground" : "bg-card text-muted-foreground active:bg-muted/40"
            }`}
            aria-label="语音输入"
          >
            <Mic className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {recording && <div className="mt-1 text-[10px] text-destructive">● 正在录音，自动转文字...</div>}
    </div>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-full px-2 py-1 text-[11px] ${
              value === o ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
