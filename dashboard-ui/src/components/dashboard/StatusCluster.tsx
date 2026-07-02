import type { ReactNode } from "react";
import {
  Battery,
  KeyRound,
  ToggleRight,
  Power,
  Fuel,
  Fan,
  ShieldCheck,
  Cog,
} from "lucide-react";
import type { StatusKey } from "@/lib/ecu";

type StatusMap = Record<StatusKey, number>;

interface Led {
  label?: string;
  on: boolean;
  color: string;
}

function LedDot({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      className="h-2.5 w-2.5 rounded-full md:h-3 md:w-3"
      style={{
        background: on ? color : "#0c1c2c",
        border: `1px solid ${on ? color : "#26405c"}`,
        boxShadow: on
          ? `0 0 8px ${color}, inset 0 0 3px rgba(255,255,255,0.5)`
          : "inset 0 0 3px rgba(0,0,0,0.6)",
        transition: "background 80ms, box-shadow 80ms, border-color 80ms",
      }}
    />
  );
}

// One status subsystem tile: a glyph that lights when any of its LEDs is on,
// its LEDs, and a caption — the same framing as the coil/injector cells.
function StatusGroup({
  icon,
  color,
  label,
  leds,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  leds: Led[];
}) {
  const anyOn = leds.some((l) => l.on);
  return (
    <div
      className="flex h-full flex-col items-center justify-between gap-1.5 rounded-lg border px-1 py-2"
      style={{
        borderColor: anyOn ? `${color}` : "#213b56",
        background: anyOn
          ? `linear-gradient(180deg, ${color}1f, transparent 72%), #0f2236`
          : "#0f2236",
        boxShadow: anyOn ? `0 0 14px -5px ${color}` : "inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "border-color 80ms, box-shadow 80ms, background 80ms",
      }}
    >
      <span
        className="grid place-items-center"
        style={{
          color: anyOn ? color : "#3a536e",
          filter: anyOn ? `drop-shadow(0 0 7px ${color})` : "none",
          transition: "color 80ms, filter 80ms",
        }}
      >
        {icon}
      </span>
      <div className="flex w-full items-end justify-around">
        {leds.map((l, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {l.label && (
              <span className="font-data text-[7px] leading-none text-muted-foreground">
                {l.label}
              </span>
            )}
            <LedDot on={l.on} color={l.color} />
          </div>
        ))}
      </div>
      <span className="font-data text-[8px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

const ICON = "h-6 w-6 md:h-8 md:w-8";

// Right-side grouped status: ST·ETC · FPC · FAN · IMO · IAC (matches the sketch).
export function StatusClusters({
  status,
  iacStep,
  className,
}: {
  status: StatusMap;
  iacStep: number;
  className?: string;
}) {
  const on = (k: StatusKey) => !!status[k];
  const iacLit = Math.round((iacStep / 200) * 4); // 0..4 phases lit

  return (
    <div className={className}>
      <StatusGroup
        icon={<Power className={ICON} strokeWidth={2.2} />}
        color="#a3e635"
        label="ST · ETC"
        leds={[
          { label: "ST", on: on("start"), color: "#a3e635" },
          { label: "ETC", on: on("etc"), color: "#22d3ee" },
        ]}
      />
      <StatusGroup
        icon={<Fuel className={ICON} strokeWidth={2.2} />}
        color="#fbbf24"
        label="FPC"
        leds={[
          { label: "−", on: on("fuelPump"), color: "#fbbf24" },
          { label: "+", on: on("fuelPump"), color: "#fbbf24" },
        ]}
      />
      <StatusGroup
        icon={<Fan className={ICON} strokeWidth={2.2} />}
        color="#38bdf8"
        label="FAN"
        leds={[
          { label: "1", on: on("fan1"), color: "#38bdf8" },
          { label: "2", on: on("fan2"), color: "#38bdf8" },
        ]}
      />
      <StatusGroup
        icon={<ShieldCheck className={ICON} strokeWidth={2.2} />}
        color="#a78bfa"
        label="IMO"
        leds={[
          { label: "+", on: on("immoP"), color: "#a78bfa" },
          { label: "−", on: on("immoN"), color: "#a78bfa" },
        ]}
      />
      <StatusGroup
        icon={<Cog className={ICON} strokeWidth={2.2} />}
        color="#22d3ee"
        label="IAC"
        leds={[0, 1, 2, 3].map((i) => ({ on: i < iacLit, color: "#22d3ee" }))}
      />
    </div>
  );
}

// Bottom-left system rail chip: a glyph lens that lights when energized.
function SystemChip({
  icon,
  label,
  on,
  color,
}: {
  icon: ReactNode;
  label: string;
  on: boolean;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="grid h-12 w-12 place-items-center rounded-xl border md:h-14 md:w-14"
        style={{
          borderColor: on ? color : "#213b56",
          color: on ? color : "#3a536e",
          background: on
            ? `radial-gradient(circle at 50% 35%, ${color}2e, transparent 70%), #0f2236`
            : "#0f2236",
          boxShadow: on ? `0 0 16px -5px ${color}` : "inset 0 1px 0 rgba(255,255,255,0.03)",
          filter: on ? `drop-shadow(0 0 6px ${color})` : "none",
          transition: "all 90ms",
        }}
      >
        {icon}
      </span>
      <span className="font-data text-[8px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}

export function SystemIcons({
  status,
  className,
}: {
  status: StatusMap;
  className?: string;
}) {
  const on = (k: StatusKey) => !!status[k];
  const i = "h-6 w-6 md:h-7 md:w-7";
  return (
    <div className={className}>
      <SystemChip icon={<Battery className={i} strokeWidth={2.2} />} label="BAT" on={on("battery")} color="#34d399" />
      <SystemChip icon={<KeyRound className={i} strokeWidth={2.2} />} label="SW ON" on={on("switch")} color="#22d3ee" />
      <SystemChip icon={<ToggleRight className={i} strokeWidth={2.2} />} label="MRC+" on={on("mrcP")} color="#34d399" />
      <SystemChip icon={<ToggleRight className={i} strokeWidth={2.2} />} label="MRC−" on={on("mrcN")} color="#34d399" />
    </div>
  );
}
