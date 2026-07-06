import { useMemo } from "react";
import type { GaugeDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Compact half-circle sensor gauge after the "ECU Test Bench v4.0" mockup:
// a segmented colored arc in the signal's colour (red past the warn threshold),
// a red needle, the label on top and a digital readout below. All-SVG.
// Values/labels unchanged — every sensor is shown as a 0..5 V signal.

const START = 180; // deg — left (min)
const SWEEP = 180; // deg — over the top to the right (max)
const CX = 100;
const CY = 98;
const R = 74; // arc baseline radius

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
  const volts = t * VMAX;
  const hot = def.warn !== undefined && value >= def.warn;
  const warnT =
    def.warn !== undefined
      ? clamp((def.warn - def.min) / (def.max - def.min), 0, 1)
      : 1;

  const tip = polar(angle, R - 12);
  const hw = 3.2;
  const perp = { x: Math.cos(((angle + 90) * Math.PI) / 180), y: Math.sin(((angle + 90) * Math.PI) / 180) };
  const pL = { x: CX + hw * perp.x, y: CY + hw * perp.y };
  const pR = { x: CX - hw * perp.x, y: CY - hw * perp.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y}`;

  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; red: boolean }[] = [];
    const M = 32;
    for (let i = 0; i <= M; i++) {
      const f = i / M;
      const ang = START + f * SWEEP;
      const major = i % 4 === 0;
      const o = polar(ang, R);
      const inn = polar(ang, major ? R - 12 : R - 7);
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, red: f >= warnT });
    }
    return arr;
  }, [warnT]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg viewBox="0 0 200 128" preserveAspectRatio="xMidYMid meet" className="h-full max-h-[150px] w-full min-h-0">
        <defs>
          <filter id={`sg-glow-${def.key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* label on top */}
        <text x={CX} y={12} fill={hot ? "#ff5260" : def.color} fontSize="15" fontWeight="700" textAnchor="middle" letterSpacing="1.5" fontFamily="'Chakra Petch', sans-serif" style={{ filter: `url(#sg-glow-${def.key})` }}>
          {def.label}
        </text>

        {/* segmented colored arc — bloom + crisp */}
        <g filter={`url(#sg-glow-${def.key})`} opacity={0.65}>
          {segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.red ? "#ff2d3a" : def.color} strokeWidth={3.2} strokeLinecap="round" />
          ))}
        </g>
        {segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.red ? "#ff2d3a" : def.color} strokeWidth={2} strokeLinecap="round" />
        ))}

        {/* needle + hub */}
        <polygon points={needle} fill="#ff3b3b" stroke="#7c0f14" strokeWidth={0.5} style={{ filter: "drop-shadow(0 0 3px rgba(255,45,58,0.7))" }} />
        <circle cx={CX} cy={CY} r={7} fill="#0b1116" stroke="#8a95a0" strokeWidth={1.1} />
        <circle cx={CX} cy={CY} r={2.4} fill="#ff3b3b" />

        {/* digital readout below */}
        <text x={CX} y={122} fill={hot ? "#ff5260" : "#eaf4f9"} fontSize="20" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="'JetBrains Mono', monospace">
          {volts.toFixed(2)}
          <tspan fontSize="10" fill="#7fa6b8"> V</tspan>
        </text>
      </svg>
    </div>
  );
}
