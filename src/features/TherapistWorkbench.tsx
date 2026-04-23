import { useState } from "react";
import {
  Activity,
  Phone,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Home,
  HeartPulse,
  User,
  ChevronRight,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction } from "./SecretaryWorkbench";
import { patients, todayTasks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type TabKey = "home" | "rehab" | "followup" | "me";

export function TherapistWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const rehab = patients.filter((p) => ["post-op", "rehab", "in-surgery"].includes(p.status));
  const followUp = patients.filter((p) => p.status === "follow-up");
  const tasks = todayTasks.therapist;

  return (
    <PhoneShell
      title="治疗师工作台"
      subtitle="朱年鑫 · 康复师"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "rehab", label: "康复管理", icon: HeartPulse, badge: rehab.length },
            { key: "followup", label: "随访", icon: Phone, badge: followUp.filter((p) => p.followUpStatus !== "done").length },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && <HomeTab tasks={tasks} rehabCount={rehab.length} followCount={followUp.length} />}
      {tab === "rehab" && <RehabTab list={rehab} />}
      {tab === "followup" && <FollowUpTab list={followUp} />}
      {tab === "me" && <MeTab />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  rehabCount,
  followCount,
}: {
  tasks: typeof todayTasks.therapist;
  rehabCount: number;
  followCount: number;
}) {
  return (
    <div className="space-y-3 p-3">
      <div
        className="rounded-2xl p-4 text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="text-[10px] opacity-80">康复治疗师 · {new Date().toLocaleDateString("zh-CN")}</div>
        <div className="mt-1 text-base font-bold">朱年鑫, 加油 💪</div>
        <div className="mt-0.5 text-[11px] opacity-90">
          康复中 {rehabCount} 例 · 待随访 {followCount} 例
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="负责康复中" value={rehabCount} />
          <MiniStat label="待随访" value={followCount} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
        <QuickAction icon={Activity} label="新建方案" tone="bg-primary/15 text-primary" />
        <QuickAction icon={ClipboardCheck} label="出院评估" tone="bg-success/15 text-success" />
        <QuickAction icon={Phone} label="电话随访" tone="bg-warning/20 text-warning-foreground" />
        <QuickAction icon={Calendar} label="排班" tone="bg-info/15 text-info" />
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
                {t.type === "follow-up" && <Phone className="h-3 w-3 text-warning" />}
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
            { l: "随访完成", v: 22 },
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

function RehabTab({ list }: { list: typeof patients }) {
  return (
    <div className="space-y-3 p-3">
      {list.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-2 border-b p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {p.bedNo}床
                </span>
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.surgeryName} · 术日 {p.surgeryDate}
              </div>
            </div>
            {p.status === "rehab" && <Pill cls="bg-success/15 text-success">康复达标</Pill>}
            {p.status === "post-op" && <Pill cls="bg-info/15 text-info">术后第3日</Pill>}
            {p.status === "in-surgery" && <Pill cls="bg-warning/20 text-warning-foreground">今日术后</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <Metric label="疼痛 VAS" value="3/10" trend="down" />
            <Metric label="屈膝角度" value="85°" trend="up" />
            <Metric label="SLR" value="可独立" trend="up" />
            <Metric label="是否下地" value={p.status === "in-surgery" ? "未" : "已下地"} trend="up" />
          </div>

          <div className="mx-3 mb-3 rounded-lg border bg-muted/20 p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">医生建议</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              术后第1日 SLR 训练; 屈膝 0-60° 起步; 24h 拔引流。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-0 border-t">
            <button className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40">
              <ClipboardCheck className="h-3 w-3" />填写评估
            </button>
            {p.status === "rehab" ? (
              <button
                className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary-foreground active:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <CheckCircle2 className="h-3 w-3" />确认出院
              </button>
            ) : (
              <button className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary active:bg-muted/40">
                <HeartPulse className="h-3 w-3" />康复记录
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FollowUpTab({ list }: { list: typeof patients }) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-warning/5 p-3 text-[11px] text-warning-foreground">
        ⏰ 智能问卷自动推送, 超时未填将转电话干预。
      </div>

      {list.map((p) => (
        <div key={p.id} className="rounded-2xl border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {p.surgeryName} · 出院 {p.dischargeDate}
              </div>
              {p.followUpResult && (
                <div className="mt-1 text-[10px] text-muted-foreground">问卷结论: {p.followUpResult}</div>
              )}
            </div>
            <FollowUpBadge status={p.followUpStatus} />
          </div>

          <div className="mt-3 flex justify-end gap-1.5">
            {p.followUpStatus === "pending" && (
              <button className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-[11px] font-medium text-destructive active:opacity-80">
                <Phone className="h-3 w-3" />电话干预
              </button>
            )}
            {p.followUpStatus === "needs-second" && (
              <button
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-primary-foreground active:opacity-80"
                style={{ background: "var(--gradient-primary)" }}
              >
                <ClipboardCheck className="h-3 w-3" />2 次随访
              </button>
            )}
            {p.followUpStatus === "done" && (
              <span className="flex items-center gap-1 rounded-full border border-success/40 px-3 py-1.5 text-[11px] text-success">
                <CheckCircle2 className="h-3 w-3" />已完成
              </span>
            )}
          </div>
        </div>
      ))}
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
        {["康复方案模板", "随访问卷管理", "排班日历", "关于骨安"].map((s) => (
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
  return (
    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium", cls)}>{children}</span>
  );
}

function FollowUpBadge({ status }: { status?: string }) {
  if (status === "done")
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-medium text-success">
        <CheckCircle2 className="h-2.5 w-2.5" />已随访
      </span>
    );
  if (status === "needs-second")
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-medium text-warning-foreground">
        <AlertCircle className="h-2.5 w-2.5" />2 次随访
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
      <Phone className="h-2.5 w-2.5" />超时
    </span>
  );
}
