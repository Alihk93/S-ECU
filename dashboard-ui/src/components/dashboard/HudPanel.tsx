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
    <section className={cn("panel overflow-hidden rounded-lg", className)}>
      {title && (
        <header className="panel-titlebar relative flex items-center justify-center gap-2 px-2.5 py-1 short:py-0.5 md:py-1.5">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-hud text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] md:text-[12px]">
            {title}
          </h2>
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {right}
            <span className="dot-led h-1.5 w-1.5 rounded-full" style={{ color: accent, background: accent }} />
            <span className="dot-led h-1.5 w-1.5 rounded-full" style={{ color: "#ffb000", background: "#ffb000" }} />
          </div>
        </header>
      )}
      <div className={cn("p-1.5 short:p-1.5 md:p-2.5", bodyClassName)}>{children}</div>
    </section>
  );
}
