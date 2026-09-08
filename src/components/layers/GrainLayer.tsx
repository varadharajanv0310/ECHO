"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/utils";

type Props = {
  opacity?: number;
  /** Size of one grain speck in CSS pixels. ~1 is 35mm, higher is coarser stock. */
  size?: number;
  /** How hard the specks bite. */
  contrast?: number;
  /** Frames per second the grain reshuffles. 24 reads as film; 60 reads as TV static. */
  cadence?: number;
};

const TILE = 220;
const VARIANTS = 10;

/**
 * Film grain, applied at fixed screen density above every other layer.
 *
 * Two things make this read as film rather than as a noise overlay:
 *
 *  - the pattern origin is jittered every frame, so the tile repeat never
 *    resolves into a visible grid however long you stare at it
 *  - it reshuffles at 24fps rather than at display rate. Grain that changes
 *    every frame at 120Hz stops looking like emulsion and starts looking like
 *    a broken signal. This is a look, not a saving.
 *
 * It screens rather than overlays, because in a frame that is 90% black the
 * grain has to live in the blacks. Overlay leaves blacks untouched.
 */
export function GrainLayer({
  opacity = 0.6,
  size = 1,
  contrast = 1,
  cadence = 24,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ opacity, size, contrast, cadence });
  live.current = { opacity, size, contrast, cadence };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const build = (px: number, bite: number) => {
      const tiles: HTMLCanvasElement[] = [];
      const dim = Math.max(8, Math.round(TILE / px));
      for (let v = 0; v < VARIANTS; v++) {
        const t = document.createElement("canvas");
        t.width = dim;
        t.height = dim;
        const tc = t.getContext("2d")!;
        const img = tc.createImageData(dim, dim);
        for (let i = 0; i < img.data.length; i += 4) {
          // Sparse rather than uniform. Raising a uniform random to a high
          // power leaves most pixels at nothing and a few bright, which is
          // what emulsion looks like. A flat random field is television snow.
          const n = Math.random();
          const a = Math.pow(n, 4.2) * 0.5;
          const lum = 190 + 65 * n;
          img.data[i] = lum * 0.9;
          img.data[i + 1] = lum * 0.82;
          img.data[i + 2] = lum; // a touch violet, so grain never reads neutral grey
          img.data[i + 3] = 255 * a * bite;
        }
        tc.putImageData(img, 0, 0);
        tiles.push(t);
      }
      return { tiles, dim };
    };

    let { tiles } = build(live.current.size, live.current.contrast);
    let builtFor = `${live.current.size}|${live.current.contrast}`;
    let patterns = tiles.map((t) => ctx.createPattern(t, "repeat")!);

    let w = 0;
    let h = 0;
    const resize = () => {
      // Deliberately DPR-1: the grain is a property of the screen, not of the
      // content, so it must not scale with zoom or pixel density.
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      patterns = tiles.map((t) => ctx.createPattern(t, "repeat")!);
    };
    resize();

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frame = 0;
    let shown = live.current.opacity;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const s = live.current;
      const key = `${s.size}|${s.contrast}`;
      if (key !== builtFor) {
        ({ tiles } = build(s.size, s.contrast));
        patterns = tiles.map((t) => ctx.createPattern(t, "repeat")!);
        builtFor = key;
      }

      shown = damp(shown, s.opacity, 4, dt);
      canvas.style.opacity = String(shown);

      acc += dt;
      const step = 1 / Math.max(1, s.cadence);
      if (acc >= step) {
        acc %= step;
        frame = (frame + 1) % VARIANTS;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      // Jitter the origin so the repeat never resolves into a grid.
      ctx.translate(-Math.random() * TILE, -Math.random() * TILE);
      ctx.fillStyle = patterns[frame];
      ctx.fillRect(0, 0, w + TILE * 2, h + TILE * 2);
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="grain-layer pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: "var(--z-grain)" }}
    />
  );
}
