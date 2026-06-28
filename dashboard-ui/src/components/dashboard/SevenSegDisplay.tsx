// Inline-SVG seven-segment renderer — no fonts, no rasters. Lit segments glow in
// `color`; unlit segments show as faint ghosts for the authentic LED-panel look.

const SEGMAP: Record<string, string[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
  "-": ["g"],
  " ": [],
};

const SEG_RECT: Record<string, [number, number, number, number]> = {
  a: [5, 2, 10, 3],
  b: [15, 4, 3, 11],
  c: [15, 17, 3, 11],
  d: [5, 29, 10, 3],
  e: [2, 17, 3, 11],
  f: [2, 4, 3, 11],
  g: [5, 15.5, 10, 3],
};

const DIGIT_W = 21;
const DOT_W = 7;
const H = 34;

interface SevenSegDisplayProps {
  value: string;
  color?: string;
  className?: string;
}

export function SevenSegDisplay({
  value,
  color = "#ff3b4d",
  className,
}: SevenSegDisplayProps) {
  let x = 1;
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === ".") {
      nodes.push(
        <circle key={i} cx={x + 2} cy={H - 3} r={2} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />,
      );
      x += DOT_W;
      continue;
    }
    const on = SEGMAP[ch] ?? [];
    const ox = x;
    (["a", "b", "c", "d", "e", "f", "g"] as const).forEach((seg) => {
      const [rx, ry, rw, rh] = SEG_RECT[seg];
      const lit = on.includes(seg);
      nodes.push(
        <rect
          key={`${i}-${seg}`}
          x={ox + rx}
          y={ry}
          width={rw}
          height={rh}
          rx={1.2}
          fill={lit ? color : "#1c2b33"}
          opacity={lit ? 1 : 0.22}
          style={lit ? { filter: `drop-shadow(0 0 2px ${color})` } : undefined}
        />,
      );
    });
    x += DIGIT_W;
  }

  return (
    <svg
      viewBox={`0 0 ${x + 1} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
    >
      {nodes}
    </svg>
  );
}
