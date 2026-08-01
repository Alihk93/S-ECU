import { clamp } from "@/lib/sim";
import type { GaugeDef } from "@/lib/ecu";

// Modern digital-cluster gauge: a thick 270° arc track with a glowing colored
// progress sweep, a small tip marker, and a big centered digital readout.
// Scale/values are unchanged (every sensor is shown on a 0..5 V dial).

const START = 135; // deg — lower-left (min)
const SWEEP = 270; // deg — clockwise to lower-right (max)
const CX = 50;
const CY = 50;
const R = 38; // arc radius

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

const VMAX = 5; // every sensor is shown as a 0..5 V signal

interface GaugeProps {
  def: GaugeDef;
  value: number;
}

export function Gauge({ def, value }: GaugeProps) {
  const t = clamp((value - def.min) / (def.max - def.min), 0, 1);
  const volts = t * VMAX;
  const hot = def.warn !== undefined && value >= def.warn;
  const col = hot ? "#fb5566" : def.color;
  const warnT =
    def.warn !== undefined
      ? clamp((def.warn - def.min) / (def.max - def.min), 0, 1)
      : 1;

  const track = arcPath(START, START + SWEEP, R);
  const [tipX, tipY] = pt(START + t * SWEEP, R);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-[260px] w-full min-h-0"
      >
        <defs>
          <filter id={`g-glow-${def.key}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base track */}
        <path
          d={track}
          fill="none"
          stroke="#1e4062"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* redline segment on the track (only if this gauge warns) */}
        {def.warn !== undefined && (
          <path
            d={arcPath(START + warnT * SWEEP, START + SWEEP, R)}
            fill="none"
            stroke="#6d1a25"
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        {/* progress sweep */}
        {t > 0.005 && (
          <path
            d={track}
            fill="none"
            stroke={col}
            strokeWidth={8}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${t * 100} 100`}
            filter={`url(#g-glow-${def.key})`}
            style={{ transition: "stroke-dasharray 120ms linear" }}
          />
        )}
        {/* tip marker */}
        <circle cx={tipX} cy={tipY} r={3.4} fill="#eaf2f8" />
        <circle cx={tipX} cy={tipY} r={2} fill={col} filter={`url(#g-glow-${def.key})`} />

        {/* label */}
        <text
          x={CX}
          y={CY - 12}
          fill={col}
          fontSize="9"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="1.5"
          fontFamily="'Chakra Petch', sans-serif"
        >
          {def.label}
        </text>
        {/* big value */}
        <text
          x={CX}
          y={CY + 8}
          fill={hot ? "#fb5566" : "#f2f7fb"}
          fontSize="24"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace"
          style={{ filter: hot ? `url(#g-glow-${def.key})` : undefined }}
        >
          {volts.toFixed(2)}
        </text>
        {/* unit */}
        <text
          x={CX}
          y={CY + 22}
          fill="#7f9bb5"
          fontSize="7"
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="2"
          fontFamily="'Chakra Petch', sans-serif"
        >
          VOLT
        </text>
      </svg>
    </div>
  );
}
