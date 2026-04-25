import { useState } from "react";
import { ArrowLeft, Search, FileSearch, MessageCircle, Edit3, Save, Stethoscope, ChevronRight } from "lucide-react";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 治疗师 · 患者管理列表
 * - 支持搜索 / 切换 住院 / 门诊
 * - 点击单个患者可查看详情 + 添加医生备注
 */
export function PatientListSheet({
  inpatientList,
  outpatientList,
  onClose,
  onArchive,
  onChat,
}: {
  inpatientList: Patient[];
  outpatientList: Patient[];
  onClose: () => void;
  onArchive: (p: Patient) => void;
  onChat: (p: Patient) => void;
}) {
  const [sub, setSub] = useState<"inpatient" | "outpatient">("inpatient");
  const [outpatientSub, setOutpatientSub] = useState<"all" | "first" | "revisit">("all");
  const [keyword, setKeyword] = useState("");
  const [noteFor, setNoteFor] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const baseList = sub === "inpatient" ? inpatientList : outpatientList;
  const filteredByVisitType =
    sub === "outpatient" && outpatientSub !== "all"
      ? baseList.filter((p) => p.visitType === outpatientSub)
      : baseList;
  const list = filteredByVisitType.filter(
    (p) => !keyword || p.name.includes(keyword) || p.bedNo?.includes(keyword),
  );

  const firstCount = outpatientList.filter((p) => p.visitType === "first").length;
  const revisitCount = outpatientList.filter((p) => p.visitType === "revisit").length;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">患者管理</div>
        <div className="w-4" />
      </div>

      <div className="border-b bg-card p-3">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索姓名 / 床号"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-full border bg-muted/30 p-0.5 text-[12px]">
          <button
            onClick={() => setSub("inpatient")}
            className={cn(
              "rounded-full py-1.5 font-medium transition-colors",
              sub === "inpatient" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            住院 · {inpatientList.length}
          </button>
          <button
            onClick={() => setSub("outpatient")}
            className={cn(
              "rounded-full py-1.5 font-medium transition-colors",
              sub === "outpatient" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            门诊 · {outpatientList.length}
          </button>
        </div>
        {sub === "outpatient" && (
          <div className="mt-2 flex gap-1.5">
            {(
              [
                { k: "all", label: `全部 ${outpatientList.length}` },
                { k: "first", label: `首诊 ${firstCount}` },
                { k: "revisit", label: `复诊 ${revisitCount}` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.k}
                onClick={() => setOutpatientSub(opt.k)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px]",
                  outpatientSub === opt.k
                    ? "bg-primary text-primary-foreground"
                    : "border bg-card text-muted-foreground active:bg-muted/40",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {list.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center text-[12px] text-muted-foreground">
            暂无{sub === "inpatient" ? "住院" : "门诊"}患者
          </div>
        )}
        {list.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <button onClick={() => onArchive(p)} className="block w-full border-b p-3 text-left active:bg-muted/30">
              <div className="flex items-center gap-1.5">
                {p.bedNo ? (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {p.bedNo}床
                  </span>
                ) : (
                  <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-bold text-info">门诊</span>
                )}
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                {p.visitType === "first" && (
                  <span className="rounded bg-success/15 px-1 py-0.5 text-[9px] font-bold text-success">首诊</span>
                )}
                {p.visitType === "revisit" && (
                  <span className="rounded bg-info/15 px-1 py-0.5 text-[9px] font-bold text-info">复诊</span>
                )}
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.diagnosis} · {p.surgeryName ?? "保守治疗"}
              </div>
              <div className="text-[10px] text-muted-foreground">主诊医生：{p.director}</div>
              {notes[p.id] && (
                <div className="mt-1.5 rounded-lg bg-info/5 p-1.5 text-[10px] text-info">
                  <span className="font-bold">医生备注：</span>
                  {notes[p.id]}
                </div>
              )}
            </button>
            <div className="grid grid-cols-3 gap-0 border-t">
              <button
                onClick={() => onArchive(p)}
                className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40"
              >
                <FileSearch className="h-3 w-3" />档案
              </button>
              <button
                onClick={() => onChat(p)}
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] text-foreground active:bg-muted/40"
              >
                <MessageCircle className="h-3 w-3" />沟通
              </button>
              <button
                onClick={() => setNoteFor(p)}
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary active:bg-muted/40"
              >
                <Edit3 className="h-3 w-3" />{notes[p.id] ? "改备注" : "加备注"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {noteFor && (
        <NoteEditor
          patient={noteFor}
          initial={notes[noteFor.id] ?? ""}
          onClose={() => setNoteFor(null)}
          onSave={(v) => {
            setNotes((s) => ({ ...s, [noteFor.id]: v }));
            setNoteFor(null);
          }}
        />
      )}
    </div>
  );
}

function NoteEditor({
  patient,
  initial,
  onClose,
  onSave,
}: {
  patient: Patient;
  initial: string;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  const [val, setVal] = useState(initial);
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">取消</button>
        <div className="text-[13px] font-semibold">医生备注 · {patient.name}</div>
        <button
          onClick={() => onSave(val)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground"
        >
          <Save className="h-3 w-3" />保存
        </button>
      </div>
      <div className="flex-1 space-y-3 bg-muted/20 p-3">
        <div className="rounded-2xl border bg-info/5 p-2.5 text-[11px] text-info">
          <Stethoscope className="mr-1 inline h-3 w-3" />
          可记录医生交代的康复重点、禁忌、复诊建议等，所有团队角色均可见。
        </div>
        <textarea
          rows={8}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="例：患者合并糖尿病，康复训练强度需循序渐进；术后 4 周内禁止负重..."
          className="w-full rounded-2xl border bg-card p-3 text-[12px] outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
