import { ChannelCell } from "./ChannelCell";

interface CoilIndicatorProps {
  index: number; // 0-based
  dwell: number; // 0..1
  spark: boolean;
}

// Smart ignition-coil channel. Charging ramps a red glow with dwell; firing
// flashes the cell gold. Uses the shared ChannelCell so coils, port injectors
// and GDI injectors all share one visual language.
export function CoilIndicator({ index, dwell, spark }: CoilIndicatorProps) {
  return (
    <ChannelCell
      label={`C${index + 1}`}
      color={spark ? "#ffd23a" : "#ff5a66"}
      intensity={spark ? 1 : dwell}
      flash={spark}
      icon="coil"
    />
  );
}
