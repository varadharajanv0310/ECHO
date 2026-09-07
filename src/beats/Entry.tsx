import { useEffect, useMemo } from "react";
import { NebulaShader } from "@/components/ui/nebula-shader";
import { FallingFigure } from "@/components/FallingFigure";
import { Wordmark } from "@/components/Wordmark";
import { copy } from "@/copy";
import { PHASES, useSequence } from "@/store/sequence";
import { easeInOutCubic, remap } from "@/lib/utils";
import "./entry.css";

/** Minimum dwell on the void. Long enough to land, short enough not to annoy. */
const MIN_DWELL = 3200;

type NebulaMix = {
  intensity: number;
  cloud: number;
  lights: number;
  starAmt: number;
  warpAmt: number;
  riseAmt: number;
  speed: number;
};

/**
 * Beats 1 and 2. One component, deliberately - the void does not unmount and
 * the reveal does not mount. The nebula, the figure and the wordmark are all
 * present throughout; what changes is how much of each you can see. That is
 * what lets the void stain into the reveal instead of cutting to it.
 */
export function Entry({ boost = 1 }: { boost?: number }) {
  const phase = useSequence((s) => s.phase);
  const bootProgress = useSequence((s) => s.bootProgress);
  const setBootProgress = useSequence((s) => s.setBootProgress);
  const setPhase = useSequence((s) => s.setPhase);

  const revealed = phase !== "void";

  // The wordmark does not cut away when the passage starts - it rises out of
  // frame as the road comes up underneath it, so the bleed and the road read
  // as one continuous body of light.
  const passageProgress = useSequence((s) => s.passageProgress);
  const exit =
    PHASES.indexOf(phase) > PHASES.indexOf("passage")
      ? 1
      : phase === "passage"
        ? remap(passageProgress, 0, 0.085, 0, 1)
        : 0;

  // The preload gate. Real work happens behind it - fonts have to be resident
  // before the wordmark resolves or the width-axis animation will pop - but it
  // is never surfaced as a bar or a percentage. The nebula waking up is the
  // progress indicator.
  useEffect(() => {
    if (phase !== "void") return;

    let raf = 0;
    let assetsReady = false;
    const start = performance.now();

    document.fonts.ready.then(() => {
      assetsReady = true;
    });

    let lastPushed = -1;
    const tick = (now: number) => {
      const elapsed = (now - start) / MIN_DWELL;

      // Hold just short of full until the real work is done, so the final
      // surge always coincides with actually being ready.
      const p = Math.min(1, elapsed) * (assetsReady ? 1 : 0.92);
      if (Math.abs(p - lastPushed) > 0.008) {
        lastPushed = p;
        setBootProgress(p);
      }

      if (elapsed >= 1 && assetsReady) {
        setBootProgress(1);
        setPhase("reveal");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, setBootProgress, setPhase]);

  const nebula = useMemo<NebulaMix>(() => {
    if (phase === "void") {
      const w = easeInOutCubic(bootProgress);
      return {
        // The void is a sky, not an empty screen. Stars are there from the
        // first frame; the cloud swells as the gate completes.
        intensity: (0.55 + w * 0.5) * boost,
        cloud: 0.35 + w * 0.75,
        lights: 0.02 + w * 0.1,
        starAmt: 0.85 + w * 0.25,
        warpAmt: 0.05,
        riseAmt: 0.08 + w * 0.22,
        speed: 0.3 + w * 0.08,
      };
    }
    if (phase === "reveal") {
      // The field surges: the point lights come up behind the wordmark and
      // the cloud rises with them.
      return {
        intensity: 1.15 * boost,
        cloud: 1.35,
        lights: 0.62,
        starAmt: 0.7,
        warpAmt: 0.063,
        riseAmt: 1,
        speed: 0.5,
      };
    }
    // Past the entry the field is gone; the passage has its own world.
    return {
      intensity: 0,
      cloud: 0,
      lights: 0,
      starAmt: 0,
      warpAmt: 0.06,
      riseAmt: 1,
      speed: 0.5,
    };
  }, [phase, bootProgress, boost]);

  return (
    <div
      className="entry"
      data-revealed={revealed}
      style={{
        transform: `translateY(${-exit * 34}vh)`,
        opacity: 1 - exit,
        filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
        pointerEvents: exit >= 1 ? "none" : undefined,
      }}
    >
      <div className="entry__nebula">
        <NebulaShader
          intensity={nebula.intensity}
          cloud={nebula.cloud}
          lights={nebula.lights}
          starAmt={nebula.starAmt}
          warpAmt={nebula.warpAmt}
          riseAmt={nebula.riseAmt}
          speed={nebula.speed}
          responsiveness={revealed ? 0.9 : 2.2}
        />
      </div>

      <p className="entry__caption">{copy.voidCaption}</p>

      {/* The figure sits behind the wordmark and sinks through it as ECHO
          resolves, so the light it carries shows between the letters. */}
      <FallingFigure className="entry__figure" />

      <div className="entry__word">
        <Wordmark state={revealed ? "in" : "out"} />
      </div>

      <div className="entry__credit" aria-hidden={!revealed}>
        {copy.credit.map((line, i) => (
          <span key={i} className="entry__credit-line">
            {line}
          </span>
        ))}
        <span className="entry__thread" aria-hidden />
      </div>
    </div>
  );
}
