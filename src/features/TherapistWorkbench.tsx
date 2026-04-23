import { useState } from "react";
import { Activity, Phone, ClipboardCheck, CheckCircle2, AlertCircle, MessageSquare, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { patients, todayTasks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function TherapistWorkbench() {
  const [tab, setTab] = useState<"inpatient" | "follow-up">("inpatient");

  const rehab = patients.filter((p) => ["post-op", "rehab", "in-surgery"].includes(p.status));
  const followUp = patients.filter((p) => p.status === "follow-up");
  const tasks = todayTasks.therapist;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Therapist</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">治疗师 工作台</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} · 朱年鑫 治疗师
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />康复排班</Button>
          <Button size="sm" className="gap-1.5"><Activity className="h-3.5 w-3.5" />新建康复方案</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="负责康复中" value={rehab.length} hint="覆盖术后第 1-7 日" tone="primary" />
        <StatCard icon={ClipboardCheck} label="今日评估" value={3} hint="含 1 例出院评估" tone="info" />
        <StatCard icon={Phone} label="待随访" value={2} hint="1 例超时需电话干预" tone="warning" />
        <StatCard icon={CheckCircle2} label="本月已出院" value={18} hint="康复达标率 94%" tone="success" />
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
                <div className="mt-1 ml-3.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                  {t.type === "follow-up" && <Phone className="ml-1 h-3 w-3 text-warning" />}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-6 lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="inpatient" className="gap-1.5"><Activity className="h-3.5 w-3.5" />住院 · 康复管理</TabsTrigger>
              <TabsTrigger value="follow-up" className="gap-1.5"><Phone className="h-3.5 w-3.5" />出院 · 智能随访</TabsTrigger>
            </TabsList>

            <TabsContent value="inpatient" className="m-0 mt-3">
              <SectionCard title="康复视图 (一级)" description="术后患者康复进度 · 是否下地" accent="bg-success">
                <div className="divide-y">
                  {rehab.map((p) => (
                    <div key={p.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">{p.bedNo}床</span>
                            <span className="text-sm font-bold">{p.name}</span>
                            <span className="text-[11px] text-muted-foreground">{p.gender} {p.age}岁</span>
                            {p.status === "rehab" && <Badge className="bg-success/15 text-success text-[10px]">康复达标可出院</Badge>}
                            {p.status === "post-op" && <Badge className="bg-info/15 text-info text-[10px]">术后第 3 日</Badge>}
                            {p.status === "in-surgery" && <Badge className="bg-warning/20 text-warning-foreground text-[10px]">今日术后</Badge>}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {p.surgeryName} · 手术日期 {p.surgeryDate} · 责任医生 {p.responsibleDoctor}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]">
                            <MessageSquare className="h-3 w-3" />康复记录
                          </Button>
                          {p.status === "rehab" ? (
                            <Button size="sm" className="h-7 gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" />确认出院
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
                              <ClipboardCheck className="h-3 w-3" />填写评估
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <Metric label="疼痛 VAS" value="3/10" trend="down" />
                        <Metric label="屈膝角度" value="85°" trend="up" />
                        <Metric label="SLR" value="可独立完成" trend="up" />
                        <Metric label="是否下地" value={p.status === "in-surgery" ? "未" : "已下地"} trend="up" />
                      </div>

                      <div className="mt-3 rounded-md border bg-muted/20 p-2.5 text-[11px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium text-foreground">医生建议:</span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">
                          术后第1日开始 SLR 训练; 屈膝训练 0-60° 起步; 注意伤口引流,24小时后拔管。
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="follow-up" className="m-0 mt-3">
              <SectionCard title="出院随访" description="智能问卷 · 超时未填将转电话干预" accent="bg-warning">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 text-left">随访状态</th>
                        <th className="px-3 py-2 text-left">姓名</th>
                        <th className="px-3 py-2 text-left">手术</th>
                        <th className="px-3 py-2 text-left">出院日期</th>
                        <th className="px-3 py-2 text-left">随访结果</th>
                        <th className="px-3 py-2 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {followUp.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2">
                            <FollowUpBadge status={p.followUpStatus} />
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.gender} {p.age}岁</div>
                          </td>
                          <td className="px-3 py-2 text-[11px]">{p.surgeryName}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{p.dischargeDate}</td>
                          <td className="px-3 py-2 text-[11px] text-muted-foreground">{p.followUpResult ?? "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {p.followUpStatus === "pending" && (
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]">
                                  <Phone className="h-3 w-3" />电话干预
                                </Button>
                              )}
                              {p.followUpStatus === "needs-second" && (
                                <Button size="sm" className="h-7 gap-1 text-[10px]">
                                  <ClipboardCheck className="h-3 w-3" />2次随访
                                </Button>
                              )}
                              {p.followUpStatus === "done" && (
                                <Badge variant="outline" className="h-6 gap-1 text-[10px] border-success/40 text-success">
                                  <CheckCircle2 className="h-3 w-3" />已完成
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: "up" | "down" }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <TrendingUp className={cn("h-3 w-3", trend === "up" ? "text-success" : "text-info rotate-180")} />
      </div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function FollowUpBadge({ status }: { status?: string }) {
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
        <CheckCircle2 className="h-2.5 w-2.5" />已随访 良好
      </span>
    );
  if (status === "needs-second")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
        <AlertCircle className="h-2.5 w-2.5" />需 2 次随访
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
      <Phone className="h-2.5 w-2.5" />超时未填
    </span>
  );
}
