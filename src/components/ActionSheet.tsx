import { useEffect } from "react";

export function ActionSheet({
  open,
  title,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  actions: { label: string; tone?: "default" | "primary" | "destructive"; onClick: () => void }[];
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-foreground/40" onClick={onClose}>
      <div
        className="w-full overflow-hidden rounded-t-2xl bg-card pb-2 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b py-2 text-center text-[11px] font-medium text-muted-foreground">{title}</div>
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              a.onClick();
              onClose();
            }}
            className={`block w-full border-b py-3 text-[13px] last:border-b-0 active:bg-muted/40 ${
              a.tone === "destructive" ? "text-destructive" : a.tone === "primary" ? "font-semibold text-primary" : "text-foreground"
            }`}
          >
            {a.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="mt-1.5 block w-full bg-muted/40 py-3 text-[13px] font-medium text-muted-foreground"
        >
          取消
        </button>
      </div>
    </div>
  );
}

export function ToastBanner({ text, tone = "success" }: { text: string; tone?: "success" | "info" | "warning" }) {
  const map = {
    success: "bg-success text-white",
    info: "bg-info text-white",
    warning: "bg-warning text-warning-foreground",
  };
  return (
    <div className={`absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-medium shadow-lg ${map[tone]}`}>
      {text}
    </div>
  );
}
