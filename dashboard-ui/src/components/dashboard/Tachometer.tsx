import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Half-circle automotive tachometer styled after a classic VW/Audi cluster:
// black dished face, segmented teal outer ring, red inner band + redline,
// white numbers and a red sweep needle. Scale/values are unchanged.

const START = 180; // deg — left (0)
const SWEEP = 180; // deg — clockwise over the top to the right (max)
const CX = 120;
const CY = 126;
const R = 96; // tick baseline radius
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
      const outer = polar(ang, R);
      const inner = polar(ang, major ? R - 13 : R - 7);
      const tk: (typeof arr)[number] = {
        x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major, red,
      };
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

  // segmented teal outer ring (radial bars, red over the redline)
  const segs = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; red: boolean }[] = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const ang = START + f * SWEEP;
      const o = polar(ang, 112);
      const inn = polar(ang, 103);
      arr.push({ x1: o.x, y1: o.y, x2: inn.x, y2: inn.y, red: f >= redlineT });
    }
    return arr;
  }, [redlineT]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 240 150"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[320px] w-full min-h-0"
      >
        <defs>
          <radialGradient id="tach-face" cx="50%" cy="78%" r="78%">
            <stop offset="0%" stopColor="#0c1216" />
            <stop offset="70%" stopColor="#05090c" />
            <stop offset="100%" stopColor="#010406" />
          </radialGradient>
          <filter id="tach-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* bezel + black dished half-disc face */}
        <path d={`M ${CX - 117} ${CY} A 117 117 0 0 1 ${CX + 117} ${CY} Z`} fill="#0a0f12" stroke="#243038" strokeWidth={3} />
        <path d={`M ${CX - 114} ${CY} A 114 114 0 0 1 ${CX + 114} ${CY} Z`} fill="url(#tach-face)" />

        {/* segmented teal outer ring */}
        {segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.red ? "#ff2d3a" : "#2bb6d8"}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={s.red ? 0.95 : 0.85}
          />
        ))}

        {/* red inner band + brighter redline zone */}
        <path d={arcPath(START, START + SWEEP, R + 2)} fill="none" stroke="#5e0e16" strokeWidth={5} opacity={0.9} />
        <path d={arcPath(START + redlineT * SWEEP, START + SWEEP, R + 2)} fill="none" stroke="#ff2d3a" strokeWidth={5} />

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
                fontSize="15" fontWeight="700"
                textAnchor="middle" dominantBaseline="central"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* "1/min x 1000" caption */}
        <text
          x={CX} y={CY - 30}
          fill="#9fb2bb" fontSize="11" textAnchor="middle"
          fontFamily="'Chakra Petch', sans-serif" letterSpacing="1"
        >
          1/min&nbsp;x&nbsp;1000
        </text>

        {/* needle */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 90ms linear",
          }}
        >
          <line
            x1={CX} y1={CY} x2={CX + (R - 8)} y2={CY}
            stroke="#ff2a2a" strokeWidth={3.4} strokeLinecap="round"
            filter="url(#tach-glow)"
          />
          <line x1={CX} y1={CY} x2={CX - 20} y2={CY} stroke="#ff2a2a" strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={11} fill="#0c1216" stroke="#ff2a2a" strokeWidth={2.4} />
        <circle cx={CX} cy={CY} r={3.6} fill="#ff2a2a" />
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
            RPM {over && <span className="text-neon-red">· SHIFT</span>}
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
