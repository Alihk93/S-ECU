import { useMemo } from "react";
import type { GaugeDef } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// v5 mini round gauge after the brushed-steel mockup: each sensor sits on its
// own small black tile — a full-circle dial with a thin chrome bezel, dark
// face, fine white ticks, an orange needle — with the white digital value and
// the label beneath. Values unchanged: every sensor shown as its 0..5 V signal.

const START = 135; // deg — lower-left (min)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 60;
const CY = 60;
const R = 44; // tick baseline radius

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

  const tip = polar(angle, R - 6);
  const tail = polar(angle + 180, 10);
  const hw = 2.4;
  const perp = { x: Math.cos(((angle + 90) * Math.PI) / 180), y: Math.sin(((angle + 90) * Math.PI) / 180) };
  const pL = { x: CX + hw * perp.x, y: CY + hw * perp.y };
  const pR = { x: CX - hw * perp.x, y: CY - hw * perp.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y} ${tail.x},${tail.y}`;

  const ticks = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; major: boolean; red: boolean }[] = [];
    const N = 20;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 4 === 0;
      const o = polar(ang, R);
      const inn = polar(ang, major ? R - 8 : R - 4.5);
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, major, red: f >= warnT });
    }
    return arr;
  }, [warnT]);

  return (
    <div className="inset-screen flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-md px-1 py-1">
      <svg viewBox="0 0 120 152" preserveAspectRatio="xMidYMid meet" className="h-full w-full min-h-0">
        <defs>
          <linearGradient id={`mg-chrome-${def.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2f4" />
            <stop offset="45%" stopColor="#848d94" />
            <stop offset="100%" stopColor="#343b41" />
          </linearGradient>
          <radialGradient id={`mg-face-${def.key}`} cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#1b2a38" />
            <stop offset="60%" stopColor="#0b141d" />
            <stop offset="100%" stopColor="#04080c" />
          </radialGradient>
          <linearGradient id={`mg-needle-${def.key}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffcf7d" />
            <stop offset="55%" stopColor="#ff9b1d" />
            <stop offset="100%" stopColor="#d95f00" />
          </linearGradient>
        </defs>

        {/* thin chrome bezel + dark face */}
        <circle cx={CX} cy={CY} r={56} fill={`url(#mg-chrome-${def.key})`} stroke="#22282d" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={51.5} fill="#0a0f14" />
        <circle cx={CX} cy={CY} r={50} fill={`url(#mg-face-${def.key})`} />

        {/* ticks (red past warn) */}
        {ticks.map((tk, i) => (
          <line
            key={i}
            x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
            stroke={tk.red ? "#ff5a45" : tk.major ? "#e8eef2" : "#77848e"}
            strokeWidth={tk.major ? 1.7 : 0.8}
          />
        ))}

        {/* glass highlight */}
        <ellipse cx={CX - 7} cy={CY - 20} rx={28} ry={14} fill="#dceeff" opacity={0.06} />

        {/* orange needle + hub */}
        <polygon points={needle} fill={`url(#mg-needle-${def.key})`} stroke="#9c4a00" strokeWidth={0.4} style={{ filter: "drop-shadow(0 0 2.5px rgba(255,155,29,0.65))" }} />
        <circle cx={CX} cy={CY} r={5.5} fill="#11161b" stroke="#8a939a" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={2} fill="#ff9b1d" />

        {/* digital value + label beneath the dial */}
        <text x={CX} y={127} fill={hot ? "#ff5a45" : "#f2f7fa"} fontSize="21" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
          {volts.toFixed(2)}
        </text>
        <text x={CX} y={145} fill={hot ? "#ff5a45" : "#b8c3cc"} fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="2" fontFamily="'Chakra Petch', sans-serif">
          {def.label}
        </text>
      </svg>
    </div>
  );
}
