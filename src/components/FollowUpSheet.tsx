import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  Send,
  Stethoscope,
  Activity,
  X,
  ClipboardList,
  Clock,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import type { Patient } from "@/lib/types";

type Stage = "list" | "session" | "manual" | "summary";

type DialogTurn =
  | { from: "ai"; text: string; time: string }
  | { from: "patient"; text: string; time: string }
  | { from: "system"; text: string; time: string };

interface SessionState {
  patient: Patient;
  turns: DialogTurn[];
  status: "ai-active" | "no-reply" | "manual" | "done";
  // 已问的问题数（用于决定 AI 下一句）
  step: number;
  // 汇总
  pain?: string;
  swelling?: string;
  rom?: string;
  abnormal?: string;
  recommendation?: { kind: "doctor" | "therapist" | "self"; reason: string };
}

const AI_QUESTIONS = [
  "您好，我是术后智能随访助手，请问您术后伤口疼痛评分（VAS 0-10）是多少？",
  "好的，请问伤口附近是否有红肿、渗液或异常发热？",
  "活动方面，您目前关节屈伸是否能完成医生建议的角度？是否能下床活动？",
  "最后请问您是否按时服药？有无其他不适（发烧、头晕、恶心）？",
];

// 模拟患者反馈池（不同患者随机化）
const PATIENT_REPLIES = [
  ["VAS 大约 3 分，可以忍受", "VAS 5-6 分，夜间加重", "VAS 2 分，基本不疼"],
  ["没有红肿，敷料干燥", "伤口有点渗液，颜色淡黄", "周围皮肤有点红"],
  ["可以屈到 60°，下床扶拐", "屈膝只能到 30°，比较僵", "可以屈 90°，自主下地"],
  ["按时吃药，无其他不适", "有点低烧 37.5℃", "服药正常，无明显异常"],
];

export function FollowUpSheet({
  candidates,
  onClose,
  onPushTo,
}: {
  candidates: Patient[];
  onClose: () => void;
  onPushTo: (msg: string) => void;
}) {
  const [stage, setStage] = useState<Stage>("list");
  const [session, setSession] = useState<SessionState | null>(null);

  // 把候选患者构造为随访清单（每个患者一条）
  const items = useMemo(
    () =>
      candidates.map((p, i) => ({
        patient: p,
        // 模拟随访状态：默认 pending，部分已完成
        status: p.followUpStatus ?? (i % 3 === 0 ? "done" : "pending"),
        scheduled: p.dischargeDate
          ? `术后第 ${Math.min(7 + i, 30)} 天`
          : `术后第 ${3 + i} 天`,
      })),
    [candidates],
  );

  const pendingCount = items.filter((it) => it.status !== "done").length;

  const startAi = (p: Patient) => {
    const firstTurn: DialogTurn = {
      from: "ai",
      text: `${p.name}您好，我是您的术后智能随访助手 🤖\n${AI_QUESTIONS[0]}`,
      time: now(),
    };
    setSession({
      patient: p,
      turns: [firstTurn],
      status: "ai-active",
      step: 0,
    });
    setStage("session");
  };

  const sendPatientReply = () => {
    if (!session) return;
    const idx = session.step;
    const replies = PATIENT_REPLIES[idx] ?? ["收到"];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    const newTurn: DialogTurn = { from: "patient", text: reply, time: now() };

    const next = idx + 1;
    if (next < AI_QUESTIONS.length) {
      const aiTurn: DialogTurn = { from: "ai", text: AI_QUESTIONS[next], time: now() };
      setSession({ ...session, turns: [...session.turns, newTurn, aiTurn], step: next });
    } else {
      // AI 收尾 + 进入小结
      const closing: DialogTurn = {
        from: "ai",
        text: "感谢您的配合，已记录本次随访。如有不适请随时联系我们。",
        time: now(),
      };
      const summary = buildSummary([...session.turns, newTurn]);
      setSession({
        ...session,
        turns: [...session.turns, newTurn, closing],
        step: next,
        status: "done",
        ...summary,
      });
      setStage("summary");
    }
  };

  const markNoReply = () => {
    if (!session) return;
    const sys: DialogTurn = {
      from: "system",
      text: "⚠️ 患者长时间未回复（>30 分钟），建议人工外呼介入。",
      time: now(),
    };
    setSession({ ...session, turns: [...session.turns, sys], status: "no-reply" });
  };

  const switchToManual = () => {
    if (!session) return;
    setSession({ ...session, status: "manual" });
    setStage("manual");
  };

  const finishManual = (manualNotes: {
    pain: string;
    swelling: string;
    rom: string;
    other: string;
  }) => {
    if (!session) return;
    const callTurn: DialogTurn = {
      from: "system",
      text: `📞 人工外呼已完成 · 录入：疼痛 ${manualNotes.pain} · 红肿 ${manualNotes.swelling} · ROM ${manualNotes.rom}${manualNotes.other ? " · " + manualNotes.other : ""}`,
      time: now(),
    };
    const merged = [...session.turns, callTurn];
    const summary = buildSummaryFromManual(manualNotes);
    setSession({ ...session, turns: merged, status: "done", ...summary });
    setStage("summary");
  };

  const confirmPush = () => {
    if (!session?.recommendation) return;
    const target =
      session.recommendation.kind === "doctor"
        ? `手术医疗团队 (${session.patient.responsibleDoctor ?? "朱医生"})`
        : session.recommendation.kind === "therapist"
          ? `康复治疗师 (${session.patient.responsibleTherapist ?? "朱年鑫"})`
          : "护理";
    onPushTo(`已推送至 ${target} 沟通模块`);
    setStage("list");
    setSession(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      {/* 顶部 */}
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2.5">
        <button
          onClick={() => {
            if (stage === "list") onClose();
            else {
              setStage("list");
              setSession(null);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">
            {stage === "list" && "术后随访清单"}
            {stage === "session" && `AI 随访 · ${session?.patient.name}`}
            {stage === "manual" && `人工外呼录入 · ${session?.patient.name}`}
            {stage === "summary" && `随访小结 · ${session?.patient.name}`}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {stage === "list"
              ? `共 ${items.length} 项 · 待随访 ${pendingCount}`
              : session?.patient.diagnosis}
          </div>
        </div>
        {stage === "list" && (
          <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-medium text-info">
            AI 多轮托管
          </span>
        )}
      </div>

      {stage === "list" && (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.map(({ patient, status, scheduled }) => (
            <div
              key={patient.id}
              className="rounded-2xl border bg-card p-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{patient.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {patient.gender}·{patient.age}
                    </span>
                    {status === "done" && (
                      <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] text-success">
                        已完成
                      </span>
                    )}
                    {status === "needs-second" && (
                      <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] text-warning-foreground">
                        需复访
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="rounded-full bg-info/15 px-1.5 py-0.5 text-[9px] text-info">
                        待随访
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-foreground">
                    {patient.surgeryName ?? patient.diagnosis}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {scheduled}
                    {patient.followUpResult && ` · ${patient.followUpResult}`}
                  </div>
                </div>
                {status !== "done" ? (
                  <button
                    onClick={() => startAi(patient)}
                    className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-primary-foreground active:opacity-80"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI 随访
                  </button>
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {stage === "session" && session && (
        <SessionView
          session={session}
          onPatientReply={sendPatientReply}
          onNoReply={markNoReply}
          onSwitchManual={switchToManual}
          onFinish={() => {
            const summary = buildSummary(session.turns);
            setSession({ ...session, ...summary, status: "done" });
            setStage("summary");
          }}
        />
      )}

      {stage === "manual" && session && (
        <ManualEntryView patient={session.patient} onSave={finishManual} />
      )}

      {stage === "summary" && session && (
        <SummaryView session={session} onConfirm={confirmPush} onChange={(rec) => setSession({ ...session, recommendation: rec })} />
      )}
    </div>
  );
}

/* ---------- 子视图 ---------- */

function SessionView({
  session,
  onPatientReply,
  onNoReply,
  onSwitchManual,
  onFinish,
}: {
  session: SessionState;
  onPatientReply: () => void;
  onNoReply: () => void;
  onSwitchManual: () => void;
  onFinish: () => void;
}) {
  const noReply = session.status === "no-reply";
  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="rounded-xl bg-info/5 p-2 text-[10px] text-info">
          <Sparkles className="mr-1 inline h-2.5 w-2.5" />
          AI 多轮随访进行中 · 已问 {Math.min(session.step + 1, AI_QUESTIONS.length)} / {AI_QUESTIONS.length}
        </div>
        {session.turns.map((t, i) => (
          <Bubble key={i} turn={t} />
        ))}
      </div>

      <div className="border-t bg-card p-2.5">
        {!noReply && session.status !== "done" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={onPatientReply}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] active:bg-muted/70"
            >
              <MessageCircle className="h-3 w-3" />
              模拟患者回复
            </button>
            <button
              onClick={onNoReply}
              className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[10px] text-warning-foreground active:opacity-80"
            >
              <AlertCircle className="h-3 w-3" />
              标记未回复
            </button>
            <button
              onClick={onFinish}
              className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary active:opacity-80"
            >
              <CheckCircle2 className="h-3 w-3" />
              提前结束
            </button>
          </div>
        )}
        {noReply && (
          <div className="space-y-1.5">
            <div className="rounded-lg bg-warning/10 p-2 text-[10px] text-warning-foreground">
              ⚠️ 患者未回复，建议人工外呼介入
            </div>
            <button
              onClick={onSwitchManual}
              className="flex w-full items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-primary-foreground active:opacity-80"
              style={{ background: "var(--gradient-primary)" }}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              人工外呼并录入
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ManualEntryView({
  patient,
  onSave,
}: {
  patient: Patient;
  onSave: (n: { pain: string; swelling: string; rom: string; other: string }) => void;
}) {
  const [pain, setPain] = useState("");
  const [swelling, setSwelling] = useState("");
  const [rom, setRom] = useState("");
  const [other, setOther] = useState("");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-info/5 p-2.5 text-[11px] text-info">
          <Phone className="h-3.5 w-3.5" />
          <div className="flex-1">
            正在拨打 {patient.phone} ...请将通话内容录入下方
          </div>
        </div>

        <Field label="疼痛 / VAS" value={pain} onChange={setPain} placeholder="例：VAS 4 分，夜间略加重" />
        <Field label="红肿 / 渗液" value={swelling} onChange={setSwelling} placeholder="例：无红肿，敷料干燥" />
        <Field label="ROM / 活动" value={rom} onChange={setRom} placeholder="例：屈膝 60°，扶拐下地" />
        <Field label="其他" value={other} onChange={setOther} placeholder="服药 / 饮食 / 主诉" />

        <button
          onClick={() => onSave({ pain, swelling, rom, other })}
          className="w-full rounded-full px-3 py-2 text-[12px] font-medium text-primary-foreground active:opacity-80"
          style={{ background: "var(--gradient-primary)" }}
        >
          完成外呼并生成小结
        </button>
      </div>
    </div>
  );
}

function SummaryView({
  session,
  onConfirm,
  onChange,
}: {
  session: SessionState;
  onConfirm: () => void;
  onChange: (rec: { kind: "doctor" | "therapist" | "self"; reason: string }) => void;
}) {
  const rec = session.recommendation ?? { kind: "self" as const, reason: "无异常，本科室随访留观" };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 p-3">
        <div className="rounded-2xl border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-2 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
            <div className="text-[12px] font-semibold">随访记录</div>
          </div>
          <div className="space-y-1 text-[11px]">
            <Row label="疼痛" value={session.pain ?? "-"} />
            <Row label="红肿/渗液" value={session.swelling ?? "-"} />
            <Row label="ROM/活动" value={session.rom ?? "-"} />
            {session.abnormal && (
              <div className="mt-1.5 rounded-md bg-destructive/10 p-1.5 text-[10px] text-destructive">
                ⚠️ {session.abnormal}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-info/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-info">
            <Sparkles className="h-3 w-3" />
            AI 推荐处理人
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">
            {rec.reason}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <RecOption
              icon={Stethoscope}
              label="手术医疗团队"
              active={rec.kind === "doctor"}
              onClick={() =>
                onChange({ kind: "doctor", reason: "存在术后异常，需手术医疗团队评估" })
              }
            />
            <RecOption
              icon={Activity}
              label="康复治疗师"
              active={rec.kind === "therapist"}
              onClick={() =>
                onChange({ kind: "therapist", reason: "ROM 受限，需康复指导" })
              }
            />
            <RecOption
              icon={CheckCircle2}
              label="护理"
              active={rec.kind === "self"}
              onClick={() => onChange({ kind: "self", reason: "无异常，护理留观随访" })}
            />
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium text-primary-foreground active:opacity-80"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="h-3.5 w-3.5" />
          护士确认并推送
        </button>
      </div>
    </div>
  );
}

/* ---------- Bits ---------- */

function Bubble({ turn }: { turn: DialogTurn }) {
  if (turn.from === "system") {
    return (
      <div className="mx-auto max-w-[90%] rounded-md bg-warning/10 px-2 py-1 text-center text-[10px] text-warning-foreground">
        {turn.text}
      </div>
    );
  }
  if (turn.from === "ai") {
    return (
      <div className="ml-auto flex max-w-[85%] flex-row-reverse gap-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/15 text-info">
          <Sparkles className="h-3 w-3" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tr-sm border border-info/30 bg-info/5 px-3 py-1.5 text-[12px] whitespace-pre-line">
            {turn.text}
          </div>
          <div className="mt-0.5 text-right text-[9px] text-muted-foreground">
            AI · {turn.time}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex max-w-[80%] gap-1.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px]">
        患
      </div>
      <div>
        <div className="rounded-2xl rounded-tl-sm bg-card px-3 py-1.5 text-[12px] shadow-sm">
          {turn.text}
        </div>
        <div className="mt-0.5 text-[9px] text-muted-foreground">{turn.time}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-foreground">{label}</div>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border bg-card p-2 text-[12px] outline-none focus:border-primary"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 text-foreground">{value}</span>
    </div>
  );
}

function RecOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent bg-muted/40 text-muted-foreground active:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ---------- helpers ---------- */

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildSummary(turns: DialogTurn[]): Partial<SessionState> {
  const patientSays = turns.filter((t) => t.from === "patient").map((t) => t.text);
  const text = patientSays.join(" / ");
  const painMatch = text.match(/VAS\s*[:：]?\s*(\d+(-\d+)?)/i);
  const pain = painMatch ? `VAS ${painMatch[1]} 分` : patientSays[0] ?? "-";
  const swelling = patientSays[1] ?? "-";
  const rom = patientSays[2] ?? "-";

  let abnormal = "";
  if (/红|渗液|发热|低烧|37\.|38\./.test(text)) abnormal = "存在炎症/发热风险";
  if (/30°|僵|受限/.test(text)) abnormal = (abnormal ? abnormal + "；" : "") + "ROM 明显受限";
  if (/5-6|6 分|7 分|8 分/.test(text)) abnormal = (abnormal ? abnormal + "；" : "") + "疼痛分值偏高";

  let recommendation: SessionState["recommendation"];
  if (/红|渗液|发热|低烧|37\.|38\./.test(text) || /6 分|7 分|8 分/.test(text)) {
    recommendation = { kind: "doctor", reason: "出现发热/疼痛加重，建议手术医疗团队评估" };
  } else if (/30°|僵|受限/.test(text)) {
    recommendation = { kind: "therapist", reason: "ROM 受限，需康复治疗师介入" };
  } else {
    recommendation = { kind: "self", reason: "未见明显异常，本科室继续随访" };
  }

  return { pain, swelling, rom, abnormal, recommendation };
}

function buildSummaryFromManual(n: {
  pain: string;
  swelling: string;
  rom: string;
  other: string;
}): Partial<SessionState> {
  const text = `${n.pain} ${n.swelling} ${n.rom} ${n.other}`;
  let abnormal = "";
  if (/红|渗液|发热|低烧/.test(text)) abnormal = "存在炎症/发热风险";
  if (/受限|僵|30/.test(text)) abnormal = (abnormal ? abnormal + "；" : "") + "ROM 受限";

  let recommendation: SessionState["recommendation"];
  if (/红|渗液|发热|低烧/.test(text)) {
    recommendation = { kind: "doctor", reason: "存在异常体征，建议医生评估" };
  } else if (/受限|僵/.test(text)) {
    recommendation = { kind: "therapist", reason: "活动受限，建议康复治疗师介入" };
  } else {
    recommendation = { kind: "self", reason: "无明显异常，留观随访" };
  }

  return {
    pain: n.pain || "-",
    swelling: n.swelling || "-",
    rom: n.rom || "-",
    abnormal,
    recommendation,
  };
}

// Suppress unused-import warning for X
void X;
