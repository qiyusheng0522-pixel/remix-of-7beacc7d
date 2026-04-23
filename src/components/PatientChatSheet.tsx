import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileSearch, ArrowLeft, Phone } from "lucide-react";
import type { Patient } from "@/lib/types";
import { aiAutoReply } from "@/lib/mock-records";
import { PatientArchiveSheet } from "./PatientArchiveSheet";

interface Msg {
  id: string;
  from: "patient" | "self" | "ai";
  text: string;
  time: string;
}

export function PatientChatSheet({ patient, onClose, selfRole = "护士" }: { patient: Patient; onClose: () => void; selfRole?: string }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [aiOn, setAiOn] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "m1", from: "patient", text: `您好，我是 ${patient.name}，有几个问题想咨询`, time: "09:21" },
    { id: "m2", from: "patient", text: "术后伤口有点疼，VAS 4-5 分，要紧吗？", time: "09:22" },
    { id: "m3", from: "ai", text: aiAutoReply("疼痛"), time: "09:22" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((m) => [...m, { id: `s${Date.now()}`, from: "self", text: input, time: t }]);
    setInput("");
  };

  const simulatePatient = () => {
    const sample = "请问明天可以下地吗？";
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((m) => [...m, { id: `p${Date.now()}`, from: "patient", text: sample, time: t }]);
    if (aiOn) {
      setTimeout(() => {
        setMessages((m) => [...m, { id: `a${Date.now()}`, from: "ai", text: aiAutoReply(sample), time: t }]);
      }, 600);
    }
  };

  if (archiveOpen) return <PatientArchiveSheet patient={patient} onClose={() => setArchiveOpen(false)} />;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      {/* 顶部 */}
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2.5">
        <button onClick={onClose}><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {patient.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{patient.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {patient.bedNo ? `${patient.bedNo}床 · ` : ""}{patient.diagnosis}
          </div>
        </div>
        <button
          onClick={() => alert(`正在拨打 ${patient.phone}`)}
          className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-medium text-success"
        >
          <Phone className="h-3 w-3" />电话
        </button>
        <button
          onClick={() => setArchiveOpen(true)}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"
        >
          <FileSearch className="h-3 w-3" />档案
        </button>
      </div>

      {/* AI 开关 */}
      <div className="flex items-center justify-between border-b bg-info/5 px-3 py-1.5 text-[10px]">
        <span className="flex items-center gap-1 text-info">
          <Sparkles className="h-3 w-3" />AI 自动回复 {aiOn ? "已开启" : "已关闭"}
        </span>
        <button
          onClick={() => setAiOn((v) => !v)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiOn ? "bg-info text-white" : "bg-muted text-muted-foreground"}`}
        >
          {aiOn ? "关闭" : "开启"}
        </button>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} selfRole={selfRole} />
        ))}
      </div>

      {/* 输入 */}
      <div className="border-t bg-card px-2 py-2">
        <div className="mb-1.5 flex gap-1">
          <button
            onClick={simulatePatient}
            className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground active:bg-muted/40"
          >
            模拟患者发问
          </button>
          <button className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
            <Phone className="h-2.5 w-2.5" />语音
          </button>
        </div>
        <div className="flex items-end gap-1.5">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="输入消息..."
            className="flex-1 resize-none rounded-full border bg-muted/30 px-3 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <button
            onClick={send}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground active:opacity-80"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, selfRole }: { msg: Msg; selfRole: string }) {
  if (msg.from === "patient") {
    return (
      <div className="flex max-w-[80%] gap-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px]">患</div>
        <div>
          <div className="rounded-2xl rounded-tl-sm bg-card px-3 py-1.5 text-[12px] shadow-sm">{msg.text}</div>
          <div className="mt-0.5 text-[9px] text-muted-foreground">{msg.time}</div>
        </div>
      </div>
    );
  }
  if (msg.from === "ai") {
    return (
      <div className="flex max-w-[85%] gap-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/15 text-info">
          <Sparkles className="h-3 w-3" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tl-sm border border-info/30 bg-info/5 px-3 py-1.5 text-[12px]">
            <div className="mb-0.5 text-[9px] font-bold text-info">AI 自动回复</div>
            {msg.text}
          </div>
          <div className="mt-0.5 text-[9px] text-muted-foreground">{msg.time}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="ml-auto flex max-w-[80%] flex-row-reverse gap-1.5">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        {selfRole.slice(0, 1)}
      </div>
      <div>
        <div
          className="rounded-2xl rounded-tr-sm px-3 py-1.5 text-[12px] text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          {msg.text}
        </div>
        <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{msg.time}</div>
      </div>
    </div>
  );
}
