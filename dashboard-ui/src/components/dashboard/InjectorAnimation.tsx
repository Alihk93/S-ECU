interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
  prefix?: string; // channel label prefix ("I" port, "G" GDI)
}

// Port injector ("I" bank) — redrawn after the reference Bosch EV14 photo:
// gunmetal ribbed inlet (EV14 mark), bright red upper O-ring, angled black
// keyed connector, matte black BOSCH body, chrome collar, a pink lower O-ring
// and a chrome pintle nozzle whose tip glows when energized.
function PortInjectorSvg({ uid, value, active }: { uid: string; value: number; active: boolean }) {
  return (
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
        {/* rounded black cylinder shading */}
        <linearGradient id={`inj-black-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b4147" />
          <stop offset="22%" stopColor="#1b1f22" />
          <stop offset="50%" stopColor="#0b0d0f" />
          <stop offset="78%" stopColor="#181c1f" />
          <stop offset="100%" stopColor="#33383d" />
        </linearGradient>
        <linearGradient id={`inj-metal-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2f5f7" />
          <stop offset="45%" stopColor="#aab4ba" />
          <stop offset="70%" stopColor="#dde3e6" />
          <stop offset="100%" stopColor="#8d979d" />
        </linearGradient>
        {/* upper red O-ring */}
        <linearGradient id={`inj-ring-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6a6a" />
          <stop offset="45%" stopColor="#e21f1f" />
          <stop offset="100%" stopColor="#8e1414" />
        </linearGradient>
        {/* lower pink O-ring */}
        <linearGradient id={`inj-pink-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff8aa0" />
          <stop offset="50%" stopColor="#d2415f" />
          <stop offset="100%" stopColor="#8e1f33" />
        </linearGradient>
      </defs>

      {/* gunmetal ribbed inlet cap (rounded top) */}
      <rect x="18.5" y="2" width="11" height="14" rx="4.5" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.5" />
      <g stroke="#4a5056" strokeWidth="0.6" opacity="0.55">
        <line x1="19.5" x2="28.5" y1="6" y2="6" />
        <line x1="19.5" x2="28.5" y1="9" y2="9" />
        <line x1="19.5" x2="28.5" y1="12" y2="12" />
      </g>
      <ellipse cx="24" cy="3.6" rx="4" ry="1.4" fill="#7c848a" opacity="0.5" />

      {/* top black shoulder + EV14 mark */}
      <rect x="16.5" y="14" width="15" height="7" rx="2.5" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.5" />
      <text x="24" y="18.6" fill="#9aa3a9" fontSize="4" fontWeight="700" textAnchor="middle" letterSpacing="0.3" opacity="0.8" fontFamily="'Chakra Petch', sans-serif">EV14</text>

      {/* bright red upper O-ring */}
      <rect x="15.5" y="20.5" width="17" height="4.4" rx="2.2" fill={`url(#inj-ring-${uid})`} />
      <rect x="15.5" y="20.9" width="17" height="1.3" rx="0.6" fill="#ff9a9a" opacity="0.85" />

      {/* angled black keyed connector (upper-left) */}
      <g transform="rotate(-45 17 36)">
        <rect x="1" y="27" width="17" height="16" rx="3" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.6" />
        <rect x="4.5" y="30.5" width="8" height="8" rx="1.5" fill="#0c0e10" />
        <rect x="6" y="32" width="5" height="5" rx="0.8" fill="#1b2024" />
      </g>

      {/* main black BOSCH body */}
      <rect x="15" y="24" width="18" height="66" rx="4.5" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.7" />
      <text
        x="24" y="74"
        fill="#9aa3a9" fontSize="4.4" fontWeight="700"
        textAnchor="middle" letterSpacing="0.4" opacity="0.7"
        fontFamily="'Chakra Petch', sans-serif"
      >
        BOSCH
      </text>

      {/* black lower step */}
      <rect x="16.5" y="88" width="15" height="7" rx="2" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.5" />

      {/* chrome collar */}
      <rect x="18" y="95" width="12" height="8" rx="1.5" fill={`url(#inj-metal-${uid})`} stroke="#7e878d" strokeWidth="0.4" />

      {/* pink lower O-ring */}
      <rect x="16.5" y="102.5" width="15" height="4.4" rx="2.2" fill={`url(#inj-pink-${uid})`} />
      <rect x="16.5" y="102.9" width="15" height="1.2" rx="0.6" fill="#ffb3c2" opacity="0.85" />

      {/* chrome pintle nozzle (tapering) */}
      <path
        d="M20 106 H28 L26.8 118 a1.6 1.6 0 0 1 -1.6 1.4 H22.8 a1.6 1.6 0 0 1 -1.6 -1.4 Z"
        fill={`url(#inj-metal-${uid})`}
        stroke="#7e878d"
        strokeWidth="0.5"
      />
      <g stroke="#6b747a" strokeWidth="0.6" opacity="0.8">
        <line x1="22.5" x2="22.2" y1="108" y2="118" />
        <line x1="24" x2="24" y1="108" y2="119" />
        <line x1="25.5" x2="25.8" y1="108" y2="118" />
      </g>
      {/* pintle tip — glows on injection */}
      <rect
        x="22.4"
        y="119"
        width="3.2"
        height="4.6"
        rx="1"
        fill={active ? "#bdf0ff" : `url(#inj-metal-${uid})`}
        style={{
          filter: active ? "drop-shadow(0 0 4px #29c2ff)" : "none",
          transition: "filter 40ms linear",
        }}
      />
    </svg>
  );
}

// GDI injector ("G" bank) — redrawn after the reference smart-injector photo:
// black keyed connector (PA66 markings), blue inlet O-ring, a clear window over
// a silvery driver PCB, and a fluted chrome basket nozzle that sprays when
// energized (PCB + director tip brighten with injection intensity).
function GdiInjectorSvg({ uid, value, active }: { uid: string; value: number; active: boolean }) {
  const glow = 0.4 + value * 0.6;
  return (
    <svg
      viewBox="0 0 48 132"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      style={{
        filter: active ? `drop-shadow(0 0 ${2 + value * 8}px #7fe7ff)` : "none",
        transition: "filter 60ms linear",
      }}
    >
      <defs>
        <linearGradient id={`inj-black-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a5158" />
          <stop offset="30%" stopColor="#20262b" />
          <stop offset="60%" stopColor="#0c1013" />
          <stop offset="100%" stopColor="#2b3237" />
        </linearGradient>
        <linearGradient id={`inj-metal-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f4f7f9" />
          <stop offset="42%" stopColor="#a9b3b9" />
          <stop offset="68%" stopColor="#e4eaec" />
          <stop offset="100%" stopColor="#828c92" />
        </linearGradient>
        <linearGradient id={`inj-clear-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cfdae0" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#eef4f6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#a7b2b8" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* top fuel inlet: chrome ring + blue O-ring */}
      <ellipse cx="24" cy="4" rx="6.5" ry="2.4" fill={`url(#inj-metal-${uid})`} />
      <rect x="17.5" y="4.5" width="13" height="5" rx="2.4" fill="#2f6fd6" />
      <rect x="17.5" y="4.8" width="13" height="1.6" rx="0.8" fill="#8fb8ff" opacity="0.85" />

      {/* angled black keyed connector (upper-left) */}
      <g transform="rotate(-40 15 22)">
        <rect x="-1" y="12" width="19" height="17" rx="3.5" fill={`url(#inj-black-${uid})`} stroke="#050708" strokeWidth="0.6" />
        <rect x="1.5" y="15" width="9" height="11" rx="1.6" fill="#0a0c0e" />
        <rect x="3" y="17" width="6" height="7" rx="1" fill="#1b2024" />
        <rect x="12" y="27" width="5" height="4" rx="1" fill={`url(#inj-black-${uid})`} />
      </g>

      {/* black marked upper body */}
      <rect x="16" y="9" width="17" height="41" rx="4" fill={`url(#inj-black-${uid})`} stroke="#050708" strokeWidth="0.7" />
      <rect x="16" y="11.5" width="17" height="2" rx="1" fill={`url(#inj-metal-${uid})`} opacity="0.7" />
      {/* faint moulded markings */}
      <g fill="#8c959b" opacity="0.6" fontFamily="'Chakra Petch', sans-serif">
        <text x="24.5" y="24" fontSize="4" textAnchor="middle">PA66</text>
        <text x="24.5" y="31" fontSize="4" textAnchor="middle">550</text>
        <text x="24.5" y="38" fontSize="4" textAnchor="middle">23-4</text>
        <text x="24.5" y="45" fontSize="3.4" textAnchor="middle">2-02-01</text>
      </g>
      <g stroke="#3a4045" strokeWidth="0.5" opacity="0.7">
        <line x1="17" x2="32" y1="27" y2="27" />
        <line x1="17" x2="32" y1="34" y2="34" />
        <line x1="17" x2="32" y1="41" y2="41" />
      </g>

      {/* clear window body */}
      <rect x="15" y="49" width="18" height="47" rx="4" fill={`url(#inj-clear-${uid})`} stroke="#8fa0a6" strokeWidth="0.5" />
      {/* wavy potting flanks */}
      <g stroke="#c9d4d9" strokeWidth="0.5" opacity="0.5" fill="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M16 ${52 + i * 4.6} q2 -1.8 4 0`} />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={`r${i}`} d={`M28 ${52 + i * 4.6} q2 -1.8 4 0`} />
        ))}
      </g>

      {/* silvery driver PCB (brightens with injection intensity) */}
      <g opacity={glow} style={{ transition: "opacity 60ms linear" }}>
        <rect x="19.5" y="52" width="9" height="41" rx="1" fill="#16242b" />
        <g stroke={active ? "#d8f6ff" : "#aeb8be"} strokeWidth="0.5" fill="none" strokeLinecap="round">
          <path d="M21 56 H27 M21 56 V61 M27 56 V60" />
          <path d="M22 66 H28 M22 66 V71" />
          <path d="M20.5 76 H26 M26 76 V81 M23 81 H28" />
          <path d="M21 86 H27 M27 86 V90" />
        </g>
        {[
          [21, 58, 3.4, 2.6],
          [24.6, 62, 3, 3],
          [20.6, 70, 4, 3.4],
          [24.4, 73, 3, 2.6],
          [21.4, 82, 4, 3],
          [24.2, 87, 3, 2.4],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="0.5" fill={active ? "#eafcff" : "#c4ced3"} />
        ))}
      </g>
      {/* glass specular highlight */}
      <path d="M17.5 54 q-1 20 1 38" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />

      {/* chrome collar */}
      <rect x="18" y="95" width="12" height="8" rx="2" fill={`url(#inj-metal-${uid})`} stroke="#7e878d" strokeWidth="0.4" />

      {/* fluted chrome basket nozzle */}
      <path d="M18.5 103 H29.5 L28 118 a2 2 0 0 1 -2 1.6 H22 a2 2 0 0 1 -2 -1.6 Z" fill={`url(#inj-metal-${uid})`} stroke="#7e878d" strokeWidth="0.5" />
      <g stroke="#6b747a" strokeWidth="0.6" opacity="0.85">
        <line x1="21" x2="20.6" y1="105" y2="118" />
        <line x1="24" x2="24" y1="105" y2="119" />
        <line x1="27" x2="27.4" y1="105" y2="118" />
      </g>
      {/* director tip with slots — glows on injection */}
      <rect
        x="21"
        y="119"
        width="6"
        height="8"
        rx="1.2"
        fill={active ? "#d8f6ff" : `url(#inj-metal-${uid})`}
        style={{ filter: active ? "drop-shadow(0 0 4px #7fe7ff)" : "none", transition: "filter 40ms linear" }}
      />
      <g stroke="#6b747a" strokeWidth="0.6" opacity="0.8">
        <line x1="23" x2="23" y1="120" y2="126" />
        <line x1="25" x2="25" y1="120" y2="126" />
      </g>
    </svg>
  );
}

// GDI high-pressure fuel pump — brushed-aluminium domed pump head, faceted hex
// body with left outlet + right inlet ports, a grey solenoid connector, an oval
// mounting flange and the tappet return spring below. Hand-drawn SVG after the
// reference photo (frontend-only art; feeds the HI-P rail readout).
export function HpPumpArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 122" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="hp-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#828b92" />
          <stop offset="30%" stopColor="#eef2f4" />
          <stop offset="55%" stopColor="#bdc5ca" />
          <stop offset="100%" stopColor="#6f787f" />
        </linearGradient>
        <radialGradient id="hp-dome" cx="40%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#f4f7f8" />
          <stop offset="55%" stopColor="#c1c9cd" />
          <stop offset="100%" stopColor="#767f86" />
        </radialGradient>
        <linearGradient id="hp-con" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9aa0a6" />
          <stop offset="50%" stopColor="#686e73" />
          <stop offset="100%" stopColor="#40454a" />
        </linearGradient>
        <linearGradient id="hp-spring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5e5952" />
          <stop offset="45%" stopColor="#2a2724" />
          <stop offset="100%" stopColor="#131110" />
        </linearGradient>
      </defs>

      {/* grey solenoid connector, upper-left */}
      <g transform="rotate(-16 24 36)">
        <rect x="2" y="30" width="24" height="15" rx="3" fill="url(#hp-con)" stroke="#2e3236" strokeWidth="0.6" />
        <rect x="4" y="33" width="8" height="9" rx="1.5" fill="#3a3f43" />
      </g>

      {/* left outlet port + bore */}
      <rect x="4" y="49" width="28" height="10" rx="3" fill="url(#hp-steel)" stroke="#6b747a" strokeWidth="0.5" />
      <circle cx="6.5" cy="54" r="2.4" fill="#39424a" />
      {/* right inlet port + bore */}
      <rect x="48" y="48" width="28" height="12" rx="3" fill="url(#hp-steel)" stroke="#6b747a" strokeWidth="0.5" />
      <circle cx="72.5" cy="54" r="3.6" fill="#2b3338" />

      {/* faceted hex aluminium body */}
      <path d="M16 32 L64 32 L69 46 L64 66 L16 66 L11 46 Z" fill="url(#hp-steel)" stroke="#69727a" strokeWidth="0.6" />
      <g stroke="#7d868c" strokeWidth="0.6" opacity="0.5">
        <line x1="27" y1="34" x2="27" y2="64" />
        <line x1="53" y1="34" x2="53" y2="64" />
      </g>

      {/* domed pump head */}
      <ellipse cx="40" cy="22" rx="27" ry="17" fill="url(#hp-dome)" stroke="#69727a" strokeWidth="0.6" />
      <ellipse cx="34" cy="13" rx="10" ry="5" fill="#f4f7f8" opacity="0.55" />
      <ellipse cx="40" cy="16" rx="15" ry="7" fill="#a9b2b7" />
      <ellipse cx="40" cy="15" rx="9.5" ry="4.5" fill="#d9e0e3" />

      {/* oval mounting flange */}
      <ellipse cx="40" cy="72" rx="35" ry="7" fill="url(#hp-steel)" stroke="#69727a" strokeWidth="0.6" />
      <circle cx="68" cy="72" r="2.6" fill="#39424a" />

      {/* black O-ring under the flange */}
      <ellipse cx="40" cy="79" rx="12" ry="4" fill="#161719" />

      {/* tappet return spring */}
      <g fill="none" stroke="url(#hp-spring)" strokeWidth="3.2">
        <ellipse cx="40" cy="85" rx="11" ry="4" />
        <ellipse cx="40" cy="91" rx="11" ry="4" />
        <ellipse cx="40" cy="97" rx="11" ry="4" />
        <ellipse cx="40" cy="103" rx="10.5" ry="4" />
        <ellipse cx="40" cy="109" rx="10" ry="4" />
      </g>

      {/* bottom tappet rod */}
      <rect x="36" y="110" width="8" height="9" rx="2" fill="url(#hp-steel)" stroke="#6b747a" strokeWidth="0.5" />
    </svg>
  );
}

// Renders one injector channel. The "I" (port) bank uses the Bosch-style art;
// the "G" (GDI) bank keeps the original smart-injector look. Energized state
// drives the body glow, pintle-tip glow and the spray cone (shared chrome).
export function InjectorAnimation({ index, value, prefix = "I" }: InjectorProps) {
  const active = value > 0.02;
  const uid = `${prefix}${index}`;
  const gdi = prefix === "G";

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center">
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        {gdi ? (
          <GdiInjectorSvg uid={uid} value={value} active={active} />
        ) : (
          <PortInjectorSvg uid={uid} value={value} active={active} />
        )}

        {/* soft misty spray cone — fades downward from the nozzle, length and
            density scale with injection intensity */}
        {active && (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              top: "84%",
              width: "92%",
              height: `${(0.26 + value * 0.16) * 100}%`,
              opacity: 0.3 + value * 0.7,
            }}
          >
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(228,248,255,0.92) 0%, rgba(184,239,255,0.55) 38%, rgba(159,232,255,0.14) 74%, transparent 100%)",
                clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
                filter: "blur(2.5px)",
                transformOrigin: "top center",
                animation: "mist 0.6s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
