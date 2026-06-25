import { CoilIndicator } from "@/components/dashboard/CoilIndicator";
import { DebugPanel } from "@/components/dashboard/DebugPanel";
import { Gauge } from "@/components/dashboard/Gauge";
import { HudPanel } from "@/components/dashboard/HudPanel";
import { InjectorAnimation } from "@/components/dashboard/InjectorAnimation";
import { RpmBar } from "@/components/dashboard/RpmBar";
import { SimControls } from "@/components/dashboard/SimControls";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { TopBar } from "@/components/dashboard/TopBar";
import { VoltageMeter } from "@/components/dashboard/VoltageMeter";
import { WaveformScope } from "@/components/dashboard/WaveformScope";
import { useEcuEngine } from "@/hooks/useEcuEngine";
import { useEcuLink } from "@/hooks/useEcuLink";
import { CYL_COUNT, GAUGES, STATUS_DEFS, VOLTAGES } from "@/lib/ecu";

export default function App() {
  const link = useEcuLink();
  const { state, controls, setControls, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps } =
    useEcuEngine(link);

  return (
    <div className="hud-backdrop scanlines relative flex h-screen w-screen flex-col gap-2.5 overflow-hidden p-2.5 text-foreground">
      <TopBar
        running={controls.running}
        fps={fps}
        linkStatus={link.status}
        onToggleRun={() => setControls({ running: !controls.running })}
      />

      {/* RPM hero */}
      <HudPanel title="Engine Speed" accent="#ff2d55" className="shrink-0">
        <RpmBar rpm={state.rpm} />
      </HudPanel>

      {/* Main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2.5">
        {/* Left: gauges + voltages */}
        <div className="col-span-12 flex min-h-0 flex-col gap-2.5 lg:col-span-3">
          <HudPanel title="Analog Sensors" accent="#00e7f2" className="flex-1" bodyClassName="grid grid-cols-3 gap-1 lg:grid-cols-1">
            {GAUGES.map((g) => (
              <Gauge key={g.key} def={g} value={state[g.key]} />
            ))}
          </HudPanel>
          <HudPanel title="Voltage Rails" accent="#2bff88" bodyClassName="space-y-4">
            {VOLTAGES.map((v) => (
              <VoltageMeter key={v.key} def={v} value={state[v.key]} />
            ))}
          </HudPanel>
        </div>

        {/* Center: scope + coils + injectors */}
        <div className="col-span-12 flex min-h-0 flex-col gap-2.5 lg:col-span-6">
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

          <HudPanel title="Ignition Coils ×8" accent="#00e7f2" bodyClassName="grid grid-cols-8 gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <CoilIndicator key={i} index={i} dwell={state.coils[i]} spark={state.coilSpark[i]} />
            ))}
          </HudPanel>

          <HudPanel title="Injectors ×8" accent="#2bff88" bodyClassName="grid grid-cols-8 gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <InjectorAnimation key={i} index={i} value={state.injectors[i]} />
            ))}
          </HudPanel>
        </div>

        {/* Right: controls + debug */}
        <div className="col-span-12 flex min-h-0 flex-col gap-2.5 lg:col-span-3">
          <HudPanel title="Simulation Console" accent="#ffb000" className="flex min-h-0 flex-[1.4] flex-col" bodyClassName="flex-1 min-h-0">
            <SimControls controls={controls} setControls={setControls} />
          </HudPanel>
          <HudPanel title="Debug · Protocol" accent="#9d6bff" className="flex min-h-0 flex-1 flex-col" bodyClassName="flex-1 min-h-0">
            <DebugPanel state={state} fps={fps} />
          </HudPanel>
        </div>
      </div>

      {/* Status strip */}
      <HudPanel title="Digital Status · 12 Channels" accent="#9d6bff" className="shrink-0" bodyClassName="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
        {STATUS_DEFS.map((s) => (
          <StatusIndicator key={s.key} def={s} on={!!state.status[s.key]} />
        ))}
      </HudPanel>
    </div>
  );
}
