import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  Home,
  HeartPulse,
  User,
  Users,
  ChevronRight,
  Sparkles,
  Edit3,
  Trash2,
  FileText,
  MessageCircle,
  FileSearch,
  PlusCircle,
  Mic,
  Save,
  Calendar,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction } from "./SecretaryWorkbench";
import { BarChart, ChartCard, HBarRow, LineChart, StatTile } from "@/components/WorkStats";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientArchiveSheet } from "@/components/PatientArchiveSheet";
import { PatientListSheet } from "@/components/PatientListSheet";
import { RehabRecordSheet } from "@/components/RehabRecordSheet";
import { ActionSheet, ToastBanner } from "@/components/ActionSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "plans" | "records" | "me";
type Overlay =
  | { kind: "chat"; patient: Patient }
  | { kind: "archive"; patient: Patient }
  | { kind: "patient-list" }
  | { kind: "discharge"; patient: Patient }
  | null;

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
  const [recordFor, setRecordFor] = useState<Patient | null>(null);
  const [planStatuses, setPlanStatuses] = useState<Record<string, PlanStatus>>({
    p7: "ai-draft",
    p8: "confirmed",
    p9: "edited",
  });
  const [toast, setToast] = useState<string | null>(null);

  // 住院 + 门诊康复患者
  const inpatientList = patients.filter(
    (p) => p.department === "inpatient" && ["in-surgery", "post-op", "rehab"].includes(p.status),
  );
  const outpatientList = patients.filter((p) => p.department === "outpatient" && p.status === "rehab");
  const myPatients = [...inpatientList, ...outpatientList];
  const tasks = todayTasks.therapist;
  // 明日手术（提供给治疗师作为术前康复参考，但治疗师不再做手术决策）
  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);

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
            { key: "surg-confirm", label: "手术确认", icon: Calendar, badge: surgPending },
            { key: "plans", label: "康复方案", icon: HeartPulse, badge: myPatients.filter((p) => planStatuses[p.id] === "ai-draft").length },
            { key: "records", label: "院内评估", icon: FileText, badge: inpatientList.length },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab
          tasks={tasks}
          inpatientCount={inpatientList.length}
          outpatientCount={outpatientList.length}
          planPendingCount={myPatients.filter((p) => planStatuses[p.id] === "ai-draft").length}
          assessPendingCount={tasks.filter((t) => t.type === "preop-confirm" || t.type === "discharge").length}
          chatPendingCount={3}
          surgConfirmPending={surgPending}
          onOpenPatients={() => setOverlay({ kind: "patient-list" })}
          onOpenPlans={() => setTab("plans")}
          onOpenRecords={() => setTab("records")}
          onOpenSurgConfirm={() => setTab("surg-confirm")}
          onQuick={(l) => showToast(`已打开 ${l}`)}
        />
      )}
      {tab === "surg-confirm" && (
        <SurgConfirmTab
          list={tomorrowSurgery}
          decisions={surgConfirms}
          onGo={(p) => {
            setSurgConfirms((s) => ({ ...s, [p.id]: "go" }));
            showToast(`已确认如期康复介入：${p.name}`);
          }}
          onHold={(p) => {
            setSurgConfirms((s) => ({ ...s, [p.id]: "hold" }));
            showToast(`已暂缓 ${p.name}，已通知主刀医生`);
          }}
          onReturn={(p) => {
            setSurgConfirms((s) => ({ ...s, [p.id]: "return" }));
            showToast(`已退回 ${p.name}，待重新评估`);
          }}
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
          inpatientList={inpatientList}
          onSelect={(p) => setActionPatient(p)}
          onAssess={(p) => showToast(`正在为 ${p.name} 进行康复评估...`)}
          onAddRecord={(p) => setRecordFor(p)}
          onDischarge={(p) => setOverlay({ kind: "discharge", patient: p })}
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
      {recordFor && (
        <RehabRecordSheet
          patient={recordFor}
          onClose={() => setRecordFor(null)}
          onSave={() => {
            showToast(`已保存院内康复记录：${recordFor.name}`);
            setRecordFor(null);
          }}
        />
      )}
      {overlay?.kind === "chat" && (
        <PatientChatSheet
          patient={overlay.patient}
          onClose={() => setOverlay(null)}
          selfRole="治"
        />
      )}
      {overlay?.kind === "archive" && (
        <PatientArchiveSheet
          patient={overlay.patient}
          onClose={() => setOverlay(null)}
          selfRole="治疗师"
          selfName="朱年鑫"
        />
      )}
      {/* 手术确认现已作为独立 Tab，不再作为 overlay */}
      {overlay?.kind === "discharge" && (
        <DischargeSheet
          patient={overlay.patient}
          onClose={() => setOverlay(null)}
          onConfirm={(note) => {
            showToast(`已确认 ${overlay.patient.name} 出院 · 备注已同步`);
            setOverlay(null);
          }}
        />
      )}
      {overlay?.kind === "patient-list" && (
        <PatientListSheet
          inpatientList={inpatientList}
          outpatientList={outpatientList}
          onClose={() => setOverlay(null)}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
          onChat={(p) => setOverlay({ kind: "chat", patient: p })}
        />
      )}
      <ActionSheet
        open={!!actionPatient}
        title={actionPatient ? `${actionPatient.name}${actionPatient.bedNo ? ` · ${actionPatient.bedNo}床` : " · 门诊"}` : ""}
        onClose={() => setActionPatient(null)}
        actions={[
          { label: "在线沟通", tone: "primary", onClick: () => actionPatient && setOverlay({ kind: "chat", patient: actionPatient }) },
          { label: "查看患者档案", onClick: () => actionPatient && setOverlay({ kind: "archive", patient: actionPatient }) },
          {
            label: "新增院内治疗记录",
            onClick: () => {
              if (actionPatient) {
                setRecordFor(actionPatient);
                setActionPatient(null);
              }
            },
          },
          { label: "发起康复评估", onClick: () => showToast("已发起评估") },
        ]}
      />
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  inpatientCount,
  outpatientCount,
  planPendingCount,
  assessPendingCount,
  chatPendingCount,
  surgConfirmPending,
  onOpenPatients,
  onOpenPlans,
  onOpenRecords,
  onOpenSurgConfirm,
  onQuick,
}: {
  tasks: typeof todayTasks.therapist;
  inpatientCount: number;
  outpatientCount: number;
  planPendingCount: number;
  assessPendingCount: number;
  chatPendingCount: number;
  surgConfirmPending: number;
  onOpenPatients: () => void;
  onOpenPlans: () => void;
  onOpenRecords: () => void;
  onOpenSurgConfirm: () => void;
  onQuick: (l: string) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[10px] opacity-80">康复治疗师 · 工作概览</div>
        <div className="mt-1 text-base font-bold">朱年鑫, 加油 💪</div>
        <div className="mt-0.5 text-[11px] opacity-90">
          住院 {inpatientCount} · 门诊 {outpatientCount} · 今日待办 {tasks.length} 项
        </div>
      </div>

      {/* 工作台统计入口 */}
      <div className="grid grid-cols-2 gap-2">
        <StatEntry
          icon={Users}
          label="患者管理"
          sub={`住院 ${inpatientCount} · 门诊 ${outpatientCount}`}
          value={inpatientCount + outpatientCount}
          tone="bg-info/10 text-info"
          onClick={onOpenPatients}
        />
        <StatEntry
          icon={HeartPulse}
          label="康复方案"
          sub={planPendingCount > 0 ? `${planPendingCount} 份待确认` : "全部已确认"}
          value={planPendingCount}
          badge={planPendingCount > 0}
          tone="bg-primary/10 text-primary"
          onClick={onOpenPlans}
        />
        <StatEntry
          icon={ClipboardCheck}
          label="康复评估"
          sub={assessPendingCount > 0 ? `${assessPendingCount} 项待评估` : "今日已完成"}
          value={assessPendingCount}
          badge={assessPendingCount > 0}
          tone="bg-warning/15 text-warning-foreground"
          onClick={onOpenRecords}
        />
        <StatEntry
          icon={MessageCircle}
          label="患者沟通"
          sub={chatPendingCount > 0 ? `${chatPendingCount} 条未回复` : "无待回复"}
          value={chatPendingCount}
          badge={chatPendingCount > 0}
          tone="bg-success/15 text-success"
          onClick={onOpenPatients}
        />
        <StatEntry
          icon={Calendar}
          label="手术确认"
          sub={surgConfirmPending > 0 ? `${surgConfirmPending} 例待治疗师确认` : "全部已确认"}
          value={surgConfirmPending}
          badge={surgConfirmPending > 0}
          tone="bg-warning/15 text-warning-foreground"
          onClick={onOpenSurgConfirm}
        />
        <StatEntry
          icon={Sparkles}
          label="今日待办"
          sub={`${tasks.length} 项任务`}
          value={tasks.length}
          tone="bg-info/10 text-info"
          onClick={onOpenRecords}
        />
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
                {t.type === "preop-confirm" && <ClipboardCheck className="h-3 w-3 text-warning-foreground" />}
                {t.type === "discharge" && <CheckCircle2 className="h-3 w-3 text-success" />}
              </div>
              <div className="ml-3.5 mt-0.5 text-[10px] text-muted-foreground">
                {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

function StatEntry({
  icon: Icon,
  label,
  sub,
  value,
  badge,
  tone,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  value: number;
  badge?: boolean;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2.5 rounded-2xl border bg-card p-3 text-left active:bg-muted/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-semibold">{label}</span>
          {badge && value > 0 && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
              {value}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </button>
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
  inpatientList,
  onSelect,
  onAssess,
  onAddRecord,
  onDischarge,
}: {
  inpatientList: Patient[];
  onSelect: (p: Patient) => void;
  onAssess: (p: Patient) => void;
  onAddRecord: (p: Patient) => void;
  onDischarge: (p: Patient) => void;
}) {
  const list = inpatientList;

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-info/5 p-2.5 text-[11px] text-info">
        <ClipboardCheck className="mr-1 inline h-3 w-3" />
        院内评估仅记录住院患者；门诊患者的康复记录请在「患者管理 → 患者档案」中查看。
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-[12px] font-semibold">住院康复 · {list.length} 例</div>
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border bg-card p-6 text-center text-[12px] text-muted-foreground">
          暂无住院康复患者
        </div>
      )}

      {list.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => onSelect(p)} className="block w-full border-b p-3 text-left">
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
              {p.status === "rehab" && p.department === "inpatient" && <Pill cls="bg-success/15 text-success">康复达标</Pill>}
              {p.status === "post-op" && <Pill cls="bg-info/15 text-info">术后第 3 日</Pill>}
              {p.status === "in-surgery" && <Pill cls="bg-warning/20 text-warning-foreground">今日术后</Pill>}
              {p.status === "rehab" && p.department === "outpatient" && <Pill cls="bg-info/15 text-info">门诊康复</Pill>}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {p.surgeryName ?? p.diagnosis}
              {p.surgeryDate && ` · 术日 ${p.surgeryDate}`}
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 p-3">
            <Metric label="疼痛 VAS" value="3/10" trend="down" />
            <Metric label="屈膝角度" value="85°" trend="up" />
            <Metric label="SLR" value="可独立" trend="up" />
            <Metric label="是否下地" value={p.status === "in-surgery" ? "未" : "已下地"} trend="up" />
          </div>

          <div className="grid grid-cols-2 gap-0 border-t">
            <button
              onClick={() => onAddRecord(p)}
              className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40"
            >
              <PlusCircle className="h-3 w-3" />每日评估
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
                <FileText className="h-3 w-3" />历史评估
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
  const [goal, setGoal] = useState(plan.goal);
  const [items, setItems] = useState<string[]>(plan.items);
  const [precautions, setPrecautions] = useState<string>(plan.precautions.join("\n"));

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">取消</button>
        <div className="text-[13px] font-semibold">修改康复方案 · {patient.name}</div>
        <button
          onClick={onSave}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground active:opacity-90"
        >
          <Save className="h-3 w-3" />保存
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
        <div className="rounded-2xl border bg-info/5 p-2.5 text-[11px] text-info">
          <Sparkles className="mr-1 inline h-3 w-3" />
          所有字段支持语音输入，按住右侧"麦克风"图标说话即可。
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">康复目标</div>
          <VoiceTextarea
            rows={2}
            value={goal}
            onChange={setGoal}
            voiceSample={`${patient.surgeryName ?? "术后"} · 14 日内屈膝 ≥110°，独立行走 100m，可上下楼梯`}
          />
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">每日训练计划</div>
          {items.map((it, i) => (
            <div key={i} className="mb-1.5">
              <VoiceTextarea
                rows={2}
                value={it}
                onChange={(v) => setItems((arr) => arr.map((x, idx) => (idx === i ? v : x)))}
                voiceSample="患者今日完成踝泵 30 次/h，被动屈膝 0-75°，无明显疼痛"
                small
              />
            </div>
          ))}
          <button
            onClick={() => setItems((arr) => [...arr, ""])}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-[11px] text-muted-foreground active:bg-muted/30"
          >
            <PlusCircle className="h-3 w-3" />新增一条训练
          </button>
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">注意事项</div>
          <VoiceTextarea
            rows={4}
            value={precautions}
            onChange={setPrecautions}
            voiceSample={"避免患肢负重 >50%\n如出现 38℃ 以上发热立即上报\n夜间睡眠保持患肢中立位"}
            small
          />
        </div>
      </div>
    </div>
  );
}

function VoiceTextarea({
  rows,
  value,
  onChange,
  voiceSample,
  small,
}: {
  rows: number;
  value: string;
  onChange: (v: string) => void;
  voiceSample: string;
  small?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const triggerVoice = () => {
    setRecording(true);
    setTimeout(() => {
      onChange(value ? `${value}\n${voiceSample}` : voiceSample);
      setRecording(false);
    }, 1200);
  };
  return (
    <div>
      <div className="flex items-start gap-1.5">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex-1 rounded-lg border bg-muted/20 p-2 outline-none focus:border-primary",
            small ? "text-[11px]" : "text-[12px]",
          )}
        />
        <button
          onClick={triggerVoice}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            recording ? "animate-pulse bg-destructive text-destructive-foreground" : "bg-card text-muted-foreground active:bg-muted/40",
          )}
          aria-label="语音输入"
        >
          <Mic className="h-3.5 w-3.5" />
        </button>
      </div>
      {recording && <div className="mt-1 text-[10px] text-destructive">● 正在录音，自动转文字...</div>}
    </div>
  );
}

function MeTab() {
  const weeklyPlan = [
    { label: "周一", value: 5 },
    { label: "周二", value: 7 },
    { label: "周三", value: 6 },
    { label: "周四", value: 8 },
    { label: "周五", value: 4 },
    { label: "周六", value: 3 },
    { label: "周日", value: 2 },
  ];
  const reachRate = [
    { label: "1月", value: 88 },
    { label: "2月", value: 90 },
    { label: "3月", value: 92 },
    { label: "4月", value: 94 },
  ];
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

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={Sparkles} label="AI 方案确认" value={35} delta="↑ 12%" tone="info" />
        <StatTile icon={ClipboardCheck} label="康复评估" value={48} tone="primary" />
        <StatTile icon={CheckCircle2} label="出院评估通过" value={18} delta="达标 94%" tone="success" />
        <StatTile icon={Edit3} label="方案修订" value={7} tone="warning" />
      </div>

      <ChartCard title="本周方案处理量" subtitle="共 35 份 · AI 直接采纳 28 份">
        <BarChart data={weeklyPlan} unit="份" color="var(--info)" />
      </ChartCard>

      <ChartCard title="康复达标率趋势" subtitle="近 4 个月">
        <LineChart data={reachRate} stroke="var(--success)" />
      </ChartCard>

      <ChartCard title="工作类型占比（本月）">
        <div className="space-y-2">
          <HBarRow label="AI 方案确认" value={35} total={108} color="var(--info)" />
          <HBarRow label="康复评估" value={48} total={108} color="var(--primary)" />
          <HBarRow label="出院评估" value={18} total={108} color="var(--success)" />
          <HBarRow label="方案修订" value={7} total={108} color="var(--warning)" />
        </div>
      </ChartCard>

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

/* ---------- 手术确认（治疗师同步，与医疗团队展示一致） ---------- */
function aiSurgConclusion(p: Patient): { recommendation: "go" | "hold"; summary: string; reasons: string[] } {
  const abnormal = p.preOpFindings?.filter((f) => f.abnormal) ?? [];
  if (abnormal.length === 0) {
    return {
      recommendation: "go",
      summary: "AI 结论：建议如期手术",
      reasons: ["术前各项检查指标均在正常范围", "无明显手术禁忌", "可按计划开展"],
    };
  }
  return {
    recommendation: "hold",
    summary: `AI 结论：建议暂缓手术（${abnormal.length} 项异常）`,
    reasons: abnormal.map((a) => `${a.label} ${a.value} 偏离正常范围，建议复查或会诊`),
  };
}

function SurgConfirmTab({
  list,
  decisions,
  onGo,
  onHold,
  onReturn,
}: {
  list: Patient[];
  decisions: Record<string, SurgDecision | undefined>;
  onGo: (p: Patient) => void;
  onHold: (p: Patient) => void;
  onReturn: (p: Patient) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
        <Sparkles className="mr-1 inline h-3 w-3" />
        AI 已根据值班医生录入的术前量表给出结论，治疗师需确认患者是否满足手术条件，不满足则延迟手术。
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border bg-card p-6 text-center text-[12px] text-muted-foreground">
          暂无待确认手术
        </div>
      )}

      {list.map((p) => {
        const d = decisions[p.id];
        const ai = aiSurgConclusion(p);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="border-b p-3">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                {p.side && (
                  <span className="rounded bg-warning/20 px-1 py-0.5 text-[9px] font-bold text-warning-foreground">
                    患侧 {p.side}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.diagnosis} · {p.surgeryName} · {p.director}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 border-b p-3">
              {p.preOpFindings?.map((f) => (
                <span
                  key={f.label}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px]",
                    f.abnormal ? "bg-destructive/10 font-bold text-destructive" : "bg-muted text-muted-foreground",
                  )}
                >
                  {f.label} {f.value}
                </span>
              ))}
            </div>

            <div className={cn("border-b p-3", ai.recommendation === "go" ? "bg-success/5" : "bg-destructive/5")}>
              <div className={cn("flex items-center gap-1 text-[11px] font-bold", ai.recommendation === "go" ? "text-success" : "text-destructive")}>
                <Sparkles className="h-3 w-3" />
                {ai.summary}
              </div>
              <ul className="mt-1 space-y-0.5 pl-3 text-[10px] text-muted-foreground">
                {ai.reasons.map((r, i) => (
                  <li key={i} className="list-disc">{r}</li>
                ))}
              </ul>
            </div>

            {d === "go" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-success/10 p-2 text-[10px] text-success">
                <CheckCircle2 className="h-3 w-3" />已确认满足手术条件，已同步主刀
              </div>
            )}
            {d === "hold" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-warning/10 p-2 text-[10px] text-warning-foreground">
                <AlertTriangle className="h-3 w-3" />已暂缓手术，理由已归档
              </div>
            )}
            {d === "return" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-[10px] text-destructive">
                <Trash2 className="h-3 w-3" />已退回手术待排
              </div>
            )}

            <div className="grid grid-cols-3 gap-0 border-t">
              <button
                onClick={() => onReturn(p)}
                className={cn(
                  "flex items-center justify-center gap-1 py-2.5 text-[11px] active:bg-muted/40",
                  d === "return" ? "bg-destructive/10 font-medium text-destructive" : "text-foreground",
                )}
              >
                <Trash2 className="h-3 w-3" />退回
              </button>
              <button
                onClick={() => onHold(p)}
                className={cn(
                  "flex items-center justify-center gap-1 border-l py-2.5 text-[11px] active:bg-muted/40",
                  d === "hold" ? "bg-warning/15 font-medium text-warning-foreground" : "text-foreground",
                )}
              >
                <AlertTriangle className="h-3 w-3" />暂缓
              </button>
              <button
                onClick={() => onGo(p)}
                className={cn(
                  "flex items-center justify-center gap-1 border-l py-2.5 text-[11px] active:bg-muted/40",
                  d === "go" ? "bg-primary/10 font-medium text-primary" : "text-foreground",
                )}
              >
                <CheckCircle2 className="h-3 w-3" />如期手术
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 出院备注 ---------- */
function DischargeSheet({
  patient,
  onClose,
  onConfirm,
}: {
  patient: Patient;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">取消</button>
        <div className="text-[13px] font-semibold">康复出院确认 · {patient.name}</div>
        <button
          disabled={!note.trim()}
          onClick={() => onConfirm(note.trim())}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
        >
          <Save className="h-3 w-3" />确认出院
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
        <div className="rounded-2xl border bg-warning/5 p-2.5 text-[11px] text-warning-foreground">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          确认出院前必须填写出院备注，所有角色（医生 / 护士 / 治疗师）均可查看。
        </div>
        <div className="rounded-2xl border bg-card p-3 text-[11px]">
          <div className="font-semibold">
            {patient.bedNo && `${patient.bedNo}床 · `}{patient.name} · {patient.surgeryName ?? patient.diagnosis}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            术日 {patient.surgeryDate ?? "—"} · 患侧 {patient.side ?? "—"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold">出院备注说明 *</div>
          <textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请填写康复达标情况、居家训练计划、复诊安排、注意事项..."
            className="w-full rounded-xl border bg-card p-3 text-[12px] outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}


