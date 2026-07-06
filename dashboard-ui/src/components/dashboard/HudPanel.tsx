import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HudPanelProps {
  title?: string;
  accent?: string;
  /** "screen" = recessed black instrument screen (white title strip);
      "metal" = brushed plate with an engraved dark title. */
  variant?: "screen" | "metal";
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function HudPanel({
  title,
  accent = "#ff9d00",
  variant = "screen",
  right,
  className,
  bodyClassName,
  children,
}: HudPanelProps) {
  const metal = variant === "metal";
  return (
    <section className={cn(metal ? "metal-plate" : "inset-screen", "overflow-hidden rounded-lg", className)}>
      {title && (
        <header
          className={cn(
            "relative flex items-center justify-center gap-2 px-2.5 py-1 short:py-0.5 md:py-1.5",
            !metal && "screen-titlebar",
          )}
        >
          <h2
            className={cn(
              "font-display text-[10px] font-bold uppercase tracking-hud md:text-[12px]",
              metal ? "metal-title" : "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]",
            )}
          >
            {title}
          </h2>
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {right}
            <span className="dot-led h-1.5 w-1.5 rounded-full" style={{ color: accent, background: accent }} />
            <span className="dot-led h-1.5 w-1.5 rounded-full" style={{ color: "#e33d3d", background: "#e33d3d" }} />
          </div>
        </header>
      )}
      <div className={cn("p-1.5 short:p-1.5 md:p-2.5", bodyClassName)}>{children}</div>
    </section>
  );
}
