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
const art = "h-14 w-14 md:h-[4.5rem] md:w-[4.5rem]";

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
  // 9 overlapping swept blades → a solid axial-fan rotor (no see-through gaps).
  const blades = Array.from({ length: 9 }, (_, i) => (
    <path
      key={i}
      d="M50 50 C49 34 53 22 61 20 C74 17 86 26 86 40 C77 42 62 46 55 49 C52 50 50 50 50 50 Z"
      fill="url(#fan-blade)"
      stroke="#2c1b0d"
      strokeWidth="0.6"
      transform={`rotate(${i * 40} 50 50)`}
    />
  ));
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="fan-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#efe7d4" />
          <stop offset="100%" stopColor="#c7b999" />
        </linearGradient>
        <radialGradient id="fan-well" cx="50%" cy="44%" r="58%">
          <stop offset="0%" stopColor="#3d2b18" />
          <stop offset="100%" stopColor="#130c05" />
        </radialGradient>
        <linearGradient id="fan-blade" x1="0" y1="16" x2="0" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9c6739" />
          <stop offset="50%" stopColor="#6b4423" />
          <stop offset="100%" stopColor="#3a2513" />
        </linearGradient>
        <radialGradient id="fan-hub" cx="42%" cy="38%" r="66%">
          <stop offset="0%" stopColor="#8c5c31" />
          <stop offset="100%" stopColor="#2b1a0c" />
        </radialGradient>
      </defs>

      {/* beige frame with a circular air opening cut out (evenodd) */}
      <path
        fill="url(#fan-frame)"
        fillRule="evenodd"
        d="M14 3 H86 A11 11 0 0 1 97 14 V86 A11 11 0 0 1 86 97 H14 A11 11 0 0 1 3 86 V14 A11 11 0 0 1 14 3 Z
           M50 8 A42 42 0 1 0 50 92 A42 42 0 1 0 50 8 Z"
      />
      {/* interior air-well shadow */}
      <circle cx="50" cy="50" r="42" fill="url(#fan-well)" />

      {/* corner mounting pads + screw holes */}
      {[[15, 15], [85, 15], [15, 85], [85, 85]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="8" fill="#b8aa89" />
          <circle cx={cx} cy={cy} r="3" fill="#241a10" />
        </g>
      ))}

      {/* swept rotor blades */}
      {blades}

      {/* hub + center sticker */}
      <circle cx="50" cy="50" r="16" fill="url(#fan-hub)" stroke="#241608" strokeWidth="1" />
      <circle cx="50" cy="50" r="8" fill="#dccdb1" />
      <circle cx="50" cy="50" r="8" fill="none" stroke="#8a5a30" strokeWidth="1" />
    </svg>
  );
}

// IMO — immobilizer tell-tale: a red car side-profile outline with a solid key
// inside (bow + toothed blade), the "key inside car" anti-theft warning glyph.
function ImmobilizerArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* SUV side-profile outline: flat vertical tailgate (no trunk), long tall
          roof, near-vertical windshield, short hood, big wheels */}
      <path
        d="M14 96 L14 42 Q14 36 20 36 L128 36
           Q137 36 142 43 L157 62 L186 66 Q192 67 192 74 L192 90 Q192 96 186 96
           L168 96 A20 20 0 0 0 128 96 L84 96 A20 20 0 0 0 44 96 Z"
        fill="none" stroke="#ff2d2d" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* big SUV wheels sitting in the arches */}
      <circle cx="64" cy="96" r="16" fill="none" stroke="#ff2d2d" strokeWidth="7" />
      <circle cx="148" cy="96" r="16" fill="none" stroke="#ff2d2d" strokeWidth="7" />

      {/* key inside the cabin: bold oval bow ring, slim blade, pointed tip,
          comb teeth near the tip — sized to stay within the car body */}
      <ellipse cx="80" cy="63" rx="9" ry="11" fill="none" stroke="#ff2d2d" strokeWidth="6" />
      <g fill="#ff2d2d">
        <rect x="88" y="60" width="44" height="6" rx="3" />
      </g>
      {/* comb teeth on the bottom edge near the tip */}
      <g stroke="#ff2d2d" strokeWidth="3.5" strokeLinecap="round">
        <line x1="112" y1="66" x2="112" y2="72" />
        <line x1="120" y1="66" x2="120" y2="72" />
      </g>
    </svg>
  );
}

// IAC — idle-air-control stepper valve, rendered photo-realistically after a
// Mitsubishi-style unit: glossy black moulded motor body, ribbed connector plug
// on top, knurled brass collar, steel coil spring and black bullet pintle nose.
function IacValveArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 144 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        {/* glossy black plastic — off-centre highlight, deep falloff */}
        <radialGradient id="iac-body" cx="36%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#8b9096" />
          <stop offset="18%" stopColor="#3c4045" />
          <stop offset="48%" stopColor="#17191c" />
          <stop offset="100%" stopColor="#020203" />
        </radialGradient>
        <radialGradient id="iac-con" cx="34%" cy="24%" r="90%">
          <stop offset="0%" stopColor="#6c7076" />
          <stop offset="35%" stopColor="#262a2e" />
          <stop offset="100%" stopColor="#040506" />
        </radialGradient>
        <radialGradient id="iac-nose" cx="30%" cy="28%" r="95%">
          <stop offset="0%" stopColor="#6a6e73" />
          <stop offset="35%" stopColor="#202327" />
          <stop offset="100%" stopColor="#020203" />
        </radialGradient>
        {/* brass cylinder seen side-on: dark rim / bright specular band / dark rim */}
        <linearGradient id="iac-copper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a4420" />
          <stop offset="20%" stopColor="#c79758" />
          <stop offset="40%" stopColor="#f6d79f" />
          <stop offset="56%" stopColor="#d5a262" />
          <stop offset="100%" stopColor="#573619" />
        </linearGradient>
        {/* steel wire: bright top specular grading to shadow at the bottom */}
        <linearGradient id="iac-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b6166" />
          <stop offset="26%" stopColor="#f2f5f7" />
          <stop offset="52%" stopColor="#bcc3c8" />
          <stop offset="100%" stopColor="#4d5257" />
        </linearGradient>
        <filter id="iac-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="iac-shadow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {/* soft ground contact shadow */}
      <ellipse cx="92" cy="94" rx="52" ry="6" fill="#000" opacity="0.4" filter="url(#iac-shadow)" />

      {/* mounting ears behind the body */}
      <g fill="#0a0b0c" stroke="#000" strokeWidth="0.6">
        <rect x="82" y="74" width="16" height="17" rx="3" />
        <rect x="104" y="72" width="15" height="16" rx="3" />
      </g>
      <circle cx="90" cy="82.5" r="3" fill="#050506" stroke="#33363a" strokeWidth="0.8" />
      <circle cx="111.5" cy="79.5" r="3" fill="#050506" stroke="#33363a" strokeWidth="0.8" />

      {/* ---- left shaft assembly: nose · spring · brass collar ---- */}
      {/* knurled brass collar (right end tucks under the body) */}
      <rect x="46" y="40" width="26" height="28" rx="2.5" fill="url(#iac-copper)" stroke="#33200f" strokeWidth="0.7" />
      <g stroke="#7a5026" strokeWidth="0.7" opacity="0.45">
        <line x1="50" y1="40" x2="50" y2="68" />
        <line x1="54" y1="40" x2="54" y2="68" />
        <line x1="58" y1="40" x2="58" y2="68" />
        <line x1="62" y1="40" x2="62" y2="68" />
        <line x1="66" y1="40" x2="66" y2="68" />
      </g>
      <rect x="46" y="45" width="26" height="2.4" rx="1" fill="#ffe9c2" opacity="0.6" />
      {/* dark end caps give the cylinder rounded ends */}
      <ellipse cx="46" cy="54" rx="3" ry="14" fill="#3a2512" />
      <ellipse cx="72" cy="54" rx="3" ry="14" fill="#7a5026" opacity="0.5" />

      {/* steel coil spring — each coil = shadow ring + offset highlight ring */}
      <rect x="30" y="46" width="20" height="16" fill="#101214" />
      <g fill="none">
        {[31.5, 36, 40.5, 45].map((cx, i) => (
          <g key={i}>
            <ellipse cx={cx} cy="54" rx="3.6" ry="11" stroke="#1b1e20" strokeWidth="3.4" />
            <ellipse cx={cx} cy="54" rx="3.6" ry="11" stroke="url(#iac-steel)" strokeWidth="2.4" />
            <path d={`M${cx - 3.4} 51 A3.6 8 0 0 1 ${cx + 2.4} 46`} stroke="#ffffff" strokeWidth="0.9" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* black flange washer between nose and spring */}
      <ellipse cx="29" cy="54" rx="3" ry="12" fill="#0c0d0f" stroke="#2a2d30" strokeWidth="0.7" />

      {/* black bullet pintle nose (far left) */}
      <path d="M29 43 L20 43 Q6 46 6 54 Q6 62 20 65 L29 65 Z" fill="url(#iac-nose)" stroke="#000" strokeWidth="0.7" />
      <ellipse cx="15" cy="48" rx="4.5" ry="3" fill="#8b8f94" opacity="0.55" filter="url(#iac-soft)" />
      <ellipse cx="12" cy="47" rx="1.8" ry="1.1" fill="#eef1f3" opacity="0.75" />

      {/* ---- glossy black stepper-motor body — sharp-edged rectangular moulding ---- */}
      <rect x="62" y="21" width="66" height="64" rx="3" ry="3" fill="url(#iac-body)" stroke="#000" strokeWidth="1" />
      {/* raised circular bearing boss on the left face (shaft entry) */}
      <ellipse cx="77" cy="54" rx="14" ry="16" fill="none" stroke="#3a3d41" strokeWidth="1.4" opacity="0.5" />
      <ellipse cx="77" cy="54" rx="8" ry="10" fill="none" stroke="#2c2f33" strokeWidth="1" opacity="0.45" />
      {/* broad soft gloss + tight specular hotspot */}
      <ellipse cx="82" cy="33" rx="16" ry="9" fill="#b7bbc0" opacity="0.4" filter="url(#iac-soft)" />
      <ellipse cx="79" cy="30" rx="5" ry="3" fill="#f2f4f6" opacity="0.7" />
      {/* rim light down the right edge and along the bottom */}
      <path d="M128 60 L128 84 L110 84" fill="none" stroke="#5a5e63" strokeWidth="2" opacity="0.4" filter="url(#iac-soft)" />

      {/* dark bearing collar at the shaft/body junction */}
      <ellipse cx="64" cy="54" rx="5" ry="16" fill="#090a0b" />
      <ellipse cx="64" cy="54" rx="5" ry="16" fill="none" stroke="#54585c" strokeWidth="1" opacity="0.55" />

      {/* ---- tall ribbed electrical connector on top, tilted up-right ---- */}
      <g transform="rotate(-15 96 24)">
        <rect x="76" y="5" width="50" height="28" rx="8" fill="url(#iac-con)" stroke="#000" strokeWidth="0.9" />
        {/* gloss streak + moulded ribs */}
        <rect x="81" y="7.5" width="32" height="4" rx="2" fill="#71757a" opacity="0.45" filter="url(#iac-soft)" />
        <g stroke="#000" strokeWidth="1" opacity="0.45">
          <line x1="90" y1="8" x2="90" y2="30" />
          <line x1="96" y1="8" x2="96" y2="30" />
        </g>
        {/* protruding terminal plug at the end */}
        <rect x="108" y="7" width="18" height="24" rx="3.5" fill="#0a0b0c" stroke="#000" strokeWidth="0.7" />
        <rect x="110" y="9" width="14" height="20" rx="2.5" fill="#040405" />
        <g fill="#8b8f94">
          <rect x="112.5" y="12" width="3.4" height="14" rx="1" />
          <rect x="118" y="12" width="3.4" height="14" rx="1" />
        </g>
      </g>
    </svg>
  );
}
