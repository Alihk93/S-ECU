import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// v5 output-driver bank after the brushed-steel mockup: a dark plate with a
// colored rim + soft glow (amber COIL / blue INJ / red GDI), a centered white
// title with a colored dot-LED, and a 4×2 grid of black part cells (the cells
// themselves — badge, part art, caption — are rendered by the children).

interface DriverBankProps {
  title: string;
  accent: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function DriverBank({ title, accent, right, className, bodyClassName, children }: DriverBankProps) {
  return (
    <section
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg", className)}
      style={{
        background: "linear-gradient(180deg, #141516, #0a0b0c 40%, #060707)",
        border: `1.5px solid ${accent}88`,
        boxShadow: `0 0 14px -4px ${accent}99, inset 0 0 18px -8px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.07)`,
      }}
    >
      <header
        className="relative flex items-center justify-center gap-2 px-2 py-1 short:py-0.5"
        style={{ borderBottom: `1px solid ${accent}55`, background: "linear-gradient(180deg, #1c1e20, #0c0d0e)" }}
      >
        <span className="dot-led h-1.5 w-1.5 rounded-full" style={{ color: accent, background: accent }} />
        <h3 className="font-display text-[10px] font-bold uppercase tracking-hud text-white md:text-[12px]">{title}</h3>
        {right && <div className="absolute right-2 flex items-center">{right}</div>}
      </header>
      <div className={cn("grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-1 p-1.5 short:gap-1 short:p-1", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

// Shared cell chrome: black tile, colored hairline border, square number badge
// in the corner and a small caption under the part art.
export function BankCell({
  n,
  accent,
  caption,
  children,
}: {
  n: number;
  accent: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex h-full min-h-0 flex-col items-center overflow-hidden rounded-md px-1 pb-0.5 pt-1"
      style={{
        background: "linear-gradient(180deg, #101112, #070808 55%, #040505)",
        border: `1px solid ${accent}66`,
        boxShadow: "inset 0 1px 5px rgba(0,0,0,0.8)",
      }}
    >
      <span
        className="absolute left-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-[3px] font-data text-[8px] font-bold leading-none md:h-4 md:w-4 md:text-[9px]"
        style={{ background: accent, color: "#0b0d0e", boxShadow: `0 0 6px -1px ${accent}` }}
      >
        {n}
      </span>
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">{children}</div>
      <span className="font-display text-[6.5px] uppercase tracking-wide text-[#8d979f] md:text-[8px]">{caption}</span>
    </div>
  );
}
