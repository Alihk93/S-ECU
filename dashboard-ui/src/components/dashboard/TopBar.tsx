import { useEffect, useRef, useState } from "react";
import type { LinkStatus } from "@/hooks/useEcuLink";
import type { StatusKey } from "@/lib/ecu";
import logoUrl from "@/assets/al-ayed-logo.jpg";
import { SevenSegDisplay } from "./SevenSegDisplay";

interface TopBarProps {
  fps: number;
  linkStatus: LinkStatus;
  ecuV: number;
  cur: number;
  status: Record<StatusKey, number>;
}

const LINK_BADGE: Record<LinkStatus, { label: string; color: string }> = {
  live: { label: "Live", color: "#2bff88" },
  connecting: { label: "Link…", color: "#ffb000" },
  offline: { label: "No Link", color: "#ff2d55" },
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

export function TopBar({ fps, linkStatus, ecuV, cur, status }: TopBarProps) {
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

  const on = (k: StatusKey) => !!status[k];

  return (
    <header className="panel flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 short:py-1 md:px-4">
      {/* brand logo (AL-AYED · ECU Tester) */}
      <div className="flex items-center">
        <img
          src={logoUrl}
          alt="AL-AYED · ECU Tester"
          className="h-9 w-auto rounded-sm short:h-7 md:h-12"
          style={{ boxShadow: "0 0 10px -3px rgba(0,231,242,0.5)" }}
        />
      </div>

      {/* three seven-seg readouts */}
      <div className="hidden items-stretch gap-2 sm:flex">
        <SegBox label="VOLTAGE" unit="V" color="#22d3ee">
          <SevenSegDisplay value={fmt(ecuV, 2, 2)} color="#22d3ee" className="h-[26px] w-full" />
        </SegBox>
        <SegBox label="CURRENT" unit="A" color="#ff9d00">
          <SevenSegDisplay value={fmt(cur, 2, 2)} color="#ff9d00" className="h-[26px] w-full" />
        </SegBox>
      </div>

      {/* round indicator lamps */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <Lamp label="BAT" on={on("battery")} color="#ff3b3b" icon={<BatteryGlyph />} />
          <Lamp label="SWON" on={on("switch")} color="#ffb000" icon={<KeyGlyph />} />
          <Lamp label="MRC+" on={on("mrcP")} color="#2bff88" icon={<RelayGlyph />} />
          <Lamp label="MRC−" on={on("mrcN")} color="#2bff88" icon={<RelayGlyph />} />
        </div>
        <span
          className="flex items-center gap-1.5 rounded-sm border px-2 py-1 font-display text-[10px] uppercase tracking-hud"
          style={{
            color: LINK_BADGE[linkStatus].color,
            borderColor: `${LINK_BADGE[linkStatus].color}80`,
            boxShadow: `0 0 12px -4px ${LINK_BADGE[linkStatus].color}`,
          }}
        >
          <span className="h-1.5 w-1.5 animate-pulse-led rounded-full" style={{ background: LINK_BADGE[linkStatus].color }} />
          {LINK_BADGE[linkStatus].label}
        </span>
        <span className="hidden items-center gap-1 font-data text-[10px] tabular-nums text-muted-foreground lg:flex" title="Connection uptime">
          <span className="text-[8px] uppercase tracking-widest opacity-70">UP</span>
          {uptime}
        </span>
        <span className="hidden font-data text-[9px] text-muted-foreground xl:inline">
          FPS <b className={fps >= 50 ? "text-neon-green" : fps >= 30 ? "text-neon-amber" : "text-neon-red"}>{fps}</b>
        </span>
      </div>
    </header>
  );
}

function SegBox({ label, unit, color, children }: { label: string; unit?: string; color: string; children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-w-[92px] flex-col justify-center rounded-md border border-border/60 px-2 py-1"
      style={{ background: "linear-gradient(180deg,#03131c,#010a0f)", boxShadow: "inset 0 1px 6px rgba(0,0,0,0.7)" }}
    >
      <span className="mb-0.5 font-display text-[7px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {children}
        {unit && <span className="font-data text-[11px] font-bold" style={{ color }}>{unit}</span>}
      </div>
    </div>
  );
}

function Lamp({ label, on, color, icon }: { label: string; on: boolean; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-full border md:h-9 md:w-9"
        style={{
          color: on ? color : "#3a4a55",
          borderColor: on ? color : "#243039",
          background: on
            ? `radial-gradient(circle at 50% 35%, ${color}44, #05141d 72%)`
            : "radial-gradient(circle at 50% 35%, #0d1a22, #04080c)",
          boxShadow: on ? `0 0 12px -1px ${color}, inset 0 0 6px -2px ${color}` : "inset 0 0 5px rgba(0,0,0,0.8)",
        }}
      >
        {icon}
      </span>
      <span className="font-data text-[7px] font-bold uppercase tracking-wide" style={{ color: on ? color : "#5a6b76" }}>{label}</span>
    </div>
  );
}

function BatteryGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="8" cy="12" r="3.4" />
      <path d="M11.2 12 H20 M17.5 12 V15 M20 12 V15.5" strokeLinecap="round" />
    </svg>
  );
}
function RelayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 4 V9 M6 9 A2.6 2.6 0 0 1 11 9 A2.6 2.6 0 0 1 16 9 V4" />
      <path d="M18 4 L18 12 L13 16" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

