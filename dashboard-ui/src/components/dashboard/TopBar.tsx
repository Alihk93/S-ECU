import { useEffect, useRef, useState } from "react";
import type { LinkStatus } from "@/hooks/useEcuLink";
import type { StatusKey } from "@/lib/ecu";
import { SevenSegDisplay } from "./SevenSegDisplay";

interface TopBarProps {
  fps: number;
  linkStatus: LinkStatus;
  ecuV: number;
  cur: number;
  amp: number;
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
// dotted "8.8.8" three-digit LED look
function dotted3(v: number) {
  const cl = Math.max(0, v);
  let d: string;
  if (cl >= 100) d = String(Math.min(999, Math.round(cl)));
  else if (cl >= 10) d = (Math.round(cl * 10) / 10).toFixed(1).replace(".", "");
  else d = cl.toFixed(2).replace(".", "");
  d = d.padStart(3, "0").slice(0, 3);
  return d.split("").map((c) => `${c}.`).join("");
}

function fmtElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TopBar({ fps, linkStatus, ecuV, cur, amp, status }: TopBarProps) {
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
      {/* title */}
      <div className="flex items-center gap-2 leading-tight">
        <SparkMark />
        <div>
          <div className="font-display text-sm font-bold tracking-hud text-white short:text-xs md:text-base">
            AL-AYED
          </div>
          <div className="font-data text-[8px] uppercase tracking-widest text-neon-cyan md:text-[9px]">
            ECU Test Bench v4.0
          </div>
        </div>
      </div>

      {/* three seven-seg readouts */}
      <div className="hidden items-stretch gap-2 sm:flex">
        <SegBox label="VOLTAGE" unit="V" color="#22d3ee">
          <SevenSegDisplay value={fmt(ecuV, 2, 2)} color="#22d3ee" className="h-[26px] w-full" />
        </SegBox>
        <SegBox label="CURRENT" unit="A" color="#ff9d00">
          <SevenSegDisplay value={fmt(cur, 2, 2)} color="#ff9d00" className="h-[26px] w-full" />
        </SegBox>
        <SegBox label="COUNTER" color="#2bff88">
          <SevenSegDisplay value={dotted3(amp)} color="#37d97a" className="h-[26px] w-full" />
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

function SparkMark() {
  return (
    <svg viewBox="0 0 120 40" className="h-6 w-[52px] shrink-0 md:h-7" aria-hidden="true">
      <defs>
        <filter id="logo-spark" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M2,24 H40 V38 H50 V6 C54,6 56,24 66,24 H118" fill="none" stroke="#3aa7ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40,38 H50 V6 C54,6 56,24 66,24" fill="none" stroke="#ff2d55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-spark)" />
      <path d="M2,18 V30 M118,18 V30" stroke="#3aa7ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
      <circle cx="90" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
      <circle cx="110" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
    </svg>
  );
}
