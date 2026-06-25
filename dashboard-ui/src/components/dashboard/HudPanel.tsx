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
  accent = "#00e7f2",
  right,
  className,
  bodyClassName,
  children,
}: HudPanelProps) {
  return (
    <section className={cn("panel panel-corner rounded-sm", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-[3px] rounded-full"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            <h2 className="font-display text-[11px] font-semibold uppercase tracking-hud text-muted-foreground">
              {title}
            </h2>
          </div>
          {right}
        </header>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
