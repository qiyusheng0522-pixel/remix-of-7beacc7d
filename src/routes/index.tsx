import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope, ClipboardCheck, Users, Activity, ArrowRight, Building2, Workflow } from "lucide-react";
import { roleMeta } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "骨安 BoneCare — 骨科一体化诊疗工作台" },
      { name: "description", content: "面向护士、值班医生、手术团队、治疗师的角色化骨科诊疗工作台。" },
    ],
  }),
  component: HomePage,
});

const roleIcons = {
  secretary: Stethoscope,
  "doctor-on-duty": ClipboardCheck,
  "surgical-team": Users,
  therapist: Activity,
} as const;

const roles: Role[] = ["secretary", "doctor-on-duty", "surgical-team", "therapist"];

const flowSteps = [
  { label: "门诊待入院", role: "护士/秘书", desc: "扫码登记 · 电话沟通 · 推送宣教" },
  { label: "入院 + 术前检查", role: "值班医生", desc: "OCR 录入量表 · 异常指标高亮" },
  { label: "手术决策 + 术中", role: "手术团队", desc: "审核结果 · 填写术中量表" },
  { label: "术后康复", role: "治疗师 + 护士", desc: "术后观察 · 康复方案 · 出院评估" },
  { label: "出院随访", role: "治疗师", desc: "智能问卷 · 超时电话干预" },
];

function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      {/* Hero */}
      <header className="border-b bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">骨安 BoneCare</div>
              <div className="text-[10px] text-muted-foreground">骨科一体化诊疗工作台 · Demo</div>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] text-success md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            已接入门诊 / 住院 / 随访 全流程
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <Workflow className="h-3 w-3" />
            选择角色进入对应工作台
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            一个流程,
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              四个协同角色
            </span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            从门诊待入院 → 术前检查 → 手术 → 术后康复 → 出院随访,
            每个角色都能在自己的工作台聚焦"今天该做的事"。
          </p>
        </div>

        {/* Role cards */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => {
            const meta = roleMeta[r];
            const Icon = roleIcons[r];
            return (
              <Link
                key={r}
                to="/role/$role"
                params={{ role: r }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${meta.accent} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`}
                />
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-md`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {meta.subtitle}
                </div>
                <h3 className="mt-1 text-lg font-bold text-foreground">{meta.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  进入工作台
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        {/* Department split */}
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-info" />
              <h3 className="text-sm font-semibold">门诊 患者管理</h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              患者通过【骨安】小程序住院版扫码登记 → 科室秘书电话沟通确认入院日期 → 入院前一日推送宣教。
              重点关注"待入院总表"与"拟入院日期"。
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["扫码登记", "电话确认", "宣教推送", "入院办理"].map((t) => (
                <span key={t} className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] text-info">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">住院 患者管理</h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              床位视图 / 当日 / 护理 / 康复 / 主任 多视图协同, 串联术前检查 → 手术 → 术后 → 出院 → 随访 全周期。
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["床位视图", "术前OCR", "术中量表", "康复评估", "出院随访"].map((t) => (
                <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow strip */}
        <section className="mt-12 overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="border-b px-5 py-3">
            <h3 className="text-sm font-semibold">业务流程总览</h3>
            <p className="text-[11px] text-muted-foreground">骨安 - 全周期协同流程图</p>
          </div>
          <div className="grid gap-0 md:grid-cols-5">
            {flowSteps.map((s, i) => (
              <div key={s.label} className="relative border-r p-4 last:border-r-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="text-xs font-semibold text-foreground">{s.label}</div>
                </div>
                <div className="mt-2 text-[10px] text-primary">{s.role}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 text-center text-[11px] text-muted-foreground">
          数据为演示用模拟数据 · 已脱敏
        </footer>
      </main>
    </div>
  );
}
