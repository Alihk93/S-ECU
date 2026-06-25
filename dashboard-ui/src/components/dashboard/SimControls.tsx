import { RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CYL_COUNT,
  GAUGES,
  STATUS_DEFS,
  VOLTAGES,
  type StatusKey,
} from "@/lib/ecu";
import type { CmpMode } from "@/lib/sim";
import type { EngineControls } from "@/hooks/useEcuEngine";
import { cn } from "@/lib/utils";

interface SimControlsProps {
  controls: EngineControls;
  setControls: (patch: Partial<EngineControls>) => void;
}

const ANALOG = [
  ...GAUGES.map((g) => ({ key: g.key, label: g.label, unit: g.unit, min: g.min, max: g.max, step: 1 })),
  ...VOLTAGES.map((v) => ({ key: v.key, label: v.label, unit: v.unit, min: v.min, max: v.max, step: 0.05 })),
] as const;

export function SimControls({ controls, setControls }: SimControlsProps) {
  const setManual = (key: string, val: number | null) => {
    const manual = { ...controls.manual } as Record<string, number>;
    if (val === null) delete manual[key];
    else manual[key] = val;
    setControls({ manual });
  };

  const toggleStatus = (key: StatusKey) => {
    const cur = controls.statusOverride[key];
    const next = { ...controls.statusOverride };
    if (cur === undefined) next[key] = 1;
    else if (cur === 1) next[key] = 0;
    else delete next[key];
    setControls({ statusOverride: next });
  };

  const setForce = (kind: "coilForce" | "injForce", i: number) => {
    const arr = [...controls[kind]];
    arr[i] = !arr[i];
    setControls({ [kind]: arr } as Partial<EngineControls>);
  };

  return (
    <Tabs defaultValue="drive" className="flex h-full flex-col">
      <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
        <TabsTrigger value="drive" className="font-display text-[10px] uppercase tracking-wide">Drive</TabsTrigger>
        <TabsTrigger value="analog" className="font-display text-[10px] uppercase tracking-wide">Analog</TabsTrigger>
        <TabsTrigger value="wave" className="font-display text-[10px] uppercase tracking-wide">Wave</TabsTrigger>
        <TabsTrigger value="digital" className="font-display text-[10px] uppercase tracking-wide">Digital</TabsTrigger>
      </TabsList>

      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        <TabsContent value="drive" className="mt-0 space-y-5">
          <Field label="Engine RPM" value={`${Math.round(controls.targetRpm)}`} unit="rpm">
            <Slider
              min={0}
              max={7500}
              step={10}
              value={[controls.targetRpm]}
              disabled={controls.autoRev}
              onValueChange={([v]) => setControls({ targetRpm: v })}
            />
          </Field>
          <Row label="Auto-rev sweep">
            <Switch
              checked={controls.autoRev}
              onCheckedChange={(v) => setControls({ autoRev: v })}
            />
          </Row>
          <Field label="Engine load" value={`${Math.round(controls.load * 100)}`} unit="%">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[controls.load * 100]}
              onValueChange={([v]) => setControls({ load: v / 100 })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Preset label="Idle" onClick={() => setControls({ targetRpm: 850, load: 0.1, autoRev: false })} />
            <Preset label="Cruise" onClick={() => setControls({ targetRpm: 2600, load: 0.35, autoRev: false })} />
            <Preset label="WOT" onClick={() => setControls({ targetRpm: 6200, load: 1, autoRev: false })} />
          </div>
        </TabsContent>

        <TabsContent value="analog" className="mt-0 space-y-4">
          {ANALOG.map((a) => {
            const manual = controls.manual[a.key as keyof typeof controls.manual];
            const isManual = manual !== undefined;
            return (
              <div key={a.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
                    {a.label}
                  </span>
                  <button
                    onClick={() =>
                      setManual(a.key, isManual ? null : (a.min + a.max) / 2)
                    }
                    className={cn(
                      "rounded-sm border px-1.5 py-0.5 font-data text-[9px] uppercase",
                      isManual
                        ? "border-neon-amber/60 text-neon-amber"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {isManual ? "manual" : "auto"}
                  </button>
                </div>
                <Slider
                  min={a.min}
                  max={a.max}
                  step={a.step}
                  value={[isManual ? (manual as number) : a.min]}
                  disabled={!isManual}
                  onValueChange={([v]) => setManual(a.key, v)}
                />
                {isManual && (
                  <div className="text-right font-data text-[10px] text-neon-amber">
                    {(manual as number).toFixed(a.step < 1 ? 2 : 0)} {a.unit}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="wave" className="mt-0 space-y-5">
          <div className="space-y-2">
            <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
              CMP sync mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["sync", "advance", "fault"] as CmpMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setControls({ cmpMode: m })}
                  className={cn(
                    "rounded-sm border py-1.5 font-display text-[10px] uppercase tracking-wide",
                    controls.cmpMode === m
                      ? "border-neon-magenta/60 bg-neon-magenta/10 text-neon-magenta"
                      : "border-border text-muted-foreground hover:border-neon-magenta/30",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="font-data text-[9px] leading-relaxed text-muted-foreground/70">
              {controls.cmpMode === "sync" && "Cam aligned to crank — normal timing."}
              {controls.cmpMode === "advance" && "Cam pulse advanced 60° — timing offset demo."}
              {controls.cmpMode === "fault" && "Intermittent cam — lost-sync / signal-integrity demo."}
            </p>
          </div>
          <Field label="CMP phase" value={`${Math.round(controls.cmpPhase)}`} unit="°">
            <Slider
              min={0}
              max={360}
              step={1}
              value={[controls.cmpPhase]}
              onValueChange={([v]) => setControls({ cmpPhase: v })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="digital" className="mt-0 space-y-4">
          <ForceGrid
            title="Force coils"
            count={CYL_COUNT}
            prefix="C"
            active={controls.coilForce}
            onToggle={(i) => setForce("coilForce", i)}
            color="#00e7f2"
          />
          <ForceGrid
            title="Force injectors"
            count={CYL_COUNT}
            prefix="I"
            active={controls.injForce}
            onToggle={(i) => setForce("injForce", i)}
            color="#2bff88"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
                Status overrides
              </span>
              <button
                onClick={() => setControls({ statusOverride: {} })}
                className="flex items-center gap-1 font-data text-[9px] text-muted-foreground hover:text-neon-cyan"
              >
                <RotateCcw className="h-3 w-3" /> clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_DEFS.map((s) => {
                const ov = controls.statusOverride[s.key];
                const tag = ov === undefined ? "auto" : ov === 1 ? "ON" : "OFF";
                const col = ov === undefined ? "#5b6b7a" : ov === 1 ? s.color : "#ff2d55";
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleStatus(s.key)}
                    className="flex items-center justify-between rounded-sm border border-border px-2 py-1 hover:border-foreground/30"
                  >
                    <span className="font-display text-[9px] uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </span>
                    <span className="font-data text-[9px]" style={{ color: col }}>
                      {tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function Field({
  label,
  value,
  unit,
  children,
}: {
  label: string;
  value: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="font-data text-sm text-foreground">
          {value} <span className="text-[10px] text-muted-foreground">{unit}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-border py-1.5 font-display text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan"
    >
      {label}
    </button>
  );
}

function ForceGrid({
  title,
  count,
  prefix,
  active,
  onToggle,
  color,
}: {
  title: string;
  count: number;
  prefix: string;
  active: boolean[];
  onToggle: (i: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <span className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className="rounded-sm border py-1 font-data text-[9px]"
            style={{
              borderColor: active[i] ? color : "hsl(var(--border))",
              color: active[i] ? color : "#5b6b7a",
              background: active[i] ? `${color}18` : "transparent",
              boxShadow: active[i] ? `0 0 8px -2px ${color}` : "none",
            }}
          >
            {prefix}
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
