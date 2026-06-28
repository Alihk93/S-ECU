import {
  BatteryFull,
  Cog,
  Fan,
  Fuel,
  Hand,
  KeyRound,
  Power,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { StatusKey } from "@/lib/ecu";

interface Led {
  label?: string;
  on: boolean;
  color: string;
}

function LedDot({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      className="h-3 w-3 rounded-full md:h-3.5 md:w-3.5"
      style={{
        background: on ? color : "#0c151a",
        border: `1px solid ${on ? color : "#2a3942"}`,
        boxShadow: on ? `0 0 8px ${color}, inset 0 0 3px rgba(255,255,255,0.4)` : "inset 0 0 3px rgba(0,0,0,0.6)",
        transition: "background 80ms, box-shadow 80ms",
      }}
    />
  );
}

function StatusGroup({
  title,
  leds,
  icon,
}: {
  title?: string;
  leds: Led[];
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-border bg-secondary/40 px-2 py-1">
      {title && (
        <span className="font-display text-[8px] font-semibold uppercase tracking-widest text-muted-foreground md:text-[9px]">
          {title}
        </span>
      )}
      <div className="flex items-end gap-1.5">
        {leds.map((l, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <LedDot on={l.on} color={l.color} />
            {l.label && (
              <span className="font-data text-[7px] leading-none text-muted-foreground">
                {l.label}
              </span>
            )}
          </div>
        ))}
      </div>
      {icon && <span className="text-foreground/55">{icon}</span>}
    </div>
  );
}

type StatusMap = Record<StatusKey, number>;
const ic = "h-3.5 w-3.5";

// Right-side grouped status: ST · ETC · FPC · FAN · IMO · IAC (matches the sketch).
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
        leds={[
          { label: "ST", on: on("start"), color: "#b6ff3c" },
          { label: "ETC", on: on("etc"), color: "#00e7f2" },
        ]}
        icon={<Power className={ic} />}
      />
      <StatusGroup
        title="FPC"
        leds={[
          { label: "−", on: on("fuelPump"), color: "#ffb000" },
          { label: "+", on: on("fuelPump"), color: "#ffb000" },
        ]}
        icon={<Fuel className={ic} />}
      />
      <StatusGroup
        title="FAN"
        leds={[
          { label: "1", on: on("fan1"), color: "#2d8bff" },
          { label: "2", on: on("fan2"), color: "#2d8bff" },
        ]}
        icon={<Fan className={ic} />}
      />
      <StatusGroup
        title="IMO"
        leds={[
          { label: "+", on: on("immoP"), color: "#9d6bff" },
          { label: "−", on: on("immoN"), color: "#9d6bff" },
        ]}
        icon={<Hand className={ic} />}
      />
      <StatusGroup
        title="IAC"
        leds={[0, 1, 2, 3].map((i) => ({
          on: i < iacLit,
          color: "#00e7f2",
        }))}
        icon={<Cog className={ic} />}
      />
    </div>
  );
}

// Bottom-left system rail: BAT · SW ON · MRC+ · MRC− (matches the sketch).
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
    <div className="flex flex-col items-center gap-1">
      <span
        className="grid h-8 w-8 place-items-center rounded-full border md:h-9 md:w-9"
        style={{
          borderColor: on ? color : "#2a3942",
          color: on ? color : "#46586390",
          background: on ? `${color}1f` : "transparent",
          boxShadow: on ? `0 0 10px -2px ${color}` : "none",
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
  const i2 = "h-4 w-4";
  return (
    <div className={className}>
      <SystemChip icon={<BatteryFull className={i2} />} label="BAT" on={on("battery")} color="#2bff88" />
      <SystemChip icon={<KeyRound className={i2} />} label="SW ON" on={on("switch")} color="#00e7f2" />
      <SystemChip icon={<Zap className={i2} />} label="MRC+" on={on("mrcP")} color="#ff36c8" />
      <SystemChip icon={<SlidersHorizontal className={i2} />} label="MRC−" on={on("mrcN")} color="#ff36c8" />
    </div>
  );
}
