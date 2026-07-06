import type { ReactNode } from "react";
import { CanScope } from "@/components/dashboard/CanScope";
import { CoilIndicator } from "@/components/dashboard/CoilIndicator";
import { DriverBank } from "@/components/dashboard/DriverBank";
import { Gauge } from "@/components/dashboard/Gauge";
import { HudPanel } from "@/components/dashboard/HudPanel";
import { HpPumpArt, InjectorAnimation } from "@/components/dashboard/InjectorAnimation";
import { MainAnalogWave } from "@/components/dashboard/MainAnalogWave";
import { StatusGrid } from "@/components/dashboard/StatusGrid";
import { Tachometer } from "@/components/dashboard/Tachometer";
import { TopBar } from "@/components/dashboard/TopBar";
import { WaveformScope } from "@/components/dashboard/WaveformScope";
import { useEcuEngine } from "@/hooks/useEcuEngine";
import { useEcuLink } from "@/hooks/useEcuLink";
import { CYL_COUNT, GAUGES } from "@/lib/ecu";
import { cn } from "@/lib/utils";

// Small titled block for the stacked scopes inside the oscilloscope panel.
function ScopeBlock({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-0.5 font-display text-[8px] font-semibold uppercase tracking-hud text-neon-cyan/90 md:text-[9px]">
        {label}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export default function App() {
  const link = useEcuLink();
  const { state, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps } = useEcuEngine(link);
  const running = state.rpm > 0;

  return (
    <div className="bench-frame h-dvh w-full overflow-hidden">
      <div className="hud-backdrop scanlines relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-[1.05rem] p-1.5 text-foreground md:gap-2 md:p-2">
        <TopBar fps={fps} linkStatus={link.status} ecuV={state.ecuV} cur={state.cur} amp={state.amp} status={state.status} />

        <main className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden md:gap-2">
          {/* ───── middle band: oscilloscope/CAN (left) · gauges+RPM + indicators (right) ───── */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 lg:grid-cols-[1.12fr_1fr] md:gap-2">
            {/* LEFT — oscilloscope & CAN analysis */}
            <HudPanel
              title="Oscilloscope & CAN Analysis"
              accent="#00e7f2"
              className="flex min-h-0 flex-col"
              bodyClassName="flex min-h-0 flex-1 flex-col gap-1.5 md:gap-2"
            >
              <ScopeBlock label="Main Analog Wave" className="flex-1">
                <MainAnalogWave rpmRef={rpmRef} />
              </ScopeBlock>
              <ScopeBlock label="Digital CKP / CMP Pulse (CKP, CMP1, CMP2)" className="flex-[1.5]">
                <WaveformScope phaseRef={phaseRef} rpmRef={rpmRef} cmpRef={cmpRef} cmpPhaseRef={cmpPhaseRef} />
              </ScopeBlock>
              <ScopeBlock label="CAN Bus (CAN HI / CAN LO)" className="flex-1">
                <CanScope active={running} />
              </ScopeBlock>
            </HudPanel>

            {/* RIGHT — sensor gauges + RPM, then indicators */}
            <div className="flex min-h-0 flex-col gap-1.5 md:gap-2">
              <HudPanel
                title="Sensor Gauges & RPM"
                accent="#ff9d00"
                className="flex min-h-0 flex-1 flex-col"
                bodyClassName="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-1.5 md:gap-2"
              >
                <div className="flex min-h-0 items-center justify-center">
                  <Tachometer rpm={state.rpm} load={state.load} />
                </div>
                <div className="grid min-h-0 grid-cols-2 grid-rows-3 gap-1 md:gap-1.5">
                  {GAUGES.map((g) => (
                    <Gauge key={g.key} def={g} value={state[g.key]} />
                  ))}
                </div>
              </HudPanel>

              <HudPanel title="Indicators" accent="#2bff88" className="shrink-0">
                <StatusGrid
                  status={state.status}
                  iacStep={state.iacStep}
                  className="grid grid-cols-4 grid-rows-2 gap-1.5"
                />
              </HudPanel>
            </div>
          </div>

          {/* ───── bottom: output driver banks ───── */}
          <div className="grid h-[26vh] shrink-0 grid-cols-3 gap-1.5 short:h-[30vh] md:h-[27vh] md:gap-2">
            <DriverBank title="Coil Bank (1-8)" accent="#ffb000">
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <CoilIndicator key={i} index={i} dwell={state.coils[i]} spark={state.coilSpark[i]} />
              ))}
            </DriverBank>

            <DriverBank title="Inj Bank (1-8)" accent="#2d8bff">
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <InjectorAnimation key={i} index={i} value={state.injectors[i]} prefix="I" />
              ))}
            </DriverBank>

            <DriverBank
              title="GDI Bank (1-8)"
              accent="#ff2d3a"
              right={
                <span className="flex items-center gap-1 font-data text-[9px] text-muted-foreground">
                  <span className="uppercase tracking-widest">HI-P</span>
                  <b style={{ color: "#ff9d3c" }}>{Math.round(state.hip)}</b>
                  <span className="opacity-70">bar</span>
                  <HpPumpArt className="ml-0.5 h-5 w-4" />
                </span>
              }
            >
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <InjectorAnimation key={i} index={i} value={state.gdiInjectors[i]} prefix="G" />
              ))}
            </DriverBank>
          </div>
        </main>
      </div>
    </div>
  );
}
