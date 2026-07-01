import { useMemo } from "react";
import { RANGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

// Modern digital-cluster tachometer: a bold 270° arc with a glowing rpm sweep
// (red past the redline), an inner LOAD arc, numeric ×1000 labels and a huge
// centered rpm readout. Scale/values unchanged (0–8 ×1000, 6500 redline).

const START = 135;
const SWEEP = 270;
const CX = 50;
const CY = 47;
const R = 41; // rpm arc radius
const RL = 30; // load arc radius
const MAX_K = 8;

function pt(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(fromDeg: number, toDeg: number, r: number) {
  const [x1, y1] = pt(fromDeg, r);
  const [x2, y2] = pt(toDeg, r);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

interface TachometerProps {
  rpm: number;
  load: number; // 0..1
}

export function Tachometer({ rpm, load }: TachometerProps) {
  const maxRpm = MAX_K * 1000;
  const t = clamp(rpm / maxRpm, 0, 1);
  const lt = clamp(load, 0, 1);
  const over = rpm >= RANGES.rpm.redline;
  const redlineT = RANGES.rpm.redline / maxRpm;
  const loadPct = Math.round(lt * 100);
  const rpmColor = over ? "#fb5566" : "#22d3ee";

  const track = arcPath(START, START + SWEEP, R);

  const labels = useMemo(() => {
    const arr: { x: number; y: number; n: number; red: boolean }[] = [];
    for (let i = 0; i <= MAX_K; i++) {
      const f = i / MAX_K;
      const [x, y] = pt(START + f * SWEEP, R - 9);
      arr.push({ x, y, n: i, red: f >= redlineT });
    }
    return arr;
  }, [redlineT]);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 100 96"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[420px] w-full min-h-0"
      >
        <defs>
          <filter id="tach-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* rpm track + redline zone */}
        <path d={track} fill="none" stroke="#132a41" strokeWidth={6.5} strokeLinecap="round" />
        <path
          d={arcPath(START + redlineT * SWEEP, START + SWEEP, R)}
          fill="none"
          stroke="#5b1620"
          strokeWidth={6.5}
          strokeLinecap="round"
        />
        {/* rpm progress sweep */}
        {t > 0.005 && (
          <path
            d={track}
            fill="none"
            stroke={rpmColor}
            strokeWidth={6.5}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${t * 100} 100`}
            filter="url(#tach-glow)"
            style={{ transition: "stroke-dasharray 90ms linear" }}
          />
        )}

        {/* inner LOAD arc */}
        <path d={arcPath(START, START + SWEEP, RL)} fill="none" stroke="#102438" strokeWidth={2.6} />
        {lt > 0.005 && (
          <path
            d={arcPath(START, START + SWEEP, RL)}
            fill="none"
            stroke="#2bd4c0"
            strokeWidth={2.6}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${lt * 100} 100`}
            style={{ transition: "stroke-dasharray 90ms linear" }}
          />
        )}

        {/* ×1000 numeric labels */}
        {labels.map((l) => (
          <text
            key={l.n}
            x={l.x}
            y={l.y}
            fill={l.red ? "#fb5566" : "#9fb6c9"}
            fontSize="5"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'JetBrains Mono', monospace"
          >
            {l.n}
          </text>
        ))}

        {/* big rpm readout */}
        <text
          x={CX}
          y={CY - 2}
          fill={over ? "#fb5566" : "#f2f7fb"}
          fontSize="19"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace"
        >
          {Math.round(rpm)}
        </text>
        <text
          x={CX}
          y={CY + 11}
          fill="#7f9bb5"
          fontSize="5"
          fontWeight="600"
          letterSpacing="3"
          textAnchor="middle"
          fontFamily="'Chakra Petch', sans-serif"
        >
          RPM · ×1000
        </text>

        {/* load readout in the bottom gap */}
        <text
          x={CX}
          y={CY + 33}
          fill="#22d3ee"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace"
        >
          {loadPct}%
        </text>
        <text
          x={CX}
          y={CY + 42}
          fill="#7f9bb5"
          fontSize="4.5"
          fontWeight="600"
          letterSpacing="3"
          textAnchor="middle"
          fontFamily="'Chakra Petch', sans-serif"
        >
          {over ? "LOAD · SHIFT" : "LOAD"}
        </text>
      </svg>
    </div>
  );
}
