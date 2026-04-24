import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileSearch, ArrowLeft, Phone, BellRing, CheckCircle2, RefreshCw, Package, X } from "lucide-react";
import type { Patient } from "@/lib/types";
import { aiAutoReply, getArchive } from "@/lib/mock-records";
import { PatientArchiveSheet } from "./PatientArchiveSheet";

interface Msg {
  id: string;
  from: "patient" | "self" | "ai";
  text: string;
  time: string;
}

const QUICK_QUESTIONS = ["术后伤口疼痛 VAS 4-5 分", "明天可以下地吗？", "出院需要满足什么条件？"];

export function PatientChatSheet({
  patient,
  onClose,
  selfRole = "护士",
}: {
  patient: Patient;
  onClose: () => void;
  selfRole?: string;
}) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [picker, setPicker] = useState<null | "edu" | "package">(null);
  const [aiHosting, setAiHosting] = useState(true); // 默认开启 AI 托管
  const [messages, setMessages] = useState<Msg[]>([
    { id: "m1", from: "patient", text: `您好，我是 ${patient.name}，有几个问题想咨询`, time: "09:21" },
    { id: "m2", from: "patient", text: "术后伤口有点疼，VAS 4-5 分，要紧吗？", time: "09:22" },
  ]);
  const [draft, setDraft] = useState<string>(""); // AI 生成的待确认草稿
  const [draftSource, setDraftSource] = useState<"ai" | "manual">("ai");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 进入即让 AI 结合最后一条患者问题 + 档案生成草稿
  useEffect(() => {
    if (aiHosting && draft === "") {
      const lastPatientMsg = [...messages].reverse().find((m) => m.from === "patient");
      if (lastPatientMsg) {
        setDraft(buildAiDraft(lastPatientMsg.text, patient));
        setDraftSource("ai");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiHosting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const sendDraft = () => {
    if (!draft.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `s${Date.now()}`, from: draftSource === "ai" ? "ai" : "self", text: draft, time: now() },
    ]);
    setDraft("");
  };

  const sendInput = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: `s${Date.now()}`, from: "self", text: input, time: now() }]);
    setInput("");
  };

  const regenerate = () => {
    const lastPatientMsg = [...messages].reverse().find((m) => m.from === "patient");
    if (lastPatientMsg) {
      setDraft(buildAiDraft(lastPatientMsg.text, patient));
      setDraftSource("ai");
    }
  };

  const askQuick = (q: string) => {
    setMessages((m) => [...m, { id: `p${Date.now()}`, from: "patient", text: q, time: now() }]);
    if (aiHosting) {
      setTimeout(() => {
        setDraft(buildAiDraft(q, patient));
        setDraftSource("ai");
      }, 400);
    }
  };

  if (archiveOpen) return <PatientArchiveSheet patient={patient} onClose={() => setArchiveOpen(false)} />;

  const sendQuickItem = (kind: "edu" | "package", title: string, desc: string) => {
    const prefix = kind === "edu" ? "📘 已发送宣教" : "🎁 已发送服务包";
    setMessages((m) => [
      ...m,
      { id: `q${Date.now()}`, from: "self", text: `${prefix}：${title}\n${desc}`, time: now() },
    ]);
    setPicker(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      {/* 顶部 */}
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2.5">
        <button onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {patient.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{patient.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {patient.bedNo ? `${patient.bedNo}床 · ` : ""}
            {patient.diagnosis}
          </div>
        </div>
        <button
          onClick={() => alert(`正在拨打 ${patient.phone}`)}
          className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-medium text-success"
        >
          <Phone className="h-3 w-3" />
          电话
        </button>
        <button
          onClick={() => setArchiveOpen(true)}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"
        >
          <FileSearch className="h-3 w-3" />
          档案
        </button>
      </div>

      {/* AI 托管开关 */}
      <div className="flex items-center justify-between border-b bg-info/5 px-3 py-1.5 text-[10px]">
        <span className="flex items-center gap-1 text-info">
          <Sparkles className="h-3 w-3" />
          AI 托管 {aiHosting ? "已开启" : "已关闭"} · {aiHosting ? "结合档案自动起草，待您确认" : "纯人工回复"}
        </span>
        <button
          onClick={() => setAiHosting((v) => !v)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            aiHosting ? "bg-info text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {aiHosting ? "关闭" : "开启"}
        </button>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} selfRole={selfRole} />
        ))}
        {/* 模拟患者快速提问（用于演示） */}
        {messages.length < 6 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => askQuick(q)}
                className="rounded-full border bg-card px-2 py-0.5 text-[10px] text-muted-foreground active:bg-muted/40"
              >
                ↩ {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI 草稿确认区（托管开启且有草稿时显示） */}
      {aiHosting && draft && (
        <div className="border-t bg-info/5 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-bold text-info">
              <Sparkles className="h-3 w-3" />
              AI 已结合档案生成回复（待您确认）
            </span>
            <button onClick={regenerate} className="flex items-center gap-1 text-[10px] text-muted-foreground active:text-foreground">
              <RefreshCw className="h-2.5 w-2.5" />
              换一条
            </button>
          </div>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftSource("manual");
            }}
            className="w-full resize-none rounded-lg border border-info/30 bg-card p-2 text-[12px] outline-none focus:border-info"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setDraft("")}
              className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground active:bg-muted/40"
            >
              丢弃
            </button>
            <button
              onClick={sendDraft}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-medium text-primary-foreground active:opacity-80"
              style={{ background: "var(--gradient-primary)" }}
            >
              <CheckCircle2 className="h-3 w-3" />
              确认发送
            </button>
          </div>
        </div>
      )}

      {/* 输入区 */}
      <div className="border-t bg-card px-2 py-2">
        <div className="mb-1.5 flex flex-wrap gap-1">
          <button
            onClick={() => setPicker("edu")}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary active:opacity-80"
          >
            <BellRing className="h-2.5 w-2.5" />
            发送宣教
          </button>
          <button
            onClick={() => setPicker("package")}
            className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning-foreground active:opacity-80"
          >
            <Package className="h-2.5 w-2.5" />
            服务包
          </button>
          {!aiHosting && (
            <button
              onClick={() => {
                const lastPatient = [...messages].reverse().find((m) => m.from === "patient");
                if (lastPatient) {
                  setDraft(buildAiDraft(lastPatient.text, patient));
                  setDraftSource("ai");
                  setAiHosting(true);
                }
              }}
              className="flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info active:opacity-80"
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI 起草
            </button>
          )}
        </div>
        <div className="flex items-end gap-1.5">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendInput();
              }
            }}
            placeholder={aiHosting ? "可直接补充手工内容..." : "输入消息..."}
            className="flex-1 resize-none rounded-full border bg-muted/30 px-3 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <button
            onClick={sendInput}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground active:opacity-80"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {picker && (
        <QuickSendPicker
          kind={picker}
          patientName={patient.name}
          onClose={() => setPicker(null)}
          onSelect={(t, d) => sendQuickItem(picker, t, d)}
        />
      )}
    </div>
  );
}

const EDU_ITEMS = [
  { title: "术前一日宣教", desc: "皮肤准备 / 8 小时禁食 / 心理准备" },
  { title: "术后康复指导", desc: "踝泵 / SLR / 体位摆放" },
  { title: "DVT 预防宣教", desc: "下肢活动 / 弹力袜 / 抗凝注意" },
  { title: "出院随访注意事项", desc: "复查时间 / 用药 / 饮食" },
  { title: "膝关节屈伸训练", desc: "0-90° 渐进 / 每日 3 组" },
];

const PACKAGE_ITEMS = [
  { title: "术后基础康复包（30 天）", desc: "包含 8 次居家随访、康复方案、视频指导" },
  { title: "ACL 重建专项包（90 天）", desc: "ROM 训练 / 力量恢复 / 运动回归测试" },
  { title: "TKA 术后康复包（60 天）", desc: "屈膝训练 / 步态矫正 / 上下楼梯" },
  { title: "肩袖修复康复包（90 天）", desc: "被动活动 / 主动活动 / 抗阻训练" },
  { title: "居家随访服务（按月）", desc: "每周 2 次电话 + 1 次视频回访" },
];

function QuickSendPicker({
  kind,
  patientName,
  onClose,
  onSelect,
}: {
  kind: "edu" | "package";
  patientName: string;
  onClose: () => void;
  onSelect: (title: string, desc: string) => void;
}) {
  const isEdu = kind === "edu";
  const items = isEdu ? EDU_ITEMS : PACKAGE_ITEMS;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-black/40" onClick={onClose}>
      <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-t-3xl bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isEdu ? (
                <BellRing className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Package className="h-3.5 w-3.5 text-warning-foreground" />
              )}
              <div className="text-[13px] font-semibold">
                选择{isEdu ? "宣教内容" : "服务包"}
              </div>
              <span className="text-[10px] text-muted-foreground">→ {patientName}</span>
            </div>
            <button onClick={onClose} className="rounded-full p-1 active:bg-muted/40">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
            {items.map((it) => (
              <button
                key={it.title}
                onClick={() => onSelect(it.title, it.desc)}
                className="flex w-full items-start justify-between gap-2 rounded-xl border bg-card p-2.5 text-left active:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium">{it.title}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{it.desc}</div>
                </div>
                <Send className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
              </button>
            ))}
          </div>
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
      <div className="ml-auto flex max-w-[85%] flex-row-reverse gap-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/15 text-info">
          <Sparkles className="h-3 w-3" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tr-sm border border-info/30 bg-info/5 px-3 py-1.5 text-[12px]">
            <div className="mb-0.5 flex items-center gap-1 text-[9px] font-bold text-info">
              <CheckCircle2 className="h-2.5 w-2.5" />
              {selfRole} 已确认 · AI 起草
            </div>
            {msg.text}
          </div>
          <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{msg.time}</div>
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

/* AI 草稿生成：结合患者档案 + 问题关键词 */
function buildAiDraft(question: string, patient: Patient): string {
  const archive = getArchive(patient.id);
  const base = aiAutoReply(question);
  const personal: string[] = [];
  if (archive.allergies.length) personal.push(`您过敏史：${archive.allergies.join("、")}`);
  if (patient.surgeryName) personal.push(`您的手术：${patient.surgeryName}`);
  const recent = archive.medication[0];
  if (recent) personal.push(`当前用药：${recent.drug} ${recent.dose} ${recent.route}`);
  return `${patient.name}您好，${base}\n\n（结合档案：${personal.join("；")}）`;
}
