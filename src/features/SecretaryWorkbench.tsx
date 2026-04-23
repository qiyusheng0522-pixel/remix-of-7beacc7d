import { useState } from "react";
import { Phone, BellRing, BedDouble, ClipboardList, FileText, Building2, Hospital, AlertCircle, CheckCircle2, Clock, Camera } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { patients, todayTasks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function SecretaryWorkbench() {
  const [tab, setTab] = useState<"outpatient" | "inpatient">("outpatient");

  const pendingAdmission = patients.filter((p) => p.status === "outpatient-pending");
  const inpatientPatients = patients.filter((p) => p.department === "inpatient");
  const tasks = todayTasks.secretary;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Nurse · Secretary</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">护士 / 科室秘书 工作台</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} · 张护士长
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Camera className="h-3.5 w-3.5" />入院通知单 OCR</Button>
          <Button size="sm" className="gap-1.5"><BellRing className="h-3.5 w-3.5" />发起护理交班</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Phone} label="待电话沟通" value={pendingAdmission.length} hint="今日需确认入院日期" tone="warning" />
        <StatCard icon={Hospital} label="今日入院办理" value={2} hint="床号 01 / 06" tone="info" />
        <StatCard icon={BedDouble} label="在院患者" value={inpatientPatients.length} hint="床位使用率 75%" tone="primary" />
        <StatCard icon={BellRing} label="宣教推送" value={5} hint="入院前 1 日自动推送" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today tasks */}
        <SectionCard
          title="今日待办"
          description={`${tasks.length} 项任务`}
          accent="bg-primary"
          className="lg:col-span-1"
        >
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                <div className={cn(
                  "mt-0.5 flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                  t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {t.type === "call" && <Phone className="h-3.5 w-3.5" />}
                  {t.type === "education" && <BellRing className="h-3.5 w-3.5" />}
                  {t.type === "admission" && <Hospital className="h-3.5 w-3.5" />}
                  {t.type === "handover" && <FileText className="h-3.5 w-3.5" />}
                  {t.type === "nursing" && <ClipboardList className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground">{t.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {t.patientName && <span>{t.patientName}{t.bedNo && ` · ${t.bedNo}床`}</span>}
                    {t.due && <><Clock className="h-3 w-3" />{t.due}</>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Patient lists */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <div className="mb-3 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="outpatient" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />门诊待入院</TabsTrigger>
                <TabsTrigger value="inpatient" className="gap-1.5"><Hospital className="h-3.5 w-3.5" />住院 · 护理视图</TabsTrigger>
              </TabsList>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px]">总表</Badge>
                <Badge variant="outline" className="text-[10px]">备用视图</Badge>
              </div>
            </div>

            <TabsContent value="outpatient" className="m-0">
              <SectionCard title="待入院总表" description="拨打电话确认入院, 已确认日期支持手动修改" accent="bg-info">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">门诊号</th>
                        <th className="px-3 py-2 text-left font-medium">姓名</th>
                        <th className="px-3 py-2 text-left font-medium">诊断 / 拟手术</th>
                        <th className="px-3 py-2 text-left font-medium">联系方式</th>
                        <th className="px-3 py-2 text-left font-medium">主任</th>
                        <th className="px-3 py-2 text-left font-medium">备注</th>
                        <th className="px-3 py-2 text-left font-medium">拟入院日期</th>
                        <th className="px-3 py-2 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pendingAdmission.map((p, i) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{p.name}</span>
                              {p.urgent && <Badge variant="destructive" className="h-4 px-1 text-[9px]">加急</Badge>}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{p.gender} · {p.age}岁</div>
                          </td>
                          <td className="px-3 py-2">
                            <div>{p.diagnosis}</div>
                            <div className="text-[10px] text-muted-foreground">{p.surgeryName}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px]">{p.phone}</td>
                          <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{p.director}</Badge></td>
                          <td className="px-3 py-2 text-[10px] text-muted-foreground">{p.notes ?? "—"}</td>
                          <td className="px-3 py-2">
                            <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                              {p.scheduledAdmission}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]">
                              <Phone className="h-3 w-3" />沟通
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="inpatient" className="m-0 space-y-4">
              <SectionCard title="08:00 护理交班记录" description="系统自动生成北京时间" accent="bg-primary">
                <div className="space-y-2 px-5 py-4 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono">2024-04-22 08:00 — 2024-04-23 08:00 护理交班</span>
                  </div>
                  <p>
                    病人总数: <b className="text-foreground">12</b> 人 (床号 01-12)。 昨日出院 <b className="text-foreground">1</b> 人 (08床), 昨日入院 <b className="text-foreground">2</b> 人 (01/06床), 昨日手术 <b className="text-foreground">2</b> 人 (03/05床), 今日手术 <b className="text-foreground">3</b> 人。
                    <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning-foreground">系统自动抓取</span>
                  </p>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="font-medium text-foreground">昨日手术:</div>
                    <p className="mt-1">03床 孙顺英, 昨日在 (全麻) 下行 (右) TKA, 心电监护 (有) 窦性心律 齐, 伤口敷料外观 (清洁) 干燥, 患肢足背动脉搏动可触及, 足趾活动好, 引流管引出暗血性液体 50 ml, 尿管 (有), 见淡黄色清亮液体引出 200 ml。</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="font-medium text-foreground">特殊交班:</div>
                    <p className="mt-1">05床 杨成轩 (沟通难·自动导入), 02床 吴翠花 (传染病·自动导入)。</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="床位视图 (总表)" description="一级视图 - 节点状态与提醒" accent="bg-primary">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 text-left">床号</th>
                        <th className="px-3 py-2 text-left">姓名</th>
                        <th className="px-3 py-2 text-left">诊断</th>
                        <th className="px-3 py-2 text-left">手术</th>
                        <th className="px-3 py-2 text-left">护理提醒</th>
                        <th className="px-3 py-2 text-left">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inpatientPatients.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono font-bold">{p.bedNo}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{p.name}</span>
                              {p.isNew && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-info text-[9px] font-bold text-white">新</span>}
                              {p.infectious && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">传</span>}
                              {p.communicationDifficult && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-warning-foreground">沟</span>}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{p.gender} {p.age}</div>
                          </td>
                          <td className="px-3 py-2 text-[11px]">{p.diagnosis}</td>
                          <td className="px-3 py-2 text-[11px]">{p.surgeryName}</td>
                          <td className="px-3 py-2 text-[11px]">
                            {p.status === "in-surgery" && <Badge className="h-4 bg-warning/20 text-warning-foreground">引流监护</Badge>}
                            {p.status === "post-op" && <Badge className="h-4 bg-info/20 text-info">补交伤口引流</Badge>}
                            {p.status === "rehab" && <Badge className="h-4 bg-success/20 text-success">下地训练</Badge>}
                            {p.status === "admitted" && <Badge className="h-4 bg-muted">术前准备</Badge>}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={p.status} />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    "admitted": { label: "在院", cls: "bg-info/15 text-info", icon: CheckCircle2 },
    "in-surgery": { label: "今日手术", cls: "bg-warning/20 text-warning-foreground", icon: AlertCircle },
    "post-op": { label: "术后", cls: "bg-primary/15 text-primary", icon: Clock },
    "rehab": { label: "康复中", cls: "bg-success/15 text-success", icon: CheckCircle2 },
    "follow-up": { label: "随访", cls: "bg-muted text-muted-foreground", icon: CheckCircle2 },
  };
  const m = map[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", m.cls)}>
      <Icon className="h-2.5 w-2.5" />{m.label}
    </span>
  );
}
