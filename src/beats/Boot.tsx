import loadingUrl from "@/assets/loading.jpg";
import { copy } from "@/copy";
import { useSequence } from "@/store/sequence";
import "./boot.css";

/**
 * Beat 1, rebuilt as an actual loading screen rather than an ambient
 * animation.
 *
 * A black frame, one still plate, and a bar that fills. Nothing drifts,
 * nothing breathes. The only motion is the bar, because the only thing
 * happening is loading - and a loading screen that animates for its own sake
 * reads as a title card you are being made to sit through.
 *
 * When it completes the black does not fade. It opens: a hole grows out of the
 * centre through a radial mask and the black is pushed off the edges of the
 * frame, taking the plate and the bar with it. Fading would dissolve one
 * picture into another; opening makes the landing feel like it was always
 * behind this, waiting.
 */
export function Boot() {
  const phase = useSequence((s) => s.phase);
  const progress = useSequence((s) => s.bootProgress);

  const open = phase !== "void";

  return (
    <div className="boot" data-open={open} style={{ zIndex: "var(--z-boot)" }}>
      <div className="boot__inner">
        <img className="boot__plate" src={loadingUrl} alt="" aria-hidden />

        <div className="boot__bar" role="progressbar" aria-label="Loading">
          <span
            className="boot__fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <span className="boot__caption">{copy.voidCaption}</span>
      </div>
    </div>
  );
}
