interface InjectorProps {
  index: number;
  value: number; // 0..1 injection intensity
}

export function InjectorAnimation({ index, value }: InjectorProps) {
  const active = value > 0.02;
  const color = active ? "#2bff88" : "#1d2b33";
  const droplets = [0, 1, 2, 3, 4];

  return (
    <div className="panel flex flex-col items-center gap-1 rounded-sm px-1.5 py-2">
      <span className="font-data text-[9px] text-muted-foreground">I{index + 1}</span>
      <div className="relative h-12 w-6">
        {/* injector body */}
        <div
          className="absolute left-1/2 top-0 h-6 w-3 -translate-x-1/2 rounded-sm border"
          style={{
            borderColor: color,
            background: `linear-gradient(180deg, ${color}33, transparent)`,
            boxShadow: active ? `0 0 10px ${color}` : "none",
            transition: "box-shadow 60ms linear, border-color 80ms",
          }}
        />
        {/* nozzle */}
        <div
          className="absolute left-1/2 top-6 h-1.5 w-1 -translate-x-1/2"
          style={{ background: color }}
        />
        {/* spray cone */}
        <div className="absolute left-1/2 top-[30px] h-6 w-6 -translate-x-1/2 overflow-hidden">
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
        className="h-1 w-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color} ${value * 100}%, transparent ${value * 100}%)`,
          boxShadow: active ? `0 0 6px ${color}` : "none",
        }}
      />
    </div>
  );
}
