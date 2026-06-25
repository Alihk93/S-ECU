import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

interface RpmBarProps {
  rpm: number;
  segments?: number;
}

export function RpmBar({ rpm, segments = 40 }: RpmBarProps) {
  const t = clamp(rpm / RANGES.rpm.max, 0, 1);
  const active = Math.round(t * segments);
  const redlineSeg = Math.round((RANGES.rpm.redline / RANGES.rpm.max) * segments);
  const over = rpm >= RANGES.rpm.redline;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-1 items-end gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < active;
          const isRed = i >= redlineSeg;
          const color = isRed ? "#ff2d55" : i > segments * 0.62 ? "#ffb000" : "#00e7f2";
          const h = 10 + (i / segments) * 26;
          return (
            <span
              key={i}
              className="w-full rounded-[1px]"
              style={{
                height: `${h}px`,
                background: on ? color : "#13202700",
                border: on ? "none" : "1px solid rgba(70,110,130,0.18)",
                boxShadow: on ? `0 0 8px ${color}, 0 0 2px ${color}` : "none",
                opacity: on ? 1 : 0.5,
                transition: "background 50ms linear, box-shadow 50ms linear",
              }}
            />
          );
        })}
      </div>
      <div className="flex shrink-0 flex-col items-end leading-none">
        <div
          className="font-data text-[40px] font-bold tabular-nums"
          style={{
            color: over ? "#ff2d55" : "#eafdff",
            textShadow: over
              ? "0 0 18px #ff2d55"
              : "0 0 16px rgba(0,231,242,0.45)",
          }}
        >
          {Math.round(rpm).toString().padStart(4, "0")}
        </div>
        <div className="font-display text-[10px] uppercase tracking-hud text-muted-foreground">
          RPM {over && <span className="text-neon-red text-glow-soft">· SHIFT</span>}
        </div>
      </div>
    </div>
  );
}
