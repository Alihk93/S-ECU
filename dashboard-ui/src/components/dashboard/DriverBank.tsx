import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Output-driver bank frame (COIL / INJ / GDI) after the mockup: an accent-tinted
// title bar over a 4×2 grid of numbered part cells. Cells are supplied by the
// caller (the existing CoilIndicator / InjectorAnimation art).

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
    <section className={cn("panel flex min-h-0 flex-col overflow-hidden rounded-lg", className)}>
      <header
        className="relative flex items-center justify-center gap-2 px-2 py-1 short:py-0.5"
        style={{
          background: `linear-gradient(180deg, ${accent}2b, rgba(4,10,16,0.6))`,
          borderBottom: `1px solid ${accent}77`,
          boxShadow: "inset 0 1px 0 rgba(160,210,255,0.15)",
        }}
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
