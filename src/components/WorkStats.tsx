import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ===========================================================
 * 移动端轻量图表（纯 SVG，无外部依赖）
 * =========================================================== */

export interface BarSeries {
  label: string;
  value: number;
}

/** 柱状图：用于展示每日/每周量 */
export function BarChart({
  data,
  color = "var(--gradient-primary)",
  unit,
  height = 120,
}: {
  data: BarSeries[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const h = Math.max((d.value / max) * (height - 24), 4);
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[9px] font-bold text-foreground">{d.value}</div>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: h, background: color, minHeight: 4 }}
              />
              <div className="text-[9px] text-muted-foreground">{d.label}</div>
            </div>
          );
        })}
      </div>
      {unit && <div className="mt-1 text-right text-[9px] text-muted-foreground">单位：{unit}</div>}
    </div>
  );
}

/** 折线/面积图：用于展示趋势 */
export function LineChart({
  data,
  height = 120,
  stroke = "var(--primary)",
}: {
  data: BarSeries[];
  height?: number;
  stroke?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const w = 280;
  const padding = 16;
  const innerH = height - padding * 2;
  const step = (w - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: padding + i * step,
    y: padding + innerH - ((d.value - min) / range) * innerH,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${padding + innerH} L ${points[0].x} ${padding + innerH} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={stroke} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d) => (
          <div key={d.label} className="text-[9px] text-muted-foreground">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 环形进度图：用于展示达标率 / 完成率 */
export function DonutChart({
  value,
  label,
  color = "var(--primary)",
  size = 80,
}: {
  value: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth="6" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-sm font-bold text-foreground">{value}%</div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

/** 横向条形：用于展示分类占比 */
export function HBarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* =========================================================== */

export function StatTile({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-info/10 text-info",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-2.5">
      <div className="flex items-center gap-1.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", toneCls)}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
      <div className="mt-1.5 text-base font-bold text-foreground">{value}</div>
      {delta && <div className="text-[9px] text-success">{delta}</div>}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-[12px] font-semibold text-foreground">{title}</div>
          {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
