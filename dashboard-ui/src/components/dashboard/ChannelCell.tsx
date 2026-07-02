import { Zap, Droplet } from "lucide-react";

// Unified channel indicator used by every coil and injector so the whole bank
// reads as one family: a rounded cell with a channel label, a glowing icon that
// brightens/fills with activity, and a thin activity bar. Coils use a spark
// bolt, injectors a fuel droplet — identical framing, different glyph.
interface ChannelCellProps {
  label: string;
  color: string; // active accent
  intensity: number; // 0..1 dwell / injection amount
  flash?: boolean; // momentary event (spark)
  icon: "coil" | "injector";
}

export function ChannelCell({ label, color, intensity, flash, icon }: ChannelCellProps) {
  const active = intensity > 0.02 || !!flash;
  const glow = flash ? 1 : intensity;
  const Icon = icon === "coil" ? Zap : Droplet;

  return (
    <div
      className="relative flex flex-col items-center justify-between gap-1 rounded-lg border px-1 py-1.5 md:gap-1.5 md:py-2.5"
      style={{
        borderColor: active ? color : "#213b56",
        background: active
          ? `linear-gradient(180deg, ${color}26, transparent 72%), #0f2236`
          : "#0f2236",
        boxShadow: active
          ? `0 0 16px -4px ${color}, inset 0 0 12px -7px ${color}`
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "border-color 80ms, box-shadow 80ms, background 80ms",
      }}
    >
      <span className="font-data text-[9px] font-semibold tracking-wide text-muted-foreground md:text-[10px]">
        {label}
      </span>

      <Icon
        className="h-5 w-5 md:h-8 md:w-8"
        strokeWidth={2.2}
        style={{
          color: flash ? "#ffffff" : active ? color : "#3a536e",
          fill: icon === "injector" && active ? color : "transparent",
          fillOpacity: icon === "injector" && active ? 0.9 : 0,
          filter: glow ? `drop-shadow(0 0 ${3 + glow * 9}px ${color})` : "none",
          transition: "color 60ms, filter 60ms, fill 60ms",
        }}
      />

      <div className="h-1 w-full overflow-hidden rounded-full bg-[#0a1a2b]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${glow * 100}%`,
            background: color,
            boxShadow: active ? `0 0 6px ${color}` : "none",
            transition: "width 60ms linear",
          }}
        />
      </div>
    </div>
  );
}
