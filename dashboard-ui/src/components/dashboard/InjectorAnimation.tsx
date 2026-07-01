import { ChannelCell } from "./ChannelCell";

interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
  prefix?: string; // channel label prefix ("I" port, "G" GDI)
}

// Port ("I") and GDI ("G") injectors share the unified ChannelCell so every
// coil/injector reads as one family — a fuel droplet that fills and glows with
// injection intensity.
export function InjectorAnimation({ index, value, prefix = "I" }: InjectorProps) {
  return (
    <ChannelCell
      label={`${prefix}${index + 1}`}
      color="#22d3ee"
      intensity={value}
      flash={value > 0.6}
      icon="injector"
    />
  );
}

// Clean high-pressure fuel-rail glyph for the HI P tile: a pressure gauge with a
// swept needle. Pure SVG line art in the cyan accent (no raster).
export function HpPumpArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#22d3ee"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* dial */}
      <circle cx="24" cy="22" r="14" stroke="#1d3a56" />
      <path d="M12.5 30 A14 14 0 1 1 35.5 30" />
      {/* ticks */}
      <g stroke="#3a6a8a" strokeWidth="1.6">
        <path d="M24 10 v2.5" />
        <path d="M35 22 h-2.5" />
        <path d="M13 22 h2.5" />
        <path d="M31.6 14.4 l-1.8 1.8" />
        <path d="M16.4 14.4 l1.8 1.8" />
      </g>
      {/* needle in the high zone */}
      <path d="M24 22 L31 16" stroke="#22d3ee" strokeWidth="2.6" />
      <circle cx="24" cy="22" r="2.4" fill="#22d3ee" stroke="none" />
      {/* rail stub */}
      <path d="M24 36 v6 M20 42 h8" stroke="#3a6a8a" />
    </svg>
  );
}
