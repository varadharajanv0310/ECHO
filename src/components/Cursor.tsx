import { useEffect, useRef } from "react";
import { damp } from "@/utils/math";
import { useSequence } from "@/store/sequence";
import "./cursor.css";

/**
 * The cursor.
 *
 * Two parts moving at different rates: a dot that tracks the pointer exactly,
 * and a ring that lags behind it. The lag is the whole effect - it gives the
 * pointer weight, and it means the ring is still catching up when you stop,
 * which reads as the interface noticing rather than reacting.
 *
 * It swells over anything interactive, and it is the proximity field the
 * galaxy answers to.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  // The pointer is the one piece of the interface that is always yours, so it
  // carries your mark colour rather than the app accent.
  const hue = useSequence((s) => s.profile?.hue ?? 276);

  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let hot = 0;
    let hotTarget = 0;
    let visible = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      visible = 1;
      const el = e.target as Element | null;
      hotTarget = el?.closest?.("button, a, input, [data-cursor='hot']") ? 1 : 0;
    };
    const leave = () => {
      visible = 0;
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerleave", leave);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      rx = damp(rx, x, 9, dt);
      ry = damp(ry, y, 9, dt);
      hot = damp(hot, hotTarget, 10, dt);

      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        dot.current.style.opacity = String(visible * (1 - hot * 0.6));
      }
      if (ring.current) {
        const s = 1 + hot * 1.9;
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${s})`;
        ring.current.style.opacity = String(visible * (0.4 + hot * 0.6));
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        className="cursor cursor--ring"
        style={{ "--cur": hue } as React.CSSProperties}
        aria-hidden
      />
      <div
        ref={dot}
        className="cursor cursor--dot"
        style={{ "--cur": hue } as React.CSSProperties}
        aria-hidden
      />
    </>
  );
}
