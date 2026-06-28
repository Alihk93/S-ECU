interface CoilIndicatorProps {
  index: number; // 0-based
  dwell: number; // 0..1
  spark: boolean;
}

// Visualizes a smart pencil-coil channel as the real part: red body with a
// translucent core showing the driver PCB. Charging ramps the inner glow with
// dwell (+ rail); firing flashes the whole coil + plug tip (− rail).
export function CoilIndicator({ index, dwell, spark }: CoilIndicatorProps) {
  const charging = dwell > 0.02 && !spark;
  const glow = spark ? 1 : dwell;
  const halo = spark ? "#ffd23a" : "#ff2d3a";

  return (
    <div className="panel flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 short:gap-0.5 short:px-1 short:py-0.5 md:gap-1 md:px-1.5 md:py-2">
      <span className="font-data text-[9px] text-muted-foreground">C{index + 1}</span>

      <div className="relative flex h-9 w-6 items-center justify-center short:h-9 short:w-6 md:h-16 md:w-8">
        <svg
          viewBox="0 0 48 132"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{
            filter: glow
              ? `drop-shadow(0 0 ${2 + glow * 9}px ${halo})`
              : "none",
            transition: "filter 60ms linear",
          }}
        >
          <defs>
            <linearGradient id={`coil-red-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff5a66" />
              <stop offset="42%" stopColor="#d8242f" />
              <stop offset="100%" stopColor="#8f161e" />
            </linearGradient>
            <linearGradient id={`coil-metal-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f2f5f7" />
              <stop offset="45%" stopColor="#aab4ba" />
              <stop offset="70%" stopColor="#dde3e6" />
              <stop offset="100%" stopColor="#8d979d" />
            </linearGradient>
            <linearGradient id={`coil-body-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#caa9ab" />
              <stop offset="50%" stopColor="#e7d6d6" />
              <stop offset="100%" stopColor="#a98a8c" />
            </linearGradient>
          </defs>

          {/* mounting tab (right) */}
          <path
            d="M34 14 H46 a2 2 0 0 1 2 2 V24 a2 2 0 0 1 -2 2 H34 Z"
            fill={`url(#coil-red-${index})`}
            stroke="#6e1018"
            strokeWidth="0.6"
          />
          <circle cx="42" cy="20" r="2.4" fill="#6e1018" />

          {/* angled plug boot (upper-left) */}
          <g transform="rotate(-32 16 16)">
            <rect
              x="0"
              y="9"
              width="20"
              height="14"
              rx="6"
              fill={`url(#coil-red-${index})`}
              stroke="#6e1018"
              strokeWidth="0.6"
            />
            <rect x="0" y="12" width="6" height="8" rx="2" fill="#7c1119" />
          </g>

          {/* connector head */}
          <rect
            x="13"
            y="8"
            width="24"
            height="22"
            rx="4"
            fill={`url(#coil-red-${index})`}
            stroke="#6e1018"
            strokeWidth="0.8"
          />

          {/* silver crimp ring under the head */}
          <rect x="15" y="30" width="20" height="5" rx="1.5" fill={`url(#coil-metal-${index})`} />

          {/* red upper sleeve */}
          <rect
            x="17"
            y="34"
            width="16"
            height="10"
            rx="2"
            fill={`url(#coil-red-${index})`}
            stroke="#6e1018"
            strokeWidth="0.6"
          />

          {/* translucent body */}
          <rect
            x="17.5"
            y="42"
            width="15"
            height="52"
            rx="4"
            fill={`url(#coil-body-${index})`}
            stroke="#9c7d7f"
            strokeWidth="0.6"
          />

          {/* faint winding pattern inside the body */}
          <g stroke="#b89395" strokeWidth="0.5" opacity="0.6">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={i} x1="18.5" x2="31.5" y1={47 + i * 5} y2={47 + i * 5} />
            ))}
          </g>

          {/* glowing driver PCB core (brightens with dwell, flashes on spark) */}
          <g opacity={0.35 + glow * 0.65} style={{ transition: "opacity 60ms linear" }}>
            <rect x="21" y="46" width="8" height="44" rx="1" fill="#7a1018" />
            {[
              [22.5, 49, 5, 4],
              [23, 56, 4, 3],
              [22, 62, 6, 5],
              [23, 70, 4, 4],
              [22.5, 77, 5, 3],
              [22, 83, 6, 4],
            ].map(([x, y, w, h], i) => (
              <rect
                key={i}
                x={x}
                y={y}
                width={w}
                height={h}
                rx="0.6"
                fill={spark ? "#ffe27a" : "#ff4d5a"}
              />
            ))}
          </g>

          {/* clear lower neck */}
          <rect x="20" y="94" width="10" height="12" rx="2" fill={`url(#coil-metal-${index})`} opacity="0.55" />

          {/* metallic spring / spark-plug terminal */}
          <rect x="21" y="105" width="8" height="16" rx="1.5" fill={`url(#coil-metal-${index})`} />
          <g stroke="#7e878d" strokeWidth="0.6" opacity="0.8">
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1="21" x2="29" y1={108 + i * 2.6} y2={108 + i * 2.6} />
            ))}
          </g>
          {/* bottom contact nub — fires on spark */}
          <rect
            x="23"
            y="121"
            width="4"
            height="6"
            rx="1"
            fill={spark ? "#fff27a" : `url(#coil-metal-${index})`}
            style={{
              filter: spark ? "drop-shadow(0 0 5px #ffd23a)" : "none",
              transition: "filter 40ms linear",
            }}
          />
        </svg>
      </div>

      <div className="hidden w-full items-center justify-between px-0.5 short:hidden md:flex">
        <span
          className="font-data text-[8px]"
          style={{ color: charging ? "#ff3b5c" : "#46586390" }}
        >
          +
        </span>
        <span
          className="font-data text-[8px]"
          style={{ color: spark ? "#ffb000" : "#46586390" }}
        >
          −
        </span>
      </div>
    </div>
  );
}
