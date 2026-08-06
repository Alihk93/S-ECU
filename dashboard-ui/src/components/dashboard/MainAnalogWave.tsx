import { useEffect, useRef, type MutableRefObject } from "react";

// "MAIN ANALOG WAVE" — a representative cyan analog sensor trace (like the mockup):
// a scrolling waveform whose activity scales with engine speed. Derived, not
// streamed (same pattern as the CKP/CMP + CAN scopes).

interface Props {
  rpmRef: MutableRefObject<number>;
  loadRef?: MutableRefObject<number>;
}

const SPEED = 90; // px/sec scroll

export function MainAnalogWave({ rpmRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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

    // deterministic analog-ish sample: base swell + periodic sensor event
    const sample = (u: number, act: number) => {
      const ev = ((u % 120) + 120) % 120; // 0..120 event window
      let e = 0;
      if (ev < 8) e = -0.55; // step down
      else if (ev < 16) e = 0.9 * Math.exp(-(ev - 8) / 3) - 0.1; // spike + decay
      const base = 0.14 * Math.sin(u / 7) + 0.06 * Math.sin(u / 2.3);
      return (base + e) * (0.35 + 0.65 * act);
    };

    const draw = (now: number) => {
      const rpm = rpmRef.current;
      const act = Math.max(0, Math.min(1, rpm / 6000));
      const pos = (now / 1000) * SPEED * (0.4 + act);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#04080b";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(45,110,130,0.16)";
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const x = (i / 24) * W; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let i = 0; i <= 5; i++) { const y = (i / 5) * H; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();

      // trace
      const mid = H * 0.52;
      const amp = H * 0.34;
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const u = (pos + x) / 3;
        const y = mid - sample(u, act) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#00e7f2";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#00e7f2";
      ctx.stroke();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [rpmRef]);

  return (
    <div ref={wrapRef} className="scanlines relative h-full min-h-0 w-full overflow-hidden rounded-sm border border-border/70">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
