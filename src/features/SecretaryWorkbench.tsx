import { useState } from "react";
import {
  Phone,
  BellRing,
  BedDouble,
  Hospital,
  Camera,
  Clock,
  Search,
  Bell,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Home,
  ClipboardList,
  User,
  MessageCircle,
  FileSearch,
  Activity,
  HeartPulse,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientArchiveSheet } from "@/components/PatientArchiveSheet";
import { ActionSheet, ToastBanner } from "@/components/ActionSheet";
import { HandoverSheet } from "@/components/HandoverSheet";
import { VitalsSheet } from "@/components/VitalsSheet";
import { EducationPushSheet } from "@/components/EducationPushSheet";
import { FollowUpSheet } from "@/components/FollowUpSheet";
import { BarChart, ChartCard, HBarRow, StatTile } from "@/components/WorkStats";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "outpatient" | "inpatient" | "followup" | "me";
type Overlay =
  | { kind: "chat"; patient: Patient }
  | { kind: "archive"; patient: Patient }
  | { kind: "vitals"; patient: Patient }
  | { kind: "handover" }
  | { kind: "education"; candidates: Patient[]; lockSinglePatient?: boolean }
  | { kind: "followup"; candidates: Patient[] }
  | null;

export function SecretaryWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [actionPatient, setActionPatient] = useState<Patient | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pendingAdmission = patients.filter((p) => p.status === "outpatient-pending");
  const inpatientPatients = patients.filter((p) => p.department === "inpatient");
  const followUpPatients = patients.filter(
    (p) => p.status === "follow-up" || p.status === "post-op" || p.status === "rehab",
  );
  const followUpPending = followUpPatients.filter((p) => p.followUpStatus !== "done");
  const tasks = todayTasks.secretary;

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  const handleTaskClick = (taskType: string) => {
    if (taskType === "handover") setOverlay({ kind: "handover" });
    else if (taskType === "education") setOverlay({ kind: "education", candidates: pendingAdmission });
    else if (taskType === "nursing") {
      const target = inpatientPatients.find((p) => p.bedNo === "05");
      if (target) setOverlay({ kind: "vitals", patient: target });
    } else if (taskType === "call") setTab("outpatient");
    else if (taskType === "admission") setTab("inpatient");
  };

  return (
    <PhoneShell
      title="护士工作台"
      subtitle="张护士长 · 骨科病区"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "outpatient", label: "门诊", icon: Hospital, badge: pendingAdmission.length },
            { key: "inpatient", label: "住院", icon: BedDouble },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab
          tasks={tasks}
          pendingCount={pendingAdmission.length}
          inpatientCount={inpatientPatients.length}
          onQuick={(key) => {
            if (key === "handover") setOverlay({ kind: "handover" });
            else if (key === "education") setOverlay({ kind: "education", candidates: [...pendingAdmission, ...inpatientPatients] });
            else if (key === "ocr") showToast("OCR 识别：化验单 / 入院单 / 电子病历");
          else if (key === "vitals") {
              // 跳转到住院列表录入指标，无患者则不跳
              if (inpatientPatients.length > 0) setTab("inpatient");
            }
          }}
          onTask={handleTaskClick}
          onJumpOutpatient={() => setTab("outpatient")}
          onJumpInpatient={() => setTab("inpatient")}
        />
      )}
      {tab === "outpatient" && (
        <OutpatientTab
          list={pendingAdmission}
          onChat={(p) => setOverlay({ kind: "chat", patient: p })}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
          onEducation={(p) => setOverlay({ kind: "education", candidates: [p], lockSinglePatient: true })}
          onBatchEducation={() => setOverlay({ kind: "education", candidates: pendingAdmission })}
        />
      )}
      {tab === "inpatient" && (
        <InpatientTab
          list={inpatientPatients}
          onSelect={(p) => setActionPatient(p)}
          onBatchEducation={() => setOverlay({ kind: "education", candidates: inpatientPatients })}
        />
      )}
      {tab === "me" && <MeTab name="张护士长" role="科室秘书 / 责任护士" />}

      {overlay?.kind === "chat" && (
        <PatientChatSheet patient={overlay.patient} onClose={() => setOverlay(null)} selfRole="护士" />
      )}
      {overlay?.kind === "archive" && (
        <PatientArchiveSheet patient={overlay.patient} onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === "vitals" && (
        <VitalsSheet patient={overlay.patient} onClose={() => setOverlay(null)} onSave={(t) => { showToast(t); setOverlay(null); }} />
      )}
      {overlay?.kind === "handover" && <HandoverSheet onClose={() => setOverlay(null)} />}
      {overlay?.kind === "education" && (
        <EducationPushSheet
          candidates={overlay.candidates}
          lockSinglePatient={overlay.lockSinglePatient}
          onClose={() => setOverlay(null)}
          onPush={showToast}
        />
      )}

      <ActionSheet
        open={!!actionPatient}
        title={actionPatient ? `${actionPatient.name} · ${actionPatient.bedNo}床` : ""}
        onClose={() => setActionPatient(null)}
        actions={[
          { label: "在线沟通（含电话/档案）", tone: "primary", onClick: () => actionPatient && setOverlay({ kind: "chat", patient: actionPatient }) },
          { label: "查看患者档案", onClick: () => actionPatient && setOverlay({ kind: "archive", patient: actionPatient }) },
          { label: "录入住院指标（DVT/生命体征）", onClick: () => actionPatient && setOverlay({ kind: "vitals", patient: actionPatient }) },
          { label: "推送宣教内容", onClick: () => actionPatient && setOverlay({ kind: "education", candidates: [actionPatient], lockSinglePatient: true }) },
        ]}
      />
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  pendingCount,
  inpatientCount,
  onQuick,
  onTask,
  onJumpOutpatient,
  onJumpInpatient,
}: {
  tasks: typeof todayTasks.secretary;
  pendingCount: number;
  inpatientCount: number;
  onQuick: (key: "ocr" | "handover" | "vitals" | "education") => void;
  onTask: (taskType: string) => void;
  onJumpOutpatient: () => void;
  onJumpInpatient: () => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div
        className="relative overflow-hidden rounded-2xl p-4 text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="text-[10px] opacity-80">今日工作概览</div>
        <div className="mt-1 text-base font-bold">早安, 张护士长 ☀️</div>
        <div className="mt-0.5 text-[11px] opacity-90">今日 {tasks.length} 项待办 · 2 例办理入院</div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onJumpOutpatient} className="text-left active:opacity-80">
            <MiniStat label="门诊待入院 ›" value={pendingCount} />
          </button>
          <button onClick={onJumpInpatient} className="text-left active:opacity-80">
            <MiniStat label="在院患者 ›" value={inpatientCount} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
        <QuickAction icon={Camera} label="OCR 录入" tone="bg-info/15 text-info" onClick={() => onQuick("ocr")} />
        <QuickAction icon={ClipboardList} label="护理交班" tone="bg-primary/15 text-primary" onClick={() => onQuick("handover")} />
        <QuickAction icon={Activity} label="指标录入" tone="bg-warning/20 text-warning-foreground" onClick={() => onQuick("vitals")} />
        <QuickAction icon={BellRing} label="宣教推送" tone="bg-success/15 text-success" onClick={() => onQuick("education")} />
      </div>

      <Card title="今日待办" rightLabel={`${tasks.length} 项`}>
        <div className="divide-y">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => onTask(t.type)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left active:bg-muted/40"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                )}
              >
                {t.type === "call" && <Phone className="h-3.5 w-3.5" />}
                {t.type === "education" && <BellRing className="h-3.5 w-3.5" />}
                {t.type === "admission" && <Hospital className="h-3.5 w-3.5" />}
                {t.type === "handover" && <ClipboardList className="h-3.5 w-3.5" />}
                {t.type === "nursing" && <Activity className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {t.patientName && (
                    <span>
                      {t.patientName}
                      {t.bedNo && ` · ${t.bedNo}床`}
                    </span>
                  )}
                  {t.due && (
                    <>
                      <Clock className="h-2.5 w-2.5" />
                      {t.due}
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>

      <Card title="08:00 护理交班摘要" rightLabel="自动生成">
        <div className="space-y-1.5 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <div>
            病人 <b className="text-foreground">12</b> · 昨入院 <b className="text-foreground">2</b> · 昨手术{" "}
            <b className="text-foreground">2</b> · 今手术 <b className="text-foreground">3</b>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            03床 孙顺英 昨日 (右) TKA, 引流暗血性液 50ml; 尿管 200ml。
          </div>
          <div className="rounded-md bg-warning/10 p-2 text-warning-foreground">
            ⚠️ 05床 沟通障碍 · 02床 传染病史 (自动导入)
          </div>
        </div>
      </Card>
    </div>
  );
}

function OutpatientTab({
  list,
  onChat,
  onArchive,
  onEducation,
  onBatchEducation,
}: {
  list: typeof patients;
  onChat: (p: Patient) => void;
  onArchive: (p: Patient) => void;
  onEducation: (p: Patient) => void;
  onBatchEducation: () => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <SearchBar placeholder="搜索姓名 / 门诊号" />

      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold">门诊待入院 · {list.length} 人</div>
        <button onClick={onBatchEducation} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
          <BellRing className="h-3 w-3" />批量宣教
        </button>
      </div>

      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => onArchive(p)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                  {p.gender} · {p.age}岁
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-foreground">{p.diagnosis}</div>
                <div className="text-[10px] text-muted-foreground">拟行: {p.surgeryName} · {p.director}</div>
              </button>
              <div className="text-right">
                <div className="text-[9px] text-muted-foreground">拟入院</div>
                <div className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                  {p.scheduledAdmission?.slice(5)}
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t pt-2">
              <button onClick={() => onArchive(p)} className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <FileSearch className="h-3 w-3" />档案
              </button>
              <div className="flex gap-1.5">
                <a
                  href={`tel:${(p.phone ?? "").replace(/\D/g, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] text-foreground active:bg-muted/70"
                >
                  <Phone className="h-3 w-3" />电话
                </a>
                <button
                  onClick={() => onEducation(p)}
                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] text-foreground active:bg-muted/70"
                >
                  <BellRing className="h-3 w-3" />宣教
                </button>
                <button
                  onClick={() => onChat(p)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-primary-foreground active:opacity-80"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <MessageCircle className="h-3 w-3" />沟通
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InpatientTab({ list, onSelect, onBatchEducation }: { list: typeof patients; onSelect: (p: Patient) => void; onBatchEducation: () => void }) {
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "总床位", v: 16, c: "text-foreground" },
          { l: "在院", v: list.length, c: "text-primary" },
          { l: "今日手术", v: 3, c: "text-warning-foreground" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border bg-card p-2.5 text-center">
            <div className={cn("text-lg font-bold", x.c)}>{x.v}</div>
            <div className="text-[10px] text-muted-foreground">{x.l}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold">床位视图</div>
        <button onClick={onBatchEducation} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
          <BellRing className="h-3 w-3" />批量宣教
        </button>
      </div>

      <div className="space-y-2">
        {list.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)} className="w-full rounded-2xl border bg-card p-3 text-left active:bg-muted/30">
            <div className="flex items-start gap-2.5">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="text-[8px]">床号</span>
                <span className="font-mono text-sm font-bold leading-none">{p.bedNo}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.gender}·{p.age}
                  </span>
                  {p.isNew && <Tag color="info">新</Tag>}
                  {p.infectious && <Tag color="destructive">传</Tag>}
                  {p.communicationDifficult && <Tag color="warning">沟</Tag>}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{p.diagnosis}</div>
                <div className="text-[10px] text-muted-foreground">{p.surgeryName}</div>
              </div>
              <StatusPill status={p.status} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MeTab({ name, role }: { name: string; role: string }) {
  const weeklyAdmission = [
    { label: "周一", value: 6 },
    { label: "周二", value: 8 },
    { label: "周三", value: 5 },
    { label: "周四", value: 9 },
    { label: "周五", value: 7 },
    { label: "周六", value: 4 },
    { label: "周日", value: 3 },
  ];
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          {name.slice(0, 1)}
        </div>
        <div className="mt-2 text-base font-bold">{name}</div>
        <div className="text-[11px] text-muted-foreground">{role}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={Hospital} label="本月办理入院" value={42} delta="↑ 12%" tone="primary" />
        <StatTile icon={BellRing} label="宣教推送" value={86} delta="↑ 8%" tone="success" />
        <StatTile icon={Phone} label="电话沟通" value={124} tone="info" />
        <StatTile icon={Activity} label="指标录入" value={68} delta="↑ 5%" tone="warning" />
      </div>

      <ChartCard title="本周入院办理量" subtitle="共 42 例 · 较上周 +12%">
        <BarChart data={weeklyAdmission} unit="例" />
      </ChartCard>

      <ChartCard title="工作分布（本月）">
        <div className="space-y-2">
          <HBarRow label="入院办理" value={42} total={320} color="var(--primary)" />
          <HBarRow label="宣教推送" value={86} total={320} color="var(--success)" />
          <HBarRow label="电话沟通" value={124} total={320} color="var(--info)" />
          <HBarRow label="指标录入" value={68} total={320} color="var(--warning)" />
        </div>
      </ChartCard>

    </div>
  );
}

/* ---------- Shared mobile UI ---------- */

export function Card({
  title,
  rightLabel,
  children,
}: {
  title: string;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between border-b bg-card px-3 py-2">
        <div className="text-[12px] font-semibold text-foreground">{title}</div>
        {rightLabel && <div className="text-[10px] text-muted-foreground">{rightLabel}</div>}
      </div>
      {children}
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] opacity-80">{label}</div>
    </div>
  );
}

export function QuickAction({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-lg py-1.5 text-center active:bg-muted/40">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] text-foreground">{label}</span>
    </button>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-sm">
      <Search className="h-3.5 w-3.5 text-muted-foreground" />
      <input className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground" placeholder={placeholder} />
      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

export function Tag({ children, color }: { children: React.ReactNode; color: "info" | "destructive" | "warning" | "success" | "primary" }) {
  const map = {
    info: "bg-info text-white",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-white",
    primary: "bg-primary text-primary-foreground",
  } as const;
  return (
    <span className={cn("inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold", map[color])}>
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    admitted: { label: "在院", cls: "bg-info/15 text-info", icon: CheckCircle2 },
    "in-surgery": { label: "今日手术", cls: "bg-warning/20 text-warning-foreground", icon: AlertCircle },
    "post-op": { label: "术后", cls: "bg-primary/15 text-primary", icon: Clock },
    rehab: { label: "康复", cls: "bg-success/15 text-success", icon: CheckCircle2 },
    "follow-up": { label: "随访", cls: "bg-muted text-muted-foreground", icon: CheckCircle2 },
  };
  const m = map[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5 self-start rounded-full px-1.5 py-0.5 text-[9px] font-medium", m.cls)}>
      <Icon className="h-2.5 w-2.5" />
      {m.label}
    </span>
  );
}
