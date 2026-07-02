import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Full-circle automotive tachometer redrawn after the reference gauge photo:
// a dished black face, a segmented neon outer ring (blue grading to red across
// the redline), white numerals and a bold red sweep needle with counterweight.
// Scale / values are unchanged (0–8 ×1000, 6500 redline). Realism is pure SVG
// (gradients / filters), no raster — constraint #4.

const START = 135; // deg — lower-left (0)
const SWEEP = 270; // deg — clockwise over the top to lower-right (max)
const CX = 120;
const CY = 120;
const R = 90; // tick baseline radius
const MAX_K = 8; // full-scale ×1000

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

  // Needle geometry — a diamond spar (tip + counterweight) computed directly to
  // avoid the CSS transform-origin ambiguity on <g>.
  const tip = polar(angle, R - 2);
  const tail = polar(angle + 180, 26);
  const hw = 4.6; // half-width at the hub
  const perpL = { x: Math.cos((angle + 90) * Math.PI / 180), y: Math.sin((angle + 90) * Math.PI / 180) };
  const pL = { x: CX + hw * perpL.x, y: CY + hw * perpL.y };
  const pR = { x: CX - hw * perpL.x, y: CY - hw * perpL.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y} ${tail.x},${tail.y}`;

  // segmented neon outer ring — blue below the redline, red at/above it
  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 8 === 0;
      const o = polar(ang, 106);
      const inn = polar(ang, major ? 92 : 96);
      const red = f >= redlineT;
      // subtle cyan→blue graduation across the healthy range
      const color = red ? "#ff2d3a" : f < 0.45 ? "#22c3f2" : "#2d8bff";
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, color });
    }
    return arr;
  }, [redlineT]);

  // ticks + numerals (0..8)
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
      const outer = polar(ang, R);
      const inner = polar(ang, major ? R - 11 : R - 6);
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
        viewBox="0 0 240 240"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[340px] w-full min-h-0"
      >
        <defs>
          <radialGradient id="tach-face" cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#12191f" />
            <stop offset="62%" stopColor="#070c10" />
            <stop offset="100%" stopColor="#010406" />
          </radialGradient>
          <radialGradient id="tach-bezel" cx="50%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#3a444c" />
            <stop offset="45%" stopColor="#1a2127" />
            <stop offset="100%" stopColor="#05080b" />
          </radialGradient>
          <linearGradient id="tach-needle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6a6a" />
            <stop offset="55%" stopColor="#ff2a2a" />
            <stop offset="100%" stopColor="#b3151b" />
          </linearGradient>
          <filter id="tach-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tach-ringglow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* outer neon halo + metallic bezel + dished black face */}
        <circle cx={CX} cy={CY} r={116} fill="none" stroke="#1c6f9e" strokeWidth={2} opacity={0.5} filter="url(#tach-ringglow)" />
        <circle cx={CX} cy={CY} r={113} fill="url(#tach-bezel)" stroke="#04070a" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={104} fill="url(#tach-face)" stroke="#0c1319" strokeWidth={1} />

        {/* soft blurred copy of the segmented ring → neon bloom */}
        <g filter="url(#tach-ringglow)" opacity={0.7}>
          {segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={3.4} strokeLinecap="round" />
          ))}
        </g>
        {/* crisp segmented ring on top */}
        {segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={2.6} strokeLinecap="round" />
        ))}

        {/* ticks + numerals */}
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
                fill={tk.red ? "#ff5260" : "#f2f8fb"}
                fontSize="17" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* "1/min x 1000" caption inside the lower face */}
        <text x={CX} y={CY + 40} fill="#9fb2bb" fontSize="10" textAnchor="middle" letterSpacing="2" fontFamily="'Chakra Petch', sans-serif">
          1/min
        </text>
        <text x={CX} y={CY + 54} fill="#c7d6de" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1.5" fontFamily="'Chakra Petch', sans-serif">
          x 1000
        </text>

        {/* glass reflection */}
        <ellipse cx={CX} cy={CY - 44} rx={72} ry={40} fill="#cfeaff" opacity={0.05} />

        {/* needle — diamond spar with counterweight, glowing */}
        <polygon points={needle} fill="url(#tach-needle)" stroke="#7c0f14" strokeWidth={0.6} filter="url(#tach-glow)" />
        {/* hub */}
        <circle cx={CX} cy={CY} r={13} fill="#0b1116" stroke="#3a444c" strokeWidth={1.4} />
        <circle cx={CX} cy={CY} r={9} fill="none" stroke="#ff2a2a" strokeWidth={2} opacity={0.9} />
        <circle cx={CX} cy={CY} r={3.4} fill="#ff5a5a" />
      </svg>

      <div className="-mt-4 flex items-end gap-6 short:-mt-3 md:-mt-5">
        <div className="flex flex-col items-center">
          <div
            className="font-data font-bold leading-none text-[34px] short:text-[28px] md:text-[44px]"
            style={{
              color: over ? "#ff2d55" : "#e8f2f8",
              textShadow: over ? "0 0 18px #ff2d55" : "0 0 14px rgba(120,200,235,0.45)",
            }}
          >
            {Math.round(rpm).toString().padStart(4, "0")}
          </div>
          <div className="mt-0.5 font-display text-[10px] uppercase tracking-hud text-muted-foreground">
            RBM {over && <span className="text-neon-red">· SHIFT</span>}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-data text-[20px] font-bold leading-none md:text-[24px]" style={{ color: "#4fc9e8", textShadow: "0 0 12px rgba(79,201,232,0.5)" }}>
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
