interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
  prefix?: string; // channel label prefix ("I" port, "G" GDI)
}

// Port injector ("I" bank) — styled after the real Bosch part: silver fuel
// inlet, black ribbed cap, a red upper O-ring, an angled black electrical
// connector, a black BOSCH-marked body, a cream mid-collar, a pink lower O-ring
// and a metallic nozzle whose pintle tip glows when energized.
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
        {/* cream mid collar */}
        <linearGradient id={`inj-body-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cabfb2" />
          <stop offset="50%" stopColor="#f1ebe2" />
          <stop offset="100%" stopColor="#b3a799" />
        </linearGradient>
        {/* upper red O-ring */}
        <linearGradient id={`inj-ring-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6a6a" />
          <stop offset="45%" stopColor="#d22f2f" />
          <stop offset="100%" stopColor="#8e1414" />
        </linearGradient>
        {/* lower pink O-ring */}
        <linearGradient id={`inj-pink-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff8aa0" />
          <stop offset="50%" stopColor="#d2415f" />
          <stop offset="100%" stopColor="#8e1f33" />
        </linearGradient>
      </defs>

      {/* top fuel inlet pipe (silver) */}
      <rect x="20.5" y="2" width="7" height="8" rx="2" fill={`url(#inj-metal-${uid})`} />
      {/* dark inlet cap ring */}
      <rect x="18" y="8.5" width="12" height="3.5" rx="1.7" fill="#15181b" />

      {/* black ribbed top cap */}
      <rect x="16" y="11" width="16" height="11" rx="3" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.5" />
      <g stroke="#4a5056" strokeWidth="0.5" opacity="0.5">
        <line x1="17" x2="31" y1="14" y2="14" />
        <line x1="17" x2="31" y1="16.5" y2="16.5" />
        <line x1="17" x2="31" y1="19" y2="19" />
      </g>

      {/* upper red O-ring */}
      <rect x="15.5" y="20" width="17" height="4" rx="2" fill={`url(#inj-ring-${uid})`} />
      <rect x="15.5" y="20.4" width="17" height="1.2" rx="0.6" fill="#ff9a9a" opacity="0.8" />

      {/* angled electrical connector — points up to 11 o'clock */}
      <g transform="rotate(-62 18 36)">
        <rect x="3" y="27" width="16" height="15" rx="3" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.6" />
        <rect x="6" y="30.5" width="7" height="8" rx="1.5" fill="#0c0e10" />
      </g>

      {/* main black BOSCH body */}
      <rect x="15" y="22.5" width="18" height="62" rx="4" fill={`url(#inj-black-${uid})`} stroke="#0a0c0e" strokeWidth="0.7" />
      {/* embossed marking */}
      <text
        x="24" y="45"
        fill="#9aa3a9" fontSize="4.6" fontWeight="700"
        textAnchor="middle" letterSpacing="0.3" opacity="0.75"
        fontFamily="'Chakra Petch', sans-serif"
      >
        BOSCH
      </text>
      {/* lower body ribs */}
      <g stroke="#3c4248" strokeWidth="0.5" opacity="0.55">
        <line x1="18" x2="30" y1="52" y2="52" />
        <line x1="18" x2="30" y1="70" y2="70" />
        <line x1="18" x2="30" y1="73" y2="73" />
        <line x1="18" x2="30" y1="76" y2="76" />
        <line x1="18" x2="30" y1="79" y2="79" />
      </g>

      {/* cream mid collar */}
      <rect x="17" y="84" width="14" height="11" rx="2" fill={`url(#inj-body-${uid})`} stroke="#9aa4aa" strokeWidth="0.5" />

      {/* lower pink O-ring */}
      <rect x="16.5" y="93" width="15" height="4" rx="2" fill={`url(#inj-pink-${uid})`} />
      <rect x="16.5" y="93.4" width="15" height="1.1" rx="0.5" fill="#ffb3c2" opacity="0.8" />

      {/* metallic nozzle (tapering) */}
      <path
        d="M19 96 H29 L27.5 114 a1.6 1.6 0 0 1 -1.6 1.4 H22.1 a1.6 1.6 0 0 1 -1.6 -1.4 Z"
        fill={`url(#inj-metal-${uid})`}
        stroke="#7e878d"
        strokeWidth="0.5"
      />
      <g stroke="#6b747a" strokeWidth="0.6" opacity="0.8">
        <line x1="22" x2="21.6" y1="98" y2="113" />
        <line x1="24" x2="24" y1="98" y2="114" />
        <line x1="26" x2="26.4" y1="98" y2="113" />
      </g>
      {/* pintle tip — glows on injection */}
      <rect
        x="22"
        y="114.5"
        width="4"
        height="5"
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

// GDI injector ("G" bank) — original smart-injector art: black connector + blue
// inlet O-ring, marked black body, a translucent core showing a cyan driver
// PCB, and a metallic basket nozzle that sprays when energized.
function GdiInjectorSvg({ uid, value, active }: { uid: string; value: number; active: boolean }) {
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
        <linearGradient id={`inj-black-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#454b51" />
          <stop offset="45%" stopColor="#181b1e" />
          <stop offset="100%" stopColor="#2c3236" />
        </linearGradient>
        <linearGradient id={`inj-metal-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2f5f7" />
          <stop offset="45%" stopColor="#aab4ba" />
          <stop offset="70%" stopColor="#dde3e6" />
          <stop offset="100%" stopColor="#8d979d" />
        </linearGradient>
        <linearGradient id={`inj-body-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b9c2c8" />
          <stop offset="50%" stopColor="#e8edf0" />
          <stop offset="100%" stopColor="#9aa4aa" />
        </linearGradient>
      </defs>

      {/* fuel inlet (top-right) with blue O-ring */}
      <rect x="26" y="4" width="11" height="20" rx="3" fill={`url(#inj-black-${uid})`} />
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
          fill={`url(#inj-black-${uid})`}
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
        fill={`url(#inj-black-${uid})`}
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
        fill={`url(#inj-body-${uid})`}
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
      <rect x="20" y="104" width="14" height="8" rx="2" fill={`url(#inj-metal-${uid})`} opacity="0.55" />

      {/* metallic basket nozzle */}
      <path
        d="M21 112 H33 L31 126 a2 2 0 0 1 -2 1.6 H25 a2 2 0 0 1 -2 -1.6 Z"
        fill={`url(#inj-metal-${uid})`}
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
        fill={active ? "#bdf0ff" : `url(#inj-metal-${uid})`}
        style={{
          filter: active ? "drop-shadow(0 0 4px #29c2ff)" : "none",
          transition: "filter 40ms linear",
        }}
      />
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
    <div className="panel flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 short:gap-0.5 short:px-1 short:py-0.5 md:gap-1 md:px-1.5 md:py-2">
      <span className="font-data text-[9px] text-muted-foreground">{prefix}{index + 1}</span>

      <div className="relative flex h-9 w-6 items-center justify-center short:h-9 short:w-6 fit:h-28 fit:w-12">
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
