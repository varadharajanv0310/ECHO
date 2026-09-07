import { useMemo } from "react";
import { PassageLine } from "@/components/PassageLine";
import { copy } from "@/copy";
import { clamp, remap } from "@/lib/utils";
import { PASSAGE_VH } from "@/lib/useLenis";
import { useSequence } from "@/store/sequence";
import "./passage.css";

/** Where the first and last stops sit in overall scroll progress. */
const FIRST = 0.13;
const LAST = 0.74;

/** How much of the gap between stops a stop stays visible for. */
const REACH = 0.62;

/**
 * Beats 3 to 5. The argument, the narrowing, and the last line.
 *
 * The scrolling element is a single tall spacer; everything visible is fixed.
 * That means the six stops are not laid out down a document - they are one
 * fixed frame whose contents are a function of scroll position, which is what
 * lets a stop arrive smeared, resolve, and leave smeared without any of them
 * ever moving through the layout.
 */
export function Passage() {
  const phase = useSequence((s) => s.phase);
  const p = useSequence((s) => s.passageProgress);

  const stops = copy.passage;
  const gap = (LAST - FIRST) / (stops.length - 1);

  const windows = useMemo(
    () =>
      stops.map((_, i) => {
        const centre = FIRST + gap * i;
        // Signed distance in window-widths: -1 approaching, 0 centred, +1 gone.
        const local = clamp((p - centre) / (gap * REACH), -1, 1);
        // Shaped falloff - lines hold sharp near centre and fall away quickly.
        const k = Math.pow(Math.abs(local), 1.35);
        return { centre, local, k };
      }),
    [stops, gap, p],
  );

  // The final line lands after the last stop, as the road runs out.
  // The last line belongs to the road. Once the galaxy has the frame, it is gone.
  const lastK =
    phase === "galaxy"
      ? 1
      : Math.pow(clamp(Math.abs(remap(p, 0.83, 0.96, -1, 1)), 0, 1), 1.3);

  const visible = phase === "passage" || phase === "galaxy";

  return (
    <>
      {/* The only thing in normal flow. It exists to give the page its height. */}
      <div style={{ height: `${PASSAGE_VH}vh` }} aria-hidden />

      <div
        className="passage"
        data-visible={visible}
        style={{ zIndex: "var(--z-content)" }}
      >
        {stops.map((stop, i) => {
          const w = windows[i];
          if (w.k >= 1) return null;
          return (
            <PassageLine
              key={stop.kicker}
              kicker={stop.kicker}
              line={stop.line}
              k={w.k}
              local={w.local}
            />
          );
        })}

        {lastK < 1 && (
          <div
            className="passage__last"
            style={{ opacity: 1 - lastK, filter: `blur(${lastK * 14}px)` }}
          >
            <span className="passage__last-line">{copy.lastLine}</span>
          </div>
        )}
      </div>

      {/* Reading position. The only progress indicator in the build, and it is
          about where you are rather than how long you have left. */}
      <div className="passage__rail" data-visible={visible} aria-hidden>
        <span
          className="passage__rail-fill"
          style={{ transform: `scaleY(${p})` }}
        />
      </div>
    </>
  );
}
