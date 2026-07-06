import { CanScope } from "@/components/dashboard/CanScope";
import { CoilIndicator } from "@/components/dashboard/CoilIndicator";
import { BankCell, DriverBank } from "@/components/dashboard/DriverBank";
import { Gauge } from "@/components/dashboard/Gauge";
import { HudPanel } from "@/components/dashboard/HudPanel";
import { InjectorAnimation } from "@/components/dashboard/InjectorAnimation";
import { StatusGrid, SystemLamps } from "@/components/dashboard/StatusGrid";
import { Tachometer } from "@/components/dashboard/Tachometer";
import { TopBar } from "@/components/dashboard/TopBar";
import { WaveformScope } from "@/components/dashboard/WaveformScope";
import { useEcuEngine } from "@/hooks/useEcuEngine";
import { useEcuLink } from "@/hooks/useEcuLink";
import { CYL_COUNT, GAUGES } from "@/lib/ecu";

// v5 "ECU TESTER · AL-AYED" brushed-steel bench layout (from the reference
// photo): top strip (VOLTAGE · brand+spark · CURRENT) → left column
// (indicator keys · CKP/CMP pulse scope · CAN bus scope) → right column
// (SENSOR GAUGES & RPM: lamps row, chrome speedo + 2×3 mini dials) → bottom
// OUTPUT DRIVER BANKS (COIL / INJ / GDI ×8).

export default function App() {
  const link = useEcuLink();
  const { state, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps } = useEcuEngine(link);
  const running = state.rpm > 0;

  return (
    <div className="bench-frame h-dvh w-full overflow-hidden">
      <div className="hud-backdrop relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-[0.75rem] p-1.5 text-foreground md:gap-2 md:p-2">
        <TopBar fps={fps} linkStatus={link.status} ecuV={state.ecuV} cur={state.cur} />

        <main className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto lg:grid lg:grid-cols-[1.02fr_1fr] lg:overflow-hidden md:gap-2">
          {/* ───── LEFT: indicator keys · CKP/CMP scope · CAN scope ───── */}
          <div className="flex min-h-0 flex-col gap-1.5 md:gap-2">
            <div className="inset-screen shrink-0 rounded-lg p-1.5 md:p-2">
              <StatusGrid
                status={state.status}
                iacStep={state.iacStep}
                className="grid grid-cols-4 grid-rows-2 gap-1.5 md:gap-2"
              />
            </div>

            <HudPanel
              title="Digital CKP/CMP Pulse (CKP, CMP1, CMP2)"
              accent="#ff9d00"
              className="flex min-h-[160px] flex-[1.45] flex-col lg:min-h-0"
              bodyClassName="flex-1 min-h-0"
            >
              <WaveformScope phaseRef={phaseRef} rpmRef={rpmRef} cmpRef={cmpRef} cmpPhaseRef={cmpPhaseRef} />
            </HudPanel>

            <HudPanel
              title="CAN Bus (CAN HI/CAN LO)"
              accent="#49e057"
              className="flex min-h-[120px] flex-1 flex-col lg:min-h-0"
              bodyClassName="flex-1 min-h-0"
            >
              <CanScope active={running} />
            </HudPanel>
          </div>

          {/* ───── RIGHT: sensor gauges & RPM ───── */}
          <HudPanel
            title="Sensor Gauges & RPM"
            variant="metal"
            accent="#2f7fe0"
            className="flex min-h-0 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col gap-1.5 md:gap-2"
          >
            <div className="inset-screen shrink-0 rounded-md px-2 py-1">
              <SystemLamps status={state.status} className="flex items-center justify-around gap-2" />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-1.5 md:gap-2">
              <div className="flex min-h-0 items-center justify-center">
                <Tachometer rpm={state.rpm} load={state.load} />
              </div>
              <div className="grid min-h-0 grid-cols-2 grid-rows-3 gap-1 md:gap-1.5">
                {GAUGES.map((g) => (
                  <Gauge key={g.key} def={g} value={state[g.key]} />
                ))}
              </div>
            </div>
          </HudPanel>
        </main>

        {/* ───── BOTTOM: output driver banks (dark strip, white title) ───── */}
        <div className="inset-screen shrink-0 rounded-lg p-1.5 md:p-2">
          <div className="mb-1 text-center font-display text-[10px] font-bold uppercase tracking-hud text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] md:text-[12px]">
            Output Driver Banks
          </div>
          <div className="grid h-[22vh] grid-cols-3 gap-1.5 short:h-[26vh] md:h-[23vh] md:gap-2">
            <DriverBank title="Coil Bank (1-8)" accent="#f0a818">
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <BankCell key={i} n={i + 1} accent="#f0a818" caption={`Coil ${i + 1}`}>
                  <CoilIndicator index={i} dwell={state.coils[i]} spark={state.coilSpark[i]} />
                </BankCell>
              ))}
            </DriverBank>

            <DriverBank title="Inj Bank (1-8)" accent="#4aa8ff">
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <BankCell key={i} n={i + 1} accent="#4aa8ff" caption={`Injector ${i + 1}`}>
                  <InjectorAnimation index={i} value={state.injectors[i]} prefix="I" />
                </BankCell>
              ))}
            </DriverBank>

            <DriverBank
              title="GDI Bank (1-8)"
              accent="#e33d3d"
              right={
                <span className="flex items-center gap-1 font-data text-[9px] text-[#8d979f]">
                  <span className="uppercase tracking-widest">HI-P</span>
                  <b style={{ color: "#ff9b1d" }}>{Math.round(state.hip)}</b>
                  <span className="opacity-70">bar</span>
                </span>
              }
            >
              {Array.from({ length: CYL_COUNT }).map((_, i) => (
                <BankCell key={i} n={i + 1} accent="#e33d3d" caption={`GDI ${i + 1}`}>
                  <InjectorAnimation index={i} value={state.gdiInjectors[i]} prefix="G" />
                </BankCell>
              ))}
            </DriverBank>
          </div>
        </div>
      </div>
    </div>
  );
}
