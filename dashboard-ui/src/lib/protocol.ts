// S-ECU firmware <-> frontend wire contract.
// THIS FILE IS THE SOURCE OF TRUTH. Any change here must be mirrored byte-for-byte
// in the firmware telemetry serializer (Firmware/Smart_ECU/main/main.c, telemetry_task).
//
// Transport: WebSocket text frame, same-origin ws://<host>/ws, ESP -> browser only.
// Cadence:   30 Hz, sent on change + a 0.5 s heartbeat.
// Payload:   minified JSON, short keys, integer-biased to keep frames tiny and parsing cheap.
//
// Example frame:
//   {"rpm":850,"ld":12,"maf":7,"map":52,"iat":42,"cts":88,"igf":97,"ev":1380,"cur":140,
//    "amp":1820,"sv":500,"iac":120,"hip":45,"st":4095,"cm":0,"cp":10}
//
//  key | meaning                    | encoding / range
//  ----+----------------------------+--------------------------------------------------
//  rpm | engine speed               | int 0..7500
//  ld  | load / throttle            | percent int 0..100   (browser uses ld/100 -> 0..1)
//  maf | mass air flow              | int g/s 0..400
//  map | manifold abs. pressure     | int kPa 0..250
//  iat | intake air temp            | int degC (may be negative)
//  cts | coolant temp               | int degC (may be negative)
//  igf | ignition feedback          | int % 0..100
//  ev  | ECU voltage                | int volts*100  (1380 = 13.80 V), 0..2500
//  cur | ECU self-consumption (CT)  | int amps*100   (140 = 1.40 A),   0..2000
//  amp | engine/system current      | int amps*100   (1820 = 18.20 A), 0..6000
//  sv  | sensor Vref                | int volts*100  (500 = 5.00 V),   0..500
//  iac | IAC stepper position       | int 0..200
//  hip | GDI high-pressure fuel rail| int bar 0..250
//  st  | digital status bitmask     | 12-bit int, bit i = STATUS_BIT_ORDER[i]
//  cm  | cam (CMP) mode for scope   | 0 sync | 1 advance | 2 fault
//  cp  | cam phase offset           | int crank deg
//
// NOTE: CKP/CMP waveforms, the CAN HI/LO traces, and the coil / port-injector /
// GDI-injector firing animations are DERIVED in the browser from `rpm` (+ cm/cp), per
// the locked "fluidity = cadence + interpolation" decision — they are NOT streamed.
// When real per-channel coil/injector sensing is added, extend this contract with
// `cl`/`in` 8-bit masks and have the engine prefer them.

import type { StatusKey } from "./ecu";
import { STATUS_KEYS, emptyStatus } from "./ecu";
import type { CmpMode } from "./sim";

// Bit position in `st` == index in this array. MUST match the firmware bit order.
export const STATUS_BIT_ORDER: readonly StatusKey[] = STATUS_KEYS;

const CMP_MODES: CmpMode[] = ["sync", "advance", "fault"];

export interface LiveFrame {
  rpm: number;
  load: number; // 0..1
  maf: number;
  map: number;
  iat: number;
  cts: number;
  igf: number;
  ecuV: number;
  cur: number; // amps
  amp: number; // amps
  sensorV: number;
  iacStep: number;
  hip: number; // bar
  status: Record<StatusKey, number>;
  cmpMode: CmpMode;
  cmpPhase: number;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Parse a wire frame. Returns null on malformed JSON so the link can ignore it. */
export function parseFrame(data: string): LiveFrame | null {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (raw === null || typeof raw !== "object" || raw.rpm === undefined) return null;

  const st = num(raw.st, 0);
  const status = emptyStatus();
  STATUS_BIT_ORDER.forEach((key, bit) => {
    status[key] = (st >> bit) & 1;
  });

  const cm = num(raw.cm, 0);
  return {
    rpm: num(raw.rpm, 0),
    load: num(raw.ld, 0) / 100,
    maf: num(raw.maf, 0),
    map: num(raw.map, 0),
    iat: num(raw.iat, 0),
    cts: num(raw.cts, 0),
    igf: num(raw.igf, 0),
    ecuV: num(raw.ev, 0) / 100,
    cur: num(raw.cur, 0) / 100,
    amp: num(raw.amp, 0) / 100,
    sensorV: num(raw.sv, 0) / 100,
    iacStep: num(raw.iac, 0),
    hip: num(raw.hip, 0),
    status,
    cmpMode: CMP_MODES[cm] ?? "sync",
    cmpPhase: num(raw.cp, 10),
  };
}
