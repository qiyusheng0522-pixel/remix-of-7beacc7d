import { useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Search, ChevronRight, Sparkles } from "lucide-react";
import type { Patient } from "@/lib/types";

/** 与护士端一致的"患者沟通"入口卡片（横向，绿色图标 + 未读徽章） */
export function PatientChatEntryCard({
  unreadCount,
  patientCount,
  onClick,
}: {
  unreadCount: number;
  patientCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-2xl border bg-card p-3 text-left active:bg-muted/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
        <MessageCircle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold">患者沟通</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} 条未处理消息 · 涉及 ${patientCount} 位患者`
            : "暂无未处理消息"}
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

interface ChatListProps {
  patients: Patient[];
  /** 各患者未读数（id -> 数字） */
  unread?: Record<string, number>;
  /** 各患者最近一条消息预览 */
  lastMessage?: Record<string, string>;
  onOpen: (p: Patient) => void;
}

/** 内嵌使用的"患者沟通"列表（用于 Tab 内容） */
export function PatientChatListView({ patients, unread = {}, lastMessage = {}, onOpen }: ChatListProps) {
  const [keyword, setKeyword] = useState("");

  const totalUnread = useMemo(
    () => Object.values(unread).reduce((s, n) => s + n, 0),
    [unread],
  );
  const involved = useMemo(
    () => Object.values(unread).filter((n) => n > 0).length,
    [unread],
  );

  const visible = patients.filter((p) => {
    if (!keyword.trim()) return true;
    const k = keyword.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(k) ||
      (p.bedNo ?? "").toLowerCase().includes(k) ||
      (p.diagnosis ?? "").toLowerCase().includes(k)
    );
  });

  return (
    <div className="space-y-3 p-3">
      {/* 概览卡片（护士端风格） */}
      <div
        className="flex w-full items-center gap-2.5 rounded-2xl border bg-card p-3 text-left"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold">未处理消息</span>
            {totalUnread > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {totalUnread > 0
              ? `${totalUnread} 条未处理消息 · 涉及 ${involved} 位患者`
              : "暂无未处理消息"}
          </div>
        </div>
      </div>

      {/* AI 提示条 */}
      <div className="flex items-center gap-1.5 rounded-2xl border bg-info/5 p-2.5 text-[11px] text-info">
        <Sparkles className="h-3 w-3 shrink-0" />
        AI 已为每位患者准备草稿，确认后即可发送。
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索姓名 / 床号 / 诊断"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold">我的患者 · {visible.length}</div>
      </div>

      <div className="space-y-2">
        {visible.map((p) => {
          const u = unread[p.id] ?? 0;
          const last = lastMessage[p.id] ?? p.surgeryName ?? p.diagnosis ?? "暂无消息";
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="flex w-full items-center gap-2.5 rounded-2xl border bg-card p-3 text-left active:bg-muted/30"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                {p.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12px] font-semibold">{p.name}</span>
                  {p.bedNo && (
                    <span className="text-[10px] text-muted-foreground">· {p.bedNo}床</span>
                  )}
                  {p.side && (
                    <span className="rounded bg-warning/20 px-1 py-0.5 text-[9px] font-bold text-warning-foreground">
                      患侧 {p.side}
                    </span>
                  )}
                  {u > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
                      {u}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{last}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center text-[11px] text-muted-foreground">
            暂无匹配的患者
          </div>
        )}
      </div>
    </div>
  );
}

/** 全屏 Sheet 形式的"患者沟通"列表（用于从首页卡片打开） */
export function PatientChatListSheet({
  title = "患者沟通",
  subtitle,
  patients,
  unread,
  lastMessage,
  onClose,
  onOpen,
}: ChatListProps & { title?: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2.5">
        <button onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{title}</div>
          {subtitle && (
            <div className="truncate text-[10px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <PatientChatListView
          patients={patients}
          unread={unread}
          lastMessage={lastMessage}
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}
