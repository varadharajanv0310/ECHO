"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils/math";
import { damp } from "@/utils/math";
import { renderDpr } from "@/utils/dpr";

interface FluidParticlesProps {
  particleCount?: number;
  noiseIntensity?: number;
  minSize?: number;
  maxSize?: number;
  /** 0-1, driven per phase by the sequence. */
  opacity?: number;
  className?: string;
}

/** Classic Perlin permutation table. */
function createNoise() {
  const permutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103,
    30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197,
    62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20,
    125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231,
    83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102,
    143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200,
    196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
    250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47,
    16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163,
    70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79,
    113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210,
    144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
    181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236,
    205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];
  const p = new Array<number>(512);
  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;
    return lerp(
      w,
      lerp(
        v,
        lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
        lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z)),
      ),
      lerp(
        v,
        lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
        lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)),
      ),
    );
  };
}

interface Particle {
  x: number;
  y: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
}

/**
 * Perlin flow field, running as a persistent fixed layer behind everything.
 *
 * Departures from the stock component:
 *  - it is a background layer, not an h-screen page wrapper that centres children
 *  - dark only; ECHO has no light mode, so the theme sniff is gone
 *  - particles are tinted violet through magenta rather than white
 *  - opacity is a prop, damped, so the sequence can modulate it per phase
 *  - device pixel ratio aware, so the field is not a blurry upscale on retina
 */
export const FluidParticlesBackground = ({
  particleCount = 2000,
  noiseIntensity = 0.003,
  minSize = 0.5,
  maxSize = 2,
  opacity = 1,
  className,
}: FluidParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const targetOpacity = useRef(opacity);
  targetOpacity.current = opacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const noise = createNoise();
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = renderDpr();
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * (maxSize - minSize) + minSize,
      // 275-310 - violet into magenta, so the field is never a flat single hue.
      hue: 275 + Math.random() * 35,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 50,
    }));

    let raf = 0;
    let last = performance.now();
    let shown = targetOpacity.current;

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      shown = damp(shown, targetOpacity.current, 3, dt);
      wrap.style.opacity = String(shown);

      // Semi-transparent overpaint in the void colour, which is what leaves
      // the trails behind each particle.
      ctx.fillStyle = "rgba(4, 3, 10, 0.12)";
      ctx.fillRect(0, 0, w, h);

      const t = now * 0.0001;

      for (const p of particles) {
        p.life += 1;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * w;
          p.y = Math.random() * h;
        }

        const o = Math.sin((p.life / p.maxLife) * Math.PI) * 0.15;
        const n = noise(p.x * noiseIntensity, p.y * noiseIntensity, t);
        const angle = n * Math.PI * 4;

        p.x += Math.cos(angle) * 2;
        p.y += Math.sin(angle) * 2;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${o})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [particleCount, noiseIntensity, minSize, maxSize]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "particles-layer fixed inset-0 overflow-hidden pointer-events-none",
        className,
      )}
      aria-hidden="true"
      style={{ zIndex: "var(--z-particles)" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

export default FluidParticlesBackground;
