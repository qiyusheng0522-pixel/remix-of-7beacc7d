import { useState } from "react";
import {
  Home,
  CalendarDays,
  BookOpen,
  User,
  FileUp,
  ClipboardList,
  Video,
  Pill,
  HeartPulse,
  CheckCircle2,
  Circle,
  ChevronRight,
  Mic,
  AlertTriangle,
  LogOut,
  Package,
  CameraOff,
  Camera,
  Play,
  Phone,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { ToastBanner } from "@/components/ActionSheet";
import { cn } from "@/lib/utils";

type Stage = "outpatient" | "inpatient";
type OutTab = "home" | "schedule" | "edu" | "me";
type InTab = "home" | "schedule" | "discharge" | "edu" | "me";

const patient = {
  name: "陈亦航",
  gender: "男",
  age: 27,
  side: "右侧",
  diagnosis: "右膝前交叉韧带（ACL）断裂 + 内侧半月板损伤",
  surgery: "右膝 ACL 重建 + 半月板缝合",
  surgeryDate: "2026-07-30",
  postOpDay: 5,
  doctor: "王主任",
  therapist: "朱治疗师",
  servicePack: "ACL 重建 12 周康复包",
};

/* ============ 主入口 ============ */
export function PatientApp() {
  const [stage, setStage] = useState<Stage>("outpatient");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1700);
  };

  return stage === "outpatient" ? (
    <OutpatientApp onStage={setStage} stage={stage} toast={toast} showToast={showToast} />
  ) : (
    <InpatientApp onStage={setStage} stage={stage} toast={toast} showToast={showToast} />
  );
}

function StageSwitch({ stage, onStage }: { stage: Stage; onStage: (s: Stage) => void }) {
  return (
    <div className="flex rounded-full bg-muted p-0.5 text-[10px]">
      {([
        ["outpatient", "门诊"],
        ["inpatient", "住院康复"],
      ] as const).map(([k, l]) => (
        <button
          key={k}
          onClick={() => onStage(k)}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium whitespace-nowrap",
            stage === k ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ============ 门诊端 ============ */
function OutpatientApp({
  stage,
  onStage,
  toast,
  showToast,
}: {
  stage: Stage;
  onStage: (s: Stage) => void;
  toast: string | null;
  showToast: (t: string) => void;
}) {
  const [tab, setTab] = useState<OutTab>("home");
  const [path, setPath] = useState<"conservative" | "admission">("admission");
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string, label: string) => {
    setDone((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else {
        n.add(id);
        showToast(`已完成：${label}`);
      }
      return n;
    });
  };

  const tasks =
    path === "admission"
      ? [
          { id: "a1", icon: FileUp, title: "档案上传", desc: "身份证 / 医保卡 / 外院影像报告", tag: "必做" },
          { id: "a2", icon: ClipboardList, title: "术前问卷", desc: "IKDC 膝关节问卷 · 约 5 分钟", tag: "必做" },
          { id: "a3", icon: Video, title: "线上面诊（如需）", desc: "与 王主任 视频复核手术方案", tag: "如需" },
          { id: "a4", icon: Pill, title: "术前用药（如需）", desc: "术前 8 小时禁食禁水提醒", tag: "如需" },
        ]
      : [
          { id: "c1", icon: FileUp, title: "档案上传", desc: "膝关节 MRI / 门诊病历", tag: "必做" },
          { id: "c2", icon: ClipboardList, title: "保守治疗问卷", desc: "疼痛 VAS / 打软腿频次", tag: "必做" },
          { id: "c3", icon: Video, title: "线上面诊（如需）", desc: "朱治疗师 评估保守康复可行性", tag: "如需" },
          { id: "c4", icon: Pill, title: "用药记录", desc: "塞来昔布 200mg 每日一次", tag: "如需" },
        ];

  const pending = tasks.filter((t) => !done.has(t.id)).length;

  return (
    <PhoneShell
      title="骨安 · 患者端"
      subtitle={`${patient.name} · ${patient.side}膝 · 门诊${path === "admission" ? "待入院" : "保守治疗"}`}
      rightSlot={<StageSwitch stage={stage} onStage={onStage} />}
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as OutTab)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: pending },
            { key: "schedule", label: "日程", icon: CalendarDays },
            { key: "edu", label: "科普", icon: BookOpen },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <div className="space-y-3 p-3">
          <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <div className="text-[10px] opacity-80">门诊阶段</div>
            <div className="mt-1 text-base font-bold">{patient.name}，您好 👋</div>
            <div className="mt-0.5 text-[11px] opacity-90">{patient.diagnosis}</div>
            <div className="mt-3 flex rounded-full bg-primary-foreground/15 p-0.5 text-[11px]">
              {([
                ["conservative", "保守治疗"],
                ["admission", "待入院"],
              ] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setPath(k)}
                  className={cn(
                    "flex-1 rounded-full py-1.5 font-medium",
                    path === k ? "bg-card text-primary" : "text-primary-foreground/85",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <SectionTitle title="待办" right={`${pending} 项未完成`} />
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <TaskRow
                key={t.id}
                index={i + 1}
                icon={t.icon}
                title={t.title}
                desc={t.desc}
                tag={t.tag}
                done={done.has(t.id)}
                onToggle={() => toggle(t.id, t.title)}
              />
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex-1 text-[12px] font-semibold">{patient.servicePack}</div>
              <button onClick={() => setTab("edu")} className="text-[11px] text-primary">
                查看
              </button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              含术前宣教、住院康复方案、12 周居家训练打卡与随访。
            </p>
          </div>
        </div>
      )}

      {tab === "schedule" && <ScheduleTab mode="outpatient" showToast={showToast} />}
      {tab === "edu" && <EduTab showToast={showToast} />}
      {tab === "me" && <MeTab />}

      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

/* ============ 住院康复端 ============ */
function InpatientApp({
  stage,
  onStage,
  toast,
  showToast,
}: {
  stage: Stage;
  onStage: (s: Stage) => void;
  toast: string | null;
  showToast: (t: string) => void;
}) {
  const [tab, setTab] = useState<InTab>("home");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [voiceFor, setVoiceFor] = useState<string | null>(null);

  const groups: {
    key: string;
    title: string;
    icon: typeof HeartPulse;
    warn?: string;
    items: { id: string; text: string; sub: string }[];
  }[] = [
    {
      key: "rehab",
      title: "康复训练",
      icon: HeartPulse,
      warn: "异常请语音上报 / 术后 6 周内患肢不可负重下地",
      items: [
        { id: "r1", text: "股四头肌等长收缩 3 组 × 15 次", sub: "上午 · 已解锁" },
        { id: "r2", text: "踝泵训练 每小时 20 次", sub: "全天 · 预防深静脉血栓" },
        { id: "r3", text: "被动屈膝 0°–60°（CPM）20 分钟", sub: "下午 · 朱治疗师陪同" },
      ],
    },
    {
      key: "med",
      title: "用药",
      icon: Pill,
      items: [
        { id: "m1", text: "塞来昔布 200mg", sub: "早餐后 · 镇痛" },
        { id: "m2", text: "利伐沙班 10mg", sub: "晚 20:00 · 抗凝" },
        { id: "m3", text: "头孢呋辛 静滴", sub: "护士执行 · 预防感染" },
      ],
    },
    {
      key: "care",
      title: "护理",
      icon: CheckCircle2,
      items: [
        { id: "n1", text: "冰敷患膝 20 分钟 / 每 3 小时", sub: "消肿" },
        { id: "n2", text: "伤口观察：渗血 / 红肿拍照上传", sub: "每日一次" },
        { id: "n3", text: "支具固定 0° 伸直位", sub: "夜间必须佩戴" },
      ],
    },
    {
      key: "survey",
      title: "问卷",
      icon: ClipboardList,
      items: [
        { id: "q1", text: "今日疼痛 VAS 评分", sub: "1 分钟" },
        { id: "q2", text: "睡眠与肿胀自评", sub: "1 分钟" },
      ],
    },
  ];

  const all = groups.flatMap((g) => g.items);
  const pending = all.filter((i) => !done.has(i.id)).length;
  const progress = Math.round(((all.length - pending) / all.length) * 100);

  const toggle = (id: string, text: string) =>
    setDone((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else {
        n.add(id);
        showToast(`已打卡：${text}`);
      }
      return n;
    });

  return (
    <PhoneShell
      title="骨安 · 患者端"
      subtitle={`${patient.name} · ${patient.surgery}`}
      rightSlot={<StageSwitch stage={stage} onStage={onStage} />}
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as InTab)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: pending },
            { key: "schedule", label: "日程", icon: CalendarDays },
            { key: "discharge", label: "出院", icon: LogOut },
            { key: "edu", label: "科普", icon: BookOpen },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <div className="space-y-3 p-3">
          <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold">住院康复</div>
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold">
                第 {patient.postOpDay} 天
              </span>
            </div>
            <div className="mt-1 text-[11px] opacity-90">
              {patient.surgery} · 手术日 {patient.surgeryDate}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/25">
              <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] opacity-90">
              <span>今日进度</span>
              <span>{progress}%（还剩 {pending} 项）</span>
            </div>
          </div>

          {groups.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.key} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[12px] font-semibold">{g.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {g.items.filter((i) => done.has(i.id)).length}/{g.items.length}
                  </span>
                </div>
                {g.warn && (
                  <div className="flex items-start gap-1.5 border-b bg-destructive/5 px-3 py-2 text-[10px] text-destructive">
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                    <span className="flex-1">{g.warn}</span>
                    <button
                      onClick={() => setVoiceFor(voiceFor === g.key ? null : g.key)}
                      className="flex items-center gap-0.5 rounded-full bg-destructive px-2 py-0.5 text-[9px] font-medium text-destructive-foreground"
                    >
                      <Mic className="h-2.5 w-2.5" />
                      语音上报
                    </button>
                  </div>
                )}
                {voiceFor === g.key && (
                  <div className="border-b bg-muted/30 px-3 py-3 text-center">
                    <div className="mx-auto flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-destructive/15">
                      <Mic className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground">正在录音…松开发送给 {patient.therapist}</div>
                    <button
                      onClick={() => {
                        setVoiceFor(null);
                        showToast("语音异常上报已发送给 朱治疗师");
                      }}
                      className="mt-2 rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground"
                    >
                      发送
                    </button>
                  </div>
                )}
                <div className="divide-y">
                  {g.items.map((i, idx) => (
                    <button
                      key={i.id}
                      onClick={() => toggle(i.id, i.text)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left active:bg-muted/40"
                    >
                      {done.has(i.id) ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[12px] font-medium",
                            done.has(i.id) && "text-muted-foreground line-through",
                          )}
                        >
                          {idx + 1}. {i.text}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{i.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "schedule" && <ScheduleTab mode="inpatient" showToast={showToast} />}
      {tab === "discharge" && <DischargeTab showToast={showToast} />}
      {tab === "edu" && <EduTab showToast={showToast} />}
      {tab === "me" && <MeTab />}

      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

/* ============ 公共子页 ============ */
function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <span className="text-[12px] font-semibold">{title}</span>
      {right && <span className="text-[10px] text-muted-foreground">{right}</span>}
    </div>
  );
}

function TaskRow({
  index,
  icon: Icon,
  title,
  desc,
  tag,
  done,
  onToggle,
}: {
  index: number;
  icon: typeof FileUp;
  title: string;
  desc: string;
  tag: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-2xl border bg-card p-3 text-left active:bg-muted/40"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          done ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate text-[12.5px] font-semibold", done && "text-muted-foreground line-through")}>
            {index}. {title}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px]",
              tag === "必做" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            {tag}
          </span>
        </div>
        <div className="truncate text-[10px] text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ScheduleTab({ mode, showToast }: { mode: Stage; showToast: (t: string) => void }) {
  const days = [
    { d: "08-03", w: "今日", checked: true },
    { d: "08-02", w: "周日", checked: true },
    { d: "08-01", w: "周六", checked: false },
    { d: "07-31", w: "周五", checked: true },
    { d: "07-30", w: "周四", checked: true },
  ];
  const items =
    mode === "outpatient"
      ? [
          { t: "09:30", n: "门诊复查 · 王主任", p: "骨科门诊 3 诊室" },
          { t: "14:00", n: "术前宣教直播", p: "线上 · 服务包内容" },
          { t: "20:00", n: "居家训练打卡", p: "直腿抬高 3 组" },
        ]
      : [
          { t: "08:00", n: "查房 · 王主任团队", p: "12 床" },
          { t: "10:00", n: "CPM 被动屈膝", p: "康复治疗室" },
          { t: "15:30", n: "床边坐位伸膝训练", p: "朱治疗师" },
          { t: "20:00", n: "抗凝用药提醒", p: "利伐沙班 10mg" },
        ];

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-3">
        <div className="text-[12px] font-semibold">打卡情况</div>
        <div className="mt-2 flex gap-2">
          {days.map((d) => (
            <div key={d.d} className="flex-1 rounded-xl border p-2 text-center">
              <div className="text-[9px] text-muted-foreground">{d.w}</div>
              <div className="text-[10px] font-medium">{d.d}</div>
              <div className="mt-1 flex justify-center">
                {d.checked ? (
                  <Camera className="h-3.5 w-3.5 text-success" />
                ) : (
                  <CameraOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => showToast("已完成今日训练打卡")}
          className="mt-3 w-full rounded-full py-2 text-[12px] font-medium text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          今日打卡
        </button>
      </div>

      <SectionTitle title="今日日程" right={`${items.length} 项`} />
      <div className="overflow-hidden rounded-2xl border bg-card divide-y">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-10 shrink-0 font-mono text-[11px] font-bold text-primary">{i.t}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium">{i.n}</div>
              <div className="text-[10px] text-muted-foreground">{i.p}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EduTab({ showToast }: { showToast: (t: string) => void }) {
  const packs = [
    { n: "ACL 重建 12 周康复包", d: "术前评估 + 住院康复 + 12 周居家训练 + 4 次随访", price: "¥2,880" },
    { n: "半月板缝合康复包", d: "8 周渐进负重方案 + 治疗师在线答疑", price: "¥1,980" },
    { n: "肩袖修补康复包", d: "16 周分期方案 + 支具指导", price: "¥3,280" },
  ];
  const articles = [
    { t: "ACL 重建术后 6 周为什么不能负重下地？", tag: "术后须知" },
    { t: "踝泵训练：预防深静脉血栓的第一课", tag: "训练视频" },
    { t: "冰敷的正确姿势与时长", tag: "护理" },
    { t: "膝关节屈曲角度进度表（0–12 周）", tag: "康复计划" },
  ];
  return (
    <div className="space-y-3 p-3">
      <SectionTitle title="服务包介绍" />
      <div className="space-y-2">
        {packs.map((p) => (
          <div key={p.n} className="rounded-2xl border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex-1 text-[12px] font-semibold">{p.n}</div>
              <span className="text-[12px] font-bold text-primary">{p.price}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{p.d}</p>
            <button
              onClick={() => showToast(`已咨询：${p.n}`)}
              className="mt-2 w-full rounded-full border border-primary/40 py-1.5 text-[11px] font-medium text-primary"
            >
              咨询顾问
            </button>
          </div>
        ))}
      </div>

      <SectionTitle title="科普内容" />
      <div className="overflow-hidden rounded-2xl border bg-card divide-y">
        {articles.map((a) => (
          <button key={a.t} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left active:bg-muted/40">
            <Play className="h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px]">{a.t}</div>
              <div className="text-[10px] text-muted-foreground">{a.tag}</div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DischargeTab({ showToast }: { showToast: (t: string) => void }) {
  const criteria = [
    { t: "伤口无渗血、无红肿", ok: true },
    { t: "被动屈膝 ≥ 90°", ok: true },
    { t: "直腿抬高无迟滞", ok: false },
    { t: "可扶双拐平地行走 50m", ok: true },
    { t: "疼痛 VAS ≤ 3", ok: true },
  ];
  const ready = criteria.filter((c) => c.ok).length;
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-[13px] font-bold">出院评估</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          达标 {ready}/{criteria.length} 项，由 {patient.therapist} 与 {patient.doctor} 共同确认后办理出院。
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card divide-y">
        {criteria.map((c) => (
          <div key={c.t} className="flex items-center gap-2.5 px-3 py-2.5">
            {c.ok ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <span className="flex-1 text-[12px]">{c.t}</span>
            <span className={cn("text-[10px]", c.ok ? "text-success" : "text-warning")}>
              {c.ok ? "达标" : "未达标"}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-3">
        <div className="text-[12px] font-semibold">出院准备</div>
        <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
          <li>· 支具佩戴至术后 6 周，患肢暂不负重</li>
          <li>· 出院带药：塞来昔布、利伐沙班（14 天）</li>
          <li>· 术后 2 周门诊拆线复查</li>
        </ul>
      </div>
      <button
        onClick={() => showToast("已提交出院申请，等待医护确认")}
        className="w-full rounded-full py-2.5 text-[12px] font-medium text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        申请出院
      </button>
    </div>
  );
}

function MeTab() {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          陈
        </div>
        <div className="mt-2 text-base font-bold">{patient.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {patient.gender} · {patient.age}岁 · 患侧 {patient.side}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-3">
        <div className="text-[12px] font-semibold">我的病历</div>
        <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
          <div>诊断：{patient.diagnosis}</div>
          <div>手术：{patient.surgery}</div>
          <div>手术日期：{patient.surgeryDate}</div>
          <div>服务包：{patient.servicePack}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card divide-y">
        {[
          { icon: User, t: "我的主刀医生", v: patient.doctor },
          { icon: HeartPulse, t: "我的康复治疗师", v: patient.therapist },
          { icon: Phone, t: "联系病区护士站", v: "021-6xxx-1200" },
        ].map((r) => (
          <div key={r.t} className="flex items-center gap-2.5 px-3 py-2.5">
            <r.icon className="h-4 w-4 text-primary" />
            <span className="flex-1 text-[12px]">{r.t}</span>
            <span className="text-[11px] text-muted-foreground">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
