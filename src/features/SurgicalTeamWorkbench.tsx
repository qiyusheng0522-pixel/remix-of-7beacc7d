import { useState } from "react";
import { CheckCircle2, XCircle, Stethoscope, ClipboardEdit, AlertTriangle, Calendar, Users, ChevronRight, FileSignature } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { patients, todayTasks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SurgicalTeamWorkbench() {
  const [decisions, setDecisions] = useState<Record<string, "go" | "hold" | undefined>>({});
  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const todaySurgery = patients.filter((p) => p.status === "in-surgery");
  const tasks = todayTasks["surgical-team"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Surgical Team</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">手术医疗团队 工作台</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} · 王主任团队
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />明日手术单</Button>
          <Button size="sm" className="gap-1.5"><FileSignature className="h-3.5 w-3.5" />填写术中量表</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="明日手术" value={tomorrowSurgery.length} hint="待审核术前结果" tone="info" />
        <StatCard icon={Stethoscope} label="今日手术" value={todaySurgery.length} hint="待填写术中量表" tone="warning" />
        <StatCard icon={AlertTriangle} label="异常指标" value={1} hint="刘德海 (Hb / 血压)" tone="destructive" />
        <StatCard icon={CheckCircle2} label="本周已完成" value={9} hint="手术成功率 100%" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="今日待办" description={`${tasks.length} 项`} accent="bg-primary">
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id} className="px-4 py-3 hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    t.priority === "high" ? "bg-destructive" : "bg-muted-foreground"
                  )} />
                  <div className="text-xs font-medium">{t.title}</div>
                </div>
                <div className="mt-1 ml-3.5 text-[11px] text-muted-foreground">
                  {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                  {t.due && ` · ${t.due}`}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-6 lg:col-span-2">
          {/* 术前决策 */}
          <SectionCard title="术前评估 · 是否如期手术" description="审核值班医生录入的术前量表" accent="bg-warning">
            <div className="divide-y">
              {tomorrowSurgery.map((p) => {
                const d = decisions[p.id];
                return (
                  <div key={p.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">{p.bedNo}床</span>
                          <span className="text-sm font-bold">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground">{p.gender} {p.age}岁</span>
                          {p.preOpAbnormal && <Badge variant="destructive" className="text-[10px]">需评估</Badge>}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {p.diagnosis} · {p.surgeryName} · 主任 {p.director}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant={d === "go" ? "default" : "outline"}
                          onClick={() => setDecisions((s) => ({ ...s, [p.id]: "go" }))}
                          className="h-7 gap-1 text-[11px]"
                        >
                          <CheckCircle2 className="h-3 w-3" />如期手术
                        </Button>
                        <Button
                          size="sm"
                          variant={d === "hold" ? "destructive" : "outline"}
                          onClick={() => setDecisions((s) => ({ ...s, [p.id]: "hold" }))}
                          className="h-7 gap-1 text-[11px]"
                        >
                          <XCircle className="h-3 w-3" />暂缓 / 退回
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.preOpFindings?.map((f) => (
                        <span
                          key={f.label}
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px]",
                            f.abnormal
                              ? "bg-destructive/10 text-destructive font-bold"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {f.label}: {f.value}
                        </span>
                      ))}
                    </div>
                    {d === "hold" && (
                      <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/5 p-2 text-[11px] text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        已退回至手术待排, 治疗师 / 护士同步收到通知
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* 术中量表 */}
          <SectionCard title="术中量表" description="今日手术 · 团队任一成员可填写" accent="bg-primary">
            {todaySurgery.map((p) => (
              <div key={p.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">{p.bedNo}床</span>
                      <span className="text-sm font-bold">{p.name}</span>
                      <Badge className="bg-warning/20 text-warning-foreground text-[10px]">手术中</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {p.surgeryName} · 手术间 1号台 · 主刀 王主任
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">朱医生 编辑中</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="麻醉方式" defaultValue="全麻 + 神经阻滞" />
                  <Field label="术中出血量 (ml)" defaultValue="180" />
                  <Field label="假体型号" defaultValue="DePuy Sigma #4" />
                  <Field label="术中并发症" defaultValue="无" />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">医生建议 (推送至治疗师)</label>
                  <Textarea
                    className="mt-1 min-h-[80px] text-xs"
                    defaultValue="术后第1日开始 SLR 训练; 屈膝训练 0-60° 起步; 注意伤口引流, 24小时后拔管。"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    保存后自动推送至 <span className="text-primary font-medium">朱年鑫 治疗师</span>
                  </div>
                  <Button size="sm" className="h-7 gap-1 text-[11px]">
                    <ClipboardEdit className="h-3 w-3" />保存并推送
                  </Button>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <Input className="mt-1 h-8 text-xs" defaultValue={defaultValue} />
    </div>
  );
}
