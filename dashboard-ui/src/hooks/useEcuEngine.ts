import { useCallback, useEffect, useRef, useState } from "react";
import {
  CYL_COUNT,
  emptyStatus,
  RANGES,
  type EcuState,
  type StatusKey,
} from "@/lib/ecu";
import type { LiveFrame } from "@/lib/protocol";
import {
  coilState,
  deriveAnalog,
  injectorState,
  type CmpMode,
} from "@/lib/sim";
import type { EcuLink } from "@/hooks/useEcuLink";

export interface EngineControls {
  running: boolean;
  targetRpm: number;
  autoRev: boolean;
  load: number; // 0..1
  cmpMode: CmpMode;
  cmpPhase: number;
  manual: Partial<Record<"maf" | "map" | "iat" | "ecuV" | "sensorV", number>>;
  statusOverride: Partial<Record<StatusKey, number>>;
  coilForce: boolean[]; // force a coil channel on
  injForce: boolean[];
}

const defaultControls: EngineControls = {
  running: true,
  targetRpm: 850,
  autoRev: false,
  load: 0.12,
  cmpMode: "sync",
  cmpPhase: 10,
  manual: {},
  statusOverride: {},
  coilForce: Array(CYL_COUNT).fill(false),
  injForce: Array(CYL_COUNT).fill(false),
};

function baseStatus(
  rpm: number,
  load: number,
  iat: number,
  running: boolean,
): Record<StatusKey, number> {
  const s = emptyStatus();
  const on = running ? 1 : 0;
  s.switch = on;
  s.battery = on;
  s.fuelPump = on;
  s.immoP = on;
  s.immoN = on;
  s.start = running && rpm > 0 && rpm < 600 ? 1 : 0;
  s.etc = load > 0.05 ? 1 : 0;
  s.fan1 = iat > 70 ? 1 : 0;
  s.fan2 = iat > 84 ? 1 : 0;
  s.mrcP = running && rpm > 1500 ? 1 : 0;
  s.mrcN = running && rpm > 3500 ? 1 : 0;
  s.iac = running && rpm < 1300 ? 1 : 0;
  return s;
}

export function useEcuEngine(link?: EcuLink) {
  const [controls, setControlsState] = useState<EngineControls>(defaultControls);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  // Stable refs so the rAF loop can read the live link without re-subscribing.
  // useRef is always called (rules of hooks); the link's refs win when present.
  const fallbackConnected = useRef(false);
  const fallbackFrame = useRef<LiveFrame | null>(null);
  const linkConnectedRef = link?.connectedRef ?? fallbackConnected;
  const linkFrameRef = link?.frameRef ?? fallbackFrame;

  const [state, setState] = useState<EcuState>(() => ({
    rpm: 0,
    load: 0.12,
    crankAngle: 0,
    maf: 0,
    map: 30,
    iat: 40,
    ecuV: 0,
    sensorV: 0,
    coils: Array(CYL_COUNT).fill(0),
    coilSpark: Array(CYL_COUNT).fill(false),
    injectors: Array(CYL_COUNT).fill(0),
    status: emptyStatus(),
    iacStep: 120,
  }));

  // Refs read by the oscilloscope at full 60fps without forcing React re-renders.
  const crankRef = useRef(0);
  const phaseRef = useRef(0); // monotonic crank angle, drives scope scroll
  const rpmRef = useRef(0);
  const cmpRef = useRef(controls.cmpMode);
  cmpRef.current = controls.cmpMode;
  const cmpPhaseRef = useRef(controls.cmpPhase);
  cmpPhaseRef.current = controls.cmpPhase;
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastEmit = 0;
    let crank = 0;
    let rpm = 0;
    let iac = 120;
    let frames = 0;
    let fpsAt = last;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const c = controlsRef.current;
      const live = linkConnectedRef.current ? linkFrameRef.current : null;

      let target = c.targetRpm;
      if (live) {
        target = live.rpm; // live telemetry drives the needle directly
      } else if (c.running && c.autoRev) {
        const sweep = (Math.sin(now / 2600) + 1) / 2; // 0..1
        target = 800 + sweep * (RANGES.rpm.redline - 800);
      } else if (!c.running) {
        target = 0;
      }
      // Smooth toward target for needle glide (lighter follow when live to stay responsive).
      rpm += (target - rpm) * Math.min(1, dt * (live ? 6 : 2.6));
      if (rpm < 1) rpm = 0;

      const dAngle = (rpm / 60) * 360 * dt;
      crank = (crank + dAngle) % 720;
      crankRef.current = crank;
      phaseRef.current += dAngle;
      rpmRef.current = rpm;

      const load = live ? live.load : c.load;
      const tSec = now / 1000;
      const auto = deriveAnalog(rpm, load, tSec);
      const maf = live ? live.maf : c.manual.maf ?? auto.maf;
      const map = live ? live.map : c.manual.map ?? auto.map;
      const iat = live ? live.iat : c.manual.iat ?? auto.iat;
      const ecuV = live ? live.ecuV : c.manual.ecuV ?? auto.ecuV;
      const sensorV = live ? live.sensorV : c.manual.sensorV ?? auto.sensorV;

      // Coils/injectors are always derived from crank angle (firing order); per the
      // locked contract they are NOT streamed. Manual force only applies in sim mode.
      const coils: number[] = [];
      const coilSpark: boolean[] = [];
      const injectors: number[] = [];
      for (let i = 0; i < CYL_COUNT; i++) {
        if (!live && c.coilForce[i]) {
          coils.push(1);
          coilSpark.push(false);
        } else {
          const cs = coilState(i, crank);
          coils.push(rpm > 0 ? cs.dwell : 0);
          coilSpark.push(rpm > 0 && cs.spark);
        }
        injectors.push(
          !live && c.injForce[i] ? 1 : rpm > 0 ? injectorState(i, crank, load) : 0,
        );
      }

      // Cam (CMP) mode drives the scope; live frame overrides the sim control.
      if (live) {
        cmpRef.current = live.cmpMode;
        cmpPhaseRef.current = live.cmpPhase;
      }

      let status: Record<StatusKey, number>;
      if (live) {
        iac += (live.iacStep - iac) * Math.min(1, dt * 4);
        status = live.status;
      } else {
        const targetIac = c.running ? (rpm < 1300 ? 150 : 40) : 90;
        iac += (targetIac - iac) * Math.min(1, dt * 1.5);
        status = baseStatus(rpm, c.load, iat, c.running);
        for (const k in c.statusOverride) {
          const key = k as StatusKey;
          const v = c.statusOverride[key];
          if (v !== undefined) status[key] = v;
        }
      }

      frames++;
      if (now - fpsAt >= 500) {
        setFps(Math.round((frames * 1000) / (now - fpsAt)));
        frames = 0;
        fpsAt = now;
      }

      // Emit to React at ~30Hz; the scope animates faster off the refs.
      if (now - lastEmit >= 1000 / 30) {
        lastEmit = now;
        setState({
          rpm,
          load: c.load,
          crankAngle: crank,
          maf,
          map,
          iat,
          ecuV,
          sensorV,
          coils,
          coilSpark,
          injectors,
          status,
          iacStep: iac,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setControls = useCallback((patch: Partial<EngineControls>) => {
    setControlsState((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    state,
    controls,
    setControls,
    crankRef,
    phaseRef,
    rpmRef,
    cmpRef,
    cmpPhaseRef,
    fps,
  };
}
