import { ReactNode, useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 模拟微信小程序的手机外壳，宽度固定为 375 (iPhone 标准)。
 * 顶部状态栏 + 微信小程序顶栏（胶囊按钮位置）。
 */
export function PhoneShell({
  title,
  subtitle,
  children,
  rightSlot,
  hideHeader,
  bottom,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  hideHeader?: boolean;
  bottom?: ReactNode;
  className?: string;
}) {
  const [time, setTime] = useState("09:41");
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[812px] w-[375px] flex-col overflow-hidden rounded-[44px] border-[10px] border-foreground/90 bg-background shadow-2xl",
        className,
      )}
      style={{ boxShadow: "0 30px 80px -20px rgba(15, 42, 84, 0.45)" }}
    >
      {/* 状态栏 */}
      <div className="flex items-center justify-between bg-card px-6 pt-2.5 pb-1 text-[11px] font-semibold text-foreground">
        <span>{time}</span>
        <div className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3" />
          <Wifi className="h-3 w-3" />
          <BatteryFull className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* 小程序顶栏 */}
      {!hideHeader && (
        <div className="relative flex items-center justify-between border-b bg-card px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-foreground">
              {title ?? "骨安 BoneCare"}
            </div>
            {subtitle && (
              <div className="truncate text-[10px] text-muted-foreground">{subtitle}</div>
            )}
          </div>
          {rightSlot}
          {/* 胶囊按钮 */}
          <div className="ml-2 flex h-6 w-[68px] items-center justify-around rounded-full border border-border/60 bg-background/60 text-[10px] text-muted-foreground">
            <span>···</span>
            <div className="h-3 w-px bg-border" />
            <span>○</span>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto bg-muted/30 pb-2">{children}</div>

      {/* 底部 Tab 栏 / 自定义底部 */}
      {bottom && <div className="border-t bg-card">{bottom}</div>}

      {/* Home indicator */}
      <div className="flex justify-center bg-card pb-1.5 pt-1">
        <div className="h-1 w-28 rounded-full bg-foreground/80" />
      </div>
    </div>
  );
}

export function TabBar({
  items,
  activeKey,
  onChange,
}: {
  items: { key: string; label: string; icon: React.ElementType; badge?: number }[];
  activeKey: string;
  onChange: (k: string) => void;
}) {
  const cols = items.length;
  const gridClass =
    cols === 5 ? "grid-cols-5" : cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <nav className={cn("grid px-1.5 pt-1.5 pb-1", gridClass)}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.key === activeKey;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              "relative flex min-w-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-1 transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {it.badge ? (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {it.badge}
                </span>
              ) : null}
            </div>
            <span className={cn("whitespace-nowrap leading-none", cols >= 5 ? "text-[9px]" : "text-[10px]")}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
