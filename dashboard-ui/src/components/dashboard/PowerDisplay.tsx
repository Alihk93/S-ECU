import { SevenSegDisplay } from "./SevenSegDisplay";

interface PowerDisplayProps {
  cur: number; // ECU self-consumption (external CT), A
  ecuV: number; // ECU voltage, V
}

function fmt(v: number, intDigits: number, dec: number) {
  const s = v.toFixed(dec);
  const [whole] = s.split(".");
  const pad = Math.max(0, intDigits - whole.length);
  return "0".repeat(pad) + s;
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

export function PowerDisplay({ cur, ecuV }: PowerDisplayProps) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-2">
      {/* ECU self-consumption current (external CT) — the headline 3-digit display */}
      <LedPanel className="relative">
        <span className="pointer-events-none absolute left-2 top-1 font-display text-[8px] uppercase tracking-widest text-muted-foreground">
          ECU&nbsp;CT&nbsp;·&nbsp;A
        </span>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-data text-base font-bold text-neon-red">
          A
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center pr-3">
          <SevenSegDisplay value={dotted3(cur)} color="#ff3b4d" className="h-full max-h-[34px] min-h-0 w-full" />
        </div>
      </LedPanel>

      {/* ECU voltage — mirrors the headline so the digits match in size */}
      <LedPanel className="relative">
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-data text-base font-bold text-neon-green">
          V
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center pr-3">
          <SevenSegDisplay value={fmt(ecuV, 2, 2)} color="#2bff88" className="h-full max-h-[34px] min-h-0 w-full" />
        </div>
      </LedPanel>
    </div>
  );
}
