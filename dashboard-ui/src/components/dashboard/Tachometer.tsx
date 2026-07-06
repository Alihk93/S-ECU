import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Glossy speedometer-style RPM gauge after the "ECU Test Bench v4.0" mockup:
// brushed-silver bezel, black face, cyan tick ring + numerals, an orange sweep
// needle and "RPM x1000" in the centre. All-SVG (no raster). Scale/values
// unchanged: 0–8 ×1000, 6500 redline; RBM + LOAD readouts kept below.

const START = 135; // deg — lower-left (0)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 120;
const CY = 120;
const R = 92; // tick baseline radius
const MAX_K = 8;

function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

interface TachometerProps {
  rpm: number;
}

export function Tachometer({ rpm }: TachometerProps) {
  const maxRpm = MAX_K * 1000;
  const t = clamp(rpm / maxRpm, 0, 1);
  const angle = START + t * SWEEP;
  const over = rpm >= RANGES.rpm.redline;
  const redlineT = RANGES.rpm.redline / maxRpm;

  const tip = polar(angle, R - 6);
  const tail = polar(angle + 180, 24);
  const hw = 4.6;
  const perp = { x: Math.cos(((angle + 90) * Math.PI) / 180), y: Math.sin(((angle + 90) * Math.PI) / 180) };
  const pL = { x: CX + hw * perp.x, y: CY + hw * perp.y };
  const pR = { x: CX - hw * perp.x, y: CY - hw * perp.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y} ${tail.x},${tail.y}`;

  const ticks = useMemo(() => {
    const arr: {
      x1: number; y1: number; x2: number; y2: number;
      major: boolean; red: boolean; lx?: number; ly?: number; label?: string;
    }[] = [];
    const N = MAX_K * 2;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const major = i % 2 === 0;
      const red = f >= redlineT;
      const outer = polar(ang, R);
      const inner = polar(ang, major ? R - 13 : R - 7);
      const tk: (typeof arr)[number] = { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major, red };
      if (major) {
        const lp = polar(ang, R - 26);
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
      <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" className="h-full max-h-[360px] w-full min-h-0">
        <defs>
          <radialGradient id="spd-face" cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#0d3247" />
            <stop offset="52%" stopColor="#061826" />
            <stop offset="100%" stopColor="#010a12" />
          </radialGradient>
          <linearGradient id="spd-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dfe6ec" />
            <stop offset="18%" stopColor="#9aa6b1" />
            <stop offset="50%" stopColor="#59636d" />
            <stop offset="82%" stopColor="#aab4bd" />
            <stop offset="100%" stopColor="#2f373f" />
          </linearGradient>
          <linearGradient id="spd-bezel2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c343c" />
            <stop offset="50%" stopColor="#0b1016" />
            <stop offset="100%" stopColor="#3a444d" />
          </linearGradient>
          <linearGradient id="spd-needle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd07a" />
            <stop offset="55%" stopColor="#ff9d00" />
            <stop offset="100%" stopColor="#d15e00" />
          </linearGradient>
          <filter id="spd-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="spd-ring" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* brushed-silver bezel rings + dished black face */}
        <circle cx={CX} cy={CY} r={118} fill="url(#spd-bezel)" />
        <circle cx={CX} cy={CY} r={109} fill="url(#spd-bezel2)" />
        <circle cx={CX} cy={CY} r={104} fill="url(#spd-face)" stroke="#0a1a26" strokeWidth={1} />

        {/* cyan minor tick ring (bloom + crisp) */}
        <g filter="url(#spd-ring)" opacity={0.6}>
          {ticks.map((tk, i) => (
            <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke={tk.red ? "#ff7a18" : "#26c9e8"} strokeWidth={tk.major ? 3 : 1.6} strokeLinecap="round" />
          ))}
        </g>
        {ticks.map((tk, i) => (
          <g key={i}>
            <line x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke={tk.red ? "#ff9d3c" : tk.major ? "#7fe9ff" : "#3aa6c4"} strokeWidth={tk.major ? 2 : 1} />
            {tk.label && (
              <text x={tk.lx} y={tk.ly} fill={tk.red ? "#ff9d3c" : "#69e0ff"} fontSize="16" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="'JetBrains Mono', monospace">
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* centre labels */}
        <text x={CX} y={CY + 38} fill={over ? "#ff2d55" : "#39d6f2"} fontSize="20" fontWeight="800" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="1" style={{ filter: "url(#spd-glow)" }}>
          RPM
        </text>
        <text x={CX} y={CY + 54} fill="#7fd9ea" fontSize="11" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="2">
          x1000
        </text>
        <text x={CX} y={CY + 78} fill="#5aa9c2" fontSize="8.5" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="1.5">
          AL-AYED
        </text>

        {/* glass reflection */}
        <ellipse cx={CX} cy={CY - 44} rx={70} ry={38} fill="#bfe9ff" opacity={0.05} />

        {/* orange needle + hub */}
        <polygon points={needle} fill="url(#spd-needle)" stroke="#8a3d00" strokeWidth={0.6} filter="url(#spd-glow)" />
        <circle cx={CX} cy={CY} r={12} fill="url(#spd-bezel2)" stroke="#8a95a0" strokeWidth={1.4} />
        <circle cx={CX} cy={CY} r={5} fill="#ff9d00" />
      </svg>

      <div className="-mt-3 flex flex-col items-center short:-mt-2 md:-mt-4">
        <div
          className="font-data font-bold leading-none text-[30px] short:text-[24px] md:text-[38px]"
          style={{ color: over ? "#ff2d55" : "#e8f2f8", textShadow: over ? "0 0 18px #ff2d55" : "0 0 14px rgba(120,200,235,0.45)" }}
        >
          {Math.round(rpm).toString().padStart(4, "0")}
        </div>
        <div className="mt-0.5 font-display text-[10px] uppercase tracking-hud text-muted-foreground">
          RBM {over && <span className="text-neon-red">· SHIFT</span>}
        </div>
      </div>
    </div>
  );
}
