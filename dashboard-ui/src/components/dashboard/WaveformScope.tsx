import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { ckpSample, cmpSample, type CmpMode } from "@/lib/sim";

interface ScopeProps {
  phaseRef: MutableRefObject<number>;
  rpmRef: MutableRefObject<number>;
  cmpRef: MutableRefObject<CmpMode>;
  cmpPhaseRef: MutableRefObject<number>;
  windowDeg?: number;
}

const LANES = [
  { key: "ckp", label: "CKP", color: "#00e7f2", fn: (a: number) => ckpSample(a) },
  { key: "cmp1", label: "CMP1", color: "#ff36c8", fn: null },
  { key: "cmp2", label: "CMP2", color: "#2bff88", fn: null },
] as const;

export function WaveformScope({
  phaseRef,
  rpmRef,
  cmpRef,
  cmpPhaseRef,
  windowDeg = 1080,
}: ScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [readout, setReadout] = useState({ rpm: 0, deg: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let lastReadout = 0;

    const draw = (now: number) => {
      const phase = phaseRef.current;
      const cmpMode: CmpMode = cmpRef.current;
      const cmpPhase = cmpPhaseRef.current;
      const laneH = H / 3;
      const pad = 10;

      // backdrop
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#04080b";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(45,110,130,0.16)";
      ctx.beginPath();
      const cols = 24;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * W;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      const rows = 9;
      for (let i = 0; i <= rows; i++) {
        const y = (i / rows) * H;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // lane separators + labels
      LANES.forEach((lane, li) => {
        const top = li * laneH;
        ctx.strokeStyle = "rgba(120,160,180,0.12)";
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(W, top);
        ctx.stroke();

        ctx.font = "600 11px 'Chakra Petch', sans-serif";
        ctx.fillStyle = lane.color;
        ctx.globalAlpha = 0.9;
        ctx.fillText(lane.label, 8, top + 16);
        ctx.globalAlpha = 1;

        // trace
        const yMid = top + laneH / 2;
        const amp = laneH / 2 - pad;
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const ang = phase - (1 - x / W) * windowDeg;
          let v: number;
          if (lane.key === "ckp") v = ckpSample(ang);
          else if (lane.key === "cmp1") v = cmpSample(ang, cmpPhase, cmpMode);
          else v = cmpSample(ang, cmpPhase + 360, cmpMode);
          const y = yMid + amp - v * 2 * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = lane.color;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 8;
        ctx.shadowColor = lane.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // sweep head
      ctx.fillStyle = "rgba(0,231,242,0.9)";
      ctx.fillRect(W - 1.5, 0, 1.5, H);

      if (now - lastReadout > 120) {
        lastReadout = now;
        setReadout({
          rpm: Math.round(rpmRef.current),
          deg: Math.round(((phase % 720) + 720) % 720),
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phaseRef, rpmRef, cmpRef, cmpPhaseRef, windowDeg]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 hidden items-center justify-between md:flex">
        <div className="flex items-center gap-3 font-data text-[10px] text-muted-foreground">
          <span>
            <span className="text-neon-cyan">CKP</span> 60-2
          </span>
          <span className="text-neon-magenta">CMP1</span>
          <span className="text-neon-green">CMP2</span>
        </div>
        <div className="flex items-center gap-3 font-data text-[10px]">
          <span className="text-muted-foreground">
            θ <span className="text-foreground">{readout.deg}°</span>
          </span>
          <span className="text-muted-foreground">
            n <span className="text-foreground">{readout.rpm}</span> rpm
          </span>
          <span className="text-muted-foreground">
            win <span className="text-foreground">{windowDeg}°</span>
          </span>
        </div>
      </div>
      <div
        ref={wrapRef}
        className="scanlines relative min-h-0 flex-1 overflow-hidden rounded-sm border border-border md:min-h-[200px]"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </div>
  );
}
