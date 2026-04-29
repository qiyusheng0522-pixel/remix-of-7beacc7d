import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Stethoscope,
  AlertTriangle,
  Calendar,
  Home,
  ClipboardEdit,
  User,
  Sparkles,
  FileSignature,
  ArrowLeft,
  Send,
  RotateCcw,
  MessageCircle,
  CalendarDays,
  Activity,
  ChevronRight,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card } from "./SecretaryWorkbench";
import { BarChart, ChartCard, DonutChart, StatTile } from "@/components/WorkStats";
import { ToastBanner } from "@/components/ActionSheet";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientChatListView, PatientChatEntryCard } from "@/components/PatientChatListSheet";
import { PatientListSheet } from "@/components/PatientListSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "preop" | "intraop" | "chat" | "me";
type Decision = "go" | "hold" | "return";

export function SurgicalTeamWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [decisions, setDecisions] = useState<Record<string, Decision | undefined>>({});
  const [reasonFor, setReasonFor] = useState<{ patient: Patient; decision: "hold" | "return" } | null>(null);
  const [intraOpFor, setIntraOpFor] = useState<Patient | null>(null);
  const [chatPatient, setChatPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const todaySurgery = patients.filter((p) => p.status === "in-surgery");
  const myPatients = patients.filter((p) => p.director === "王主任");
  const tasks = todayTasks["surgical-team"];

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <PhoneShell
      title="手术团队工作台"
      subtitle="王主任团队 · 主刀视角"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "preop", label: "手术确认", icon: Calendar, badge: tomorrowSurgery.length },
            { key: "intraop", label: "术中量表", icon: ClipboardEdit, badge: todaySurgery.length },
            { key: "chat", label: "患者沟通", icon: MessageCircle, badge: 3 },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab
          tomorrow={tomorrowSurgery.length}
          today={todaySurgery.length}
          preopPending={tomorrowSurgery.filter((p) => !decisions[p.id]).length}
          intraopPending={todaySurgery.length}
          chatPending={3}
          tasks={tasks}
          onJump={(t) => setTab(t)}
        />
      )}
      {tab === "preop" && (
        <PreOpTab
          list={tomorrowSurgery}
          decisions={decisions}
          onGo={(p) => {
            setDecisions((s) => ({ ...s, [p.id]: "go" }));
            showToast(`已确认如期手术：${p.name}`);
          }}
          onHold={(p) => setReasonFor({ patient: p, decision: "hold" })}
          onReturn={(p) => setReasonFor({ patient: p, decision: "return" })}
        />
      )}
      {tab === "intraop" && (
        <IntraOpTab
          list={todaySurgery}
          onOpen={(p) => setIntraOpFor(p)}
        />
      )}
      {tab === "chat" && (
        <PatientChatListView
          patients={myPatients}
          unread={{ [myPatients[0]?.id ?? ""]: 2, [myPatients[1]?.id ?? ""]: 1 }}
          onOpen={(p) => setChatPatient(p)}
        />
      )}
      {tab === "me" && <MeTab />}

      {chatPatient && (
        <PatientChatSheet patient={chatPatient} onClose={() => setChatPatient(null)} selfRole="主刀" />
      )}
      {showPatientList && (
        <PatientListSheet
          inpatientList={myPatients.filter((p) => p.department === "inpatient")}
          outpatientList={myPatients.filter((p) => p.department === "outpatient")}
          onClose={() => setShowPatientList(false)}
          onArchive={(p) => { setShowPatientList(false); setChatPatient(p); }}
          onChat={(p) => { setShowPatientList(false); setChatPatient(p); }}
        />
      )}

      {reasonFor && (
        <ReasonSheet
          patient={reasonFor.patient}
          decision={reasonFor.decision}
          onClose={() => setReasonFor(null)}
          onSubmit={(reason) => {
            setDecisions((s) => ({ ...s, [reasonFor.patient.id]: reasonFor.decision }));
            showToast(
              reasonFor.decision === "hold"
                ? `已暂缓 ${reasonFor.patient.name}（${reason.slice(0, 12)}...）`
                : `已退回手术待排：${reasonFor.patient.name}`,
            );
            setReasonFor(null);
          }}
        />
      )}
      {intraOpFor && (
        <IntraOpEditor
          patient={intraOpFor}
          onClose={() => setIntraOpFor(null)}
          onSave={() => {
            showToast(`术中量表已推送至治疗师 → ${intraOpFor.name}`);
            setIntraOpFor(null);
          }}
        />
      )}
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tomorrow,
  today,
  preopPending,
  intraopPending,
  chatPending,
  tasks,
  onJump,
}: {
  tomorrow: number;
  today: number;
  preopPending: number;
  intraopPending: number;
  chatPending: number;
  tasks: typeof todayTasks["surgical-team"];
  onJump: (t: TabKey) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[10px] opacity-80">主刀医生 · 王主任团队</div>
        <div className="mt-1 text-base font-bold">王主任，您好 👋</div>
        <div className="mt-0.5 text-[11px] opacity-90">今日工作台 · 点击数字可跳转对应清单</div>
      </div>

      {/* 今日工作台统计 - 全部可点击跳转（合并卡片） */}
      <div className="grid grid-cols-2 gap-2">
        <WorkStatCard
          icon={CalendarDays}
          label="明日手术确认"
          value={tomorrow}
          sub={preopPending > 0 ? `${preopPending} 例待 AI 结论审核` : "全部已确认"}
          badge={preopPending}
          tone="bg-primary/10 text-primary"
          onClick={() => onJump("preop")}
        />
        <WorkStatCard
          icon={FileSignature}
          label="今日术中量表"
          value={today}
          sub={today > 0 ? `${today} 例进行中 · ${intraopPending} 份待填写` : "今日无手术"}
          badge={intraopPending}
          tone="bg-warning/15 text-warning-foreground"
          onClick={() => onJump("intraop")}
        />
      </div>

      <PatientChatEntryCard
        unreadCount={chatPending}
        patientCount={Math.min(chatPending, 3)}
        onClick={() => onJump("chat")}
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
              </div>
              <div className="ml-3.5 mt-0.5 text-[10px] text-muted-foreground">
                {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                {t.due && ` · ${t.due}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

function WorkStatCard({
  icon: Icon,
  label,
  value,
  sub,
  badge,
  tone,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  badge?: number;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col rounded-2xl border bg-card p-3 text-left active:bg-muted/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
            待办
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</div>
    </button>
  );
}

/* ---------- AI 结论生成（基于术前量表） ---------- */
function aiConclusion(p: Patient): { recommendation: "go" | "hold"; summary: string; reasons: string[] } {
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

function PreOpTab({
  list,
  decisions,
  onGo,
  onHold,
  onReturn,
}: {
  list: typeof patients;
  decisions: Record<string, Decision | undefined>;
  onGo: (p: Patient) => void;
  onHold: (p: Patient) => void;
  onReturn: (p: Patient) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
        <Sparkles className="mr-1 inline h-3 w-3" />
        AI 已根据值班医生录入的术前量表给出结论，请确认是否如期手术。
      </div>

      {list.map((p) => {
        const d = decisions[p.id];
        const ai = aiConclusion(p);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="border-b p-3">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.diagnosis} · {p.surgeryName} · {p.director}
              </div>
            </div>

            {/* 术前量表 */}
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

            {/* AI 结论 */}
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

            {/* 已决策状态 */}
            {d === "go" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-success/10 p-2 text-[10px] text-success">
                <CheckCircle2 className="h-3 w-3" />已确认如期手术，已通知麻醉与治疗师
              </div>
            )}
            {d === "hold" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-warning/10 p-2 text-[10px] text-warning-foreground">
                <AlertTriangle className="h-3 w-3" />已暂缓手术，理由已归档
              </div>
            )}
            {d === "return" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-[10px] text-destructive">
                <RotateCcw className="h-3 w-3" />已退回手术待排
              </div>
            )}

            {/* 决策按钮 */}
            <div className="grid grid-cols-3 gap-0 border-t">
              <button
                onClick={() => onReturn(p)}
                className={cn(
                  "flex items-center justify-center gap-1 py-2.5 text-[11px] active:bg-muted/40",
                  d === "return" ? "bg-destructive/10 font-medium text-destructive" : "text-foreground",
                )}
              >
                <RotateCcw className="h-3 w-3" />退回
              </button>
              <button
                onClick={() => onHold(p)}
                className={cn(
                  "flex items-center justify-center gap-1 border-l py-2.5 text-[11px] active:bg-muted/40",
                  d === "hold" ? "bg-warning/15 font-medium text-warning-foreground" : "text-foreground",
                )}
              >
                <XCircle className="h-3 w-3" />暂缓
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

/* ---------- 暂缓 / 退回 理由收集 ---------- */
function ReasonSheet({
  patient,
  decision,
  onClose,
  onSubmit,
}: {
  patient: Patient;
  decision: "hold" | "return";
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const presets =
    decision === "hold"
      ? ["Hb 偏低，需输血或铁剂", "血压未控制，需内科会诊", "凝血异常，需血液科评估", "近 1 周感染发热"]
      : ["患者临时拒绝手术", "需补充影像学检查", "改约其他时段", "需多学科会诊后再排期"];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">
          {decision === "hold" ? "暂缓手术" : "退回手术待排"} · {patient.name}
        </div>
        <div className="w-4" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-2xl border bg-card p-3 text-[11px] text-muted-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{patient.bedNo}床</span>{" "}
          {patient.name} · {patient.surgeryName}
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold">常见理由（点选）</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setReason((r) => (r ? `${r}；${p}` : p))}
                className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-foreground active:bg-muted/40"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold">详细说明 *</div>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={decision === "hold" ? "请填写暂缓理由，将通知治疗师与护士..." : "请填写退回理由，将通知值班医生重新排期..."}
            className="w-full rounded-xl border bg-card p-3 text-[12px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="border-t bg-card p-3">
        <button
          disabled={!reason.trim()}
          onClick={() => onSubmit(reason)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-medium text-primary-foreground disabled:opacity-40"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="h-4 w-4" />提交并通知相关角色
        </button>
      </div>
    </div>
  );
}

/* ---------- 术中量表列表 ---------- */
function IntraOpTab({ list, onOpen }: { list: typeof patients; onOpen: (p: Patient) => void }) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-primary/5 p-3 text-[11px] text-primary">
        ✏️ 团队任一成员可填写，保存后自动同步治疗师。
      </div>

      {list.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen(p)}
          className="block w-full overflow-hidden rounded-2xl border bg-card text-left active:bg-muted/30"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between p-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
                <span className="text-sm font-bold">{p.name}</span>
                <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-medium text-warning-foreground">
                  手术中
                </span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.surgeryName} · 1号台 · 主刀 王主任
              </div>
            </div>
            <FileSignature className="h-4 w-4 text-primary" />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ---------- 术中量表编辑 ---------- */
function IntraOpEditor({ patient, onClose, onSave }: { patient: Patient; onClose: () => void; onSave: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">术中量表 · {patient.name}</div>
        <button onClick={onSave} className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
          保存推送
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="rounded-2xl border bg-warning/5 p-3 text-[10px] text-warning-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-bold text-primary">{patient.bedNo}床</span>{" "}
          {patient.surgeryName} · 朱医生 编辑中
        </div>
        <FormField label="麻醉方式" value="全麻 + 神经阻滞" />
        <FormField label="术中出血量" value="180 ml" />
        <FormField label="假体型号" value="DePuy Sigma #4" />
        <FormField label="手术时长" value="92 min" />
        <FormField label="术中并发症" value="无" />
        <div>
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">医生建议（推送至治疗师）</div>
          <textarea
            className="w-full rounded-lg border bg-card p-2 text-[11px] outline-none focus:border-primary"
            rows={4}
            defaultValue="术后第1日开始 SLR 训练；屈膝训练 0-60° 起步；注意伤口引流，24小时后拔管。"
          />
        </div>
      </div>
      <div className="border-t bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
        保存后将推送至 <span className="font-medium text-primary">朱年鑫 治疗师</span>
      </div>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-2.5 py-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input className="bg-transparent text-right text-[11px] font-medium outline-none" defaultValue={value} />
    </div>
  );
}

function MeTab() {
  const [showDetails, setShowDetails] = useState(false);
  const monthlySurgery = [
    { label: "1月", value: 22 },
    { label: "2月", value: 28 },
    { label: "3月", value: 31 },
    { label: "4月", value: 26 },
  ];
  const team = [
    { n: "王主任", r: "主刀医师", role: "组长", count: 26 },
    { n: "李医生", r: "一助", role: "成员", count: 21 },
    { n: "陈医生", r: "二助", role: "成员", count: 18 },
    { n: "朱年鑫", r: "治疗师", role: "成员", count: 0 },
  ];
  const teamSurgeryTotal = team.reduce((s, m) => s + m.count, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4 text-center">
        <div className="relative mx-auto h-16 w-16">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            王
          </div>
          <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-bold text-warning-foreground shadow">
            组长
          </span>
        </div>
        <div className="mt-2 text-base font-bold">王主任 · 组长</div>
        <div className="text-[11px] text-muted-foreground">骨科主任医师 · 主刀 · 王主任手术团队</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={CheckCircle2} label="本月手术" value={26} delta="↑ 4 例" tone="primary" />
        <StatTile icon={Sparkles} label="AI 采纳率" value="91%" tone="info" />
        <StatTile icon={XCircle} label="暂缓 / 退回" value={3} tone="warning" />
        <StatTile icon={FileSignature} label="术中量表" value={26} tone="success" />
      </div>

      <ChartCard title="近 4 个月手术量" subtitle="共 107 例 · 成功率 100%">
        <BarChart data={monthlySurgery} unit="例" color="var(--primary)" />
      </ChartCard>

      <ChartCard title="手术决策分布（本月）">
        <div className="flex items-center justify-around py-2">
          <DonutChart value={88} label="如期手术" color="var(--success)" />
          <DonutChart value={8} label="暂缓" color="var(--warning)" />
          <DonutChart value={4} label="退回" color="var(--destructive)" />
        </div>
      </ChartCard>

      {/* 团队手术统计 - 组长视角 */}
      <Card title="我的团队 · 手术统计" rightLabel={`本月共 ${teamSurgeryTotal} 例`}>
        <button
          onClick={() => setShowDetails(true)}
          className="flex w-full items-center justify-between border-b bg-info/5 px-3 py-2 text-[11px] text-info active:bg-info/10"
        >
          <span className="flex items-center gap-1">
            <FileSignature className="h-3 w-3" />
            查看团队手术明细（自定义筛选）
          </span>
          <ChevronRight className="h-3 w-3" />
        </button>
        {team.map((x) => (
          <div key={x.n} className="flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {x.n.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                {x.n}
                {x.role === "组长" && (
                  <span className="rounded bg-warning/20 px-1 py-0.5 text-[9px] font-bold text-warning-foreground">
                    组长
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{x.r}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-primary">{x.count}</div>
              <div className="text-[9px] text-muted-foreground">本月手术</div>
            </div>
          </div>
        ))}
      </Card>

      {showDetails && <TeamSurgeryDetailsSheet onClose={() => setShowDetails(false)} />}
    </div>
  );
}

/* ---------- 团队手术明细（支持自定义筛选） ---------- */
function TeamSurgeryDetailsSheet({ onClose }: { onClose: () => void }) {
  const [member, setMember] = useState<string>("全部");
  const [period, setPeriod] = useState<"本周" | "本月" | "近3月">("本月");
  const [type, setType] = useState<string>("全部");

  const allRecords = [
    { date: "2024-04-22", patient: "孙顺英", surgeon: "王主任", type: "肩关节镜", duration: "92 min" },
    { date: "2024-04-21", patient: "范芳进", surgeon: "李医生", type: "髌骨修补", duration: "65 min" },
    { date: "2024-04-19", patient: "杨成轩", surgeon: "王主任", type: "跟腱缝合", duration: "70 min" },
    { date: "2024-04-17", patient: "何宗兰", surgeon: "陈医生", type: "肩袖修补", duration: "85 min" },
    { date: "2024-04-15", patient: "胡国玉", surgeon: "王主任", type: "PCL 重建", duration: "110 min" },
    { date: "2024-04-12", patient: "赵晓敏", surgeon: "李医生", type: "ACL 重建", duration: "120 min" },
    { date: "2024-04-08", patient: "周晨光", surgeon: "陈医生", type: "半月板缝合", duration: "55 min" },
  ];
  const surgeons = ["全部", "王主任", "李医生", "陈医生"];
  const types = ["全部", "ACL 重建", "PCL 重建", "肩关节镜", "肩袖修补", "髌骨修补", "跟腱缝合", "半月板缝合"];
  const filtered = allRecords.filter(
    (r) => (member === "全部" || r.surgeon === member) && (type === "全部" || r.type === type),
  );

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">团队手术明细</div>
        <div className="w-4" />
      </div>

      {/* 筛选条件 */}
      <div className="space-y-2 border-b bg-card p-3">
        <FilterRow label="成员" options={surgeons} value={member} onChange={setMember} />
        <FilterRow label="时间" options={["本周", "本月", "近3月"]} value={period} onChange={(v) => setPeriod(v as never)} />
        <FilterRow label="术式" options={types} value={type} onChange={setType} />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="flex items-center justify-between px-1 text-[11px]">
          <span className="text-muted-foreground">共 {filtered.length} 例</span>
          <span className="text-info">支持点击查看详情</span>
        </div>
        {filtered.map((r, i) => (
          <button
            key={i}
            className="flex w-full items-center justify-between rounded-2xl border bg-card p-3 text-left active:bg-muted/30"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold">{r.patient}</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">{r.type}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {r.date} · 主刀 {r.surgeon} · {r.duration}
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px]",
              value === o
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground active:bg-muted/40",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}


