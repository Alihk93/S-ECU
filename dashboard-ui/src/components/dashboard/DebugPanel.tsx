import { useMemo, useState } from "react";
import type { EcuState } from "@/lib/ecu";
import { cn } from "@/lib/utils";

interface DebugPanelProps {
  state: EcuState;
  fps: number;
}

// CRC-8 (poly 0x07) — same algorithm the firmware would use over the packed frame.
function crc8(bytes: number[]): number {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

function u16(v: number) {
  const x = Math.max(0, Math.min(65535, Math.round(v)));
  return [(x >> 8) & 0xff, x & 0xff];
}

export function DebugPanel({ state, fps }: DebugPanelProps) {
  const [view, setView] = useState<"frame" | "json">("frame");

  const frame = useMemo(() => {
    // [SYNC 0xAA 0x55][LEN][rpm u16][maf u16][map u16][iat+40 u16][ecuV*100 u16][coilBits][injBits][statusBits16][CRC8]
    const coilBits = state.coils.reduce((m, c, i) => m | ((c > 0.05 ? 1 : 0) << i), 0);
    const injBits = state.injectors.reduce((m, c, i) => m | ((c > 0.05 ? 1 : 0) << i), 0);
    const statusVals = Object.values(state.status);
    const statusBits = statusVals.reduce((m, c, i) => m | ((c ? 1 : 0) << i), 0);
    const payload = [
      ...u16(state.rpm),
      ...u16(state.maf),
      ...u16(state.map),
      ...u16(state.iat + 40),
      ...u16(state.ecuV * 100),
      ...u16(state.sensorV * 100),
      coilBits & 0xff,
      injBits & 0xff,
      ...u16(statusBits),
    ];
    const bytes = [0xaa, 0x55, payload.length, ...payload];
    bytes.push(crc8(payload));
    return bytes;
  }, [state]);

  const hex = frame.map((b) => b.toString(16).padStart(2, "0").toUpperCase());

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2">
        {(["frame", "json"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-sm border px-2 py-0.5 font-display text-[9px] uppercase tracking-wide",
              view === v
                ? "border-neon-cyan/60 text-neon-cyan"
                : "border-border text-muted-foreground",
            )}
          >
            {v === "frame" ? "UART frame" : "JSON"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 font-data text-[9px] text-muted-foreground">
          <span>{frame.length}B</span>
          <span>~30Hz</span>
          <span className={fps >= 50 ? "text-neon-green" : "text-neon-amber"}>{fps}fps</span>
        </div>
      </div>

      {view === "frame" ? (
        <div className="flex-1 overflow-auto rounded-sm border border-border bg-[#04080b] p-2">
          <div className="grid grid-cols-8 gap-x-2 gap-y-1 font-data text-[10px]">
            {hex.map((h, i) => (
              <span
                key={i}
                className={cn(
                  i < 2 && "text-neon-magenta",
                  i === 2 && "text-neon-amber",
                  i === hex.length - 1 && "text-neon-green",
                  i >= 3 && i < hex.length - 1 && "text-foreground/80",
                )}
              >
                {h}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2 font-data text-[9px] text-muted-foreground">
            <span><span className="text-neon-magenta">■</span> SYNC 0xAA55</span>
            <span><span className="text-neon-amber">■</span> LEN</span>
            <span><span className="text-foreground/80">■</span> payload</span>
            <span><span className="text-neon-green">■</span> CRC-8</span>
          </div>
        </div>
      ) : (
        <pre className="flex-1 overflow-auto rounded-sm border border-border bg-[#04080b] p-2 font-data text-[10px] leading-relaxed text-foreground/80">
          {JSON.stringify(
            {
              rpm: Math.round(state.rpm),
              maf: +state.maf.toFixed(1),
              map: +state.map.toFixed(1),
              iat: +state.iat.toFixed(1),
              ecuV: +state.ecuV.toFixed(2),
              sensorV: +state.sensorV.toFixed(2),
              coils: state.coils.map((c) => (c > 0.05 ? 1 : 0)),
              inj: state.injectors.map((c) => (c > 0.05 ? 1 : 0)),
              status: state.status,
              iac: Math.round(state.iacStep),
            },
            null,
            1,
          )}
        </pre>
      )}
    </div>
  );
}
