import { useEffect, useState } from "react";
import { Activity, Cpu, Pause, Play, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/hooks/useEcuLink";

interface TopBarProps {
  running: boolean;
  fps: number;
  linkStatus: LinkStatus;
  onToggleRun: () => void;
}

const LINK_BADGE: Record<
  LinkStatus,
  { label: string; color: string }
> = {
  live: { label: "Live · ESP", color: "#2bff88" },
  connecting: { label: "Link…", color: "#ffb000" },
  offline: { label: "Simulation", color: "#ffb000" },
};

export function TopBar({ running, fps, linkStatus, onToggleRun }: TopBarProps) {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour12: false }) +
          "." +
          String(Date.now() % 1000).padStart(3, "0"),
      );
    const id = setInterval(tick, 73);
    tick();
    return () => clearInterval(id);
  }, []);

  return (
    <header className="panel flex items-center justify-between gap-4 rounded-sm px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-sm border border-neon-cyan/50"
          style={{ boxShadow: "0 0 14px -2px #00e7f2 inset, 0 0 10px -4px #00e7f2" }}
        >
          <Cpu className="h-5 w-5 text-neon-cyan" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-bold tracking-hud text-foreground">
            S<span className="text-neon-cyan text-glow-soft">·</span>ECU
          </div>
          <div className="font-data text-[9px] uppercase tracking-widest text-muted-foreground">
            Smart ECU Tester
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 font-data text-[10px] md:flex">
        <Chip icon={<Wifi className="h-3 w-3" />} label="AP" value="S-ECU" />
        <Chip label="IP" value="10.10.10.10" />
        <Chip label="IDF" value="v5.5.2" />
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
        <button
          onClick={onToggleRun}
          className={cn(
            "flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-display text-[11px] uppercase tracking-hud transition-colors",
            running
              ? "border-neon-green/50 text-neon-green hover:bg-neon-green/10"
              : "border-neon-red/50 text-neon-red hover:bg-neon-red/10",
          )}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Running" : "Halted"}
        </button>
        <span className="hidden font-data text-[11px] tabular-nums text-muted-foreground lg:block">
          {clock}
        </span>
      </div>
    </header>
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
          ? "#ff2d55"
          : "#7fa6b3";
  return (
    <span className="flex items-center gap-1 rounded-sm border border-border bg-secondary/40 px-2 py-1">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground">{label}</span>
      <span style={{ color }}>{value}</span>
    </span>
  );
}
