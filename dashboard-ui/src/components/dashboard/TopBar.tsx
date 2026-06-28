import { useEffect, useRef, useState } from "react";
import { Activity, Wifi } from "lucide-react";
import type { LinkStatus } from "@/hooks/useEcuLink";

interface TopBarProps {
  fps: number;
  linkStatus: LinkStatus;
}

const LINK_BADGE: Record<
  LinkStatus,
  { label: string; color: string }
> = {
  live: { label: "Live", color: "#2bff88" },
  connecting: { label: "Link…", color: "#ffb000" },
  offline: { label: "No Link", color: "#ff2d55" },
};

function fmtElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TopBar({ fps, linkStatus }: TopBarProps) {
  // Connection uptime: counts from the moment the link goes "live".
  const connectedAtRef = useRef<number | null>(null);
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    if (linkStatus === "live") {
      if (connectedAtRef.current === null) connectedAtRef.current = Date.now();
      const tick = () =>
        setUptime(fmtElapsed(Date.now() - (connectedAtRef.current ?? Date.now())));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
    // Reset whenever the link drops so the next connection starts fresh.
    connectedAtRef.current = null;
    setUptime("00:00:00");
  }, [linkStatus]);

  return (
    <header className="panel flex items-center justify-between gap-4 rounded-sm px-4 py-2.5 short:py-1">
      <div className="flex items-center gap-3">
        <div className="leading-tight">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-hud text-foreground short:text-xs md:text-base md:gap-2">
            <span>ECU&nbsp;TESTER</span>
            <SparkMark />
            <span>AL-AYED</span>
          </div>
          <div className="font-data text-[9px] uppercase tracking-widest text-muted-foreground">
            Smart ECU Tester
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 font-data text-[10px] md:flex">
        <Chip icon={<Wifi className="h-3 w-3" />} label="AP" value="S-ECU" />
        <Chip label="IP" value="10.10.10.10" />
        <Chip
          icon={<Activity className="h-3 w-3" />}
          label="FPS"
          value={String(fps)}
          tone={fps >= 50 ? "good" : fps >= 30 ? "warn" : "bad"}
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          className="flex items-center gap-1.5 rounded-sm border px-2 py-1 font-display text-[10px] uppercase tracking-hud"
          style={{
            color: LINK_BADGE[linkStatus].color,
            borderColor: `${LINK_BADGE[linkStatus].color}80`,
            boxShadow: `0 0 12px -4px ${LINK_BADGE[linkStatus].color}`,
          }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse-led rounded-full"
            style={{ background: LINK_BADGE[linkStatus].color }}
          />
          {LINK_BADGE[linkStatus].label}
        </span>
        <span
          className="hidden items-center gap-1.5 font-data text-[11px] tabular-nums text-muted-foreground lg:flex"
          title="Connection uptime"
        >
          <span className="text-[9px] uppercase tracking-widest opacity-70">UP</span>
          {uptime}
        </span>
      </div>
    </header>
  );
}

function SparkMark() {
  return (
    <svg
      viewBox="0 0 120 40"
      className="h-5 w-[54px] shrink-0 md:h-6 md:w-[60px]"
      aria-hidden="true"
    >
      <defs>
        <filter id="logo-spark" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* dark trace: flat → square well → tall spike → decay → flat */}
      <path
        d="M2,24 H40 V38 H50 V6 C54,6 56,24 66,24 H118"
        fill="none"
        stroke="#6f95a3"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* red glowing spike overlay */}
      <path
        d="M40,38 H50 V6 C54,6 56,24 66,24"
        fill="none"
        stroke="#ff2d55"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logo-spark)"
      />
      {/* end caps */}
      <path
        d="M2,18 V30 M118,18 V30"
        stroke="#6f95a3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* glowing pulse nodes */}
      <circle cx="26" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
      <circle cx="90" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
      <circle cx="110" cy="24" r="2.4" fill="#ff2d55" filter="url(#logo-spark)" />
    </svg>
  );
}

function Chip({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "#2bff88"
      : tone === "warn"
        ? "#ffb000"
        : tone === "bad"
          ? "#ff3b5c"
          : "#7fe7ff";
  return (
    <span className="flex items-center gap-1 rounded-sm border border-border bg-secondary/60 px-2 py-1">
      {icon && <span className="text-foreground/70">{icon}</span>}
      <span className="text-foreground/70">{label}</span>
      <span className="font-bold" style={{ color }}>
        {value}
      </span>
    </span>
  );
}
