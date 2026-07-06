import { useEffect, useRef, useState } from "react";
import type { LinkStatus } from "@/hooks/useEcuLink";
import { SevenSegDisplay } from "./SevenSegDisplay";

// v5 top strip after the brushed-steel mockup: VOLTAGE seven-seg (left, black
// inset), "ECU TESTER ⚡ AL-AYED" engraved in dark red around the spark trace
// (center), CURRENT seven-seg (right) and a small discreet link/uptime chip.

interface TopBarProps {
  fps: number;
  linkStatus: LinkStatus;
  ecuV: number;
  cur: number;
}

const LINK_BADGE: Record<LinkStatus, { label: string; color: string }> = {
  live: { label: "LIVE", color: "#2fbf5a" },
  connecting: { label: "LINK", color: "#d99a1f" },
  offline: { label: "SIM", color: "#b8412f" },
};

function fmt(v: number, intDigits: number, dec: number) {
  const s = Math.max(0, v).toFixed(dec);
  const [whole] = s.split(".");
  return "0".repeat(Math.max(0, intDigits - whole.length)) + s;
}

function fmtElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TopBar({ fps, linkStatus, ecuV, cur }: TopBarProps) {
  const connectedAtRef = useRef<number | null>(null);
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    if (linkStatus === "live") {
      if (connectedAtRef.current === null) connectedAtRef.current = Date.now();
      const tick = () => setUptime(fmtElapsed(Date.now() - (connectedAtRef.current ?? Date.now())));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
    connectedAtRef.current = null;
    setUptime("00:00:00");
  }, [linkStatus]);

  const badge = LINK_BADGE[linkStatus];

  return (
    <header className="metal-plate relative flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 short:py-1 md:px-5 md:py-2">
      {/* VOLTAGE — black inset seven-seg */}
      <div className="inset-screen flex items-center gap-2 rounded-md px-2.5 py-1.5 md:px-3">
        <span className="font-display text-[11px] font-bold uppercase tracking-wide md:text-[13px]" style={{ color: "#2f7fe0" }}>
          Voltage:
        </span>
        <SevenSegDisplay value={fmt(ecuV, 2, 2)} color="#3fd6e8" className="h-[22px] md:h-[28px]" />
        <span className="font-data text-sm font-bold md:text-base" style={{ color: "#3fd6e8" }}>V</span>
      </div>

      {/* center brand: ECU TESTER ⚡ AL-AYED engraved dark red */}
      <div className="flex items-center gap-2 md:gap-3">
        <span
          className="font-display text-base font-bold uppercase tracking-[0.12em] short:text-sm md:text-2xl"
          style={{ color: "#8e1c1c", textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}
        >
          ECU&nbsp;Tester
        </span>
        <SparkMark />
        <span
          className="font-display text-base font-bold uppercase tracking-[0.12em] short:text-sm md:text-2xl"
          style={{ color: "#8e1c1c", textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}
        >
          AL-AYED
        </span>
      </div>

      {/* CURRENT — black inset seven-seg + tiny link chip */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="inset-screen flex items-center gap-2 rounded-md px-2.5 py-1.5 md:px-3">
          <span className="font-display text-[11px] font-bold uppercase tracking-wide md:text-[13px]" style={{ color: "#5a7c9e" }}>
            Current
          </span>
          <SevenSegDisplay value={fmt(cur, 2, 2)} color="#3fd6e8" className="h-[22px] md:h-[28px]" />
          <span className="font-data text-sm font-bold md:text-base" style={{ color: "#3fd6e8" }}>A</span>
        </div>
        {/* discreet link/uptime chip, engraved into the metal */}
        <div
          className="hidden flex-col items-center gap-0.5 rounded-sm px-1.5 py-0.5 lg:flex"
          title={`Link ${badge.label} · uptime ${uptime} · ${fps} fps`}
        >
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: badge.color, boxShadow: `0 0 5px ${badge.color}` }} />
            <span className="font-data text-[8px] font-bold" style={{ color: "#3c4247", textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}>
              {badge.label}
            </span>
          </span>
          <span className="font-data text-[8px] tabular-nums" style={{ color: "#4c5257", textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}>
            {uptime}
          </span>
        </div>
      </div>
    </header>
  );
}

// Red spark trace engraved between the two brand words (flat → well → spike →
// decay), matching the mockup's ignition-waveform motif on brushed metal.
function SparkMark() {
  return (
    <svg viewBox="0 0 150 44" className="h-7 w-[92px] shrink-0 md:h-9 md:w-[130px]" aria-hidden="true">
      <defs>
        <filter id="logo-spark" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* engraved baseline */}
      <path d="M4,26 H52 V38 H64 V6 C69,6 71,26 83,26 H146" fill="none" stroke="#565b60" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M4,27.4 H52 V39.4 H64 M83,27.4 H146" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
      {/* red glowing spike */}
      <path d="M52,38 H64 V6 C69,6 71,26 83,26" fill="none" stroke="#d81f2a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-spark)" />
      <circle cx="30" cy="26" r="2.4" fill="#d81f2a" filter="url(#logo-spark)" />
      <circle cx="112" cy="26" r="2.4" fill="#d81f2a" filter="url(#logo-spark)" />
      <circle cx="134" cy="26" r="2.4" fill="#d81f2a" filter="url(#logo-spark)" />
    </svg>
  );
}
