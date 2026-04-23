import { useState } from "react";
import {
  Camera,
  ClipboardCheck,
  AlertTriangle,
  Send,
  Sparkles,
  Clock,
  Home,
  FileText,
  User,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, QuickAction, SearchBar } from "./SecretaryWorkbench";
import { patients, todayTasks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type TabKey = "home" | "scales" | "history" | "me";

export function DoctorOnDutyWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const tasks = todayTasks["doctor-on-duty"];
  const abnormalCount = tomorrowSurgery.filter((p) => p.preOpAbnormal).length;

  return (
    <PhoneShell
      title="值班医生工作台"
      subtitle="朱医生 · 今日值班"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "scales", label: "术前量表", icon: ClipboardCheck, badge: tomorrowSurgery.length },
            { key: "history", label: "历史", icon: FileText },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab tasks={tasks} surgeryCount={tomorrowSurgery.length} abnormalCount={abnormalCount} />
      )}
      {tab === "scales" && <ScalesTab list={tomorrowSurgery} />}
      {tab === "history" && <HistoryTab />}
      {tab === "me" && <MeTab />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  surgeryCount,
  abnormalCount,
}: {
  tasks: typeof todayTasks["doctor-on-duty"];
  surgeryCount: number;
  abnormalCount: number;
}) {
  return (
    <div className="space-y-3 p-3">
      <div
        className="rounded-2xl p-4 text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="text-[10px] opacity-80">值班医生 · {new Date().toLocaleDateString("zh-CN")}</div>
        <div className="mt-1 text-base font-bold">朱医生, 您今日值班 🌙</div>
        <div className="mt-0.5 text-[11px] opacity-90">
          明日手术 {surgeryCount} 例待录入量表, {abnormalCount} 例异常需关注
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="待录入量表" value={surgeryCount} />
          <MiniStat label="异常指标" value={abnormalCount} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
        <QuickAction icon={Camera} label="OCR 录入" tone="bg-primary/15 text-primary" />
        <QuickAction icon={Sparkles} label="AI 异常分析" tone="bg-info/15 text-info" />
        <QuickAction icon={Send} label="推送团队" tone="bg-success/15 text-success" />
        <QuickAction icon={AlertTriangle} label="预警中心" tone="bg-destructive/10 text-destructive" />
      </div>

      <Card title="今日待办" rightLabel={`${tasks.length} 项`}>
        <div className="divide-y">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                )}
              >
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">{t.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                  {t.due && ` · ${t.due}`}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScalesTab({ list }: { list: typeof patients }) {
  return (
    <div className="space-y-3 p-3">
      <SearchBar placeholder="搜索患者 / 床号" />

      <button
        className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-primary-foreground active:opacity-90"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Camera className="h-4 w-4" />
        OCR 录入新量表
      </button>

      <div className="text-xs font-semibold">明日手术 · {list.length} 例</div>

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
                {p.preOpAbnormal && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                    <AlertTriangle className="h-2.5 w-2.5" />异常
                  </span>
                )}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {p.diagnosis} · {p.surgeryName}
              </div>
              <div className="text-[10px] text-muted-foreground">{p.director} · 手术 {p.surgeryDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            {p.preOpFindings?.map((f) => (
              <div
                key={f.label}
                className={cn(
                  "rounded-lg border p-2",
                  f.abnormal ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>{f.label}</span>
                  {f.abnormal && <AlertTriangle className="h-2.5 w-2.5 text-destructive" />}
                </div>
                <div className={cn("mt-0.5 text-[12px] font-bold", f.abnormal ? "text-destructive" : "text-foreground")}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-[10px]",
              p.preOpAbnormal ? "bg-destructive/5 text-destructive" : "bg-success/5 text-success",
            )}
          >
            {p.preOpAbnormal ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {p.preOpAbnormal ? "等待医疗团队评估是否如期手术" : "建议如期手术 · 已推送团队"}
          </div>

          <div className="grid grid-cols-2 gap-0 border-t">
            <button className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40">
              <Camera className="h-3 w-3" />重新 OCR
            </button>
            <button className="flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium text-primary active:bg-muted/40">
              <Send className="h-3 w-3" />推送团队
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="p-3">
      <Card title="本周已录入量表" rightLabel="14 张">
        <div className="space-y-0 divide-y">
          {[
            { d: "周一", n: 3, abn: 0 },
            { d: "周二", n: 2, abn: 1 },
            { d: "周三", n: 4, abn: 1 },
            { d: "周四", n: 3, abn: 0 },
            { d: "周五", n: 2, abn: 0 },
          ].map((x) => (
            <div key={x.d} className="flex items-center justify-between px-3 py-3">
              <div>
                <div className="text-[12px] font-medium">{x.d}</div>
                <div className="text-[10px] text-muted-foreground">{x.n} 张量表</div>
              </div>
              <div className="flex items-center gap-1">
                {x.abn > 0 && (
                  <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] text-destructive">
                    异常 {x.abn}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </Card>
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
        <div className="mt-2 text-base font-bold">朱医生</div>
        <div className="text-[11px] text-muted-foreground">值班医生 · 骨科一病区</div>
      </div>
      <Card title="设置">
        {["排班日历", "OCR 历史记录", "推送规则", "关于骨安"].map((s) => (
          <button key={s} className="flex w-full items-center justify-between border-b px-3 py-3 text-[12px] last:border-b-0 active:bg-muted/30">
            {s}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </Card>
    </div>
  );
}
