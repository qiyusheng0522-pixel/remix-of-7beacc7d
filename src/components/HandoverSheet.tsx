import { ArrowLeft, ClipboardList, AlertTriangle, Activity } from "lucide-react";

/**
 * 护理交班单
 */
export function HandoverSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">护理交班单</div>
        <button className="text-[11px] font-medium text-primary">导出</button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-2xl p-3 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <div className="text-[10px] opacity-80">2024-04-22 · 早 08:00 交班</div>
          <div className="mt-1 text-sm font-bold">骨科一病区 · 共 12 名患者</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="rounded bg-white/15 p-1.5"><div className="text-base font-bold">12</div>在院</div>
            <div className="rounded bg-white/15 p-1.5"><div className="text-base font-bold">2</div>昨入</div>
            <div className="rounded bg-white/15 p-1.5"><div className="text-base font-bold">2</div>昨术</div>
            <div className="rounded bg-white/15 p-1.5"><div className="text-base font-bold">3</div>今术</div>
          </div>
        </div>

        <Section title="重点交班" icon={AlertTriangle} tone="text-destructive">
          <Row badge="03床" name="孙顺英" tone="warning" text="昨日 (右) TKA 术后，引流暗血性液 50ml；尿管 200ml。需 q4h 监测引流。" />
          <Row badge="05床" name="杨成轩" tone="info" text="术后第 3 日，沟通障碍，家属陪护。今日 PT/INR 复查。" />
          <Row badge="02床" name="吴翠花" tone="destructive" text="传染病史 (HBV)，标准预防 + 接触隔离。" />
        </Section>

        <Section title="今日手术" icon={ClipboardList}>
          <Row badge="01床" name="刘德海" text="08:30 · 右 THA · 王主任 · 术前 Hb 98 偏低需关注" />
          <Row badge="02床" name="吴翠花" text="10:00 · 左 TKA 翻修 · 秦主任" />
          <Row badge="06床" name="陈志强" text="14:00 · 右肩关节镜 · 王主任" />
        </Section>

        <Section title="DVT / 血栓监测" icon={Activity} tone="text-primary">
          <Row badge="05床" name="杨成轩" text="Caprini 5 分（高危），低分子肝素 4000IU qd" />
          <Row badge="08床" name="胡国玉" text="Caprini 3 分（中危），机械预防 + 弹力袜" />
        </Section>
      </div>

      <div className="border-t bg-card px-3 py-2.5">
        <button
          onClick={onClose}
          className="w-full rounded-full py-2 text-[13px] font-medium text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          确认交接完成
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, tone, children }: { title: string; icon: React.ElementType; tone?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold ${tone ?? "text-foreground"}`}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ badge, name, text, tone }: { badge: string; name: string; text: string; tone?: "info" | "warning" | "destructive" }) {
  const map = {
    info: "bg-info/10 border-info/30",
    warning: "bg-warning/10 border-warning/30",
    destructive: "bg-destructive/10 border-destructive/30",
  };
  return (
    <div className={`rounded-xl border bg-card p-2.5 ${tone ? map[tone] : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{badge}</span>
        <span className="text-[12px] font-medium">{name}</span>
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-foreground">{text}</div>
    </div>
  );
}
