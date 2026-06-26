import type { StatusDef } from "@/lib/ecu";

interface StatusIndicatorProps {
  def: StatusDef;
  on: boolean;
}

export function StatusIndicator({ def, on }: StatusIndicatorProps) {
  const color = on ? def.color : "#28333b";
  return (
    <div
      className="panel flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 leading-none md:gap-2 md:px-2.5 md:py-1.5"
      style={{ borderColor: on ? `${def.color}66` : undefined }}
    >
      <span
        className="led h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          color,
          background: color,
          boxShadow: on
            ? `0 0 6px ${def.color}, 0 0 14px -2px ${def.color}`
            : "none",
        }}
      />
      <span
        className="font-display text-[10px] uppercase tracking-wide"
        style={{ color: on ? "#dff5f7" : "#5b6b7a" }}
      >
        {def.label}
      </span>
      <span
        className="ml-auto font-data text-[9px]"
        style={{ color: on ? def.color : "#3a4750" }}
      >
        {on ? "ON" : "··"}
      </span>
    </div>
  );
}
