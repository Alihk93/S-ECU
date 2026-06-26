import { CoilIndicator } from "@/components/dashboard/CoilIndicator";
import { Gauge } from "@/components/dashboard/Gauge";
import { HudPanel } from "@/components/dashboard/HudPanel";
import { InjectorAnimation } from "@/components/dashboard/InjectorAnimation";
import { RpmBar } from "@/components/dashboard/RpmBar";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { TopBar } from "@/components/dashboard/TopBar";
import { VoltageMeter } from "@/components/dashboard/VoltageMeter";
import { WaveformScope } from "@/components/dashboard/WaveformScope";
import { useEcuEngine } from "@/hooks/useEcuEngine";
import { useEcuLink } from "@/hooks/useEcuLink";
import { CYL_COUNT, GAUGES, STATUS_DEFS, VOLTAGES } from "@/lib/ecu";

export default function App() {
  const link = useEcuLink();
  const { state, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps } = useEcuEngine(link);

  return (
    <div className="hud-backdrop scanlines relative flex h-dvh w-full flex-col gap-1.5 overflow-hidden p-1.5 text-foreground md:gap-2.5 md:p-2.5">
      <TopBar fps={fps} linkStatus={link.status} />

      {/* RPM hero */}
      <HudPanel title="Engine Speed" accent="#ff2d55" className="shrink-0">
        <RpmBar rpm={state.rpm} load={state.load} />
      </HudPanel>

      {/* Main grid — mobile: full-width sections stacked; md+: gauges left, scope cluster right */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 md:grid md:grid-cols-12 md:grid-rows-1 md:gap-2.5">
        {/* Left: gauges + voltages */}
        <div className="flex shrink-0 flex-col gap-1.5 md:col-span-4 md:min-h-0 md:shrink md:gap-2.5">
          <HudPanel
            title="Analog Sensors"
            accent="#00e7f2"
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="grid h-[64px] grid-cols-3 grid-rows-1 gap-1 overflow-hidden md:h-auto md:min-h-0 md:flex-1 md:grid-cols-1 md:grid-rows-3"
          >
            {GAUGES.map((g) => (
              <Gauge key={g.key} def={g} value={state[g.key]} />
            ))}
          </HudPanel>
          <HudPanel title="Voltage Rails" accent="#2bff88" className="shrink-0" bodyClassName="grid grid-cols-2 gap-x-3 gap-y-1 md:grid-cols-1 md:gap-2">
            {VOLTAGES.map((v) => (
              <VoltageMeter key={v.key} def={v} value={state[v.key]} />
            ))}
          </HudPanel>
        </div>

        {/* Right: scope + coils + injectors */}
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 md:col-span-8 md:gap-2.5">
          <HudPanel
            title="Signal Oscilloscope · CKP / CMP1 / CMP2"
            accent="#ff36c8"
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="flex-1 min-h-0"
          >
            <WaveformScope
              phaseRef={phaseRef}
              rpmRef={rpmRef}
              cmpRef={cmpRef}
              cmpPhaseRef={cmpPhaseRef}
            />
          </HudPanel>

          <HudPanel title="Ignition Coils ×8" accent="#00e7f2" className="shrink-0" bodyClassName="grid grid-cols-8 gap-1 sm:gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <CoilIndicator key={i} index={i} dwell={state.coils[i]} spark={state.coilSpark[i]} />
            ))}
          </HudPanel>

          <HudPanel title="Injectors ×8" accent="#2bff88" className="shrink-0" bodyClassName="grid grid-cols-8 gap-1 sm:gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <InjectorAnimation key={i} index={i} value={state.injectors[i]} />
            ))}
          </HudPanel>
        </div>
      </div>

      {/* Status strip */}
      <HudPanel title="Digital Status · 12 Channels" accent="#9d6bff" className="shrink-0" bodyClassName="grid grid-cols-6 gap-1 sm:grid-cols-4 sm:gap-1.5 md:grid-cols-6 xl:grid-cols-12">
        {STATUS_DEFS.map((s) => (
          <StatusIndicator key={s.key} def={s} on={!!state.status[s.key]} />
        ))}
      </HudPanel>
    </div>
  );
}
