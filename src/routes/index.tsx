import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope, ClipboardCheck, Users, Activity, ChevronRight, Smartphone, Workflow } from "lucide-react";
import { roleMeta } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "骨安 BoneCare 小程序 — 角色入口" },
      { name: "description", content: "骨安骨科诊疗小程序 · 4 个角色端 · 门诊与住院全周期管理" },
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

const flow = [
  { n: "01", t: "门诊登记", who: "护士/秘书" },
  { n: "02", t: "术前检查", who: "值班医生" },
  { n: "03", t: "手术执行", who: "手术团队" },
  { n: "04", t: "康复随访", who: "治疗师" },
];

function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="border-b bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">骨安 BoneCare 小程序</div>
              <div className="text-[10px] text-muted-foreground">微信小程序原型 · Demo</div>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] text-success md:flex">
            <Smartphone className="h-3 w-3" />
            建议在桌面端浏览各角色端原型
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <Workflow className="h-3 w-3" />
            点击下方任一角色，进入小程序原型
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            骨安 ·{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              四端协同小程序
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
            护士 / 值班医生 / 手术团队 / 治疗师 —— 每个角色都有独立的小程序入口，串联门诊与住院全流程。
          </p>
        </div>

        {/* 流程条 */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-4 gap-2">
          {flow.map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-3 text-center">
              <div className="text-[10px] font-mono text-primary">{s.n}</div>
              <div className="mt-1 text-xs font-semibold">{s.t}</div>
              <div className="text-[10px] text-muted-foreground">{s.who}</div>
            </div>
          ))}
        </div>

        {/* 角色卡片 */}
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
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-md`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background/60">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {meta.subtitle}
                </div>
                <h3 className="mt-1 text-lg font-bold text-foreground">{meta.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  打开小程序
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="mt-10 text-center text-[11px] text-muted-foreground">
          数据为演示用模拟数据 · 已脱敏 · 设计参照微信小程序原型规范
        </footer>
      </main>
    </div>
  );
}
