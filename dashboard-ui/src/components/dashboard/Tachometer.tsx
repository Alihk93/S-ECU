import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// v5 RPM gauge after the brushed-steel mockup: polished chrome ring bezel,
// deep navy dished face, fine white tick work, orange sweep needle, "RPM
// x1000" centre. Drawn dense (many segments/highlights) so it stays crisp and
// detailed at 4K. Scale/values unchanged: 0–8 ×1000, 6500 redline; small
// digital rpm + LOAD kept inside the lower face.

const START = 135; // deg — lower-left (0)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 130;
const CY = 130;
const R = 96; // tick baseline radius
const MAX_K = 8;

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
  const redlineT = RANGES.rpm.redline / maxRpm;
  const loadPct = Math.round(clamp(load, 0, 1) * 100);

  const tip = polar(angle, R - 4);
  const tail = polar(angle + 180, 26);
  const hw = 5;
  const perp = { x: Math.cos(((angle + 90) * Math.PI) / 180), y: Math.sin(((angle + 90) * Math.PI) / 180) };
  const pL = { x: CX + hw * perp.x, y: CY + hw * perp.y };
  const pR = { x: CX - hw * perp.x, y: CY - hw * perp.y };
  const needle = `${pL.x},${pL.y} ${tip.x},${tip.y} ${pR.x},${pR.y} ${tail.x},${tail.y}`;

  // dense fine ticks: minor every 100 rpm, majors every 1000 — 4K detail
  const ticks = useMemo(() => {
    const arr: {
      x1: number; y1: number; x2: number; y2: number;
      kind: "major" | "half" | "minor"; red: boolean;
      lx?: number; ly?: number; label?: string;
    }[] = [];
    const N = MAX_K * 10;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const kind = i % 10 === 0 ? "major" : i % 5 === 0 ? "half" : "minor";
      const red = f >= redlineT;
      const outer = polar(ang, R);
      const inner = polar(ang, kind === "major" ? R - 14 : kind === "half" ? R - 9 : R - 5);
      const tk: (typeof arr)[number] = { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, kind, red };
      if (kind === "major") {
        const lp = polar(ang, R - 27);
        tk.lx = lp.x;
        tk.ly = lp.y;
        tk.label = String(i / 10);
      }
      arr.push(tk);
    }
    return arr;
  }, [redlineT]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet" className="h-full max-h-[420px] w-full min-h-0">
        <defs>
          {/* polished chrome ring */}
          <linearGradient id="spd-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f8fa" />
            <stop offset="22%" stopColor="#c3cad0" />
            <stop offset="46%" stopColor="#6f7880" />
            <stop offset="50%" stopColor="#666e75" />
            <stop offset="72%" stopColor="#b7bfc5" />
            <stop offset="100%" stopColor="#3f474e" />
          </linearGradient>
          <linearGradient id="spd-chrome-in" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e9edef" />
            <stop offset="45%" stopColor="#8b939a" />
            <stop offset="100%" stopColor="#20262b" />
          </linearGradient>
          {/* deep navy dished face */}
          <radialGradient id="spd-face" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#274a70" />
            <stop offset="45%" stopColor="#132c4a" />
            <stop offset="80%" stopColor="#081527" />
            <stop offset="100%" stopColor="#040b16" />
          </radialGradient>
          <linearGradient id="spd-needle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffcf7d" />
            <stop offset="50%" stopColor="#ff9b1d" />
            <stop offset="100%" stopColor="#d95f00" />
          </linearGradient>
          <filter id="spd-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* chrome bezel: outer ring, mid groove, inner ring */}
        <circle cx={CX} cy={CY} r={126} fill="url(#spd-chrome)" stroke="#2b3238" strokeWidth={1.5} />
        <circle cx={CX} cy={CY} r={117} fill="url(#spd-chrome-in)" />
        <circle cx={CX} cy={CY} r={110} fill="#0c1420" />
        {/* dished navy face */}
        <circle cx={CX} cy={CY} r={107} fill="url(#spd-face)" />
        {/* bezel specular highlights */}
        <path d={arcPath(200, 250, 121.5)} stroke="rgba(255,255,255,0.85)" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d={arcPath(20, 60, 121.5)} stroke="rgba(255,255,255,0.5)" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.6} />

        {/* redline arc */}
        <path d={arcPath(START + redlineT * SWEEP, START + SWEEP, R + 1)} fill="none" stroke="#e33b2e" strokeWidth={5} opacity={0.95} />

        {/* fine tick work */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line
              x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={tk.red ? "#ff6a55" : tk.kind === "major" ? "#f2f7fa" : tk.kind === "half" ? "#b9c6d0" : "#7d8c99"}
              strokeWidth={tk.kind === "major" ? 2.4 : tk.kind === "half" ? 1.4 : 0.7}
            />
            {tk.label && (
              <text
                x={tk.lx} y={tk.ly}
                fill={tk.red ? "#ff6a55" : "#eef4f8"}
                fontSize="17" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'Chakra Petch', sans-serif"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* centre legend */}
        <text x={CX} y={CY + 40} fill="#e8f0f6" fontSize="19" fontWeight="800" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="1.5">
          RPM
        </text>
        <text x={CX} y={CY + 55} fill="#9fb4c6" fontSize="10.5" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="2">
          x1000
        </text>
        {/* live digital rpm + load kept inside the lower face (values preserved) */}
        <text x={CX} y={CY + 76} fill={over ? "#ff5540" : "#cfe0ec"} fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
          {Math.round(rpm).toString().padStart(4, "0")}
        </text>
        <text x={CX} y={CY + 89} fill="#8fa4b5" fontSize="8.5" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" letterSpacing="1">
          RBM · LOAD {loadPct}%
        </text>
        <text x={CX} y={CY - 34} fill="#7d94a8" fontSize="8.5" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" letterSpacing="2.5">
          AL-AYED
        </text>

        {/* glass reflections */}
        <ellipse cx={CX - 14} cy={CY - 52} rx={64} ry={30} fill="#dceeff" opacity={0.055} />
        <ellipse cx={CX + 34} cy={CY + 58} rx={40} ry={18} fill="#dceeff" opacity={0.03} />

        {/* orange needle + chrome hub */}
        <polygon points={needle} fill="url(#spd-needle)" stroke="#9c4a00" strokeWidth={0.6} filter="url(#spd-glow)" />
        <circle cx={CX} cy={CY} r={14} fill="url(#spd-chrome-in)" stroke="#3f474e" strokeWidth={1.4} />
        <circle cx={CX} cy={CY} r={7.5} fill="#11161b" />
        <circle cx={CX} cy={CY} r={3.4} fill="#ff9b1d" />
      </svg>
    </div>
  );
}
