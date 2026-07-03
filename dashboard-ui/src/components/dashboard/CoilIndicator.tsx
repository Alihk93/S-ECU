interface CoilIndicatorProps {
  index: number; // 0-based
  dwell: number; // 0..1
  spark: boolean;
}

// Smart pencil ignition coil redrawn after the reference photo: glossy red body
// with an angled connector boot, a slotted mounting ear, a clear window showing
// the wavy potting + red driver PCB, and a stepped chrome spark-plug boot.
// Charging ramps the PCB glow with dwell; firing flashes the coil + plug tip.
export function CoilIndicator({ index, dwell, spark }: CoilIndicatorProps) {
  const charging = dwell > 0.02 && !spark;
  const glow = spark ? 1 : dwell;
  const halo = spark ? "#ffd23a" : "#ff2d3a";
  const pcb = spark ? "#ffe27a" : "#ff4d5a";

  return (
    <div className="panel flex h-full min-h-0 flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 short:gap-0.5 short:px-1 short:py-0.5 md:gap-1 md:px-1.5 md:py-1.5">
      <span className="font-data text-[9px] font-bold text-neon-amber">C{index + 1}</span>

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <svg
          viewBox="0 0 48 132"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{
            filter: glow ? `drop-shadow(0 0 ${2 + glow * 9}px ${halo})` : "none",
            transition: "filter 60ms linear",
          }}
        >
          <defs>
            <linearGradient id={`coil-red-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff7b83" />
              <stop offset="26%" stopColor="#e12630" />
              <stop offset="62%" stopColor="#b6141d" />
              <stop offset="100%" stopColor="#7c0d14" />
            </linearGradient>
            <linearGradient id={`coil-metal-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f4f7f9" />
              <stop offset="42%" stopColor="#aeb8be" />
              <stop offset="68%" stopColor="#e2e8eb" />
              <stop offset="100%" stopColor="#828c92" />
            </linearGradient>
            <linearGradient id={`coil-clear-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d7e2e6" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#f2f6f8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#aeb9bf" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* slotted mounting ear (right) */}
          <path
            d="M32 12 H47 V16.5 H40.5 V20.5 H47 V25 H32 Z"
            fill={`url(#coil-red-${index})`}
            stroke="#6e1018"
            strokeWidth="0.6"
          />

          {/* angled connector boot (upper-left) */}
          <g transform="rotate(-40 17 15)">
            <rect x="1" y="8" width="21" height="14" rx="6" fill={`url(#coil-red-${index})`} stroke="#6e1018" strokeWidth="0.6" />
            <rect x="1.5" y="11" width="6.5" height="8" rx="2.5" fill="#120608" />
            <rect x="9" y="9.4" width="10" height="2" rx="1" fill="#ff9a9f" opacity="0.6" />
          </g>

          {/* red head / cap */}
          <rect x="13" y="8" width="22" height="23" rx="5" fill={`url(#coil-red-${index})`} stroke="#6e1018" strokeWidth="0.8" />
          <rect x="16" y="10.5" width="4" height="18" rx="2" fill="#ff9a9f" opacity="0.5" />

          {/* silver crimp ring */}
          <rect x="14" y="30" width="20" height="5" rx="1.6" fill={`url(#coil-metal-${index})`} />
          <rect x="14" y="33.4" width="20" height="1" fill="#5c6469" opacity="0.6" />

          {/* upper red neck + groove rings */}
          <rect x="16.5" y="34.5" width="15" height="11" rx="3" fill={`url(#coil-red-${index})`} stroke="#6e1018" strokeWidth="0.5" />
          <rect x="16.5" y="38" width="15" height="1.4" fill="#7c0d14" opacity="0.7" />
          <rect x="16.5" y="41" width="15" height="1.4" fill="#7c0d14" opacity="0.7" />

          {/* red body with a clear window */}
          <rect x="15.5" y="44" width="17" height="52" rx="5" fill={`url(#coil-red-${index})`} stroke="#6e1018" strokeWidth="0.6" />
          {/* clear window */}
          <rect x="18.5" y="47.5" width="11" height="45" rx="4" fill={`url(#coil-clear-${index})`} stroke="#8fa0a6" strokeWidth="0.4" />
          {/* wavy potting inside the window */}
          <g stroke="#c9d4d9" strokeWidth="0.5" opacity="0.55" fill="none">
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M19 ${50 + i * 4.6} q3.2 -2.4 6.4 0 q3.2 2.4 4 0`} />
            ))}
          </g>

          {/* glowing red driver PCB (brightens with dwell, flashes on spark) */}
          <g opacity={0.4 + glow * 0.6} style={{ transition: "opacity 60ms linear" }}>
            <rect x="20.5" y="50" width="7" height="40" rx="1" fill="#6e0f16" />
            {[
              [21.4, 52, 5, 4],
              [22, 59, 4, 3],
              [21, 65, 6, 4],
              [22, 72, 4, 4],
              [21.4, 79, 5, 3],
              [21.6, 84, 5, 4],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="0.6" fill={pcb} />
            ))}
          </g>

          {/* lower red collar */}
          <rect x="16.5" y="95" width="15" height="7" rx="2.4" fill={`url(#coil-red-${index})`} stroke="#6e1018" strokeWidth="0.5" />

          {/* clear neck */}
          <rect x="20" y="101" width="8" height="7" rx="2" fill={`url(#coil-metal-${index})`} opacity="0.5" />

          {/* stepped chrome spark-plug boot */}
          <path d="M19 107 H29 L27.6 117 Q27.6 119 25.6 119 H22.4 Q20.4 119 20.4 117 Z" fill={`url(#coil-metal-${index})`} stroke="#7e878d" strokeWidth="0.5" />
          <g stroke="#6b747a" strokeWidth="0.5" opacity="0.8">
            <line x1="20.6" x2="27.4" y1="110" y2="110" />
            <line x1="20.9" x2="27.1" y1="113" y2="113" />
          </g>
          <rect x="21.4" y="119" width="5.2" height="6" rx="1.2" fill={`url(#coil-metal-${index})`} stroke="#7e878d" strokeWidth="0.4" />
          {/* terminal nub — fires on spark */}
          <rect
            x="22.6"
            y="124.5"
            width="2.8"
            height="5"
            rx="1"
            fill={spark ? "#fff27a" : `url(#coil-metal-${index})`}
            style={{ filter: spark ? "drop-shadow(0 0 5px #ffd23a)" : "none", transition: "filter 40ms linear" }}
          />
        </svg>
      </div>

      <div className="hidden w-full items-center justify-between px-0.5 short:hidden md:flex">
        <span className="font-data text-[8px]" style={{ color: charging ? "#ff4d5a" : "#5b7387" }}>+</span>
        <span className="font-data text-[8px]" style={{ color: spark ? "#ffb000" : "#5b7387" }}>−</span>
      </div>
    </div>
  );
}
