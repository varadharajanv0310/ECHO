import type { CSSProperties } from "react";
import { copy } from "@/copy";
import { cn } from "@/lib/utils";
import "./wordmark.css";

const LETTERS = copy.wordmark.split("");

function Row({ className }: { className: string }) {
  return (
    <span className={cn("wm__row", className)}>
      {LETTERS.map((ch, i) => (
        <span key={i} className="wm__ch" style={{ "--i": i } as CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/**
 * ECHO, in the language of the "soul" reference: white core, violet bleeding
 * downward out of the letterforms, amber burning at their base.
 *
 * Eight copies of the word stacked in one grid cell. The three bleed layers
 * are solid colour, stretched vertically by different amounts and masked to
 * different depths - violet nearest the letters, then magenta, then amber
 * furthest down. Stacking solid colours behind masks, rather than running one
 * gradient through background-clip:text, is both more robust and more
 * controllable: the reach of each colour is independent.
 *
 * The blur is anisotropic, via an SVG filter with a two-value stdDeviation.
 * An isotropic CSS blur gives a soft halo; blurring roughly eight times harder
 * vertically than horizontally is what turns each stem into a falling strand
 * of light, which is the actual effect in every reference image.
 */
export function Wordmark({ state }: { state: "out" | "in" }) {
  return (
    <div className="wm-wrap">
      <h1 className="wm" data-state={state} aria-label={copy.wordmark}>
        <Row className="wm__layer wm__layer--bleed-amber" />
        <Row className="wm__layer wm__layer--bleed-magenta" />
        <Row className="wm__layer wm__layer--bleed-violet" />
        <Row className="wm__layer wm__layer--strand" />
        <Row className="wm__layer wm__layer--chroma-a" />
        <Row className="wm__layer wm__layer--chroma-b" />
        <Row className="wm__layer wm__layer--core" />
        <Row className="wm__layer wm__layer--burn" />
      </h1>
    </div>
  );
}
