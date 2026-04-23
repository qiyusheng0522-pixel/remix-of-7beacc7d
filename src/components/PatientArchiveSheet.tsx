import { X, FileHeart, Pill, History, AlertTriangle } from "lucide-react";
import type { Patient } from "@/lib/types";
import { getArchive } from "@/lib/mock-records";

export function PatientArchiveSheet({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const arc = getArchive(patient.id);
  return (
    <Sheet onClose={onClose} title="患者档案">
      <div className="space-y-3 p-3">
        {/* 基础信息 */}
        <div className="rounded-2xl border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {patient.name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">
                {patient.name}
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                  {patient.gender} · {patient.age}岁 · {patient.bedNo ? `${patient.bedNo}床` : "门诊"}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{patient.outpatientId}</div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <Field label="主诊断" value={patient.diagnosis} />
            <Field label="拟行术式" value={patient.surgeryName ?? "—"} />
            <Field label="主任" value={patient.director} />
            <Field label="责任医生" value={patient.responsibleDoctor ?? "—"} />
          </div>
        </div>

        {/* 过敏 + 既往史 */}
        <SectionTitle icon={AlertTriangle} text="过敏 / 既往史" tone="text-destructive" />
        <div className="rounded-xl border bg-destructive/5 p-2.5 text-[11px]">
          {arc.allergies.map((a) => (
            <div key={a} className="text-destructive">⚠ {a}</div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-2.5 text-[11px] text-muted-foreground">
          {arc.history.map((h) => (
            <div key={h}>· {h}</div>
          ))}
        </div>

        {/* 护理记录 */}
        <SectionTitle icon={FileHeart} text="护理记录" />
        <div className="space-y-1.5">
          {arc.nursing.map((n) => (
            <div key={n.date} className="rounded-xl border bg-card p-2.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{n.date} · {n.shift}</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px]">{n.vitals}</div>
              <div className="mt-0.5 text-[11px]">{n.note}</div>
            </div>
          ))}
        </div>

        {/* 用药 */}
        <SectionTitle icon={Pill} text="用药记录" />
        <div className="overflow-hidden rounded-xl border bg-card">
          {arc.medication.map((m) => (
            <div key={m.date + m.drug} className="flex items-center justify-between border-b px-3 py-2 text-[11px] last:border-b-0">
              <div>
                <div className="font-medium">{m.drug}</div>
                <div className="text-[10px] text-muted-foreground">{m.dose} · {m.route}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{m.date}</span>
            </div>
          ))}
        </div>

        {/* 就诊历史 */}
        <SectionTitle icon={History} text="就诊历史" />
        <div className="overflow-hidden rounded-xl border bg-card">
          {arc.visits.map((v) => (
            <div key={v.date + v.diagnosis} className="border-b px-3 py-2 text-[11px] last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-info/10 px-1.5 py-0.5 text-[9px] text-info">{v.type}</span>
                <span className="text-[10px] text-muted-foreground">{v.date}</span>
              </div>
              <div className="mt-0.5 font-medium">{v.diagnosis}</div>
              <div className="text-[10px] text-muted-foreground">{v.doctor}</div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-muted/30">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[11px] text-muted-foreground active:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="w-4" />
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-1.5">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, text, tone }: { icon: React.ElementType; text: string; tone?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-1 text-[11px] font-semibold ${tone ?? "text-foreground"}`}>
      <Icon className="h-3 w-3" /> {text}
    </div>
  );
}
