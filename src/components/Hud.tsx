import { useEffect, useRef } from "react";
import { copy } from "@/copy";
import { useSequence } from "@/store/sequence";

/**
 * Persistent corner labels, in the language of the poster references: small
 * mono caps, wide tracking, sitting on the frame edge rather than in a bar.
 *
 * The timecode is real. It counts since first paint, which is the closest
 * thing to a progress indicator the brief permits, and it doubles later as
 * the decay clock once signals start expiring.
 */
export function Hud({ opacity = 1 }: { opacity?: number }) {
  const phase = useSequence((s) => s.phase);
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const el = clockRef.current;
      if (!el) return;
      const t = (now - start) / 1000;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      const cs = Math.floor((t % 1) * 100);
      el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(cs).padStart(2, "0")}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Beat 1 is specified as having no logo. The mark and the index only arrive
  // once the wordmark has, so the void carries system voice and nothing else.
  const branded = phase !== "void";

  return (
    <div
      className="pointer-events-none fixed inset-0 transition-opacity duration-[1400ms]"
      style={{ zIndex: "var(--z-hud)", opacity }}
    >
      <div className="absolute inset-0 p-6 md:p-9">
        <span
          className="hud-label absolute left-6 top-6 text-white/55 transition-opacity duration-[1800ms] md:left-9 md:top-9"
          style={{ opacity: branded ? 1 : 0, transitionDelay: "1900ms" }}
        >
          {copy.hud.mark}
        </span>

        <span
          className="hud-label absolute right-6 top-6 text-white/35 transition-opacity duration-[1800ms] md:right-9 md:top-9"
          style={{ opacity: branded ? 1 : 0, transitionDelay: "2100ms" }}
        >
          {copy.hud.index}
        </span>

        <span className="hud-label absolute bottom-6 left-6 flex items-center gap-2 text-white/45 md:bottom-9 md:left-9">
          <i className="hud-pulse" aria-hidden />
          {copy.status[phase]}
        </span>

        <span
          ref={clockRef}
          className="hud-label absolute bottom-6 right-6 tabular-nums text-white/30 md:bottom-9 md:right-9"
        >
          00:00:00
        </span>
      </div>
    </div>
  );
}
