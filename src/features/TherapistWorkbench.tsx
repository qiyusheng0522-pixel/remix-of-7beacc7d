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
  Activity,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction } from "./SecretaryWorkbench";
import { BarChart, ChartCard, HBarRow, LineChart, StatTile } from "@/components/WorkStats";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientChatListSheet, PatientChatEntryCard } from "@/components/PatientChatListSheet";
import { PatientArchiveSheet } from "@/components/PatientArchiveSheet";
import { PatientListSheet } from "@/components/PatientListSheet";
import { RehabRecordSheet } from "@/components/RehabRecordSheet";
import { PreOpRehabAssessmentSheet } from "@/components/PreOpRehabAssessmentSheet";
import type { PreOpRehabAssessment } from "@/components/PreOpRehabAssessmentSheet";
import { ActionSheet, ToastBanner } from "@/components/ActionSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "plans" | "records" | "me";
type Overlay =
  | { kind: "chat"; patient: Patient }
  | { kind: "chat-list" }
  | { kind: "archive"; patient: Patient }
  | { kind: "patient-list" }
  | { kind: "discharge"; patient: Patient }
  | null;

// 康复方案模板库：默认 AI 方案 + 可手动切换的备选方案
interface PlanTemplate {
  key: string;
  name: string;
  desc: string;
  tag: string;
}

const PLAN_TEMPLATES: PlanTemplate[] = [
  { key: "ai-standard", name: "AI 标准方案", desc: "默认推荐 · 依据术中量表与医生建议生成", tag: "默认" },
  { key: "accelerated", name: "加速康复方案", desc: "进度更快，适合年轻、肌力基础好的患者", tag: "激进" },
  { key: "conservative", name: "保守渐进方案", desc: "进度放缓，适合疼痛明显或骨质疏松患者", tag: "保守" },
  { key: "home-based", name: "居家主导方案", desc: "以居家训练为主，每周 2 次门诊复查", tag: "居家" },
];

const aiRehabPlan = (patient: Patient, templateKey = "ai-standard") => {
  const base = {
    goal: `${patient.surgeryName ?? "术后"} · 7 日内屈膝 ≥90°，独立扶助行器行走 50m`,
    items: [
      "术后第 1 日：踝泵 30 次/h，SLR 直腿抬高 3 组×10 次",
      "术后第 2 日：被动屈膝 0-60°，CPM 机辅助",
      "术后第 3 日：床旁站立 5 min，扶助行器行走 5m",
      "术后第 5 日：屈膝 ≥75°，扶助行器行走 30m",
      "术后第 7 日：屈膝 ≥90°，独立行走 50m，可上下楼梯",
    ],
    precautions: ["避免患肢负重 >50%", "如出现 38℃ 以上发热立即上报", "夜间睡眠保持患肢中立位"],
  };
  if (templateKey === "accelerated")
    return {
      goal: `${patient.surgeryName ?? "术后"} · 5 日内屈膝 ≥90°，独立行走 80m`,
      items: [
        "术后第 1 日：踝泵 50 次/h，SLR 直腿抬高 5 组×15 次，主动屈膝 0-45°",
        "术后第 2 日：被动屈膝 0-75°，CPM 机辅助 2h，床旁站立 5 min",
        "术后第 3 日：屈膝 ≥85°，扶助行器行走 30m，静蹲靠墙 3 组",
        "术后第 4 日：屈膝 ≥90°，独立行走 50m，尝试上下台阶",
        "术后第 5 日：独立行走 80m，上下楼梯，达标可启动出院评估",
      ],
      precautions: ["密切观察肿胀，冰敷 3 次/日", "疼痛 VAS ≥7 立即降级方案", "每日复查伤口"],
    };
  if (templateKey === "conservative")
    return {
      goal: `${patient.surgeryName ?? "术后"} · 10 日内屈膝 ≥90°，扶助行器行走 30m`,
      items: [
        "术后第 1-2 日：踝泵 20 次/h，股四头肌等长收缩 3 组×10 次",
        "术后第 3 日：被动屈膝 0-45°，CPM 机辅助 1h",
        "术后第 5 日：屈膝 ≥60°，床旁坐起，暂不负重站立",
        "术后第 7 日：屈膝 ≥75°，扶助行器站立 3 min",
        "术后第 10 日：屈膝 ≥90°，扶助行器行走 30m",
      ],
      precautions: ["全程不负重或部分负重", "肿胀加重即暂停进阶", "睡眠抬高患肢"],
    };
  if (templateKey === "home-based")
    return {
      goal: `${patient.surgeryName ?? "术后"} · 居家训练 2 周，门诊复查 2 次/周`,
      items: [
        "每日：踝泵 30 次/h，SLR 直腿抬高 3 组×10 次（视频跟练）",
        "每日：被动屈膝至可耐受角度，记录角度打卡",
        "隔日：扶助行器室内行走 10-20m",
        "每周一/四：门诊复查，调整下一阶段动作",
        "第 14 日：门诊评估屈膝 ≥90°，达标转巩固期",
      ],
      precautions: ["居家训练需家属陪同", "每日 App 打卡上传角度照片", "异常疼痛/发热立即门诊就诊"],
    };
  return base;
};

type PlanStatus = "ai-draft" | "confirmed" | "edited" | "empty";

export function TherapistWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [actionPatient, setActionPatient] = useState<Patient | null>(null);
  const [planEditor, setPlanEditor] = useState<Patient | null>(null);
  const [recordFor, setRecordFor] = useState<Patient | null>(null);
  const [preOpFor, setPreOpFor] = useState<Patient | null>(null);
  const [preOpAssessments, setPreOpAssessments] = useState<Record<string, PreOpRehabAssessment>>({});
  const [planStatuses, setPlanStatuses] = useState<Record<string, PlanStatus>>({
    p7: "ai-draft",
    p8: "confirmed",
    p9: "edited",
  });
  const [planChoices, setPlanChoices] = useState<Record<string, string>>({});
  const [planPicker, setPlanPicker] = useState<Patient | null>(null);
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
          chatPendingCount={3}
          onOpenPatients={() => setOverlay({ kind: "patient-list" })}
          onOpenChat={() => setOverlay({ kind: "chat-list" })}
          onOpenPlans={() => setTab("plans")}
          onOpenRecords={() => setTab("records")}
        />
      )}
      {tab === "plans" && (
        <PlansTab
          list={myPatients}
          statuses={planStatuses}
          choices={planChoices}
          onPickPlan={(p) => setPlanPicker(p)}
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
          tomorrowSurgery={tomorrowSurgery}
          assessments={preOpAssessments}
          onPreOp={(p) => setPreOpFor(p)}
          onSelect={(p) => setActionPatient(p)}
          onAddRecord={(p) => setRecordFor(p)}
          onDischarge={(p) => setOverlay({ kind: "discharge", patient: p })}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
        />
      )}
      {tab === "me" && <MeTab />}

      {planPicker && (
        <PlanPickerSheet
          patient={planPicker}
          current={planChoices[planPicker.id] ?? "ai-standard"}
          onClose={() => setPlanPicker(null)}
          onSelect={(key) => {
            const t = PLAN_TEMPLATES.find((x) => x.key === key)!;
            setPlanChoices((c) => ({ ...c, [planPicker.id]: key }));
            setPlanStatuses((s) => ({ ...s, [planPicker.id]: "ai-draft" }));
            setPlanPicker(null);
            showToast(`已切换为「${t.name}」：${planPicker.name}`);
          }}
        />
      )}
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
      {preOpFor && (
        <PreOpRehabAssessmentSheet
          key={preOpFor.id}
          patient={preOpFor}
          initial={preOpAssessments[preOpFor.id]}
          onClose={() => setPreOpFor(null)}
          onSave={(assessment) => {
            setPreOpAssessments((current) => ({ ...current, [preOpFor.id]: assessment }));
            showToast(`已保存 ${preOpFor.name} 的术前康复评估`);
            setPreOpFor(null);
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
      {overlay?.kind === "chat-list" && (
        <PatientChatListSheet
          subtitle="与负责患者直接沟通"
          patients={myPatients}
          unread={{ [myPatients[0]?.id ?? ""]: 2, [myPatients[1]?.id ?? ""]: 1 }}
          onClose={() => setOverlay(null)}
          onOpen={(p) => setOverlay({ kind: "chat", patient: p })}
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
  chatPendingCount,
  onOpenPatients,
  onOpenChat,
  onOpenPlans,
  onOpenRecords,
}: {
  tasks: typeof todayTasks.therapist;
  inpatientCount: number;
  outpatientCount: number;
  planPendingCount: number;
  chatPendingCount: number;
  onOpenPatients: () => void;
  onOpenChat: () => void;
  onOpenPlans: () => void;
  onOpenRecords: () => void;
}) {
  const assessPendingCount = tasks.filter((t) => t.type === "discharge").length;
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
          icon={Sparkles}
          label="今日待办"
          sub={`${tasks.length} 项任务`}
          value={tasks.length}
          tone="bg-info/10 text-info"
          onClick={onOpenRecords}
        />
      </div>

      <PatientChatEntryCard
        unreadCount={chatPendingCount}
        patientCount={Math.min(chatPendingCount, 3)}
        onClick={onOpenChat}
      />

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
  choices,
  onPickPlan,
  onEdit,
  onConfirm,
  onClear,
  onChat,
  onArchive,
}: {
  list: typeof patients;
  statuses: Record<string, PlanStatus>;
  choices: Record<string, string>;
  onPickPlan: (p: Patient) => void;
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
        const planKey = choices[p.id] ?? "ai-standard";
        const template = PLAN_TEMPLATES.find((t) => t.key === planKey) ?? PLAN_TEMPLATES[0];
        const plan = aiRehabPlan(p, planKey);
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
                <button
                  onClick={() => onPickPlan(p)}
                  className="mt-1 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary active:opacity-80"
                >
                  <HeartPulse className="h-2.5 w-2.5" />
                  {template.name}
                  <ChevronRight className="h-2.5 w-2.5" />
                </button>
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
  tomorrowSurgery,
  assessments,
  onPreOp,
  onSelect,
  onAddRecord,
  onDischarge,
  onArchive,
}: {
  inpatientList: Patient[];
  tomorrowSurgery: Patient[];
  assessments: Record<string, PreOpRehabAssessment>;
  onPreOp: (p: Patient) => void;
  onSelect: (p: Patient) => void;
  onAddRecord: (p: Patient) => void;
  onDischarge: (p: Patient) => void;
  onArchive: (p: Patient) => void;
}) {
  const [sub, setSub] = useState<"tomorrow" | "postop">("postop");
  // 术后康复 = 已手术 / 术后观察 / 康复中
  const postOpList = inpatientList;
  const visible = sub === "tomorrow" ? tomorrowSurgery : postOpList;

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-info/5 p-2.5 text-[11px] text-info">
        <ClipboardCheck className="mr-1 inline h-3 w-3" />
        住院康复分为「明日手术」（术前康复评估）与「术后康复」（治疗记录）。
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-full border bg-muted/30 p-0.5 text-[12px]">
        <button
          onClick={() => setSub("tomorrow")}
          className={cn(
            "rounded-full py-1.5 font-medium transition-colors",
            sub === "tomorrow" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          明日手术 · {tomorrowSurgery.length}
        </button>
        <button
          onClick={() => setSub("postop")}
          className={cn(
            "rounded-full py-1.5 font-medium transition-colors",
            sub === "postop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          术后康复 · {postOpList.length}
        </button>
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border bg-card p-6 text-center text-[12px] text-muted-foreground">
          {sub === "tomorrow" ? "暂无明日手术患者" : "暂无术后康复患者"}
        </div>
      )}

      {/* 明日手术：只填写术前康复评估表 */}
      {sub === "tomorrow" &&
        visible.map((p) => {
          const saved = assessments[p.id];
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
              <button onClick={() => onArchive(p)} className="block w-full border-b p-3 text-left active:bg-muted/30">
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
                  <span className="ml-auto rounded bg-info/15 px-1.5 py-0.5 text-[9px] font-bold text-info">
                    明日手术
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {p.surgeryName} · 术日 {p.surgeryDate} · 主刀 {p.director}
                </div>
              </button>

              <div className="border-b px-3 py-2 text-[11px] text-muted-foreground">
                {saved ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />术前康复评估已填写</span> : "术前康复评估待填写"}
              </div>

              <div className="grid grid-cols-2 gap-0 border-t">
                <button
                  onClick={() => onArchive(p)}
                  className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40"
                >
                  <FileSearch className="h-3 w-3" />患者档案
                </button>
                <button
                  onClick={() => onPreOp(p)}
                  className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary active:bg-muted/40"
                >
                  <PlusCircle className="h-3 w-3" />{saved ? "查看 / 修改评估" : "填写术前评估"}
                </button>
              </div>
            </div>
          );
        })}

      {/* 术后康复：增加筛选与排序 */}
      {sub === "postop" && <PostOpList list={visible} onSelect={onSelect} onAddRecord={onAddRecord} onDischarge={onDischarge} />}
    </div>
  );
}

/* ---------- 术后康复列表（含状态/病症筛选 + 时间排序） ---------- */
function PostOpList({
  list,
  onSelect,
  onAddRecord,
  onDischarge,
}: {
  list: Patient[];
  onSelect: (p: Patient) => void;
  onAddRecord: (p: Patient) => void;
  onDischarge: (p: Patient) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "in-surgery" | "post-op" | "rehab">("all");
  const [diseaseFilter, setDiseaseFilter] = useState<string>("all");
  const [sort, setSort] = useState<"surgery-asc" | "surgery-desc" | "postdays-desc">("postdays-desc");

  // 提取所有"病症"（按 diagnosis 简短关键字）
  const diseases = Array.from(
    new Set(list.map((p) => (p.diagnosis ?? "").split(/[,，;；]/)[0].trim()).filter(Boolean)),
  );

  // 计算 周几 与 术后 X 天
  const today = new Date("2024-04-22");
  const weekdayCN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const enrich = (p: Patient) => {
    const d = p.surgeryDate ? new Date(p.surgeryDate) : null;
    const days = d ? Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000)) : 0;
    const wk = d ? weekdayCN[d.getDay()] : "—";
    return { p, days, wk, dateNum: d ? d.getTime() : 0 };
  };

  let rows = list.map(enrich);
  if (statusFilter !== "all") rows = rows.filter((r) => r.p.status === statusFilter);
  if (diseaseFilter !== "all") rows = rows.filter((r) => (r.p.diagnosis ?? "").includes(diseaseFilter));
  if (sort === "surgery-asc") rows.sort((a, b) => a.dateNum - b.dateNum);
  else if (sort === "surgery-desc") rows.sort((a, b) => b.dateNum - a.dateNum);
  else rows.sort((a, b) => b.days - a.days);

  return (
    <>
      {/* 快速筛选 */}
      <div className="space-y-1.5 rounded-2xl border bg-card p-2.5">
        <FilterRow label="状态">
          {[
            { k: "all", l: "全部" },
            { k: "in-surgery", l: "今日术后" },
            { k: "post-op", l: "术后观察" },
            { k: "rehab", l: "康复中" },
          ].map((o) => (
            <Chip key={o.k} active={statusFilter === o.k} onClick={() => setStatusFilter(o.k as typeof statusFilter)}>
              {o.l}
            </Chip>
          ))}
        </FilterRow>
        {diseases.length > 0 && (
          <FilterRow label="病症">
            <Chip active={diseaseFilter === "all"} onClick={() => setDiseaseFilter("all")}>全部</Chip>
            {diseases.map((d) => (
              <Chip key={d} active={diseaseFilter === d} onClick={() => setDiseaseFilter(d)}>
                {d}
              </Chip>
            ))}
          </FilterRow>
        )}
        <FilterRow label="排序">
          <Chip active={sort === "postdays-desc"} onClick={() => setSort("postdays-desc")}>术后天数 ↓</Chip>
          <Chip active={sort === "surgery-desc"} onClick={() => setSort("surgery-desc")}>手术日期 ↓</Chip>
          <Chip active={sort === "surgery-asc"} onClick={() => setSort("surgery-asc")}>手术日期 ↑</Chip>
        </FilterRow>
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border bg-card p-6 text-center text-[12px] text-muted-foreground">
          无符合条件的患者
        </div>
      )}

      {rows.map(({ p, days, wk }) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => onSelect(p)} className="block w-full border-b p-3 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              {p.bedNo ? (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
              ) : (
                <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-bold text-info">门诊</span>
              )}
              <span className="text-sm font-bold">{p.name}</span>
              <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
              {p.side && (
                <span className="rounded bg-warning/20 px-1 py-0.5 text-[9px] font-bold text-warning-foreground">
                  患侧 {p.side}
                </span>
              )}
              {p.status === "rehab" && p.department === "inpatient" && <Pill cls="bg-success/15 text-success">康复达标</Pill>}
              {p.status === "post-op" && <Pill cls="bg-info/15 text-info">术后观察</Pill>}
              {p.status === "in-surgery" && <Pill cls="bg-warning/20 text-warning-foreground">今日术后</Pill>}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {p.surgeryName ?? p.diagnosis}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              {p.surgeryDate && <span>手术日 {p.surgeryDate}（{wk}）</span>}
              <span>· 术后第 {days} 天</span>
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
              <PlusCircle className="h-3 w-3" />治疗记录
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
                onClick={() => onAddRecord(p)}
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary active:bg-muted/40"
              >
                <PlusCircle className="h-3 w-3" />治疗记录
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <div className="mt-1 w-9 shrink-0 text-[10px] font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground active:bg-muted/40",
      )}
    >
      {children}
    </button>
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



// 方案选择弹层：默认 AI 标准方案，可手动切换其他方案
function PlanPickerSheet({
  patient,
  current,
  onClose,
  onSelect,
}: {
  patient: Patient;
  current: string;
  onClose: () => void;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">选择康复方案 · {patient.name}</div>
        <span className="w-4" />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
          <Sparkles className="mr-1 inline h-3 w-3" />
          默认使用 AI 标准方案，可根据患者情况手动切换为其他方案；切换后需重新确认。
        </div>
        {PLAN_TEMPLATES.map((t) => {
          const active = t.key === current;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={cn(
                "w-full rounded-2xl border p-3 text-left active:opacity-90",
                active ? "border-primary bg-primary/5" : "bg-card",
              )}
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold">{t.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px]",
                      t.key === "ai-standard" ? "bg-info/10 text-info" : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {t.tag}
                  </span>
                </div>
                {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{t.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
