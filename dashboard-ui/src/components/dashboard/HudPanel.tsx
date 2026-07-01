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
        <header className="flex items-center justify-between gap-2 border-b border-border/70 px-2.5 py-1 short:px-2.5 short:py-0.5 md:px-3 md:py-2">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-[3px] rounded-full"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            <h2 className="font-display text-[10px] font-semibold uppercase tracking-hud text-muted-foreground md:text-[11px]">
              {title}
            </h2>
          </div>
          {right}
        </header>
      )}
      <div className={cn("p-1.5 short:p-1.5 md:p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
