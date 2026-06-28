import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

const START = 180; // deg — left
const SWEEP = 180; // deg — semicircle through the top to the right
const CX = 120;
const CY = 122;
const R = 96;
const MAX_K = 8; // full-scale ×1000

function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function arcPath(fromDeg: number, toDeg: number, r: number) {
  const s = polar(fromDeg, r);
  const e = polar(toDeg, r);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface TachometerProps {
  rpm: number;
  load: number; // 0..1
}

export function Tachometer({ rpm, load }: TachometerProps) {
  const maxRpm = MAX_K * 1000;
  const t = clamp(rpm / maxRpm, 0, 1);
  const angle = START + t * SWEEP;
  const over = rpm >= RANGES.rpm.redline;
  const color = over ? "#ff2d55" : "#06435a";
  const redlineT = RANGES.rpm.redline / maxRpm;
  const loadPct = Math.round(clamp(load, 0, 1) * 100);

  const ticks = useMemo(() => {
    const arr: {
      x1: number; y1: number; x2: number; y2: number;
      major: boolean; lx?: number; ly?: number; label?: string; red?: boolean;
    }[] = [];
    const N = MAX_K * 2; // half-unit minor ticks
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 2 === 0;
      const red = f >= redlineT;
      const outer = polar(ang, R + 2);
      const inner = polar(ang, major ? R - 12 : R - 7);
      const tk: (typeof arr)[number] = {
        x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major, red,
      };
      if (major) {
        const lp = polar(ang, R - 24);
        tk.lx = lp.x;
        tk.ly = lp.y;
        tk.label = String(i / 2);
      }
      arr.push(tk);
    }
    return arr;
  }, [redlineT]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 240 150"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[300px] w-full min-h-0"
      >
        <defs>
          <filter id="tach-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <path d={arcPath(START, START + SWEEP, R)} fill="none" stroke="hsl(var(--border))" strokeWidth={11} strokeLinecap="round" />
        {/* redline zone */}
        <path
          d={arcPath(START + redlineT * SWEEP, START + SWEEP, R)}
          fill="none"
          stroke="#ff2d55"
          strokeWidth={11}
          strokeLinecap="butt"
          opacity={0.35}
        />
        {/* value arc */}
        <path
          d={arcPath(START, angle, R)}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          filter="url(#tach-glow)"
          style={{ transition: "stroke 200ms" }}
        />

        {/* ticks + numbers */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line
              x1={tk.x1}
              y1={tk.y1}
              x2={tk.x2}
              y2={tk.y2}
              stroke={tk.red ? "#ff2d55" : tk.major ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
              strokeWidth={tk.major ? 1.8 : 1}
            />
            {tk.label && (
              <text
                x={tk.lx}
                y={tk.ly}
                fill={tk.red ? "#ff2d55" : "#06192b"}
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* needle */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 90ms linear",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX + (R - 16)}
            y2={CY}
            stroke={over ? "#ff2d55" : "#ff2d55"}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#tach-glow)"
          />
          <line x1={CX} y1={CY} x2={CX - 16} y2={CY} stroke="#ff2d55" strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={8} fill="hsl(var(--card))" stroke="#ff2d55" strokeWidth={2} />

        {/* scale label */}
        <text x={CX} y={CY - 26} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="2">
          ×1000
        </text>
      </svg>

      <div className="-mt-7 flex items-end gap-5 short:-mt-5 md:-mt-9">
        <div className="flex flex-col items-center">
          <div
            className="font-data font-bold leading-none text-[34px] short:text-[28px] md:text-[44px]"
            style={{
              color: over ? "#ff2d55" : "#06192b",
              textShadow: over ? "0 0 18px #ff2d55" : "none",
            }}
          >
            {Math.round(rpm).toString().padStart(4, "0")}
          </div>
          <div className="mt-0.5 font-display text-[10px] uppercase tracking-hud text-muted-foreground">
            RBM {over && <span className="text-neon-red">· SHIFT</span>}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-data text-[20px] font-bold leading-none md:text-[24px]" style={{ color: "#06435a" }}>
            {loadPct}
            <span className="text-[12px]">%</span>
          </div>
          <div className="mt-0.5 font-display text-[10px] uppercase tracking-hud text-muted-foreground">
            LOAD
          </div>
        </div>
      </div>
    </div>
  );
}
