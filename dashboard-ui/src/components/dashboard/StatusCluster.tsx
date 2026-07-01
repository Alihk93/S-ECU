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

function StatusGroup({ leds, art }: { leds: Led[]; art?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center gap-1 rounded-sm border border-border bg-secondary/40 px-2 py-1">
      <div className="mt-auto flex w-full items-end justify-between">
        {leds.map((l, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {l.label && (
              <span className="font-data text-[7px] leading-none text-muted-foreground">
                {l.label}
              </span>
            )}
            <LedDot on={l.on} color={l.color} />
          </div>
        ))}
      </div>
      {art && <span className="mt-1.5 flex justify-center">{art}</span>}
    </div>
  );
}

type StatusMap = Record<StatusKey, number>;
const art = "h-8 w-8 md:h-9 md:w-9";

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
      />
      <StatusGroup
        leds={[
          { label: "−", on: on("fuelPump"), color: "#ffb000" },
          { label: "+", on: on("fuelPump"), color: "#ffb000" },
        ]}
        art={<FuelPumpArt className={art} />}
      />
      <StatusGroup
        leds={[
          { label: "1", on: on("fan1"), color: "#2d8bff" },
          { label: "2", on: on("fan2"), color: "#2d8bff" },
        ]}
        art={<FanArt className={art} />}
      />
      <StatusGroup
        leds={[
          { label: "+", on: on("immoP"), color: "#9d6bff" },
          { label: "−", on: on("immoN"), color: "#9d6bff" },
        ]}
        art={<ImmobilizerArt className={art} />}
      />
      <StatusGroup
        leds={[0, 1, 2, 3].map((i) => ({
          on: i < iacLit,
          color: "#00e7f2",
        }))}
        art={<IacValveArt className={art} />}
      />
    </div>
  );
}

// Automotive battery / charging-system tell-tale: a battery box with two top
// terminals, an inner border line and −/+ knocked out (filled glyph in
// currentColor so the chip's on/off color carries through).
function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <mask id="sys-bat-mask">
          <rect width="24" height="24" fill="white" />
          {/* inner border line */}
          <rect x="3.6" y="8.1" width="16.8" height="9.3" rx="1.6" fill="black" />
          <rect x="4.9" y="9.4" width="14.2" height="6.7" rx="1" fill="white" />
          {/* minus */}
          <rect x="6.4" y="11.9" width="3.4" height="1.5" rx="0.4" fill="black" />
          {/* plus */}
          <rect x="14.2" y="11.9" width="3.4" height="1.5" rx="0.4" fill="black" />
          <rect x="15.15" y="10.95" width="1.5" height="3.4" rx="0.4" fill="black" />
        </mask>
      </defs>
      {/* terminals */}
      <rect x="6.5" y="4.6" width="3" height="2.2" rx="0.5" />
      <rect x="14.5" y="4.6" width="3" height="2.2" rx="0.5" />
      {/* body with inner border + signs knocked out */}
      <rect x="2" y="6.5" width="20" height="12" rx="2.5" mask="url(#sys-bat-mask)" />
    </svg>
  );
}

// Immobilizer / key tell-tale: a car side silhouette with a horizontal key
// knocked out of the body (filled glyph in currentColor).
function CarKeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <mask id="sys-key-mask">
          <rect width="24" height="24" fill="white" />
          {/* key blade */}
          <rect x="7" y="11.3" width="8.4" height="1.6" rx="0.6" fill="black" />
          {/* teeth */}
          <rect x="7.6" y="12.9" width="1.2" height="1.1" rx="0.2" fill="black" />
          <rect x="9.6" y="12.9" width="1.2" height="1.1" rx="0.2" fill="black" />
          {/* bow / head */}
          <rect x="14.9" y="10.1" width="2.6" height="3.9" rx="0.9" fill="black" />
        </mask>
      </defs>
      <g mask="url(#sys-key-mask)">
        <path d="M2 14 C2 12.9 2.9 12.7 3.8 12.6 L5.6 12.4 L7.4 9.4 C7.8 8.7 8.5 8.4 9.3 8.4 L14 8.4 C14.9 8.4 15.6 8.8 16.1 9.5 L17.8 12 L20.4 12.4 C21.5 12.6 22 13.1 22 14.1 L22 15 C22 15.5 21.7 15.8 21.2 15.8 L3 15.8 C2.4 15.8 2 15.4 2 14.9 Z" />
        <circle cx="7.2" cy="15.8" r="2" />
        <circle cx="16.8" cy="15.8" r="2" />
      </g>
    </svg>
  );
}

// Main-relay (MRC) tell-tale: a relay schematic — a switch contact over a solid
// armature bar over a coil winding (line-art in currentColor). When `closed`
// (relay energized) the lever drops to bridge the two terminals.
function RelayIcon({ className, closed = false }: { className?: string; closed?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* switch contacts + leads */}
      <line x1="1" y1="6" x2="5.9" y2="6" />
      <circle cx="7.6" cy="6" r="1.7" />
      <circle cx="14.4" cy="6" r="1.7" />
      <line x1="16.1" y1="6" x2="23" y2="6" />
      {/* switch arm: closed = horizontal contact, open = lifted lever */}
      {closed ? (
        <line x1="9.3" y1="6" x2="12.7" y2="6" />
      ) : (
        <line x1="13.2" y1="4.8" x2="8.8" y2="2.8" />
      )}
      {/* armature / contact bar (solid) */}
      <rect x="3.5" y="9.8" width="17" height="1.8" rx="0.3" fill="currentColor" stroke="none" />
      {/* coil winding */}
      <path d="M4 20.2 V18.4 A2 2 0 0 1 8 18.4 A2 2 0 0 1 12 18.4 A2 2 0 0 1 16 18.4 A2 2 0 0 1 20 18.4 V20.2" />
    </svg>
  );
}

// Bottom-left system rail: BAT · SW ON · MRC+ · MRC− (matches the sketch).
function SystemChip({
  icon,
  label,
  on,
  color,
  lamp = false,
  schematic = false,
}: {
  icon: ReactNode;
  label: string;
  on: boolean;
  color: string;
  lamp?: boolean;
  schematic?: boolean;
}) {
  // `lamp` renders a real warning-light look: a black lens with a bright red
  // symbol. `schematic` renders a white lens with a black symbol (relay
  // schematic). Otherwise the default tinted-outline chip.
  let style: React.CSSProperties;
  if (lamp) {
    style = {
      borderColor: on ? color : "#2a1416",
      color: on ? "#ff4d4d" : "#e0303c",
      background: "radial-gradient(circle at 50% 38%, #170a0c, #000)",
      boxShadow: on
        ? `0 0 12px -1px ${color}, inset 0 0 6px -2px ${color}`
        : "inset 0 0 5px rgba(0,0,0,0.85)",
    };
  } else if (schematic) {
    style = {
      borderColor: on ? color : "#c2ccd2",
      color: on ? "#ff2d3a" : "#0b0e10",
      background: "radial-gradient(circle at 50% 38%, #ffffff, #d7dde1)",
      boxShadow: on ? `0 0 12px -1px ${color}` : "inset 0 0 4px rgba(0,0,0,0.18)",
    };
  } else {
    style = {
      borderColor: on ? color : "#2a3942",
      color: on ? color : "#46586390",
      background: on ? `${color}1f` : "transparent",
      boxShadow: on ? `0 0 10px -2px ${color}` : "none",
    };
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="grid h-14 w-14 place-items-center rounded-lg border md:h-16 md:w-16"
        style={style}
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
  const i2 = "h-9 w-9 md:h-10 md:w-10";
  return (
    <div className={className}>
      <SystemChip icon={<BatteryIcon className={i2} />} label="BAT" on={on("battery")} color="#ff3b3b" lamp />
      <SystemChip icon={<CarKeyIcon className={i2} />} label="SW ON" on={on("switch")} color="#ff3b3b" lamp />
      <SystemChip icon={<RelayIcon className={i2} closed={on("mrcP")} />} label="MRC+" on={on("mrcP")} color="#ff2d3a" schematic />
      <SystemChip icon={<RelayIcon className={i2} closed={on("mrcN")} />} label="MRC−" on={on("mrcN")} color="#ff2d3a" schematic />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stylized SVG part renditions shown under each status block (no raster art,
// per the single-page constraint). Drawn to read at chip scale, not to be
// photoreal.
// ---------------------------------------------------------------------------

// FPC — Bosch inline fuel pump: brushed-metal cylinder, black connector cap.
function FuelPumpArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="fp-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f9599" />
          <stop offset="0.5" stopColor="#e6eaec" />
          <stop offset="1" stopColor="#868c90" />
        </linearGradient>
      </defs>
      {/* metal body */}
      <rect x="16" y="32" width="28" height="62" rx="4" fill="url(#fp-metal)" stroke="#6c7276" strokeWidth="1" />
      {/* body groove */}
      <rect x="16" y="66" width="28" height="2.5" fill="#6c7276" opacity="0.55" />
      {/* black connector cap */}
      <path d="M18 33 L18 24 Q18 17 27 17 L37 17 Q44 17 44 25 L44 33 Z" fill="#18181a" />
      {/* plug + nozzle */}
      <rect x="21" y="9" width="13" height="10" rx="2" fill="#242427" />
      <rect x="40" y="12" width="5" height="12" rx="2" fill="#242427" />
    </svg>
  );
}

// FAN — Noctua-style axial fan: beige square frame, brown corner mounts,
// nine curved brown blades on a hub.
function FanArt({ className }: { className?: string }) {
  const blades = Array.from({ length: 9 }, (_, i) => (
    <path
      key={i}
      d="M50 50 C58 30 78 27 87 35 C80 45 66 50 50 50 Z"
      fill="#5c3a22"
      transform={`rotate(${i * 40} 50 50)`}
    />
  ));
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="5" width="90" height="90" rx="14" fill="none" stroke="#e7dcc6" strokeWidth="6" />
      <circle cx="17" cy="17" r="7" fill="#5a3a1f" />
      <circle cx="83" cy="17" r="7" fill="#5a3a1f" />
      <circle cx="17" cy="83" r="7" fill="#5a3a1f" />
      <circle cx="83" cy="83" r="7" fill="#5a3a1f" />
      {blades}
      <circle cx="50" cy="50" r="15" fill="#6b4423" />
    </svg>
  );
}

// IMO — immobilizer tell-tale: a red car side-profile outline with a solid key
// inside (bow + toothed blade), the "key inside car" anti-theft warning glyph.
function ImmobilizerArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* car side-profile outline with two wheel arches cut into the base */}
      <path
        d="M18 90 V70 C18 63 21 59 27 57 L54 38 C58 32 64 29 72 29 L124 29
           C134 29 142 33 148 41 L168 58 C176 60 182 64 182 72 V90
           H150 A16 16 0 0 0 118 90 H64 A16 16 0 0 0 32 90 H18 Z"
        fill="none" stroke="#ff2d2d" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* key — bow (head) */}
      <rect x="74" y="50" width="34" height="32" rx="14" fill="#ff5a2d" />
      {/* key — blade with rounded tip */}
      <rect x="104" y="59" width="50" height="13" rx="6" fill="#ff5a2d" />
      {/* key — teeth on the top edge near the tip */}
      <rect x="126" y="52" width="5" height="8" rx="1" fill="#ff5a2d" />
      <rect x="135" y="52" width="5" height="8" rx="1" fill="#ff5a2d" />
      <rect x="144" y="52" width="5" height="8" rx="1" fill="#ff5a2d" />
    </svg>
  );
}

// IAC — idle-air-control stepper valve: black body + connector, copper collar,
// spring and pintle tip.
function IacValveArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 112 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* main body */}
      <circle cx="78" cy="38" r="27" fill="#161616" />
      <circle cx="78" cy="38" r="19" fill="#242424" />
      {/* connector on top */}
      <rect x="70" y="8" width="28" height="18" rx="3" fill="#0c0c0c" />
      {/* copper collar */}
      <rect x="40" y="29" width="16" height="18" rx="2" fill="#8a5a34" />
      {/* spring */}
      <rect x="22" y="33" width="20" height="10" rx="2" fill="#3a3a3a" />
      {/* pintle tip */}
      <path d="M6 38 L22 31 L22 45 Z" fill="#0c0c0c" />
      <circle cx="11" cy="38" r="6" fill="#161616" />
    </svg>
  );
}
