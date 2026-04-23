import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Stethoscope, ClipboardCheck, Users, Activity, Home, ChevronLeft } from "lucide-react";
import type { Role } from "@/lib/types";
import { SecretaryWorkbench } from "@/features/SecretaryWorkbench";
import { DoctorOnDutyWorkbench } from "@/features/DoctorOnDutyWorkbench";
import { SurgicalTeamWorkbench } from "@/features/SurgicalTeamWorkbench";
import { TherapistWorkbench } from "@/features/TherapistWorkbench";
import { roleMeta } from "@/lib/mock-data";
import { PhoneShell } from "@/components/PhoneShell";
import { cn } from "@/lib/utils";

const VALID: Role[] = ["secretary", "doctor-on-duty", "surgical-team", "therapist"];

const roleIcons = {
  secretary: Stethoscope,
  "doctor-on-duty": ClipboardCheck,
  "surgical-team": Users,
  therapist: Activity,
} as const;

export const Route = createFileRoute("/role/$role")({
  head: ({ params }) => {
    const meta = roleMeta[params.role as Role];
    const title = meta ? `${meta.title} 小程序 — 骨安` : "角色小程序 — 骨安";
    return {
      meta: [
        { title },
        { name: "description", content: meta?.description ?? "骨安角色化诊疗小程序" },
      ],
    };
  },
  component: RolePage,
});

function RolePage() {
  const { role } = Route.useParams() as { role: Role };

  if (!VALID.includes(role)) {
    return <Navigate to="/" />;
  }

  const meta = roleMeta[role];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      {/* 顶部桌面导航：用于在角色之间切换（不属于小程序内部） */}
      <header className="border-b bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">骨安 BoneCare 小程序</div>
              <div className="text-[10px] text-muted-foreground">原型预览 · 切换角色端</div>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            返回入口
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[260px_1fr_260px]">
        {/* 左侧：角色切换 */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-2">
            <div className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              角色端
            </div>
            {VALID.map((r) => {
              const Icon = roleIcons[r];
              const m = roleMeta[r];
              const active = r === role;
              return (
                <Link
                  key={r}
                  to="/role/$role"
                  params={{ role: r }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-3 transition-all",
                    active
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-transparent bg-card hover:border-primary/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                      m.accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">{m.title}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {m.subtitle}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* 中间：手机模拟外壳 */}
        <main className="flex justify-center">
          {role === "secretary" && <SecretaryWorkbench />}
          {role === "doctor-on-duty" && <DoctorOnDutyWorkbench />}
          {role === "surgical-team" && <SurgicalTeamWorkbench />}
          {role === "therapist" && <TherapistWorkbench />}
        </main>

        {/* 右侧：角色简介 */}
        <aside className="hidden space-y-3 lg:block">
          <div className="sticky top-6 space-y-3">
            <div className="rounded-2xl border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-[10px] font-medium uppercase tracking-wider text-primary">
                {meta.subtitle}
              </div>
              <h3 className="mt-1 text-base font-bold text-foreground">{meta.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
              查看全部 4 个角色端
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

