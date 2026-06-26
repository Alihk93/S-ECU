import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

interface RpmBarProps {
  rpm: number;
  load?: number; // 0..1 live throttle/load (the pot on hardware)
  segments?: number;
}

export function RpmBar({ rpm, load = 0, segments = 40 }: RpmBarProps) {
  const loadPct = Math.round(clamp(load, 0, 1) * 100);
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
      <div className="flex shrink-0 items-end gap-4 leading-none md:flex-col md:items-end md:gap-0">
        <div className="flex flex-col items-end">
          <div
            className="font-data text-[20px] font-bold tabular-nums md:text-[22px]"
            style={{ color: "#00e7f2", textShadow: "0 0 12px rgba(0,231,242,0.4)" }}
          >
            {loadPct}
            <span className="text-[13px]">%</span>
          </div>
          <div className="font-display text-[9px] uppercase tracking-hud text-muted-foreground md:mb-2 md:text-[10px]">
            LOAD
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div
            className="font-data text-[30px] font-bold tabular-nums md:text-[40px]"
            style={{
              color: over ? "#ff2d55" : "#eafdff",
              textShadow: over
                ? "0 0 18px #ff2d55"
                : "0 0 16px rgba(0,231,242,0.45)",
            }}
          >
            {Math.round(rpm).toString().padStart(4, "0")}
          </div>
          <div className="font-display text-[9px] uppercase tracking-hud text-muted-foreground md:text-[10px]">
            RPM {over && <span className="text-neon-red text-glow-soft">· SHIFT</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
