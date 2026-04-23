import { Link, useParams } from "@tanstack/react-router";
import { Stethoscope, ClipboardCheck, Users, Activity, Home, Search } from "lucide-react";
import { roleMeta } from "@/lib/mock-data";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const roleIcons = {
  secretary: Stethoscope,
  "doctor-on-duty": ClipboardCheck,
  "surgical-team": Users,
  therapist: Activity,
} as const;

const roles: Role[] = ["secretary", "doctor-on-duty", "surgical-team", "therapist"];

export function RoleSwitcher({ activeRole }: { activeRole: Role }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground shadow-sm"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-foreground">骨安 BoneCare</div>
            <div className="text-[10px] text-muted-foreground">骨科一体化诊疗平台</div>
          </div>
        </Link>

        <Link
          to="/"
          className="ml-2 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          角色入口
        </Link>

        <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {roles.map((r) => {
            const Icon = roleIcons[r];
            const meta = roleMeta[r];
            const active = r === activeRole;
            return (
              <Link
                key={r}
                to="/role/$role"
                params={{ role: r }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.title}
              </Link>
            );
          })}
        </nav>

        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索患者 / 床号 / 主任"
            className="h-8 w-64 pl-8 text-xs"
          />
        </div>

        <Badge variant="outline" className="hidden lg:flex gap-1 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          演示模式
        </Badge>
      </div>
    </header>
  );
}

export function useCurrentRole(): Role {
  // helper: read role from route params if available
  const params = useParams({ strict: false }) as { role?: Role };
  return params.role ?? "secretary";
}
