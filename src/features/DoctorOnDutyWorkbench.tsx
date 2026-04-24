import { useState } from "react";
import {
  Camera,
  ClipboardCheck,
  AlertTriangle,
  Send,
  Clock,
  Home,
  FileText,
  User,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Save,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { PhoneShell, TabBar } from "@/components/PhoneShell";
import { Card, MiniStat, SearchBar } from "./SecretaryWorkbench";
import { BarChart, ChartCard, LineChart, StatTile } from "@/components/WorkStats";
import { ToastBanner } from "@/components/ActionSheet";
import { PatientChatSheet } from "@/components/PatientChatSheet";
import { patients, todayTasks } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "home" | "scales" | "chat" | "history" | "me";

interface ScaleField {
  label: string;
  value: string;
  abnormal: boolean;
}

export function DoctorOnDutyWorkbench() {
  const [tab, setTab] = useState<TabKey>("home");
  const [editor, setEditor] = useState<Patient | null>(null);
  const [chatPatient, setChatPatient] = useState<Patient | null>(null);
  const [pushed, setPushed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const myPatients = patients.filter((p) => p.responsibleDoctor === "朱医生");

  const todaySurgery = patients.filter((p) => p.status === "admitted" && p.preOpFindings);
  const tasks = todayTasks["doctor-on-duty"];
  const abnormalCount = todaySurgery.filter((p) => p.preOpAbnormal).length;
  const pendingPush = todaySurgery.filter((p) => !pushed.has(p.id)).length;

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  const handlePush = (p: Patient) => {
    setPushed((s) => new Set(s).add(p.id));
    showToast(`已推送至 王主任团队 + 朱治疗师 → ${p.name}`);
  };

  return (
    <PhoneShell
      title="值班医生工作台"
      subtitle="朱医生 · 今日值班"
      bottom={
        <TabBar
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: "home", label: "首页", icon: Home, badge: tasks.length },
            { key: "scales", label: "术前量表", icon: ClipboardCheck, badge: pendingPush },
            { key: "history", label: "历史", icon: FileText },
            { key: "me", label: "我的", icon: User },
          ]}
        />
      }
    >
      {tab === "home" && (
        <HomeTab
          tasks={tasks}
          surgeryCount={todaySurgery.length}
          abnormalCount={abnormalCount}
          pendingPush={pendingPush}
          onOpenScales={() => setTab("scales")}
          onOcr={() => showToast("启动 OCR 摄像头...")}
        />
      )}
      {tab === "scales" && (
        <ScalesTab
          list={todaySurgery}
          pushed={pushed}
          onEdit={(p) => setEditor(p)}
          onPush={handlePush}
          onOcr={() => showToast("启动 OCR 摄像头...")}
        />
      )}
      {tab === "history" && <HistoryTab />}
      {tab === "me" && <MeTab />}

      {editor && (
        <ScaleEditor
          patient={editor}
          onClose={() => setEditor(null)}
          onSave={() => {
            showToast(`已保存 ${editor.name} 的术前量表`);
            setEditor(null);
          }}
        />
      )}
      {toast && <ToastBanner text={toast} />}
    </PhoneShell>
  );
}

function HomeTab({
  tasks,
  surgeryCount,
  abnormalCount,
  pendingPush,
  onOpenScales,
  onOcr,
}: {
  tasks: typeof todayTasks["doctor-on-duty"];
  surgeryCount: number;
  abnormalCount: number;
  pendingPush: number;
  onOpenScales: () => void;
  onOcr: () => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[10px] opacity-80">值班医生 · 工作概览</div>
        <div className="mt-1 text-base font-bold">朱医生, 您今日值班 🌙</div>
        <div className="mt-0.5 text-[11px] opacity-90">
          明日手术 {surgeryCount} 例待录入量表, {abnormalCount} 例异常需关注
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="待录入量表" value={surgeryCount} />
          <MiniStat label="待推送" value={pendingPush} />
        </div>
      </div>

      <button
        onClick={onOcr}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-medium text-primary-foreground active:opacity-90"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Camera className="h-5 w-5" />
        OCR 录入新量表
      </button>


      <Card title="今日待办" rightLabel={`${tasks.length} 项`}>
        <div className="divide-y">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={onOpenScales}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left active:bg-muted/40"
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                )}
              >
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">{t.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.patientName && `${t.patientName}${t.bedNo ? ` · ${t.bedNo}床` : ""}`}
                  {t.due && ` · ${t.due}`}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScalesTab({
  list,
  pushed,
  onEdit,
  onPush,
  onOcr,
}: {
  list: typeof patients;
  pushed: Set<string>;
  onEdit: (p: Patient) => void;
  onPush: (p: Patient) => void;
  onOcr: () => void;
}) {
  return (
    <div className="space-y-3 p-3">
      <SearchBar placeholder="搜索患者 / 床号" />

      <button
        onClick={onOcr}
        className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-primary-foreground active:opacity-90"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Camera className="h-4 w-4" />
        OCR 录入 / 拍照识别
      </button>

      <div className="text-xs font-semibold">明日手术 · {list.length} 例</div>

      {list.map((p) => {
        const isPushed = pushed.has(p.id);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-2 border-b p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {p.bedNo}床
                  </span>
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                  {p.preOpAbnormal && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                      <AlertTriangle className="h-2.5 w-2.5" />异常
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {p.diagnosis} · {p.surgeryName}
                </div>
                <div className="text-[10px] text-muted-foreground">{p.director} · 手术 {p.surgeryDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {p.preOpFindings?.map((f) => (
                <div
                  key={f.label}
                  className={cn(
                    "rounded-lg border p-2",
                    f.abnormal ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>{f.label}</span>
                    {f.abnormal && <AlertTriangle className="h-2.5 w-2.5 text-destructive" />}
                  </div>
                  <div className={cn("mt-0.5 text-[12px] font-bold", f.abnormal ? "text-destructive" : "text-foreground")}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>

            {isPushed && (
              <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-md bg-success/10 p-2 text-[10px] text-success">
                <CheckCircle2 className="h-3 w-3" />
                已推送至 王主任团队 + 朱治疗师，等待确认
              </div>
            )}

            <div className="grid grid-cols-2 gap-0 border-t">
              <button
                onClick={() => onEdit(p)}
                className="flex items-center justify-center gap-1 py-2.5 text-[11px] text-foreground active:bg-muted/40"
              >
                <Edit3 className="h-3 w-3" />编辑量表
              </button>
              <button
                onClick={() => onPush(p)}
                disabled={isPushed}
                className={cn(
                  "flex items-center justify-center gap-1 border-l py-2.5 text-[11px] font-medium active:opacity-90",
                  isPushed ? "bg-muted text-muted-foreground" : "text-primary-foreground",
                )}
                style={!isPushed ? { background: "var(--gradient-primary)" } : undefined}
              >
                <Send className="h-3 w-3" />{isPushed ? "已推送" : "确认推送"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- OCR 编辑器 ---------- */
function ScaleEditor({ patient, onClose, onSave }: { patient: Patient; onClose: () => void; onSave: () => void }) {
  const [fields, setFields] = useState<ScaleField[]>(
    patient.preOpFindings?.map((f) => ({ ...f })) ?? [
      { label: "血红蛋白", value: "", abnormal: false },
      { label: "血压", value: "", abnormal: false },
      { label: "心电图", value: "", abnormal: false },
      { label: "凝血", value: "", abnormal: false },
    ],
  );

  const update = (i: number, key: "value" | "label", v: string) => {
    setFields((s) => s.map((f, idx) => (idx === i ? { ...f, [key]: v } : f)));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">编辑术前量表 · {patient.name}</div>
        <button onClick={onSave} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
          <Save className="h-3 w-3" />保存
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="rounded-2xl border bg-info/5 p-3 text-[11px] text-info">
          <Sparkles className="mr-1 inline h-3 w-3" />
          OCR 识别结果，请核对并补充。识别后的内容支持手工编辑。
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <div className="text-[10px] font-medium text-muted-foreground">{patient.bedNo}床 · {patient.diagnosis}</div>
          <div className="text-[11px] font-semibold">{patient.surgeryName} · 主刀 {patient.director}</div>
        </div>

        <div className="space-y-2">
          {fields.map((f, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border p-3",
                f.abnormal ? "border-destructive/40 bg-destructive/5" : "bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <input
                  value={f.label}
                  onChange={(e) => update(i, "label", e.target.value)}
                  className="bg-transparent text-[11px] font-medium text-muted-foreground outline-none"
                />
                <label className="flex items-center gap-1 text-[10px] text-destructive">
                  <input
                    type="checkbox"
                    checked={f.abnormal}
                    onChange={(e) => setFields((s) => s.map((ff, idx) => (idx === i ? { ...ff, abnormal: e.target.checked } : ff)))}
                  />
                  标记异常
                </label>
              </div>
              <input
                value={f.value}
                onChange={(e) => update(i, "value", e.target.value)}
                placeholder="输入数值..."
                className="mt-1 w-full bg-transparent text-[14px] font-bold outline-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setFields((s) => [...s, { label: "新指标", value: "", abnormal: false }])}
          className="w-full rounded-xl border border-dashed py-2 text-[11px] text-muted-foreground"
        >
          + 添加指标
        </button>
      </div>

      <div className="border-t bg-card px-3 py-2 text-center text-[10px] text-muted-foreground">
        保存后请回到列表点击「确认推送」发送至 王主任团队 + 朱治疗师
      </div>
    </div>
  );
}

/* ---------- 历史按日期 ---------- */
function HistoryTab() {
  const history = [
    {
      date: "2024-04-22",
      day: "今日",
      records: [
        { bed: "01", name: "刘德海", surgery: "右 THA", abnormal: 2 },
        { bed: "02", name: "吴翠花", surgery: "左 TKA 翻修", abnormal: 0 },
      ],
    },
    {
      date: "2024-04-21",
      day: "昨日",
      records: [
        { bed: "03", name: "孙顺英", surgery: "右 TKA", abnormal: 0 },
      ],
    },
    {
      date: "2024-04-20",
      day: "周六",
      records: [
        { bed: "07", name: "李文广", surgery: "左 THA", abnormal: 1 },
        { bed: "09", name: "邹建", surgery: "右肩关节镜", abnormal: 0 },
      ],
    },
    {
      date: "2024-04-19",
      day: "周五",
      records: [
        { bed: "05", name: "杨成轩", surgery: "右 THA", abnormal: 0 },
        { bed: "11", name: "高桂兰", surgery: "左 TKA", abnormal: 1 },
        { bed: "13", name: "黄玉萍", surgery: "右 UKA", abnormal: 0 },
      ],
    },
  ];

  return (
    <div className="space-y-3 p-3">
      <SearchBar placeholder="搜索日期 / 患者" />
      {history.map((d) => (
        <div key={d.date} className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
            <div>
              <div className="text-[12px] font-semibold">{d.date}</div>
              <div className="text-[9px] text-muted-foreground">{d.day} · {d.records.length} 张量表</div>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {d.records.reduce((s, r) => s + r.abnormal, 0)} 异常
            </span>
          </div>
          <div className="divide-y">
            {d.records.map((r) => (
              <button key={r.bed + r.name} className="flex w-full items-center justify-between px-3 py-2.5 text-left active:bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{r.bed}床</span>
                  <span className="text-[12px] font-medium">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground">· {r.surgery}</span>
                </div>
                <div className="flex items-center gap-1">
                  {r.abnormal > 0 && (
                    <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] text-destructive">
                      异常 {r.abnormal}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeTab() {
  const weeklyOcr = [
    { label: "周一", value: 4 },
    { label: "周二", value: 6 },
    { label: "周三", value: 3 },
    { label: "周四", value: 7 },
    { label: "周五", value: 5 },
    { label: "周六", value: 2 },
    { label: "周日", value: 1 },
  ];
  const accuracyTrend = [
    { label: "1月", value: 86 },
    { label: "2月", value: 89 },
    { label: "3月", value: 92 },
    { label: "4月", value: 95 },
  ];
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border bg-card p-4 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          朱
        </div>
        <div className="mt-2 text-base font-bold">朱医生</div>
        <div className="text-[11px] text-muted-foreground">值班医生 · 骨科一病区</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={Camera} label="本周 OCR 录入" value={28} delta="↑ 15%" tone="info" />
        <StatTile icon={AlertTriangle} label="标记异常" value={9} tone="warning" />
        <StatTile icon={Send} label="推送团队" value={26} delta="↑ 8%" tone="primary" />
        <StatTile icon={Edit3} label="手工修订" value={12} tone="success" />
      </div>

      <ChartCard title="本周量表录入趋势" subtitle="共 28 张 · 异常率 32%">
        <BarChart data={weeklyOcr} unit="张" />
      </ChartCard>

      <ChartCard title="OCR 识别准确率趋势" subtitle="近 4 个月">
        <LineChart data={accuracyTrend} />
      </ChartCard>

    </div>
  );
}
