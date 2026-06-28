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

function noise(amp: number): number {
  return (Math.random() - 0.5) * 2 * amp;
}

/** Derive realistic analog values from rpm + load. */
export function deriveAnalog(rpm: number, load: number, tSec: number) {
  const rpmN = Math.min(rpm / 7000, 1);
  // MAP: ~30 kPa at idle vacuum, rising toward atmospheric+boost under load
  const map = 28 + load * 175 + rpmN * 15 + noise(2.5);
  // MAF airflow scales with rpm × load
  const maf = 3 + rpmN * load * 360 + rpmN * 25 + noise(4);
  // IAT warms slowly, drifts with a slow sine to look alive. load coeff mirrors main.c:
  // deliberately aggressive so high load crosses the FAN1 (>70) / FAN2 (>84) thresholds.
  const iat = 38 + 18 * Math.sin(tSec * 0.05) + load * 70 + noise(0.6);
  // ECU voltage sags slightly under cranking/load, alternator ~13.8
  const ecuV = 13.8 - load * 0.5 + 0.2 * Math.sin(tSec * 0.7) + noise(0.05);
  const sensorV = 5.0 + noise(0.012);
  // Coolant warms toward operating temp; climbs a little more under sustained load.
  const cts = 82 + load * 22 + 6 * Math.sin(tSec * 0.03) + noise(0.5);
  // Ignition feedback health: high while running, small dip with rpm.
  const igf = rpm > 0 ? 94 + 5 * Math.sin(tSec * 0.4) - rpmN * 2 + noise(0.6) : 0;
  // ECU self-consumption (external CT): driver + logic load, grows with activity.
  const cur = 0.7 + rpmN * 1.9 + load * 0.6 + noise(0.03);
  // Engine/system current: pump + fans + coils/injectors + alternator field.
  const amp = 6 + rpmN * 22 + load * 12 + (iat > 70 ? 8 : 0) + noise(0.2);
  // GDI high-pressure fuel rail: low at idle, ramps hard with load.
  const hip = 35 + load * 165 + rpmN * 12 + noise(1.5);
  return {
    map: clamp(map, 0, 250),
    maf: clamp(maf, 0, 400),
    iat: clamp(iat, -20, 120),
    cts: clamp(cts, -20, 130),
    igf: clamp(igf, 0, 100),
    ecuV: clamp(ecuV, 0, 25),
    sensorV: clamp(sensorV, 0, 5),
    cur: clamp(cur, 0, 20),
    amp: clamp(amp, 0, 60),
    hip: clamp(hip, 0, 250),
  };
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
