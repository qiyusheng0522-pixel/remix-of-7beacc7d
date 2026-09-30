import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PreOpRehabAssessment {
  painTriggers: string[];
  painScores: Record<string, string>;
  swellingSite: string;
  swellingGrade: string;
  extensionLeft: string;
  extensionRight: string;
  flexionLeft: string;
  flexionRight: string;
  dorsiflexion: string;
  amiLeft: string;
  amiRight: string;
  amiNote: string;
  slrLeft: string;
  slrRight: string;
  extensionLag: string;
  atrophyLeft: string;
  atrophyRight: string;
  atrophyOther: string;
  deformityLeft: string;
  deformityRight: string;
  laxity: string;
  laxitySite: string;
  patellaMobility: string;
  other: string;
}

const painItems = ["下地1步行", "NWB 活动", "持续", "夜间", "其他"];
const blankAssessment: PreOpRehabAssessment = {
  painTriggers: [], painScores: {}, swellingSite: "", swellingGrade: "",
  extensionLeft: "", extensionRight: "", flexionLeft: "", flexionRight: "",
  dorsiflexion: "正常", amiLeft: "无", amiRight: "无", amiNote: "", slrLeft: "1-独立完成", slrRight: "1-独立完成", extensionLag: "",
  atrophyLeft: "无", atrophyRight: "无", atrophyOther: "", deformityLeft: "正常", deformityRight: "正常", laxity: "无",
  laxitySite: "", patellaMobility: "", other: "",
};

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <section className="border-b border-border bg-card px-3 py-3 last:border-b-0">
    <h3 className="mb-2 text-xs font-semibold text-foreground">{number}. {title}</h3>
    {children}
  </section>;
}

function Choices({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-2 gap-1.5">
    {options.map((option) => <label key={option} className={cn("flex min-h-9 items-center gap-2 rounded border px-2 py-1.5 text-[11px]", value === option ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground")}>
      <input type="radio" checked={value === option} onChange={() => onChange(option)} className="accent-primary" />{option}
    </label>)}
  </div>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block min-w-0 text-[11px] text-muted-foreground">
    <span className="mb-1 block">{label}</span>
    <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "填写"} className="h-9 w-full min-w-0 rounded border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-primary" />
  </label>;
}

export function PreOpRehabAssessmentSheet({ patient, initial, onClose, onSave }: {
  patient: Patient;
  initial?: PreOpRehabAssessment;
  onClose: () => void;
  onSave: (assessment: PreOpRehabAssessment) => void;
}) {
  const [form, setForm] = useState<PreOpRehabAssessment>(() => initial ? {
    ...blankAssessment, ...initial, painTriggers: [...initial.painTriggers], painScores: { ...initial.painScores },
  } : { ...blankAssessment, painTriggers: [], painScores: {} });
  const update = <K extends keyof PreOpRehabAssessment>(key: K, value: PreOpRehabAssessment[K]) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="absolute inset-0 z-[60] flex flex-col bg-background">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-card px-3 py-2.5">
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="返回"><ArrowLeft /></Button>
      <div className="min-w-0 text-center text-[13px] font-semibold">术前康复评估 · {patient.name}</div>
      <Button size="sm" onClick={() => onSave(form)}><Save />保存</Button>
    </div>
    <div className="flex-1 overflow-y-auto bg-muted/30 pb-4">
      <div className="px-3 py-2 text-[11px] text-muted-foreground">{patient.bedNo}床 · {patient.surgeryName} · 患侧 {patient.side ?? "未标注"}</div>
      <div className="mx-3 overflow-hidden rounded-md border border-border">
        <div className="bg-muted px-3 py-2 text-xs font-bold text-foreground">一、术前康复评估</div>
        <Section number={1} title="疼痛">
          <div className="grid grid-cols-2 gap-1.5">
            {painItems.map((item) => <label key={item} className="flex min-h-9 items-center gap-2 rounded border border-border px-2 text-[11px]">
              <input type="checkbox" checked={form.painTriggers.includes(item)} onChange={(e) => update("painTriggers", e.target.checked ? [...form.painTriggers, item] : form.painTriggers.filter((v) => v !== item))} className="accent-primary" />{item}
            </label>)}
          </div>
        </Section>
        <Section number={2} title="疼痛程度（0–10）">
          <div className="grid grid-cols-2 gap-2">
            {painItems.map((item) => <label key={item} className="text-[11px] text-muted-foreground">
              <span className="mb-1 block">{item}</span>
              <div className="flex items-center gap-1"><input aria-label={`${item}疼痛程度`} type="number" min="0" max="10" inputMode="numeric" value={form.painScores[item] ?? ""} onChange={(e) => update("painScores", { ...form.painScores, [item]: e.target.value })} placeholder="0–10" className="h-9 w-full min-w-0 rounded border border-input bg-background px-2 text-xs outline-none focus:border-primary" /><span>/10</span></div>
            </label>)}
          </div>
        </Section>
        <Section number={3} title="肿胀">
          <div className="mb-2"><TextField label="部位" value={form.swellingSite} onChange={(v) => update("swellingSite", v)} /></div>
          <Choices options={["0-无", "1-轻", "2-中", "3-重"]} value={form.swellingGrade} onChange={(v) => update("swellingGrade", v)} />
        </Section>
        <Section number={4} title="伸（左右都要填）">
          <div className="grid grid-cols-2 gap-2"><TextField label="左侧（°）" value={form.extensionLeft} onChange={(v) => update("extensionLeft", v)} /><TextField label="右侧（°）" value={form.extensionRight} onChange={(v) => update("extensionRight", v)} /></div>
        </Section>
        <Section number={5} title="屈（左右都要填）">
          <div className="grid grid-cols-2 gap-2"><TextField label="左侧（°）" value={form.flexionLeft} onChange={(v) => update("flexionLeft", v)} /><TextField label="右侧（°）" value={form.flexionRight} onChange={(v) => update("flexionRight", v)} /></div>
        </Section>
        <Section number={6} title="踝关节 DF（默认正常）">
          <Choices options={["正常", "轻微受限", "明显受限"]} value={form.dorsiflexion} onChange={(v) => update("dorsiflexion", v)} />
        </Section>
        <Section number={7} title="AMI（左右都要填，默认无）">
          <div className="space-y-2">{(["Left", "Right"] as const).map((side) => <div key={side}><div className="mb-1 text-[11px] text-muted-foreground">{side === "Left" ? "左侧" : "右侧"}</div><Choices options={["无", "1a 级", "1b 级", "2a 级", "2b 级", "3 级"]} value={form[`ami${side}`]} onChange={(v) => update(`ami${side}`, v)} /></div>)}</div>
          <div className="mt-2"><TextField label="备注（如处理后结果）" value={form.amiNote} onChange={(v) => update("amiNote", v)} /></div>
        </Section>
        <Section number={8} title="SLR（左右都要填，默认独立完成）">
          <div className="space-y-2">{(["Left", "Right"] as const).map((side) => <div key={side}><div className="mb-1 text-[11px] text-muted-foreground">{side === "Left" ? "左侧" : "右侧"}</div><Choices options={["1-独立完成", "2-少许辅助", "3-更多辅助", "4-无法完成"]} value={form[`slr${side}`]} onChange={(v) => update(`slr${side}`, v)} /></div>)}</div>
          <div className="mt-2"><TextField label="伸膝迟滞角度（°）" value={form.extensionLag} onChange={(v) => update("extensionLag", v)} /></div>
        </Section>
        <Section number={9} title="肌肉萎缩（左右都要填，默认无）">
          <div className="space-y-2">{(["Left", "Right"] as const).map((side) => <div key={side}><div className="mb-1 text-[11px] text-muted-foreground">{side === "Left" ? "左侧" : "右侧"}</div><Choices options={["无", "轻", "中", "重", "其他"]} value={form[`atrophy${side}`]} onChange={(v) => update(`atrophy${side}`, v)} /></div>)}</div>
          {(form.atrophyLeft === "其他" || form.atrophyRight === "其他") && <div className="mt-2"><TextField label="其他情况" value={form.atrophyOther} onChange={(v) => update("atrophyOther", v)} /></div>}
        </Section>
        <Section number={10} title="其他">
          <div className="space-y-3">
            <div><div className="mb-1 text-[11px] font-medium">（1）畸形（左右都要填，默认正常）</div><div className="space-y-2">{(["Left", "Right"] as const).map((side) => <div key={side}><div className="mb-1 text-[11px] text-muted-foreground">{side === "Left" ? "左侧" : "右侧"}</div><Choices options={["正常", "膝内翻", "膝外翻"]} value={form[`deformity${side}`]} onChange={(v) => update(`deformity${side}`, v)} /></div>)}</div></div>
            <div><div className="mb-1 text-[11px] font-medium">（2）多关节囊松弛（默认无）</div><Choices options={["无", "有"]} value={form.laxity} onChange={(v) => update("laxity", v)} />{form.laxity === "有" && <div className="mt-2"><TextField label="具体分值" value={form.laxitySite} onChange={(v) => update("laxitySite", v)} /></div>}</div>
            <TextField label="（3）髌骨活动水平" value={form.patellaMobility} onChange={(v) => update("patellaMobility", v)} />
            <TextField label="（4）其他" value={form.other} onChange={(v) => update("other", v)} />
          </div>
        </Section>
      </div>
    </div>
  </div>;
}