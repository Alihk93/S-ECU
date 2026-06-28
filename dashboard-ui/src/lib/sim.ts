// Pure signal generators for simulation mode. No React, no hardware — deterministic
// functions of crank angle / time so the firmware can later feed the same shapes.

import { CYL_COUNT, FIRING_ORDER } from "./ecu";

export const CKP_TEETH = 60; // 60-2 trigger wheel
export const CKP_MISSING = 2;

export type CmpMode = "sync" | "advance" | "fault";

/** CKP: 60-2 missing-tooth wheel. angle in crank degrees (any range). Returns 0..1. */
export function ckpSample(angleDeg: number): number {
  const a = ((angleDeg % 360) + 360) % 360;
  const toothWidth = 360 / CKP_TEETH; // 6°
  const idx = Math.floor(a / toothWidth);
  // last CKP_MISSING teeth are absent (the sync gap)
  if (idx >= CKP_TEETH - CKP_MISSING) return 0.04;
  const within = (a % toothWidth) / toothWidth;
  return within < 0.5 ? 0.96 : 0.06;
}

/** CMP: one cam pulse per 720° crank. mode shifts/breaks the phase for fault demo. */
export function cmpSample(angle720: number, phaseDeg: number, mode: CmpMode): number {
  const cycle = Math.floor(angle720 / 720); // engine-cycle index (before wrap)
  let a = ((angle720 % 720) + 720) % 720;
  let width = 90; // pulse width in crank deg
  let start = phaseDeg;
  if (mode === "advance") start = phaseDeg - 60;
  if (mode === "fault") {
    // jittery, intermittent cam — drops the whole pulse every 3rd engine cycle
    if (((cycle % 3) + 3) % 3 === 0) return 0.05;
    width = 60 + 40 * Math.sin(a * 0.05);
  }
  const end = start + width;
  const inPulse =
    (a >= start && a <= end) || (a + 720 >= start && a + 720 <= end);
  return inPulse ? 0.92 : 0.06;
}

/** Coil dwell/spark for cylinder i (0-based) at given crank angle (0..720). */
export function coilState(cyl: number, angle720: number): { dwell: number; spark: boolean } {
  const order = FIRING_ORDER.indexOf(cyl + 1); // position in firing sequence
  const fireAt = (order * 720) / CYL_COUNT; // even spacing across 720°
  const dwellDeg = 60;
  const a = ((angle720 % 720) + 720) % 720;
  let d = a - (fireAt - dwellDeg);
  if (d < 0) d += 720;
  if (d <= dwellDeg) {
    const ratio = d / dwellDeg;
    return { dwell: 0.2 + 0.8 * ratio, spark: ratio > 0.93 };
  }
  return { dwell: 0, spark: false };
}

/** Injector pulse for cylinder i — opens just before its intake, width scales with load.
 *  bankOffsetDeg shifts the timing for a second (GDI) bank: GDI sprays late, near
 *  compression, so it fires offset from the port injector. */
export function injectorState(
  cyl: number,
  angle720: number,
  load: number,
  bankOffsetDeg = 0,
): number {
  const order = FIRING_ORDER.indexOf(cyl + 1);
  const openAt = (order * 720) / CYL_COUNT - 120 + bankOffsetDeg;
  const widthDeg = 40 + 140 * load; // longer pulse under load
  const a = ((angle720 % 720) + 720) % 720;
  let d = a - ((openAt % 720) + 720) % 720;
  if (d < 0) d += 720;
  if (d <= widthDeg) return 1 - d / widthDeg;
  return 0;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
