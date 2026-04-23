import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Stethoscope,
  AlertTriangle,
  Calendar,
  Users,
  Home,
  ClipboardEdit,
  User,
  ChevronRight,
  Sparkles,
  FileSignature,
  MessageCircle,
  FileSearch,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction } from "./SecretaryWorkbench";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { PatientArchiveSheet } from "@/components/PatientArchiveSheet";
import { ToastBanner } from "@/components/ActionSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "preop" | "intraop" | "me";
type Overlay = { kind: "chat"; patient: Patient } | { kind: "archive"; patient: Patient } | null;

export function SurgicalTeamWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [decisions, setDecisions] = useState<Record<string, "go" | "hold" | undefined>>({});
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const todaySurgery = patients.filter((p) => p.status === "in-surgery");
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
            { key: "preop", label: "术前评估", icon: Calendar, badge: tomorrowSurgery.length },
            { key: "intraop", label: "术中量表", icon: ClipboardEdit, badge: todaySurgery.length },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab tomorrow={tomorrowSurgery.length} today={todaySurgery.length} tasks={tasks} onQuick={(l) => showToast(`已打开 ${l}`)} />
      )}
      {tab === "preop" && (
        <PreOpTab
          list={tomorrowSurgery}
          decisions={decisions}
          setDecisions={setDecisions}
          onChat={(p) => setOverlay({ kind: "chat", patient: p })}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
          onConfirm={(p, d) => showToast(d === "go" ? `已确认如期手术：${p.name}` : `已退回手术待排：${p.name}`)}
        />
      )}
      {tab === "intraop" && (
        <IntraOpTab
          list={todaySurgery}
          onSave={(p) => showToast(`术中量表已推送至治疗师 → ${p.name}`)}
          onArchive={(p) => setOverlay({ kind: "archive", patient: p })}
        />
      )}
      {tab === "me" && <MeTab />}

      {overlay?.kind === "chat" && (
        <PatientChatSheet patient={overlay.patient} onClose={() => setOverlay(null)} selfRole="主" />
      )}
      {overlay?.kind === "archive" && (
        <PatientArchiveSheet patient={overlay.patient} onClose={() => setOverlay(null)} />
      )}
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tomorrow,
  today,
  tasks,
  onQuick,
}: {
  tomorrow: number;
  today: number;
  tasks: typeof todayTasks["surgical-team"];
  onQuick: (l: string) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[10px] opacity-80">主刀医生 · 王主任团队</div>
        <div className="mt-1 text-base font-bold">王主任, 您好 👋</div>
        <div className="mt-0.5 text-[11px] opacity-90">明日 {tomorrow} 例待评估, 今日 {today} 例手术中</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="明日手术" value={tomorrow} />
          <MiniStat label="今日手术" value={today} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
        <QuickAction icon={Calendar} label="手术单" tone="bg-primary/15 text-primary" onClick={() => onQuick("手术单")} />
        <QuickAction icon={FileSignature} label="术中量表" tone="bg-info/15 text-info" onClick={() => onQuick("术中量表")} />
        <QuickAction icon={Sparkles} label="AI 助手" tone="bg-success/15 text-success" onClick={() => onQuick("AI 助手")} />
        <QuickAction icon={Users} label="团队" tone="bg-warning/20 text-warning-foreground" onClick={() => onQuick("团队管理")} />
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
              </div>
              <div className="ml-3.5 mt-0.5 text-[10px] text-muted-foreground">
                {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                {t.due && ` · ${t.due}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="本周战绩">
        <div className="grid grid-cols-3 gap-1 p-3 text-center">
          {[
            { l: "已完成", v: 9 },
            { l: "成功率", v: "100%" },
            { l: "平均时长", v: "82min" },
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

function PreOpTab({
  list,
  decisions,
  setDecisions,
  onChat,
  onArchive,
  onConfirm,
}: {
  list: typeof patients;
  decisions: Record<string, "go" | "hold" | undefined>;
  setDecisions: (cb: (s: Record<string, "go" | "hold" | undefined>) => Record<string, "go" | "hold" | undefined>) => void;
  onChat: (p: Patient) => void;
  onArchive: (p: Patient) => void;
  onConfirm: (p: Patient, d: "go" | "hold") => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-warning/5 p-3 text-[11px] text-warning-foreground">
        💡 审核值班医生录入的术前量表, 决定是否如期手术。
      </div>

      {list.map((p) => {
        const d = decisions[p.id];
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="border-b p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {p.bedNo}床
                  </span>
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                  {p.preOpAbnormal && (
                    <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                      需评估
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onArchive(p)} className="rounded-full bg-muted p-1 text-muted-foreground active:bg-muted/70">
                    <FileSearch className="h-3 w-3" />
                  </button>
                  <button onClick={() => onChat(p)} className="rounded-full bg-info/10 p-1 text-info active:opacity-80">
                    <MessageCircle className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.diagnosis} · {p.surgeryName} · {p.director}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 p-3">
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

            {d === "hold" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-destructive/5 p-2 text-[10px] text-destructive">
                <AlertTriangle className="h-3 w-3" />
                已退回手术待排, 治疗师 / 护士同步收到通知
              </div>
            )}
            {d === "go" && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-success/5 p-2 text-[10px] text-success">
                <CheckCircle2 className="h-3 w-3" />
                已确认如期手术, 已通知麻醉与治疗师
              </div>
            )}

            <div className="grid grid-cols-2 gap-0 border-t">
              <button
                onClick={() => {
                  setDecisions((s) => ({ ...s, [p.id]: "hold" }));
                  onConfirm(p, "hold");
                }}
                className={cn(
                  "flex items-center justify-center gap-1 py-2.5 text-[11px] active:bg-muted/40",
                  d === "hold" ? "bg-destructive/10 font-medium text-destructive" : "text-foreground",
                )}
              >
                <XCircle className="h-3 w-3" />暂缓 / 退回
              </button>
              <button
                onClick={() => {
                  setDecisions((s) => ({ ...s, [p.id]: "go" }));
                  onConfirm(p, "go");
                }}
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

function IntraOpTab({
  list,
  onSave,
  onArchive,
}: {
  list: typeof patients;
  onSave: (p: Patient) => void;
  onArchive: (p: Patient) => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-primary/5 p-3 text-[11px] text-primary">
        ✏️ 团队任一成员可填写, 内容将自动同步治疗师。
      </div>

      {list.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between border-b p-3">
            <button onClick={() => onArchive(p)} className="text-left">
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
            </button>
            <span className="rounded-full border px-1.5 py-0.5 text-[9px] text-muted-foreground">朱医生 编辑中</span>
          </div>

          <div className="space-y-2 p-3">
            <FormField label="麻醉方式" value="全麻 + 神经阻滞" />
            <FormField label="术中出血量" value="180 ml" />
            <FormField label="假体型号" value="DePuy Sigma #4" />
            <FormField label="术中并发症" value="无" />

            <div>
              <div className="mb-1 text-[10px] font-medium text-muted-foreground">医生建议（推送至治疗师）</div>
              <textarea
                className="w-full rounded-lg border bg-muted/20 p-2 text-[11px] outline-none focus:border-primary"
                rows={3}
                defaultValue="术后第1日开始 SLR 训练; 屈膝训练 0-60° 起步; 注意伤口引流, 24小时后拔管。"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              保存后推送至 <span className="font-medium text-primary">朱年鑫 治疗师</span>
            </span>
            <button
              onClick={() => onSave(p)}
              className="rounded-full px-3 py-1 text-[11px] font-medium text-primary-foreground active:opacity-80"
              style={{ background: "var(--gradient-primary)" }}
            >
              保存并推送
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-2.5 py-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input className="bg-transparent text-right text-[11px] font-medium outline-none" defaultValue={value} />
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
          王
        </div>
        <div className="mt-2 text-base font-bold">王主任</div>
        <div className="text-[11px] text-muted-foreground">骨科主任医师 · 主刀</div>
      </div>
      <Card title="我的团队">
        {[
          { n: "王主任", r: "主刀医师" },
          { n: "李医生", r: "一助" },
          { n: "陈医生", r: "二助" },
          { n: "朱年鑫", r: "治疗师" },
        ].map((x) => (
          <div key={x.n} className="flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {x.n.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-medium">{x.n}</div>
              <div className="text-[10px] text-muted-foreground">{x.r}</div>
            </div>
            <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        ))}
      </Card>
    </div>
  );
}
