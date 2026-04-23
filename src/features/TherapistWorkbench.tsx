import { useState } from "react";
import {
  Activity,
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  Home,
  HeartPulse,
  User,
  ChevronRight,
  Sparkles,
  Edit3,
  Trash2,
  FileText,
  MessageCircle,
  FileSearch,
  PlusCircle,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction } from "./SecretaryWorkbench";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientArchiveSheet } from "@/components/PatientArchiveSheet";
import { ActionSheet, ToastBanner } from "@/components/ActionSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "plans" | "records" | "me";
type Overlay = { kind: "chat"; patient: Patient } | { kind: "archive"; patient: Patient } | null;

// AI 生成的康复方案（模拟）
const aiRehabPlan = (patient: Patient) => ({
  goal: `${patient.surgeryName ?? "术后"} · 7 日内屈膝 ≥90°，独立扶助行器行走 50m`,
  items: [
    "术后第 1 日：踝泵 30 次/h，SLR 直腿抬高 3 组×10 次",
    "术后第 2 日：被动屈膝 0-60°，CPM 机辅助",
    "术后第 3 日：床旁站立 5 min，扶助行器行走 5m",
    "术后第 5 日：屈膝 ≥75°，扶助行器行走 30m",
    "术后第 7 日：屈膝 ≥90°，独立行走 50m，可上下楼梯",
  ],
  precautions: ["避免患肢负重 >50%", "如出现 38℃ 以上发热立即上报", "夜间睡眠保持患肢中立位"],
});

type PlanStatus = "ai-draft" | "confirmed" | "edited" | "empty";

export function TherapistWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [actionPatient, setActionPatient] = useState<Patient | null>(null);
  const [planEditor, setPlanEditor] = useState<Patient | null>(null);
  const [planStatuses, setPlanStatuses] = useState<Record<string, PlanStatus>>({
    p7: "ai-draft",
    p8: "confirmed",
    p9: "edited",
  });
  const [toast, setToast] = useState<string | null>(null);

  const myPatients = patients.filter((p) => ["in-surgery", "post-op", "rehab"].includes(p.status));
  const tasks = todayTasks.therapist;

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <PhoneShell
      title="治疗师工作台"
      subtitle="朱年鑫 · 康复治疗师"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "plans", label: "康复方案", icon: HeartPulse, badge: myPatients.filter((p) => planStatuses[p.id] === "ai-draft").length },
            { key: "records", label: "院内记录", icon: FileText, badge: myPatients.length },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab
          tasks={tasks}
          myCount={myPatients.length}
          aiDraftCount={myPatients.filter((p) => planStatuses[p.id] === "ai-draft").length}
          onQuick={(l) => showToast(`已打开 ${l}`)}
        />
      )}
      {tab === "plans" && (
        <PlansTab
          list={myPatients}
          statuses={planStatuses}
          onEdit={(p) => setPlanEditor(p)}
          onConfirm={(p) => {
            setPlanStatuses((s) => ({ ...s, [p.id]: "confirmed" }));
            showToast(`已确认 AI 方案：${p.name}`);
          }}
          onClear={(p) => {
            setPlanStatuses((s) => ({ ...s, [p.id]: "empty" }));
            showToast(`已清空方案：${p.name}`);
          }}
          onChat={(p) => setOverlay({ kind: "chat", patient: p })}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
        />
      )}
      {tab === "records" && (
        <RecordsTab
          list={myPatients}
          onSelect={(p) => setActionPatient(p)}
          onAssess={(p) => showToast(`正在为 ${p.name} 进行康复评估...`)}
          onDischarge={(p) => showToast(`已发起康复出院评估：${p.name}`)}
        />
      )}
      {tab === "me" && <MeTab />}

      {planEditor && (
        <PlanEditorSheet
          patient={planEditor}
          onClose={() => setPlanEditor(null)}
          onSave={() => {
            setPlanStatuses((s) => ({ ...s, [planEditor.id]: "edited" }));
            showToast(`已保存修改：${planEditor.name}`);
            setPlanEditor(null);
          }}
        />
      )}
      {overlay?.kind === "chat" && (
        <PatientChatSheet patient={overlay.patient} onClose={() => setOverlay(null)} selfRole="治" />
      )}
      {overlay?.kind === "archive" && (
        <PatientArchiveSheet patient={overlay.patient} onClose={() => setOverlay(null)} />
      )}
      <ActionSheet
        open={!!actionPatient}
        title={actionPatient ? `${actionPatient.name} · ${actionPatient.bedNo}床` : ""}
        onClose={() => setActionPatient(null)}
        actions={[
          { label: "在线沟通", tone: "primary", onClick: () => actionPatient && setOverlay({ kind: "chat", patient: actionPatient }) },
          { label: "查看患者档案", onClick: () => actionPatient && setOverlay({ kind: "archive", patient: actionPatient }) },
          { label: "新增院内治疗记录", onClick: () => showToast("打开记录单") },
          { label: "发起康复评估", onClick: () => showToast("已发起评估") },
        ]}
      />
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  myCount,
  aiDraftCount,
  onQuick,
}: {
  tasks: typeof todayTasks.therapist;
  myCount: number;
  aiDraftCount: number;
  onQuick: (l: string) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[10px] opacity-80">康复治疗师 · 工作概览</div>
        <div className="mt-1 text-base font-bold">朱年鑫, 加油 💪</div>
        <div className="mt-0.5 text-[11px] opacity-90">
          负责康复 {myCount} 例, AI 方案待确认 {aiDraftCount} 份
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="负责康复中" value={myCount} />
          <MiniStat label="AI 方案待确认" value={aiDraftCount} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
        <QuickAction icon={Sparkles} label="AI 方案" tone="bg-info/15 text-info" onClick={() => onQuick("AI 方案")} />
        <QuickAction icon={ClipboardCheck} label="康复评估" tone="bg-primary/15 text-primary" onClick={() => onQuick("康复评估")} />
        <QuickAction icon={FileText} label="院内记录" tone="bg-success/15 text-success" onClick={() => onQuick("院内记录")} />
        <QuickAction icon={CheckCircle2} label="出院评估" tone="bg-warning/20 text-warning-foreground" onClick={() => onQuick("出院评估")} />
      </div>

      <Card title="今日待办" rightLabel={`${tasks.length} 项`}>
        <div className="divide-y">
          {tasks.map((t) => (
            <div key={t.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    t.priority === "high" ? "bg-destructive" : "bg-muted-foreground",
                  )}
                />
                <div className="text-[12px] font-medium">{t.title}</div>
                {t.type === "plan" && <Sparkles className="h-3 w-3 text-info" />}
              </div>
              <div className="ml-3.5 mt-0.5 text-[10px] text-muted-foreground">
                {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="本月数据">
        <div className="grid grid-cols-3 gap-1 p-3 text-center">
          {[
            { l: "已出院", v: 18 },
            { l: "达标率", v: "94%" },
            { l: "AI 方案采纳", v: "82%" },
          ].map((x) => (
            <div key={x.l}>
              <div className="text-base font-bold text-primary">{x.v}</div>
              <div className="text-[10px] text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlansTab({
  list,
  statuses,
  onEdit,
  onConfirm,
  onClear,
  onChat,
  onArchive,
}: {
  list: typeof patients;
  statuses: Record<string, PlanStatus>;
  onEdit: (p: Patient) => void;
  onConfirm: (p: Patient) => void;
  onClear: (p: Patient) => void;
  onChat: (p: Patient) => void;
  onArchive: (p: Patient) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
        <Sparkles className="mr-1 inline h-3 w-3" />
        AI 已根据术中量表与医生建议自动生成康复方案，请确认、修改或清空。
      </div>

      {list.map((p) => {
        const status = statuses[p.id] ?? "ai-draft";
        const plan = aiRehabPlan(p);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-2 border-b p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {p.bedNo && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                      {p.bedNo}床
                    </span>
                  )}
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {p.surgeryName} · 术日 {p.surgeryDate}
                </div>
              </div>
              <PlanStatusBadge status={status} />
            </div>

            {status === "empty" ? (
              <div className="flex flex-col items-center gap-1.5 p-4 text-[11px] text-muted-foreground">
                <Trash2 className="h-4 w-4" />
                方案已清空
                <button
                  onClick={() => onConfirm(p)}
                  className="mt-1 flex items-center gap-1 rounded-full bg-info/10 px-3 py-1 text-[10px] text-info"
                >
                  <Sparkles className="h-3 w-3" />重新生成 AI 方案
                </button>
              </div>
            ) : (
              <>
                <div className="border-b bg-info/5 px-3 py-2">
                  <div className="text-[10px] font-bold text-info">康复目标</div>
                  <div className="mt-0.5 text-[11px]">{plan.goal}</div>
                </div>
                <div className="space-y-1 p-3">
                  {plan.items.slice(0, 3).map((i, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span className="text-foreground">{i}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground">+ {plan.items.length - 3} 条更多...</div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5">
              <div className="flex gap-1">
                <button onClick={() => onArchive(p)} className="rounded-full bg-muted p-1.5 text-muted-foreground active:bg-muted/70">
                  <FileSearch className="h-3 w-3" />
                </button>
                <button onClick={() => onChat(p)} className="rounded-full bg-info/10 p-1.5 text-info active:opacity-80">
                  <MessageCircle className="h-3 w-3" />
                </button>
              </div>
              <div className="flex gap-1">
                {status !== "empty" && (
                  <button
                    onClick={() => onClear(p)}
                    className="flex items-center gap-1 rounded-full border border-destructive/30 px-2 py-1 text-[10px] text-destructive active:bg-destructive/5"
                  >
                    <Trash2 className="h-3 w-3" />清空
                  </button>
                )}
                {status !== "empty" && (
                  <button
                    onClick={() => onEdit(p)}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-foreground active:bg-muted/70"
                  >
                    <Edit3 className="h-3 w-3" />修改
                  </button>
                )}
                {status === "ai-draft" && (
                  <button
                    onClick={() => onConfirm(p)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-primary-foreground active:opacity-80"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <CheckCircle2 className="h-3 w-3" />确认方案
                  </button>
                )}
                {status === "confirmed" && (
                  <span className="flex items-center gap-1 rounded-full border border-success/40 px-2 py-1 text-[11px] text-success">
                    <CheckCircle2 className="h-3 w-3" />已确认
                  </span>
                )}
                {status === "edited" && (
                  <span className="flex items-center gap-1 rounded-full border border-primary/40 px-2 py-1 text-[11px] text-primary">
                    <Edit3 className="h-3 w-3" />已修改
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordsTab({
  list,
  onSelect,
  onAssess,
  onDischarge,
}: {
  list: typeof patients;
  onSelect: (p: Patient) => void;
  onAssess: (p: Patient) => void;
  onDischarge: (p: Patient) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      {list.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => onSelect(p)} className="block w-full border-b p-3 text-left">
            <div className="flex items-center gap-1.5">
              {p.bedNo && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
              )}
              <span className="text-sm font-bold">{p.name}</span>
              <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
              {p.status === "rehab" && <Pill cls="bg-success/15 text-success">康复达标</Pill>}
              {p.status === "post-op" && <Pill cls="bg-info/15 text-info">术后第 3 日</Pill>}
              {p.status === "in-surgery" && <Pill cls="bg-warning/20 text-warning-foreground">今日术后</Pill>}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {p.surgeryName} · 术日 {p.surgeryDate}
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 p-3">
            <Metric label="疼痛 VAS" value="3/10" trend="down" />
            <Metric label="屈膝角度" value="85°" trend="up" />
            <Metric label="SLR" value="可独立" trend="up" />
            <Metric label="是否下地" value={p.status === "in-surgery" ? "未" : "已下地"} trend="up" />
          </div>

          <div className="grid grid-cols-3 gap-0 border-t">
            <button
              onClick={() => onAssess(p)}
              className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40"
            >
              <ClipboardCheck className="h-3 w-3" />康复评估
            </button>
            <button
              onClick={() => onSelect(p)}
              className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] text-foreground active:bg-muted/40"
            >
              <PlusCircle className="h-3 w-3" />新增记录
            </button>
            {p.status === "rehab" ? (
              <button
                onClick={() => onDischarge(p)}
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary-foreground active:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <CheckCircle2 className="h-3 w-3" />出院评估
              </button>
            ) : (
              <button
                onClick={() => onSelect(p)}
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] text-primary active:bg-muted/40"
              >
                <FileText className="h-3 w-3" />历史
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanEditorSheet({ patient, onClose, onSave }: { patient: Patient; onClose: () => void; onSave: () => void }) {
  const plan = aiRehabPlan(patient);
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-muted/40">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[11px] text-muted-foreground">取消</button>
        <div className="text-[13px] font-semibold">修改康复方案 · {patient.name}</div>
        <button onClick={onSave} className="text-[11px] font-bold text-primary">保存</button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">康复目标</div>
          <textarea
            rows={2}
            defaultValue={plan.goal}
            className="w-full rounded-lg border bg-card p-2 text-[12px] outline-none focus:border-primary"
          />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">每日训练计划</div>
          {plan.items.map((it, i) => (
            <textarea
              key={i}
              rows={2}
              defaultValue={it}
              className="mb-1.5 w-full rounded-lg border bg-card p-2 text-[11px] outline-none focus:border-primary"
            />
          ))}
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">注意事项</div>
          <textarea
            rows={4}
            defaultValue={plan.precautions.join("\n")}
            className="w-full rounded-lg border bg-card p-2 text-[11px] outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

function MeTab() {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          朱
        </div>
        <div className="mt-2 text-base font-bold">朱年鑫</div>
        <div className="text-[11px] text-muted-foreground">康复治疗师 · 5 年经验</div>
      </div>
      <Card title="设置">
        {["AI 康复方案模板", "评估表单管理", "院内治疗记录模板", "关于骨安"].map((s) => (
          <button key={s} className="flex w-full items-center justify-between border-b px-3 py-3 text-[12px] last:border-b-0 active:bg-muted/30">
            {s}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </Card>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: "up" | "down" }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{label}</span>
        <TrendingUp className={cn("h-3 w-3", trend === "up" ? "text-success" : "rotate-180 text-info")} />
      </div>
      <div className="mt-0.5 text-[12px] font-bold text-foreground">{value}</div>
    </div>
  );
}

function Pill({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium", cls)}>{children}</span>;
}

function PlanStatusBadge({ status }: { status: PlanStatus }) {
  if (status === "ai-draft")
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-info/15 px-1.5 py-0.5 text-[9px] font-medium text-info">
        <Sparkles className="h-2.5 w-2.5" />AI 草稿
      </span>
    );
  if (status === "confirmed")
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-medium text-success">
        <CheckCircle2 className="h-2.5 w-2.5" />已确认
      </span>
    );
  if (status === "edited")
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
        <Edit3 className="h-2.5 w-2.5" />已修改
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
      <Trash2 className="h-2.5 w-2.5" />已清空
    </span>
  );
}

// keep imports referenced
const _activity = Activity;
void _activity;
