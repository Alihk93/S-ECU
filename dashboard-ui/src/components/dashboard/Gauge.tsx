import { useMemo } from "react";
import type { GaugeDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Round automotive dial redrawn to match the reference cluster photo (and the
// central tachometer): dished black face, segmented neon outer ring in the
// signal's own colour grading to red past the warn threshold, metallic bezel +
// halo, white numerals and a red diamond needle. 270° sweep from lower-left.
// Values/labels are unchanged — every sensor is shown as a 0..5 V signal.

const START = 135; // deg — lower-left (min)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 100;
const CY = 100;
const R = 78; // tick baseline radius

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

  // Needle geometry — a diamond spar (tip + counterweight) computed directly.
  const tip = polar(angle, R - 4);
  const tail = polar(angle + 180, 16);
  const hw = 3.4;
  const perp = {
    x: Math.cos(((angle + 90) * Math.PI) / 180),
    y: Math.sin(((angle + 90) * Math.PI) / 180),
  };
  const pL = { x: CX + hw * perp.x, y: CY + hw * perp.y };
  const pR = { x: CX - hw * perp.x, y: CY - hw * perp.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y} ${tail.x},${tail.y}`;

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
      const inner = polar(ang, major ? R - 10 : R - 5);
      const tk: (typeof arr)[number] = {
        x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major, red,
      };
      if (major) {
        const lp = polar(ang, R - 22);
        tk.lx = lp.x;
        tk.ly = lp.y;
        tk.label = String(Math.round(f * VMAX)); // 0..5 V axis
      }
      arr.push(tk);
    }
    return arr;
  }, [warnT]);

  // segmented colored outer ring (signal colour, red past the warn threshold)
  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; red: boolean }[] = [];
    const M = 48;
    for (let i = 0; i <= M; i++) {
      const f = i / M;
      const ang = START + f * SWEEP;
      const major = i % 6 === 0;
      const o = polar(ang, 92);
      const inn = polar(ang, major ? 80 : 83.5);
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
          <radialGradient id={`gface-${def.key}`} cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#12191f" />
            <stop offset="64%" stopColor="#070c10" />
            <stop offset="100%" stopColor="#010406" />
          </radialGradient>
          <radialGradient id={`gbezel-${def.key}`} cx="50%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#39434b" />
            <stop offset="45%" stopColor="#192026" />
            <stop offset="100%" stopColor="#05080b" />
          </radialGradient>
          <linearGradient id={`gneedle-${def.key}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6a6a" />
            <stop offset="55%" stopColor="#ff2a2a" />
            <stop offset="100%" stopColor="#b3151b" />
          </linearGradient>
          <filter id={`gglow-${def.key}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`gring-${def.key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* outer halo + metallic bezel + dished black face */}
        <circle cx={CX} cy={CY} r={98} fill="none" stroke={hot ? "#ff2d3a" : def.color} strokeWidth={1.6} opacity={0.4} filter={`url(#gring-${def.key})`} />
        <circle cx={CX} cy={CY} r={96} fill={`url(#gbezel-${def.key})`} stroke="#04070a" strokeWidth={1.6} />
        <circle cx={CX} cy={CY} r={88} fill={`url(#gface-${def.key})`} stroke="#0c1319" strokeWidth={0.8} />

        {/* segmented neon ring — bloom copy then crisp */}
        <g filter={`url(#gring-${def.key})`} opacity={0.7}>
          {segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.red ? "#ff2d3a" : def.color} strokeWidth={2.8} strokeLinecap="round" />
          ))}
        </g>
        {segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.red ? "#ff2d3a" : def.color} strokeWidth={2} strokeLinecap="round" />
        ))}

        {/* ticks + numerals */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line
              x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={tk.red ? "#ff5260" : tk.major ? "#eef6f9" : "#8fa3ad"}
              strokeWidth={tk.major ? 1.8 : 1}
            />
            {tk.label && (
              <text
                x={tk.lx} y={tk.ly}
                fill={tk.red ? "#ff5260" : "#f2f8fb"}
                fontSize="12" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* label near top-center */}
        <text
          x={CX} y={CY - 24}
          fill={hot ? "#ff5260" : def.color} fontSize="13" fontWeight="700"
          textAnchor="middle" letterSpacing="2"
          fontFamily="'Chakra Petch', sans-serif"
          style={{ filter: `url(#gglow-${def.key})` }}
        >
          {def.label} · V
        </text>

        {/* glass reflection */}
        <ellipse cx={CX} cy={CY - 38} rx={58} ry={30} fill="#cfeaff" opacity={0.05} />

        {/* needle + hub */}
        <polygon points={needle} fill={`url(#gneedle-${def.key})`} stroke="#7c0f14" strokeWidth={0.5} filter={`url(#gglow-${def.key})`} />
        <circle cx={CX} cy={CY} r={9} fill="#0b1116" stroke="#3a444c" strokeWidth={1.1} />
        <circle cx={CX} cy={CY} r={6} fill="none" stroke="#ff2a2a" strokeWidth={1.5} opacity={0.9} />
        <circle cx={CX} cy={CY} r={2.4} fill="#ff5a5a" />

        {/* digital readout in the lower gap */}
        <text
          x={CX} y={CY + 60}
          fill={hot ? "#ff5260" : "#eef6f9"} fontSize="24" fontWeight="700"
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace"
          style={{ filter: hot ? `url(#gglow-${def.key})` : undefined }}
        >
          {volts.toFixed(2)}
        </text>
      </svg>
    </div>
  );
}
