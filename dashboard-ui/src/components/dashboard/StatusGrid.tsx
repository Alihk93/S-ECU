import type { StatusKey } from "@/lib/ecu";

// Indicator button grid after the "ECU Test Bench v4.0" mockup: glossy labeled
// buttons that light in the signal's colour when active, grey when off. Wired to
// the real status bits (the BAT/SWON/MRC± lamps live in the top bar).

interface Btn {
  label: string;
  on: boolean;
  color: string;
}

function IndicatorButton({ label, on, color }: Btn) {
  return (
    <div
      className="flex items-center justify-center rounded-md border px-1 py-2 font-display text-[11px] font-bold uppercase tracking-wide transition-colors md:text-[13px]"
      style={{
        color: on ? "#04121a" : "#5a6b76",
        borderColor: on ? color : "#22303a",
        background: on
          ? `linear-gradient(180deg, ${color}, ${color}bb)`
          : "linear-gradient(180deg,#0e1a24,#070f16)",
        boxShadow: on
          ? `0 0 12px -2px ${color}, inset 0 1px 0 rgba(255,255,255,0.5)`
          : "inset 0 1px 0 rgba(120,160,190,0.08)",
        textShadow: on ? "0 1px 1px rgba(255,255,255,0.35)" : "none",
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
  const btns: Btn[] = [
    { label: "ST", on: on("start"), color: "#b6ff3c" },
    { label: "ETC", on: on("etc"), color: "#00e7f2" },
    { label: "FPC", on: on("fuelPump"), color: "#2bff88" },
    { label: "FAN1", on: on("fan1"), color: "#2d8bff" },
    { label: "FAN2", on: on("fan2"), color: "#2d8bff" },
    { label: "IMO+", on: on("immoP"), color: "#9d6bff" },
    { label: "IMO−", on: on("immoN"), color: "#ff2d3a" },
    { label: "IAC", on: on("iac") || iacStep > 4, color: "#00e7f2" },
  ];
  return (
    <div className={className}>
      {btns.map((b) => (
        <IndicatorButton key={b.label} {...b} />
      ))}
    </div>
  );
}
