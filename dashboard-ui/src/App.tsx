import { CanScope } from "@/components/dashboard/CanScope";
import { CoilIndicator } from "@/components/dashboard/CoilIndicator";
import { Gauge } from "@/components/dashboard/Gauge";
import { HudPanel } from "@/components/dashboard/HudPanel";
import { InjectorAnimation } from "@/components/dashboard/InjectorAnimation";
import { PowerDisplay } from "@/components/dashboard/PowerDisplay";
import { StatusClusters, SystemIcons } from "@/components/dashboard/StatusCluster";
import { Tachometer } from "@/components/dashboard/Tachometer";
import { TopBar } from "@/components/dashboard/TopBar";
import { WaveformScope } from "@/components/dashboard/WaveformScope";
import { useEcuEngine } from "@/hooks/useEcuEngine";
import { useEcuLink } from "@/hooks/useEcuLink";
import { CYL_COUNT, GAUGES } from "@/lib/ecu";
import { clamp } from "@/lib/sim";

export default function App() {
  const link = useEcuLink();
  const { state, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps } = useEcuEngine(link);
  const running = state.rpm > 0;

  return (
    <div className="hud-backdrop scanlines relative flex h-dvh w-full flex-col gap-1.5 overflow-hidden p-1.5 text-foreground short:gap-1.5 short:p-1.5 md:gap-2.5 md:p-2.5">
      <TopBar fps={fps} linkStatus={link.status} />

      {/* Main grid — stacked & scrollable on phones; locked 3-column no-scroll on
          wide/short (landscape) and fit (wide+tall / TV) to match the layout sketch. */}
      <main className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5 short:grid short:grid-cols-12 short:grid-rows-1 short:gap-2 short:overflow-hidden short:pr-0 fit:grid fit:grid-cols-12 fit:grid-rows-1 fit:gap-2.5 fit:overflow-hidden fit:pr-0">
        {/* ───────── LEFT: scope · analog gauges · system rail ───────── */}
        <div className="flex flex-col gap-1.5 short:col-span-3 short:min-h-0 short:gap-2 fit:col-span-3 fit:min-h-0 fit:gap-2.5">
          <HudPanel
            title="Oscilloscope · CKP / CMP1 / CMP2"
            accent="#ff36c8"
            className="flex min-h-0 shrink-0 flex-col short:flex-1 fit:flex-1"
            bodyClassName="flex-1 min-h-0"
          >
            <WaveformScope
              phaseRef={phaseRef}
              rpmRef={rpmRef}
              cmpRef={cmpRef}
              cmpPhaseRef={cmpPhaseRef}
            />
          </HudPanel>

          <HudPanel
            title="Analog Sensors"
            accent="#00e7f2"
            className="flex min-h-0 shrink-0 flex-col short:flex-1 fit:flex-1"
            bodyClassName="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-1 short:gap-1.5 md:gap-2"
          >
            {GAUGES.map((g) => (
              <Gauge key={g.key} def={g} value={state[g.key]} />
            ))}
          </HudPanel>

          <HudPanel title="System" accent="#2bff88" className="shrink-0">
            <SystemIcons status={state.status} className="flex items-start justify-around gap-2" />
          </HudPanel>
        </div>

        {/* ───────── CENTER: tachometer · CAN bus ───────── */}
        <div className="flex flex-col gap-1.5 short:col-span-4 short:min-h-0 short:gap-2 fit:col-span-4 fit:min-h-0 fit:gap-2.5">
          <HudPanel
            title="Engine Speed · RPM"
            accent="#ff2d55"
            className="flex min-h-0 shrink-0 flex-col short:flex-1 fit:flex-1"
            bodyClassName="flex-1 min-h-0 flex"
          >
            <Tachometer rpm={state.rpm} load={state.load} />
          </HudPanel>

          <HudPanel
            title="CAN Bus · HI / LO"
            accent="#00e7f2"
            className="flex min-h-0 shrink-0 flex-col short:h-[34%] fit:h-[34%]"
            bodyClassName="flex-1 min-h-0"
          >
            <CanScope active={running} />
          </HudPanel>
        </div>

        {/* ───────── RIGHT: power · coils · injectors · status · GDI ───────── */}
        <div className="flex flex-col gap-1.5 short:col-span-5 short:min-h-0 short:gap-2 fit:col-span-5 fit:min-h-0 fit:gap-2.5">
          <HudPanel title="Power · ECU" accent="#2bff88" className="shrink-0">
            <PowerDisplay cur={state.cur} ecuV={state.ecuV} amp={state.amp} />
          </HudPanel>

          <HudPanel title="Ignition Coils ×8" accent="#ff2d3a" className="shrink-0" bodyClassName="grid grid-cols-8 gap-1 sm:gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <CoilIndicator key={i} index={i} dwell={state.coils[i]} spark={state.coilSpark[i]} />
            ))}
          </HudPanel>

          <HudPanel title="Injectors ×8" accent="#29c2ff" className="shrink-0" bodyClassName="grid grid-cols-8 gap-1 sm:gap-1.5">
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <InjectorAnimation key={i} index={i} value={state.injectors[i]} prefix="I" />
            ))}
          </HudPanel>

          <HudPanel title="Status" accent="#9d6bff" className="shrink-0">
            <StatusClusters
              status={state.status}
              iacStep={state.iacStep}
              className="grid grid-cols-5 gap-1.5"
            />
          </HudPanel>

          <HudPanel title="INJ GDI ×8" accent="#29c2ff" className="shrink-0" bodyClassName="grid grid-cols-9 items-stretch gap-1 sm:gap-1.5">
            {/* HI P — GDI high-pressure fuel rail */}
            <div className="panel flex flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1">
              <span className="font-display text-[9px] uppercase tracking-hud text-muted-foreground">HI&nbsp;P</span>
              <span className="font-data text-base font-bold leading-none" style={{ color: "#ff9a4d" }}>
                {Math.round(state.hip)}
              </span>
              <span className="font-data text-[8px] text-muted-foreground">bar</span>
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${clamp(state.hip / 250, 0, 1) * 100}%`,
                    background: "#ff7a18",
                    boxShadow: "0 0 6px #ff7a18",
                  }}
                />
              </div>
            </div>
            {Array.from({ length: CYL_COUNT }).map((_, i) => (
              <InjectorAnimation key={i} index={i} value={state.gdiInjectors[i]} prefix="G" />
            ))}
          </HudPanel>
        </div>
      </main>
    </div>
  );
}
