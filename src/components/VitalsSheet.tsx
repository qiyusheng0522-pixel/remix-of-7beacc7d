import { useState } from "react";
import { ArrowLeft, Activity, Save } from "lucide-react";
import type { Patient } from "@/lib/types";

/**
 * 护士：填写住院期间的指标数据（生命体征 / DVT / 引流 / VAS 等）
 */
export function VitalsSheet({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [vitals, setVitals] = useState({
    temp: "36.8",
    pulse: "78",
    bp: "130/82",
    spo2: "98",
    vas: "3",
    drainage: "30",
    urine: "850",
    dvt: "Wells 1 分（低危）",
    caprini: "3 分（中危）",
    skin: "完整",
    note: "",
  });

  const update = (k: keyof typeof vitals, v: string) => setVitals((s) => ({ ...s, [k]: v }));

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">住院指标记录</div>
        <button
          onClick={() => onSave(`${patient.name} 指标已保存`)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground"
        >
          <Save className="h-3 w-3" />保存
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-2xl border bg-card p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Activity className="h-3 w-3 text-primary" />
            {patient.name} · {patient.bedNo}床 · {patient.diagnosis}
          </div>
        </div>

        <Section title="生命体征">
          <Row label="体温 (℃)" value={vitals.temp} onChange={(v) => update("temp", v)} suffix="℃" />
          <Row label="脉搏" value={vitals.pulse} onChange={(v) => update("pulse", v)} suffix="次/min" />
          <Row label="血压" value={vitals.bp} onChange={(v) => update("bp", v)} suffix="mmHg" />
          <Row label="血氧 SpO₂" value={vitals.spo2} onChange={(v) => update("spo2", v)} suffix="%" />
        </Section>

        <Section title="术后观察">
          <Row label="疼痛 VAS" value={vitals.vas} onChange={(v) => update("vas", v)} suffix="/10" />
          <Row label="引流量" value={vitals.drainage} onChange={(v) => update("drainage", v)} suffix="ml" />
          <Row label="尿量" value={vitals.urine} onChange={(v) => update("urine", v)} suffix="ml" />
          <Row label="伤口" value={vitals.skin} onChange={(v) => update("skin", v)} />
        </Section>

        <Section title="DVT / 血栓评估">
          <Row label="Wells 评分" value={vitals.dvt} onChange={(v) => update("dvt", v)} />
          <Row label="Caprini 评分" value={vitals.caprini} onChange={(v) => update("caprini", v)} />
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-[10px] text-warning-foreground">
            ⚠ Caprini ≥ 5 分需启动抗凝预防方案，并通知值班医生。
          </div>
        </Section>

        <Section title="备注">
          <textarea
            rows={3}
            value={vitals.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="补充说明（可选）"
            className="w-full rounded-lg border bg-card p-2 text-[11px] outline-none focus:border-primary"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] font-semibold">{title}</div>
      <div className="space-y-1.5 p-3">{children}</div>
    </div>
  );
}

function Row({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-2">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-right text-[12px] font-medium outline-none"
        />
        {suffix && <span className="shrink-0 text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
