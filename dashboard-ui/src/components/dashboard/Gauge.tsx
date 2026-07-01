import { useMemo } from "react";
import type { GaugeDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Classic round automotive dial (styled after the VW/Audi cluster photo):
// black dished face, segmented teal outer ring, white numbers and a red sweep
// needle. 270° sweep from lower-left, clockwise. Scale/values are unchanged
// except all scales now start at zero.

const START = 135; // deg — lower-left (min)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 100;
const CY = 100;
const R = 80; // tick baseline radius

function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

interface GaugeProps {
  def: GaugeDef;
  value: number;
}

const VMAX = 5; // every sensor is shown as a 0..5 V signal

export function Gauge({ def, value }: GaugeProps) {
  const t = clamp((value - def.min) / (def.max - def.min), 0, 1);
  const angle = START + t * SWEEP;
  const volts = t * VMAX; // physical reading mapped onto the 0..5 V dial
  const hot = def.warn !== undefined && value >= def.warn;
  const warnT =
    def.warn !== undefined
      ? clamp((def.warn - def.min) / (def.max - def.min), 0, 1)
      : 1;

  // Needle endpoints computed directly (avoids the CSS transform-origin
  // ambiguity on <g> — the same bug fixed in the tach).
  const needleTip = polar(angle, R - 6);
  const needleTail = polar(angle + 180, 16);

  const N = 10; // minor divisions
  const ticks = useMemo(() => {
    const arr: {
      x1: number; y1: number; x2: number; y2: number;
      major: boolean; red: boolean; lx?: number; ly?: number; label?: string;
    }[] = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 2 === 0;
      const red = f >= warnT;
      const outer = polar(ang, R);
      const inner = polar(ang, major ? R - 12 : R - 6);
      const tk: (typeof arr)[number] = {
        x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major, red,
      };
      if (major) {
        const lp = polar(ang, R - 25);
        tk.lx = lp.x;
        tk.ly = lp.y;
        tk.label = String(Math.round(f * VMAX)); // 0..5 V axis
      }
      arr.push(tk);
    }
    return arr;
  }, [warnT]);

  // segmented colored outer ring (red past the warn threshold)
  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; red: boolean }[] = [];
    const M = 44;
    for (let i = 0; i <= M; i++) {
      const f = i / M;
      const ang = START + f * SWEEP;
      const o = polar(ang, 94);
      const inn = polar(ang, 86);
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, red: f >= warnT });
    }
    return arr;
  }, [warnT]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[320px] w-full min-h-0"
      >
        <defs>
          <radialGradient id={`gface-${def.key}`} cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#0c1216" />
            <stop offset="70%" stopColor="#05090c" />
            <stop offset="100%" stopColor="#010406" />
          </radialGradient>
          <filter id={`gglow-${def.key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* bezel + black dished face */}
        <circle cx={CX} cy={CY} r={97} fill="#0a0f12" stroke="#243038" strokeWidth={3} />
        <circle cx={CX} cy={CY} r={92} fill={`url(#gface-${def.key})`} />

        {/* segmented colored outer ring */}
        {segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.red ? "#ff2d3a" : def.color}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={s.red ? 0.95 : 0.8}
          />
        ))}

        {/* ticks + numbers */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line
              x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={tk.red ? "#ff5260" : tk.major ? "#eef6f9" : "#8fa3ad"}
              strokeWidth={tk.major ? 2 : 1}
            />
            {tk.label && (
              <text
                x={tk.lx} y={tk.ly}
                fill={tk.red ? "#ff5260" : "#eef6f9"}
                fontSize="13" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* needle — tail stub through pivot out to the tip */}
        <line
          x1={needleTail.x} y1={needleTail.y} x2={needleTip.x} y2={needleTip.y}
          stroke="#ff2a2a" strokeWidth={3.4} strokeLinecap="round"
          filter={`url(#gglow-${def.key})`}
        />
        <circle cx={CX} cy={CY} r={9} fill="#0c1216" stroke="#ff2a2a" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={3} fill="#ff2a2a" />

        {/* digital readout + label inside the lower dial gap */}
        <text
          x={CX} y={CY + 62}
          fill={hot ? "#ff5260" : "#eef6f9"} fontSize="26" fontWeight="700"
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace"
          style={{ filter: hot ? `url(#gglow-${def.key})` : undefined }}
        >
          {volts.toFixed(2)}
        </text>
        <text
          x={CX} y={CY - 20}
          fill={hot ? "#ff5260" : def.color} fontSize="15" fontWeight="700"
          textAnchor="middle" letterSpacing="2.5"
          fontFamily="'Chakra Petch', sans-serif"
          style={{ filter: `url(#gglow-${def.key})` }}
        >
          {def.label} · V
        </text>
      </svg>
    </div>
  );
}
