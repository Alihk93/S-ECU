import type { StatusKey } from "@/lib/ecu";

// v5 indicator keys after the brushed-steel mockup: plastic push-button style
// keys on a black screen — off = charcoal key with white legend, on = the key
// lights green (or red for IMO−) with a colored ring + glow. Real signal set:
// ST · ETC · FPC · FAN1 · FAN2 · IMO+ · IMO− · IAC.

interface Btn {
  label: string;
  on: boolean;
  color: string;
}

function IndicatorKey({ label, on, color }: Btn) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 px-1 py-1.5 font-display text-[12px] font-bold uppercase tracking-wide transition-colors short:py-1 md:py-2.5 md:text-[15px]"
      style={{
        color: on ? color : "#d7dde1",
        borderColor: on ? color : "#3a3f44",
        background: on
          ? `linear-gradient(180deg, ${color}30, #0a0c0d 78%)`
          : "linear-gradient(180deg, #33373b, #17191b 60%, #0e1011)",
        boxShadow: on
          ? `0 0 14px -2px ${color}, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 10px -4px ${color}`
          : "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.5)",
        textShadow: on ? `0 0 8px ${color}` : "0 1px 1px rgba(0,0,0,0.8)",
      }}
    >
      {label}
    </div>
  );
}

export function StatusGrid({
  status,
  iacStep,
  className,
}: {
  status: Record<StatusKey, number>;
  iacStep: number;
  className?: string;
}) {
  const on = (k: StatusKey) => !!status[k];
  const GREEN = "#49e057";
  const RED = "#ff4444";
  const btns: Btn[] = [
    { label: "ST", on: on("start"), color: GREEN },
    { label: "ETC", on: on("etc"), color: GREEN },
    { label: "FPC", on: on("fuelPump"), color: GREEN },
    { label: "FAN1", on: on("fan1"), color: GREEN },
    { label: "FAN2", on: on("fan2"), color: GREEN },
    { label: "IMO+", on: on("immoP"), color: GREEN },
    { label: "IMO−", on: on("immoN"), color: RED },
    { label: "IAC", on: on("iac") || iacStep > 4, color: GREEN },
  ];
  return (
    <div className={className}>
      {btns.map((b) => (
        <IndicatorKey key={b.label} {...b} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BAT / SWON / MRC+ / MRC− round lamps row (lives inside the SENSOR GAUGES
// panel in the v5 layout): label above, colored round lens with glyph below.
// ---------------------------------------------------------------------------

function Lamp({ label, on, color, icon }: { label: string; on: boolean; color: string; icon: React.ReactNode }) {
  // The lamp keeps its colour identity even when off (dim ring + glyph, like
  // the mockup); lighting up brightens the lens and adds the glow.
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-display text-[9px] font-bold uppercase tracking-wide md:text-[11px]"
        style={{ color: on ? color : `${color}99`, textShadow: on ? `0 0 8px ${color}` : "none" }}
      >
        {label}
      </span>
      <span
        className="grid h-8 w-8 place-items-center rounded-full border-2 md:h-10 md:w-10"
        style={{
          color: on ? color : `${color}77`,
          borderColor: on ? color : `${color}66`,
          background: on
            ? `radial-gradient(circle at 50% 35%, ${color}3d, #05090c 74%)`
            : "radial-gradient(circle at 50% 35%, #10161b, #04070a)",
          boxShadow: on ? `0 0 14px -2px ${color}, inset 0 0 7px -2px ${color}` : "inset 0 0 6px rgba(0,0,0,0.85)",
        }}
      >
        {icon}
      </span>
    </div>
  );
}

export function SystemLamps({
  status,
  className,
}: {
  status: Record<StatusKey, number>;
  className?: string;
}) {
  const on = (k: StatusKey) => !!status[k];
  return (
    <div className={className}>
      <Lamp label="BAT" on={on("battery")} color="#ff3b3b" icon={<BatteryGlyph />} />
      <Lamp label="SWON" on={on("switch")} color="#ffab26" icon={<KeyGlyph />} />
      <Lamp label="MRC+" on={on("mrcP")} color="#49e057" icon={<RelayGlyph />} />
      <Lamp label="MRC−" on={on("mrcN")} color="#49e057" icon={<RelayGlyph />} />
    </div>
  );
}

function BatteryGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="2.6" height="2" rx="0.4" />
      <rect x="14.9" y="5" width="2.6" height="2" rx="0.4" />
      <rect x="3" y="7" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="11" width="3" height="1.4" rx="0.3" />
      <rect x="15" y="11" width="3" height="1.4" rx="0.3" />
      <rect x="15.8" y="10.2" width="1.4" height="3" rx="0.3" />
    </svg>
  );
}
function KeyGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 15 C3 13.8 3.9 13.6 4.8 13.5 L6.4 13.3 L8 10.8 C8.4 10.2 9 9.9 9.7 9.9 L14 9.9 C14.8 9.9 15.4 10.2 15.9 10.8 L17.4 12.9 L19.8 13.3 C20.7 13.5 21 13.9 21 14.7 L21 15.6 C21 16 20.8 16.3 20.4 16.3 L3.7 16.3 C3.3 16.3 3 16 3 15.6 Z" />
      <circle cx="7.6" cy="16.3" r="1.6" />
      <circle cx="16.4" cy="16.3" r="1.6" />
    </svg>
  );
}
function RelayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 4 V9 M6 9 A2.6 2.6 0 0 1 11 9 A2.6 2.6 0 0 1 16 9 V4" />
      <path d="M18 4 L18 12 L13 16" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
