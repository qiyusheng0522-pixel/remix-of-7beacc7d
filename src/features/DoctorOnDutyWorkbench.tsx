import { Camera, ClipboardCheck, AlertTriangle, Send, FileText, Sparkles, Clock, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { patients, todayTasks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DoctorOnDutyWorkbench() {
  const tomorrowSurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const tasks = todayTasks["doctor-on-duty"];
  const abnormalCount = tomorrowSurgery.filter((p) => p.preOpAbnormal).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Doctor on Duty</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">值班医生 工作台</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} · 朱医生 (值班)
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />AI 异常分析</Button>
          <Button size="sm" className="gap-1.5"><Camera className="h-3.5 w-3.5" />OCR 录入量表</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="待录入量表" value={2} hint="明日手术患者" tone="warning" />
        <StatCard icon={AlertTriangle} label="异常指标患者" value={abnormalCount} hint="需复核高亮指标" tone="destructive" />
        <StatCard icon={Send} label="待推送医疗团队" value={2} hint="王主任 / 秦主任" tone="info" />
        <StatCard icon={FileText} label="本周已录入" value={14} hint="平均 2 张/日" tone="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="今日待办" description={`${tasks.length} 项`} accent="bg-primary">
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                <div className={cn(
                  "mt-0.5 flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                  t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{t.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                    {t.due && ` · ${t.due}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="术前检查结果量表 (明日手术)"
            description="OCR 录入后异常指标自动高亮, 同步至治疗师"
            accent="bg-destructive"
          >
            <div className="divide-y">
              {tomorrowSurgery.map((p) => (
                <div key={p.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">
                          {p.bedNo}床
                        </span>
                        <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                        <span className="text-[11px] text-muted-foreground">{p.gender} · {p.age}岁</span>
                        {p.preOpAbnormal && (
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <AlertTriangle className="h-3 w-3" />异常
                          </Badge>
                        )}
                        {p.infectious && <Badge className="bg-destructive/15 text-destructive text-[10px]">传染病</Badge>}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {p.diagnosis} · 拟行 {p.surgeryName} · {p.director} · 手术日期 {p.surgeryDate}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
                        <Camera className="h-3 w-3" />重新OCR
                      </Button>
                      <Button size="sm" className="h-7 gap-1 text-[11px]">
                        <Send className="h-3 w-3" />推送团队
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {p.preOpFindings?.map((f) => (
                      <div
                        key={f.label}
                        className={cn(
                          "rounded-lg border p-2.5",
                          f.abnormal
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border bg-muted/20"
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{f.label}</span>
                          {f.abnormal && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        </div>
                        <div className={cn(
                          "mt-0.5 text-sm font-bold",
                          f.abnormal ? "text-destructive" : "text-foreground"
                        )}>{f.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px]">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">下一步:</span>
                    {p.preOpAbnormal ? (
                      <span className="text-destructive font-medium">等待医疗团队决定是否如期手术 / 治疗师可退回手术待排</span>
                    ) : (
                      <span className="text-success font-medium">建议如期手术, 已推送团队待确认</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
