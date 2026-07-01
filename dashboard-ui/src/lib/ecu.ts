// S-ECU domain model — signal definitions and types.
// Adding a new gauge / voltage / status flag = add one entry here; the UI maps over these.

export interface GaugeDef {
  key: GaugeKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  color: string; // neon hex
  warn?: number; // value at/above which the gauge reads "hot"
  decimals?: number; // fixed decimals for the digital readout (default 0)
}

export type GaugeKey = "maf" | "map" | "iat" | "cts" | "igf" | "sensorV";

// Left analog cluster, laid out 2×3 to match the panel sketch:
// CTS · MAF / MAP · IAT / 5V · IGF
export const GAUGES: GaugeDef[] = [
  { key: "cts", label: "CTS", unit: "°C", min: 0, max: 130, color: "#ff7a18", warn: 110 },
  { key: "maf", label: "MAF", unit: "g/s", min: 0, max: 400, color: "#00e7f2" },
  { key: "map", label: "MAP", unit: "kPa", min: 0, max: 250, color: "#9d6bff" },
  { key: "iat", label: "IAT", unit: "°C", min: 0, max: 120, color: "#ffb000", warn: 85 },
  { key: "sensorV", label: "5V", unit: "V", min: 0, max: 5, color: "#2d8bff", decimals: 1 },
  { key: "igf", label: "IGF", unit: "%", min: 0, max: 100, color: "#b6ff3c" },
];

export interface VoltageDef {
  key: VoltageKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  nominal: number;
  color: string;
  warnLow: number;
  warnHigh: number;
}

export type VoltageKey = "ecuV" | "sensorV";

export const VOLTAGES: VoltageDef[] = [
  { key: "ecuV", label: "ECU VOLTAGE", unit: "V", min: 0, max: 25, nominal: 13.8, color: "#2bff88", warnLow: 11.5, warnHigh: 15.5 },
  { key: "sensorV", label: "SENSOR VREF", unit: "V", min: 0, max: 5, nominal: 5.0, color: "#2d8bff", warnLow: 4.75, warnHigh: 5.25 },
];

export const STATUS_KEYS = [
  "battery",
  "switch",
  "start",
  "etc",
  "fan1",
  "fan2",
  "fuelPump",
  "immoP",
  "immoN",
  "mrcP",
  "mrcN",
  "iac",
] as const;

export type StatusKey = (typeof STATUS_KEYS)[number];

export interface StatusDef {
  key: StatusKey;
  label: string;
  color: string; // active color
}

export const STATUS_DEFS: StatusDef[] = [
  { key: "battery", label: "BATTERY", color: "#2bff88" },
  { key: "switch", label: "IGN SWITCH", color: "#00e7f2" },
  { key: "start", label: "START", color: "#b6ff3c" },
  { key: "etc", label: "ETC", color: "#00e7f2" },
  { key: "fan1", label: "FAN 1", color: "#2d8bff" },
  { key: "fan2", label: "FAN 2", color: "#2d8bff" },
  { key: "fuelPump", label: "FUEL PUMP", color: "#ffb000" },
  { key: "immoP", label: "IMMO +", color: "#9d6bff" },
  { key: "immoN", label: "IMMO −", color: "#9d6bff" },
  { key: "mrcP", label: "MRC +", color: "#ff36c8" },
  { key: "mrcN", label: "MRC −", color: "#ff36c8" },
  { key: "iac", label: "IAC", color: "#00e7f2" },
];

export const CYL_COUNT = 8;
// V8 firing order (Chevy LS style) — used to sequence coils & injectors over 720° crank.
export const FIRING_ORDER = [1, 8, 7, 2, 6, 5, 4, 3];

export interface EcuState {
  rpm: number;
  load: number; // 0..1 throttle/load
  crankAngle: number; // 0..720 deg
  maf: number;
  map: number;
  iat: number;
  cts: number; // coolant temp °C
  igf: number; // ignition feedback %
  ecuV: number;
  sensorV: number;
  cur: number; // ECU self-consumption current (external CT), amps
  amp: number; // engine/system current, amps
  hip: number; // GDI high-pressure fuel rail, bar
  coils: number[]; // 8 × 0..1 dwell/spark intensity
  coilSpark: boolean[]; // 8 × momentary spark flag
  injectors: number[]; // 8 × 0..1 injection intensity (port)
  gdiInjectors: number[]; // 8 × 0..1 injection intensity (GDI bank)
  status: Record<StatusKey, number>; // 0/1
  iacStep: number; // 0..200 stepper position
}

export const RANGES = {
  rpm: { min: 0, max: 7500, redline: 6500 },
};

export function emptyStatus(): Record<StatusKey, number> {
  return STATUS_KEYS.reduce(
    (acc, k) => ((acc[k] = 0), acc),
    {} as Record<StatusKey, number>,
  );
}
