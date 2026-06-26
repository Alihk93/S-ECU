import { useEffect, useRef, useState } from "react";
import { CYL_COUNT, emptyStatus, type EcuState } from "@/lib/ecu";
import { coilState, injectorState, type CmpMode } from "@/lib/sim";
import type { EcuLink } from "@/hooks/useEcuLink";

/**
 * Read-only telemetry engine. The dashboard is driven exclusively by the live
 * frame streamed from the ESP32-S3 — there is no in-browser simulation and no
 * user controls. The CKP/CMP oscilloscope and the per-cylinder coil/injector
 * firings are derived browser-side from the streamed rpm (+cm/cp), per the
 * locked contract; everything else comes straight off the frame. When no frame
 * is flowing the display reads zero/standby.
 */
export function useEcuEngine(link?: EcuLink) {
  // Stable refs so the rAF loop can read the live link without re-subscribing.
  const fallbackConnected = useRef(false);
  const fallbackFrame = useRef<EcuLink["frameRef"]["current"]>(null);
  const linkConnectedRef = link?.connectedRef ?? fallbackConnected;
  const linkFrameRef = link?.frameRef ?? fallbackFrame;

  const [state, setState] = useState<EcuState>(() => ({
    rpm: 0,
    load: 0,
    crankAngle: 0,
    maf: 0,
    map: 0,
    iat: 0,
    ecuV: 0,
    sensorV: 0,
    coils: Array(CYL_COUNT).fill(0),
    coilSpark: Array(CYL_COUNT).fill(false),
    injectors: Array(CYL_COUNT).fill(0),
    status: emptyStatus(),
    iacStep: 0,
  }));

  // Refs read by the oscilloscope at full 60fps without forcing React re-renders.
  const phaseRef = useRef(0); // monotonic crank angle, drives scope scroll
  const rpmRef = useRef(0);
  const cmpRef = useRef<CmpMode>("sync");
  const cmpPhaseRef = useRef(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastEmit = 0;
    let crank = 0;
    let rpm = 0;
    let iac = 0;
    let frames = 0;
    let fpsAt = last;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const live = linkConnectedRef.current ? linkFrameRef.current : null;

      // Live rpm drives the needle directly; with no link the engine winds down to 0.
      const target = live ? live.rpm : 0;
      rpm += (target - rpm) * Math.min(1, dt * (live ? 6 : 4));
      if (rpm < 1) rpm = 0;

      const dAngle = (rpm / 60) * 360 * dt;
      crank = (crank + dAngle) % 720;
      phaseRef.current += dAngle;
      rpmRef.current = rpm;

      const load = live ? live.load : 0;
      const maf = live ? live.maf : 0;
      const map = live ? live.map : 0;
      const iat = live ? live.iat : 0;
      const ecuV = live ? live.ecuV : 0;
      const sensorV = live ? live.sensorV : 0;

      // Coils/injectors are derived from crank angle (firing order); per the locked
      // contract they are NOT streamed.
      const coils: number[] = [];
      const coilSpark: boolean[] = [];
      const injectors: number[] = [];
      for (let i = 0; i < CYL_COUNT; i++) {
        const cs = coilState(i, crank);
        coils.push(rpm > 0 ? cs.dwell : 0);
        coilSpark.push(rpm > 0 && cs.spark);
        injectors.push(rpm > 0 ? injectorState(i, crank, load) : 0);
      }

      // Cam (CMP) mode + phase for the scope come straight off the frame.
      if (live) {
        cmpRef.current = live.cmpMode;
        cmpPhaseRef.current = live.cmpPhase;
      } else {
        cmpRef.current = "sync";
        cmpPhaseRef.current = 0;
      }

      if (live) {
        iac += (live.iacStep - iac) * Math.min(1, dt * 4);
      } else {
        iac += (0 - iac) * Math.min(1, dt * 4);
      }
      const status = live ? live.status : emptyStatus();

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
          load,
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
  }, [linkConnectedRef, linkFrameRef]);

  return { state, phaseRef, rpmRef, cmpRef, cmpPhaseRef, fps };
}
