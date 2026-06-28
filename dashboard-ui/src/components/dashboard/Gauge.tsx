import { useMemo } from "react";
import type { GaugeDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

const START = 135; // deg
const SWEEP = 270; // deg
const CX = 100;
const CY = 100;
const R = 78;

function polar(angleDeg: number, r = R) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function arcPath(fromDeg: number, toDeg: number, r = R) {
  const s = polar(fromDeg, r);
  const e = polar(toDeg, r);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface GaugeProps {
  def: GaugeDef;
  value: number;
}

export function Gauge({ def, value }: GaugeProps) {
  const t = clamp((value - def.min) / (def.max - def.min), 0, 1);
  const angle = START + t * SWEEP;
  const hot = def.warn !== undefined && value >= def.warn;
  const color = hot ? "#ff2d55" : def.color;

  const ticks = useMemo(() => {
    const arr = [];
    const N = 10;
    for (let i = 0; i <= N; i++) {
      const ang = START + (i / N) * SWEEP;
      const outer = polar(ang, R + 2);
      const inner = polar(ang, i % 5 === 0 ? R - 9 : R - 5);
      arr.push({ ...outer, x2: inner.x, y2: inner.y, major: i % 5 === 0 });
    }
    return arr;
  }, []);

  const needle = polar(angle, R - 14);
  const dashTotal = (SWEEP / 360) * 2 * Math.PI * R;

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[210px] w-full min-h-0"
      >
        <defs>
          <filter id={`glow-${def.key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <path
          d={arcPath(START, START + SWEEP)}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={arcPath(START, START + SWEEP)}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          filter={`url(#glow-${def.key})`}
          strokeDasharray={dashTotal}
          strokeDashoffset={dashTotal * (1 - t)}
          style={{ transition: "stroke-dashoffset 90ms linear, stroke 200ms" }}
        />
        {/* ticks */}
        {ticks.map((tk, i) => (
          <line
            key={i}
            x1={tk.x}
            y1={tk.y}
            x2={tk.x2}
            y2={tk.y2}
            stroke={tk.major ? "hsl(var(--muted-foreground))" : "hsl(var(--border))"}
            strokeWidth={tk.major ? 1.6 : 1}
          />
        ))}
        {/* needle */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 90ms linear",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX + R - 14}
            y2={CY}
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            filter={`url(#glow-${def.key})`}
          />
        </g>
        <circle cx={CX} cy={CY} r={6} fill="hsl(var(--card))" stroke={color} strokeWidth={1.6} />
        <circle cx={needle.x} cy={needle.y} r={0} fill="none" />
      </svg>

      <div className="-mt-12 flex flex-col items-center">
        <div
          className="font-data text-[30px] font-bold leading-none"
          style={{ color: hot ? "#ff2d55" : "#06192b", textShadow: "none" }}
        >
          {value.toFixed(def.decimals ?? 0)}
        </div>
        <div className="mt-1 font-display text-[10px] uppercase tracking-hud text-muted-foreground">
          {def.label} <span className="text-foreground/40">· {def.unit}</span>
        </div>
      </div>
    </div>
  );
}
