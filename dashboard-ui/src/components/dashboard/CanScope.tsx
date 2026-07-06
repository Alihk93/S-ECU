import { useEffect, useRef } from "react";

// Derived CAN bus visualization. Streaming the real 500 kbit/s differential bus
// is impractical over the 30 Hz telemetry link, so — like the CKP/CMP scope — this
// animates a representative CAN-H / CAN-L frame: recessive ~2.5 V on both lines,
// dominant pulls CAN-H up (~3.5 V) and CAN-L down (~1.5 V).

const BIT_W = 7; // px per bit
const SPEED = 70; // px/sec scroll

// deterministic pseudo-random bitstream so the trace scrolls smoothly
function bit(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s) > 0.5 ? 1 : 0;
}

interface CanScopeProps {
  active?: boolean;
}

export function CanScope({ active = true }: CanScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

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

    const LANES = [
      { label: "CAN HI", color: "#00e7f2", dir: -1 },
      { label: "CAN LO", color: "#ffb000", dir: 1 },
    ];

    const draw = (now: number) => {
      const pos = activeRef.current ? (now / 1000) * SPEED : 0;
      const laneH = H / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#04080b";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(45,110,130,0.16)";
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const x = (i / 24) * W;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let i = 0; i <= 6; i++) {
        const y = (i / 6) * H;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

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

        // Reserve room at the top of a lane whose dominant pulse rises (CAN HI)
        // so the peak doesn't collide with the lane label.
        const labelPad = lane.dir < 0 ? 16 : 0;
        const mid = top + labelPad + (laneH - labelPad) / 2; // recessive 2.5 V baseline
        const amp = (laneH - labelPad) / 2 - 9;

        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const n = Math.floor((pos + x) / BIT_W);
          const dominant = activeRef.current ? bit(n) : 0;
          // dominant pulls this lane toward its rail; recessive sits at mid
          const y = mid + lane.dir * dominant * amp;
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

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="scanlines relative h-full min-h-0 w-full overflow-hidden rounded-sm border border-border"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
