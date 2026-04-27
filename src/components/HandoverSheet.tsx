import { useState } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 护理交班单 — 系统自动抓取，护士可在「特殊交班」补充手动备注，支持语音录入。
 */

const handoverDate = "2024-04-22";

export function HandoverSheet({ onClose }: { onClose: () => void }) {
  const [special, setSpecial] = useState(
    "05床 杨成轩 沟通障碍，家属陪护；02床 吴翠花 HBV 标准预防 + 接触隔离。",
  );
  const [recording, setRecording] = useState(false);

  const triggerVoice = () => {
    setRecording(true);
    setTimeout(() => {
      const sample =
        "06床 周小敏 术后第 1 日，引流管暗红色 30ml，疼痛 VAS 4 分，已遵嘱镇痛。";
      setSpecial((prev) => (prev ? `${prev}\n${sample}` : sample));
      setRecording(false);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2.5">
        <button onClick={onClose} className="text-[12px] text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[13px] font-semibold">护理交班单</div>
        <button className="text-[11px] font-medium text-primary">导出</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Row>
            <span>
              <b>{handoverDate} 08:00 - 次日 08:00 护理交班</b>
              <Tag>系统自动生成</Tag>
            </span>
          </Row>

          <Row>
            <div>
              <b>病人总数：</b>12 人（01-08, 11, 13, 15, 16）。
              <br />
              昨日出院 2 人（10、12），昨日入院 2 人（01、02），昨日手术 2 人（03、05），今日手术 3 人（01、02、06）。
              <Tag>系统自动抓取</Tag>
            </div>
          </Row>

          <Row title="昨日手术">
            <div className="space-y-1.5">
              <p>
                03床 孙顺英，昨日在（全麻 + 神经阻滞）下行（右侧）（右肩关节镜 SLAP 修补），（有）心电监护，示（窦性）心率，律（齐），伤口敷料外观（清洁、干燥），患肢（足背）动脉搏动（可触及），（足趾）活动（好），（伤口引流管）（有），有引流出暗血性液体（50）ml，尿管（有），有（淡黄色）（清亮）液体引出（200）ml。
              </p>
              <p>
                05床 杨成轩，昨日在（全麻）下行（左侧）（左跟腱缝合术），（无）心电监护，伤口敷料（清洁、干燥），患肢（足趾）活动（好），无引流管，尿管（无）。
              </p>
            </div>
          </Row>

          <Row title="今日手术">
            <div>
              <b>3 人：</b>01床（已接）、02床（未接）、06床（未接），其中 01床已接去手术室。
            </div>
          </Row>

          <Row title="补交伤口引流">
            <div className="space-y-1">
              <p>03床 孙顺英，"右肩关节镜 SLAP 修补"，术后 1 天，伤口引流（50）ml。</p>
              <p>05床 杨成轩，"左跟腱缝合术"，术后 3 天，伤口引流（已拔管）。</p>
            </div>
          </Row>

          <Row title="特殊交班">
            <div className="space-y-1.5">
              <div className="text-[10px] text-muted-foreground">
                自动导入（危急值、输血、血压、血糖、体温、病危、病重、ICU 转入）及处理方式。支持语音录入补充。
              </div>
              <div className="flex items-start gap-1.5">
                <textarea
                  rows={4}
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                  className="flex-1 rounded-lg border bg-muted/20 p-2 text-[11px] outline-none focus:border-primary"
                  placeholder="护士手动补充..."
                />
                <button
                  onClick={triggerVoice}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    recording
                      ? "animate-pulse bg-destructive text-destructive-foreground"
                      : "bg-card text-muted-foreground active:bg-muted/40",
                  )}
                  aria-label="语音录入"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
              </div>
              {recording && (
                <div className="text-[10px] text-destructive">● 正在录音，自动转文字...</div>
              )}
            </div>
          </Row>
        </div>
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

function Row({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="border-b last:border-b-0">
      {title && (
        <div className="border-b bg-muted/30 px-2.5 py-1 text-[10px] font-semibold text-foreground">
          {title}
        </div>
      )}
      <div className="px-2.5 py-2 text-[11px] text-foreground">{children}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 rounded bg-warning/30 px-1.5 py-0.5 text-[9px] font-medium text-warning-foreground">
      {children}
    </span>
  );
}
