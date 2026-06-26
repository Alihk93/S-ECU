interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
}

export function InjectorAnimation({ index, value }: InjectorProps) {
  const active = value > 0.02;
  const color = active ? "#2bff88" : "#1d2b33";
  const droplets = [0, 1, 2, 3, 4];

  return (
    <div className="panel flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 md:gap-1 md:px-1.5 md:py-2">
      <span className="font-data text-[9px] text-muted-foreground">I{index + 1}</span>
      <div className="relative h-6 w-6 md:h-12">
        {/* injector body */}
        <div
          className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-sm border md:h-6"
          style={{
            borderColor: color,
            background: `linear-gradient(180deg, ${color}33, transparent)`,
            boxShadow: active ? `0 0 10px ${color}` : "none",
            transition: "box-shadow 60ms linear, border-color 80ms",
          }}
        />
        {/* nozzle */}
        <div
          className="absolute left-1/2 top-3 h-1.5 w-1 -translate-x-1/2 md:top-6"
          style={{ background: color }}
        />
        {/* spray cone */}
        <div className="absolute left-1/2 top-[17px] h-4 w-6 -translate-x-1/2 overflow-hidden md:top-[30px] md:h-6">
          {active &&
            droplets.map((d) => (
              <span
                key={d}
                className="absolute left-1/2 top-0 block h-3 w-[2px] rounded-full"
                style={{
                  background: "#2bff88",
                  transform: `translateX(-50%) rotate(${(d - 2) * 11}deg)`,
                  transformOrigin: "top center",
                  animation: `spray ${0.32 + d * 0.02}s linear infinite`,
                  opacity: value,
                }}
              />
            ))}
        </div>
      </div>
      <div
        className="hidden h-1 w-full rounded-full md:block"
        style={{
          background: `linear-gradient(90deg, ${color} ${value * 100}%, transparent ${value * 100}%)`,
          boxShadow: active ? `0 0 6px ${color}` : "none",
        }}
      />
    </div>
  );
}
