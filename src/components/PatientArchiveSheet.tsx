import { useState } from "react";
import {
  X,
  FileHeart,
  Pill,
  History,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Stethoscope,
  StickyNote,
  Plus,
  Save,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import { getArchive } from "@/lib/mock-records";
import { addNote, usePatientNotes, type PatientNote } from "@/lib/patient-notes";

export function PatientArchiveSheet({
  patient,
  onClose,
  selfRole = "护士",
  selfName = "我",
}: {
  patient: Patient;
  onClose: () => void;
  selfRole?: PatientNote["role"];
  selfName?: string;
}) {
  const arc = getArchive(patient.id);
  const notes = usePatientNotes(patient.id);
  const [adding, setAdding] = useState(false);
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
              <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                {patient.name}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {patient.gender} · {patient.age}岁 · {patient.bedNo ? `${patient.bedNo}床` : "门诊"}
                </span>
                {patient.side && (
                  <span className="rounded-md bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">
                    患侧 · {patient.side}侧
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{patient.outpatientId}</div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <Field label="主诊断" value={patient.diagnosis} />
            <Field label="拟行术式" value={patient.surgeryName ?? "—"} />
            <Field label="患侧" value={patient.side ? `${patient.side}侧` : "—"} />
            <Field label="主任" value={patient.director} />
            <Field label="责任治疗师" value={patient.responsibleTherapist ?? "—"} />
            <Field label="责任医生" value={patient.responsibleDoctor ?? "—"} />
          </div>
        </div>

        {/* 跨角色共享备注 */}
        <SectionTitle icon={StickyNote} text="患者备注（跨角色共享）" tone="text-info" />
        <div className="space-y-1.5">
          {notes.length === 0 && (
            <div className="rounded-xl border bg-card p-3 text-center text-[11px] text-muted-foreground">
              暂无备注
            </div>
          )}
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-2.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="rounded-full bg-info/10 px-1.5 py-0.5 text-info">
                  {n.role} · {n.author}
                </span>
                <span>{n.createdAt}</span>
              </div>
              {n.category && (
                <div className="mt-1 inline-block rounded bg-warning/20 px-1.5 py-0.5 text-[9px] font-medium text-warning-foreground">
                  {n.category}
                </div>
              )}
              <div className="mt-1 text-[12px] leading-relaxed">{n.text}</div>
            </div>
          ))}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed py-2 text-[11px] text-info active:bg-info/5"
            >
              <Plus className="h-3 w-3" />添加备注（{selfRole}）
            </button>
          ) : (
            <NoteAdder
              onCancel={() => setAdding(false)}
              onSave={(text, category) => {
                addNote({ patientId: patient.id, role: selfRole, author: selfName, text, category });
                setAdding(false);
              }}
            />
          )}
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

        {/* 术前检查项数据结果（门诊待入院 / 术前阶段） */}
        {(patient.preOpFindings || patient.preOpSymptoms) && (
          <>
            <SectionTitle icon={Activity} text="术前检查项数据" tone="text-primary" />
            <div className="rounded-xl border bg-primary/5 p-3 text-[11px]">
              {patient.preOpFindings && patient.preOpFindings.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {patient.preOpFindings.map((f) => (
                    <span
                      key={f.label}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        f.abnormal
                          ? "bg-destructive/10 font-bold text-destructive"
                          : "bg-card text-muted-foreground"
                      }`}
                    >
                      {f.label} {f.value}
                    </span>
                  ))}
                </div>
              )}
              {patient.preOpSymptoms && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {patient.preOpSymptoms.painVAS !== undefined && (
                    <Field label="疼痛 VAS" value={`${patient.preOpSymptoms.painVAS}/10`} />
                  )}
                  {patient.preOpSymptoms.swelling && (
                    <Field label="肿胀" value={patient.preOpSymptoms.swelling} />
                  )}
                  {patient.preOpSymptoms.rom && (
                    <Field label="关节活动度" value={patient.preOpSymptoms.rom} />
                  )}
                  {patient.preOpSymptoms.strength && (
                    <Field label="肌力" value={patient.preOpSymptoms.strength} />
                  )}
                  {patient.preOpSymptoms.dailyFunction && (
                    <div className="col-span-2">
                      <Field label="日常功能" value={patient.preOpSymptoms.dailyFunction} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* 术前康复评估 */}
        <SectionTitle icon={Activity} text="术前康复评估" tone="text-info" />
        <div className="rounded-xl border bg-info/5 p-3 text-[11px]">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>评估日期：{arc.preRehab.date}</span>
            <span>评估师：朱年鑫</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="关节活动度 ROM" value={arc.preRehab.rom} />
            <Field label="肌力" value={arc.preRehab.strength} />
            <Field label="疼痛" value={arc.preRehab.pain} />
            <Field label="功能评分" value={arc.preRehab.function} />
          </div>
          <div className="mt-2 rounded-lg bg-card p-2 text-[11px]">
            <div className="mb-0.5 text-[9px] font-bold text-info">康复师建议</div>
            {arc.preRehab.note}
          </div>
        </div>

        {/* 康复注意事项 */}
        <SectionTitle icon={ShieldAlert} text="康复注意事项" tone="text-warning-foreground" />
        <div className="rounded-xl border bg-warning/5 p-2.5 text-[11px]">
          {arc.precautions.map((p, i) => (
            <div key={i} className="flex gap-1.5 py-0.5">
              <span className="text-warning-foreground">{i + 1}.</span>
              <span>{p}</span>
            </div>
          ))}
        </div>

        {/* 手术评估（医生建议） */}
        {arc.surgery && (
          <>
            <SectionTitle icon={Stethoscope} text="手术评估 · 医生建议" tone="text-primary" />
            <div className="rounded-xl border bg-primary/5 p-3 text-[11px]">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>手术日期：{arc.surgery.date}</span>
                <span>主刀：{patient.director}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="麻醉方式" value={arc.surgery.anesthesia} />
                <Field label="术中出血" value={arc.surgery.bleeding} />
                <Field label="手术时长" value={arc.surgery.duration} />
                <Field label="并发症" value={arc.surgery.complications} />
              </div>
              <div className="mt-2 rounded-lg bg-card p-2 text-[11px]">
                <div className="mb-0.5 text-[9px] font-bold text-primary">医生建议（推送至治疗师）</div>
                {arc.surgery.doctorAdvice}
              </div>
            </div>
          </>
        )}

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
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
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

function NoteAdder({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (text: string, category: PatientNote["category"]) => void;
}) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState<PatientNote["category"]>("通用");
  return (
    <div className="rounded-xl border bg-info/5 p-2.5">
      <div className="mb-1.5 flex flex-wrap gap-1">
        {(["通用", "出院备注", "康复重点", "护理交班"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              cat === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请输入备注内容（其他角色均可见）..."
        className="w-full rounded-lg border bg-card p-2 text-[11px] outline-none focus:border-primary"
      />
      <div className="mt-1.5 flex justify-end gap-1.5">
        <button onClick={onCancel} className="rounded-full px-3 py-1 text-[11px] text-muted-foreground">
          取消
        </button>
        <button
          disabled={!text.trim()}
          onClick={() => onSave(text.trim(), cat)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
        >
          <Save className="h-3 w-3" />保存
        </button>
      </div>
    </div>
  );
}

