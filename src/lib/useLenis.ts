import { useEffect } from "react";
import Lenis from "lenis";
import { useSequence } from "@/store/sequence";

/** Total scroll length of the passage. Six stops plus an arrival and a run-out. */
export const PASSAGE_VH = 820;

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/**
 * Smoothed native scroll.
 *
 * Native scroll rather than a hijacked wheel timeline: the trackpad, the
 * scrollbar, touch, page keys and the keyboard all keep working, and the
 * passage stays operable without a mouse. Lenis only changes how it feels.
 *
 * Scroll is locked until the wordmark has landed. The first deliberate scroll
 * gesture is what starts the passage - the road moves because a person moved it.
 */
export function useLenis() {
  const phase = useSequence((s) => s.phase);
  const setPhase = useSequence((s) => s.setPhase);
  const setPassageProgress = useSequence((s) => s.setPassageProgress);

  useEffect(() => {
    const l = new Lenis({
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 3.4),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
    });
    lenis = l;

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      l.raf(t);
    };
    raf = requestAnimationFrame(loop);

    let last = -1;
    l.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      // Only the passage is scroll-driven. Past it the progress is pinned, or
      // arriving at the galaxy would rewind it to wherever the scrollbar sits.
      if (useSequence.getState().phase !== "passage") return;
      const p = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
      if (Math.abs(p - last) > 0.0008) {
        last = p;
        setPassageProgress(p);
      }
    });

    // ?p=0.62 jumps to a point in the passage. Reviewing a stop should not
    // mean scrolling eight screens to reach it every time.
    const jump = new URLSearchParams(window.location.search).get("p");
    if (jump !== null) {
      const at = Math.min(1, Math.max(0, parseFloat(jump) || 0));
      requestAnimationFrame(() => {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        l.scrollTo(limit * at, { immediate: true, force: true });
        setPassageProgress(at);
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis = null;
    };
  }, [setPassageProgress]);

  // Lock everything before the passage, and rewind so a replay starts at the top.
  useEffect(() => {
    const l = lenis;
    if (!l) return;
    const locked = phase !== "passage";
    if (locked) {
      l.stop();
      const jumped = new URLSearchParams(window.location.search).has("p");
      if (!jumped && (phase === "void" || phase === "reveal")) {
        window.scrollTo(0, 0);
        setPassageProgress(0);
      }
    } else {
      l.start();
    }
  }, [phase, setPassageProgress]);

  // The first scroll gesture after the reveal starts the passage.
  useEffect(() => {
    if (phase !== "reveal") return;
    const go = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        const keys = ["ArrowDown", "PageDown", " ", "Enter", "ArrowRight"];
        if (!keys.includes(e.key)) return;
      }
      setPhase("passage");
    };
    window.addEventListener("wheel", go, { passive: true });
    window.addEventListener("touchmove", go, { passive: true });
    window.addEventListener("keydown", go);
    return () => {
      window.removeEventListener("wheel", go);
      window.removeEventListener("touchmove", go);
      window.removeEventListener("keydown", go);
    };
  }, [phase, setPhase]);
}
