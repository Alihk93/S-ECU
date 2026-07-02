import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HudPanelProps {
  title?: string;
  accent?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function HudPanel({
  title,
  accent = "#22d3ee",
  right,
  className,
  bodyClassName,
  children,
}: HudPanelProps) {
  return (
    <section className={cn("panel rounded-lg", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-1.5 short:py-1 md:px-3.5 md:py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-1 rounded-full"
              style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
            />
            <h2 className="font-display text-[10px] font-semibold uppercase tracking-hud text-foreground/80 md:text-[12px]">
              {title}
            </h2>
          </div>
          {right}
        </header>
      )}
      <div className={cn("p-2 short:p-1.5 md:p-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}
