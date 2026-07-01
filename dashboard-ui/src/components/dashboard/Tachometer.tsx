import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Classic analog cluster tachometer (styled after the reference photo): round
// black dished face, blue segmented outer ring with a red redline zone, white
// numbers, a red sweep needle, warning tell-tale lamps clustered in the centre
// and the "1/min x 1000" caption. Scale/values unchanged (0–8 ×1000, 6500
// redline). The centre tell-tales are decorative cluster lamps.

const CX = 100;
const CY = 100;
const START = 135; // 0 at lower-left
const SWEEP = 270; // clockwise, 8 at lower-right
const R = 78; // tick baseline radius
const MAX_K = 8;

function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
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
  const redlineT = RANGES.rpm.redline / maxRpm;
  const loadPct = Math.round(clamp(load, 0, 1) * 100);

  const tip = polar(angle, R - 4);
  const tail = polar(angle + 180, 16);

  const ticks = useMemo(() => {
    const arr: {
      x1: number; y1: number; x2: number; y2: number;
      major: boolean; red: boolean; lx?: number; ly?: number; label?: string;
    }[] = [];
    const N = MAX_K * 2; // half-unit minor ticks
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 2 === 0;
      const red = f >= redlineT;
      const o = polar(ang, R);
      const inn = polar(ang, major ? 66 : 72);
      const tk: (typeof arr)[number] = { x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, major, red };
      if (major) {
        const lp = polar(ang, 58);
        tk.lx = lp.x;
        tk.ly = lp.y;
        tk.label = String(i / 2);
      }
      arr.push(tk);
    }
    return arr;
  }, [redlineT]);

  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; red: boolean }[] = [];
    const M = 48;
    for (let i = 0; i <= M; i++) {
      const f = i / M;
      const ang = START + f * SWEEP;
      const o = polar(ang, 89);
      const inn = polar(ang, 82);
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, red: f >= redlineT });
    }
    return arr;
  }, [redlineT]);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[440px] w-full min-h-0"
      >
        <defs>
          <radialGradient id="tach-face" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#0d141a" />
            <stop offset="68%" stopColor="#05090c" />
            <stop offset="100%" stopColor="#01050a" />
          </radialGradient>
          <filter id="tach-needle" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tt-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>

        {/* bezel + metallic ring + black dished face */}
        <circle cx={CX} cy={CY} r={97} fill="#0a0f12" stroke="#26333d" strokeWidth={3} />
        <circle cx={CX} cy={CY} r={93} fill="none" stroke="#12202b" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={91} fill="url(#tach-face)" />

        {/* segmented outer ring (blue, red over the redline) */}
        {segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.red ? "#ff2d3a" : "#2f7be6"}
            strokeWidth={2.6}
            strokeLinecap="round"
            opacity={s.red ? 0.98 : 0.85}
          />
        ))}

        {/* ticks + numbers */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line
              x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={tk.red ? "#ff5260" : tk.major ? "#eef6f9" : "#7f939d"}
              strokeWidth={tk.major ? 2 : 1}
            />
            {tk.label && (
              <text
                x={tk.lx} y={tk.ly}
                fill={tk.red ? "#ff5260" : "#eef6f9"}
                fontSize="11" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* ---- centre warning tell-tale lamps (decorative cluster) ---- */}
        <g filter="url(#tt-glow)">
          {/* high beam (blue) */}
          <g transform="translate(70,78)">
            <path d="M2 -5 A5 5 0 0 0 2 5 Z" fill="#3b9dff" />
            <g stroke="#3b9dff" strokeWidth="1.3" strokeLinecap="round">
              <line x1="-1" y1="-4" x2="-6" y2="-4" />
              <line x1="-1" y1="0" x2="-6" y2="0" />
              <line x1="-1" y1="4" x2="-6" y2="4" />
            </g>
          </g>

          {/* coolant temperature (red) */}
          <g transform="translate(100,60)">
            <g stroke="#ff3b3b" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <line x1="0" y1="-6" x2="0" y2="2" />
              <line x1="-2.6" y1="-4" x2="0" y2="-4" />
              <line x1="-2.6" y1="-1.5" x2="0" y2="-1.5" />
              <line x1="-2.6" y1="1" x2="0" y2="1" />
            </g>
            <circle cx="0" cy="4" r="2.2" fill="#ff3b3b" />
            <path d="M-6 8 q1.5 -1.7 3 0 t3 0" stroke="#ff3b3b" strokeWidth="1.2" fill="none" />
          </g>

          {/* battery / charge (red) */}
          <g transform="translate(130,78)">
            <rect x="-6" y="-3" width="12" height="7" rx="1" fill="none" stroke="#ff3b3b" strokeWidth="1.3" />
            <rect x="-4.5" y="-5" width="2.4" height="2" fill="#ff3b3b" />
            <rect x="2.1" y="-5" width="2.4" height="2" fill="#ff3b3b" />
            <line x1="-4" y1="0.5" x2="-1.6" y2="0.5" stroke="#ff3b3b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1.6" y1="0.5" x2="4" y2="0.5" stroke="#ff3b3b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="2.8" y1="-0.7" x2="2.8" y2="1.7" stroke="#ff3b3b" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* oil pressure (red) */}
          <g transform="translate(80,118)">
            <path
              d="M-7 1 q0 -3 3 -3 h3.5 q1 0 1.6 0.8 l3.4 -1.8 l0.7 1.5 l-3.4 1.7 v0.6 q0 2 -2.2 2 h-3.6 q-3 0 -3 -2.5 z"
              fill="#ff3b3b"
            />
            <circle cx="7.4" cy="3.6" r="1" fill="#ff3b3b" />
          </g>

          {/* brake / warning (red) */}
          <g transform="translate(120,118)">
            <circle cx="0" cy="0" r="5" fill="none" stroke="#ff3b3b" strokeWidth="1.2" />
            <path d="M-8 -3 q-1.6 3 0 6" fill="none" stroke="#ff3b3b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M8 -3 q1.6 3 0 6" fill="none" stroke="#ff3b3b" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="-0.7" y="-3" width="1.4" height="3.6" rx="0.6" fill="#ff3b3b" />
            <circle cx="0" cy="2.4" r="0.9" fill="#ff3b3b" />
          </g>
        </g>

        {/* needle */}
        <line
          x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y}
          stroke="#ff2a2a" strokeWidth={3.2} strokeLinecap="round"
          filter="url(#tach-needle)"
        />
        <circle cx={CX} cy={CY} r={10} fill="#0c1216" stroke="#ff2a2a" strokeWidth={2.2} />
        <circle cx={CX} cy={CY} r={3.4} fill="#ff2a2a" />

        {/* caption + compact digital readout */}
        <text
          x={CX} y={150}
          fill="#9fb2bb" fontSize="8" textAnchor="middle"
          fontFamily="'Chakra Petch', sans-serif" letterSpacing="1"
        >
          1/min x 1000
        </text>
        <text
          x={CX} y={166}
          fill={over ? "#ff5260" : "#eef6f9"} fontSize="12" fontWeight="700"
          textAnchor="middle" fontFamily="'JetBrains Mono', monospace"
        >
          {Math.round(rpm)}
          <tspan fill="#7f9bb5" fontSize="8" fontWeight="600"> rpm</tspan>
          <tspan fill="#22d3ee" fontSize="10"> · {loadPct}%</tspan>
          {over && <tspan fill="#ff5260" fontSize="8" fontWeight="700"> · SHIFT</tspan>}
        </text>
      </svg>
    </div>
  );
}
