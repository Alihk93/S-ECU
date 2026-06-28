interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
  prefix?: string; // channel label prefix ("I" port, "G" GDI)
}

// Visualizes a smart fuel injector as the real part: black connector + blue
// inlet O-ring, marked black body, a translucent core showing a cyan driver
// PCB, and a metallic basket nozzle that sprays when energized.
export function InjectorAnimation({ index, value, prefix = "I" }: InjectorProps) {
  const active = value > 0.02;
  const droplets = [0, 1, 2, 3, 4];

  return (
    <div className="panel flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 short:gap-0.5 short:px-1 short:py-0.5 md:gap-1 md:px-1.5 md:py-2">
      <span className="font-data text-[9px] text-muted-foreground">{prefix}{index + 1}</span>

      <div className="relative flex h-9 w-6 items-center justify-center short:h-9 short:w-6 md:h-16 md:w-8">
        <svg
          viewBox="0 0 48 132"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{
            filter: active ? `drop-shadow(0 0 ${2 + value * 8}px #29c2ff)` : "none",
            transition: "filter 60ms linear",
          }}
        >
          <defs>
            <linearGradient id={`inj-black-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#454b51" />
              <stop offset="45%" stopColor="#181b1e" />
              <stop offset="100%" stopColor="#2c3236" />
            </linearGradient>
            <linearGradient id={`inj-metal-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f2f5f7" />
              <stop offset="45%" stopColor="#aab4ba" />
              <stop offset="70%" stopColor="#dde3e6" />
              <stop offset="100%" stopColor="#8d979d" />
            </linearGradient>
            <linearGradient id={`inj-body-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b9c2c8" />
              <stop offset="50%" stopColor="#e8edf0" />
              <stop offset="100%" stopColor="#9aa4aa" />
            </linearGradient>
          </defs>

          {/* fuel inlet (top-right) with blue O-ring */}
          <rect x="26" y="4" width="11" height="20" rx="3" fill={`url(#inj-black-${index})`} />
          <rect x="25.5" y="8" width="12" height="4" rx="2" fill="#2f6fd6" />
          <rect x="25.5" y="8" width="12" height="1.4" rx="0.7" fill="#7fb0ff" />

          {/* angled electrical connector (upper-left) */}
          <g transform="rotate(-30 16 16)">
            <rect
              x="0"
              y="7"
              width="20"
              height="17"
              rx="3"
              fill={`url(#inj-black-${index})`}
              stroke="#0c0e10"
              strokeWidth="0.6"
            />
            <rect x="3" y="11" width="7" height="9" rx="1.5" fill="#0d0f11" />
          </g>

          {/* black marked body */}
          <rect
            x="15"
            y="22"
            width="24"
            height="38"
            rx="4"
            fill={`url(#inj-black-${index})`}
            stroke="#0c0e10"
            strokeWidth="0.8"
          />
          {/* part markings */}
          <g stroke="#7f8890" strokeWidth="1" opacity="0.7" strokeLinecap="round">
            <line x1="20" x2="34" y1="31" y2="31" />
            <line x1="20" x2="30" y1="38" y2="38" />
            <line x1="20" x2="33" y1="45" y2="45" />
            <line x1="20" x2="31" y1="52" y2="52" />
          </g>

          {/* translucent body */}
          <rect
            x="16.5"
            y="60"
            width="21"
            height="44"
            rx="4"
            fill={`url(#inj-body-${index})`}
            stroke="#8d979d"
            strokeWidth="0.6"
          />
          {/* internal mesh */}
          <g stroke="#aeb8be" strokeWidth="0.5" opacity="0.55">
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="18" x2="36" y1={64 + i * 5} y2={64 + i * 5} />
            ))}
          </g>

          {/* glowing cyan driver PCB (brightens with injection intensity) */}
          <g opacity={0.35 + value * 0.65} style={{ transition: "opacity 60ms linear" }}>
            <rect x="20" y="64" width="14" height="36" rx="1" fill="#0c3140" />
            <g stroke="#7fe7ff" strokeWidth="0.7" fill="none" strokeLinecap="round">
              <path d="M22 68 H31 M22 68 V74 M31 68 V72" />
              <path d="M24 78 H32 M24 78 V84" />
              <path d="M22 88 H30 M30 88 V94 M26 94 H32" />
            </g>
            {[
              [22, 70, 4, 3],
              [28, 74, 4, 4],
              [23, 82, 5, 4],
              [27, 90, 4, 3],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="0.6" fill="#bdf0ff" />
            ))}
          </g>

          {/* clear lower neck */}
          <rect x="20" y="104" width="14" height="8" rx="2" fill={`url(#inj-metal-${index})`} opacity="0.55" />

          {/* metallic basket nozzle */}
          <path
            d="M21 112 H33 L31 126 a2 2 0 0 1 -2 1.6 H25 a2 2 0 0 1 -2 -1.6 Z"
            fill={`url(#inj-metal-${index})`}
            stroke="#7e878d"
            strokeWidth="0.6"
          />
          {/* basket slots */}
          <g stroke="#6b747a" strokeWidth="0.8">
            <line x1="25" x2="24.5" y1="114" y2="125" />
            <line x1="27" x2="27" y1="114" y2="126" />
            <line x1="29" x2="29.5" y1="114" y2="125" />
          </g>
          {/* pintle tip — glows on injection */}
          <rect
            x="25.5"
            y="126"
            width="3"
            height="4"
            rx="0.8"
            fill={active ? "#bdf0ff" : `url(#inj-metal-${index})`}
            style={{
              filter: active ? "drop-shadow(0 0 4px #29c2ff)" : "none",
              transition: "filter 40ms linear",
            }}
          />
        </svg>

        {/* spray cone */}
        {active && (
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-3 w-5 -translate-x-1/2 overflow-hidden md:h-4">
            {droplets.map((d) => (
              <span
                key={d}
                className="absolute left-1/2 top-0 block h-2.5 w-[2px] rounded-full"
                style={{
                  background: "#9fe8ff",
                  transform: `translateX(-50%) rotate(${(d - 2) * 11}deg)`,
                  transformOrigin: "top center",
                  animation: `spray ${0.32 + d * 0.02}s linear infinite`,
                  opacity: value,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="hidden h-1 w-full rounded-full short:hidden md:block"
        style={{
          background: `linear-gradient(90deg, #1f8fb8 ${value * 100}%, transparent ${value * 100}%)`,
          boxShadow: active ? "0 0 6px #29c2ff" : "none",
        }}
      />
    </div>
  );
}
