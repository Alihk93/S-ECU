import { SevenSegDisplay } from "./SevenSegDisplay";

interface PowerDisplayProps {
  cur: number; // ECU self-consumption (external CT), A
  ecuV: number; // ECU voltage, V
  amp: number; // engine/system current, A
}

function fmt(v: number, intDigits: number, dec: number) {
  const s = v.toFixed(dec);
  const [whole] = s.split(".");
  const pad = Math.max(0, intDigits - whole.length);
  return " ".repeat(pad) + s;
}

// Headline display: three significant digits, each shown with its own decimal
// point — the classic "8.8.8." LED-module look.
function dotted3(v: number) {
  const cl = Math.max(0, v);
  let digits: string;
  if (cl >= 100) digits = String(Math.min(999, Math.round(cl)));
  else if (cl >= 10) digits = (Math.round(cl * 10) / 10).toFixed(1).replace(".", "");
  else digits = cl.toFixed(2).replace(".", "");
  digits = digits.padStart(3, "0").slice(0, 3);
  return digits.split("").map((d) => `${d}.`).join("");
}

// Dark LED sub-panel — seven-seg readouts look best inset on black.
function LedPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col justify-center rounded-sm border border-border/70 px-2 py-1.5 ${className}`}
      style={{
        background:
          "linear-gradient(180deg, #061016, #02080c)",
        boxShadow: "inset 0 1px 6px rgba(0,0,0,0.7)",
      }}
    >
      {children}
    </div>
  );
}

export function PowerDisplay({ cur, ecuV, amp }: PowerDisplayProps) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
      {/* ECU self-consumption current (external CT) — the headline 3-digit display */}
      <LedPanel>
        <span className="mb-1 font-display text-[8px] uppercase tracking-widest text-muted-foreground">
          ECU&nbsp;CT&nbsp;·&nbsp;A
        </span>
        <div className="flex items-center gap-1">
          <SevenSegDisplay value={dotted3(cur)} color="#ff3b4d" className="h-7 w-auto md:h-9" />
          <span className="font-data text-[10px] font-bold text-neon-red">A</span>
        </div>
      </LedPanel>

      {/* Voltage + engine current */}
      <LedPanel className="py-1">
        <div className="flex items-center justify-end gap-1">
          <SevenSegDisplay value={fmt(ecuV, 2, 1)} color="#2bff88" className="h-5 w-auto md:h-6" />
          <span className="w-3 font-data text-[10px] font-bold text-neon-green">V</span>
        </div>
        <div className="mt-1 flex items-center justify-end gap-1">
          <SevenSegDisplay value={fmt(amp, 2, 1)} color="#00e7f2" className="h-5 w-auto md:h-6" />
          <span className="w-3 font-data text-[10px] font-bold text-neon-cyan">A</span>
        </div>
      </LedPanel>
    </div>
  );
}
