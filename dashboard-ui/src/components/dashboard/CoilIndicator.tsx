import { cn } from "@/lib/utils";

interface CoilIndicatorProps {
  index: number; // 0-based
  dwell: number; // 0..1
  spark: boolean;
}

// Visualizes a smart-coil channel: charging (dwell, + rail) and firing (spark, − rail).
export function CoilIndicator({ index, dwell, spark }: CoilIndicatorProps) {
  const charging = dwell > 0.02 && !spark;
  const color = spark ? "#fff27a" : charging ? "#00e7f2" : "#1d2b33";
  const glow = spark ? 1 : dwell;

  return (
    <div className="panel flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 short:gap-0.5 short:px-1 short:py-0.5 md:gap-1 md:px-1.5 md:py-2">
      <span className="font-data text-[9px] text-muted-foreground">C{index + 1}</span>
      <div className="relative h-6 w-6 short:h-6 short:w-6 md:h-12 md:w-7">
        {/* coil body */}
        <div
          className="absolute inset-x-1 top-0 h-4 rounded-sm border short:h-4 md:h-7"
          style={{
            borderColor: color,
            background: `linear-gradient(180deg, ${color}22, transparent)`,
            boxShadow: glow ? `0 0 ${4 + glow * 12}px ${color}` : "none",
            transition: "box-shadow 60ms linear, border-color 80ms",
          }}
        >
          {/* windings */}
          <div className="absolute inset-1 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-px"
                style={{ background: color, opacity: 0.5 + glow * 0.5 }}
              />
            ))}
          </div>
        </div>
        {/* spark plug gap */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className="h-2 w-px short:h-2 md:h-3" style={{ background: color, opacity: 0.6 }} />
          <div
            className={cn("h-1.5 w-1.5 rounded-full", spark && "animate-none")}
            style={{
              background: spark ? "#fff27a" : "#0c151a",
              boxShadow: spark ? "0 0 10px 2px #fff27a, 0 0 18px 4px #ff7a18" : "none",
              transition: "box-shadow 40ms linear",
            }}
          />
        </div>
      </div>
      <div className="hidden w-full items-center justify-between px-0.5 short:hidden md:flex">
        <span
          className="font-data text-[8px]"
          style={{ color: charging ? "#00e7f2" : "#33414f" }}
        >
          +
        </span>
        <span
          className="font-data text-[8px]"
          style={{ color: spark ? "#fff27a" : "#33414f" }}
        >
          −
        </span>
      </div>
    </div>
  );
}
