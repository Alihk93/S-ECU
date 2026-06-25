import type { VoltageDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";
import { cn } from "@/lib/utils";

interface VoltageMeterProps {
  def: VoltageDef;
  value: number;
}

export function VoltageMeter({ def, value }: VoltageMeterProps) {
  const t = clamp((value - def.min) / (def.max - def.min), 0, 1);
  const warn = value < def.warnLow || value > def.warnHigh;
  const color = warn ? "#ffb000" : def.color;
  const nomT = clamp((def.nominal - def.min) / (def.max - def.min), 0, 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[10px] uppercase tracking-hud text-muted-foreground">
          {def.label}
        </span>
        <span
          className={cn("font-data text-2xl font-bold leading-none")}
          style={{ color, textShadow: `0 0 12px ${color}55` }}
        >
          {value.toFixed(2)}
          <span className="ml-0.5 text-xs text-muted-foreground">{def.unit}</span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${t * 100}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 10px ${color}`,
            transition: "width 120ms linear, background 200ms",
          }}
        />
        {/* nominal marker */}
        <div
          className="absolute inset-y-0 w-px bg-foreground/40"
          style={{ left: `${nomT * 100}%` }}
        />
      </div>
      <div className="flex justify-between font-data text-[9px] text-muted-foreground/60">
        <span>{def.min}</span>
        <span>nom {def.nominal}</span>
        <span>{def.max}</span>
      </div>
    </div>
  );
}
