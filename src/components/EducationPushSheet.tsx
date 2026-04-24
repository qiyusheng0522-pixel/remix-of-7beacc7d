import { useState } from "react";
import { ArrowLeft, Send, CheckCircle2, BellRing } from "lucide-react";
import type { Patient } from "@/lib/types";

const TEMPLATES = [
  { id: "e1", title: "入院前注意事项", desc: "禁食水时间 / 携带物品 / 陪护安排", tag: "入院" },
  { id: "e2", title: "术前一日宣教", desc: "皮肤准备 / 8 小时禁食 / 心理准备", tag: "术前" },
  { id: "e3", title: "术后康复指导", desc: "踝泵 / SLR / 体位摆放", tag: "术后" },
  { id: "e4", title: "DVT 预防宣教", desc: "下肢活动 / 弹力袜 / 抗凝注意", tag: "术后" },
  { id: "e5", title: "出院随访注意事项", desc: "复查时间 / 用药 / 饮食", tag: "出院" },
];

/**
 * 单条 / 批量推送宣教
 * - 当 `lockSinglePatient` 为 true（从单个患者入口进入）时，跳过患者选择步骤；
 *   仅展示宣教模板列表，支持多选并直接推送给该患者。
 */
export function EducationPushSheet({
  candidates,
  onClose,
  onPush,
  lockSinglePatient,
}: {
  candidates: Patient[];
  onClose: () => void;
  onPush: (msg: string) => void;
  lockSinglePatient?: boolean;
}) {
  const singleMode = !!lockSinglePatient && candidates.length === 1;
  const singlePatient = singleMode ? candidates[0] : null;
  const [selectedPatients, setSelectedPatients] = useState<string[]>(
    singleMode ? [candidates[0].id] : [],
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(["e1"]);

  const togglePatient = (id: string) =>
    setSelectedPatients((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleTemplate = (id: string) =>
    setSelectedTemplates((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSelected = selectedPatients.length === candidates.length && candidates.length > 0;
  const toggleAll = () => setSelectedPatients(allSelected ? [] : candidates.map((p) => p.id));

  const canPush = selectedTemplates.length > 0 && selectedPatients.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">
          {singleMode ? `推送宣教 · ${singlePatient?.name}` : "宣教推送"}
        </div>
        <div className="w-4" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {singleMode && singlePatient && (
          <div className="border-b bg-info/5 p-3 text-[11px] text-info">
            目标：<b>{singlePatient.name}</b>
            {singlePatient.bedNo && ` · ${singlePatient.bedNo}床`}
            {singlePatient.diagnosis && ` · ${singlePatient.diagnosis}`}
          </div>
        )}

        {/* 模板（多选） */}
        <div className="border-b bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold">
              选择宣教内容 ({selectedTemplates.length}/{TEMPLATES.length}) · 支持多选
            </div>
            <button
              onClick={() =>
                setSelectedTemplates(
                  selectedTemplates.length === TEMPLATES.length ? [] : TEMPLATES.map((t) => t.id),
                )
              }
              className="text-[11px] text-primary"
            >
              {selectedTemplates.length === TEMPLATES.length ? "取消全选" : "全选"}
            </button>
          </div>
          <div className="space-y-1.5">
            {TEMPLATES.map((t) => {
              const checked = selectedTemplates.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTemplate(t.id)}
                  className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left active:bg-muted/40 ${
                    checked ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BellRing className="h-3 w-3 text-primary" />
                      <span className="text-[12px] font-medium">{t.title}</span>
                      <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">{t.tag}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 患者列表（单患者模式下隐藏） */}
        {!singleMode && (
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold">
                选择患者 ({selectedPatients.length}/{candidates.length})
              </div>
              <button onClick={toggleAll} className="text-[11px] text-primary">
                {allSelected ? "取消全选" : "全选"}
              </button>
            </div>
            <div className="space-y-1">
              {candidates.map((p) => {
                const checked = selectedPatients.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePatient(p.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left active:bg-muted/40 ${
                      checked ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {checked && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {p.bedNo && (
                          <span className="rounded bg-primary/10 px-1 font-mono text-[9px] font-bold text-primary">{p.bedNo}床</span>
                        )}
                        <span className="text-[12px] font-medium">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">{p.gender}·{p.age}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{p.diagnosis}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-card p-3">
        <button
          disabled={!canPush}
          onClick={() => {
            const titles = TEMPLATES.filter((t) => selectedTemplates.includes(t.id))
              .map((t) => t.title)
              .join("、");
            const target = singleMode
              ? singlePatient!.name
              : `${selectedPatients.length} 位患者`;
            onPush(`已推送 [${titles}] (${selectedTemplates.length} 条) 至 ${target}`);
            onClose();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-medium text-primary-foreground disabled:opacity-40"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="h-4 w-4" />
          {singleMode
            ? `推送 ${selectedTemplates.length} 条宣教给 ${singlePatient?.name}`
            : `推送给 ${selectedPatients.length} 位患者`}
        </button>
      </div>
    </div>
  );
}
