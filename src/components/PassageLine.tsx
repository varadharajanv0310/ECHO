import type { CSSProperties } from "react";
import "./passage-line.css";

type Props = {
  kicker: string;
  line: string;
  /** 0 when the stop is dead centre, 1 when it is at the edge of its window. */
  k: number;
  /** Signed position in the window: negative approaching, positive departing. */
  local: number;
};

/**
 * One stop on the passage, in the treatment of the "RISK IT ALL" reference:
 * heavy grotesque, prism smear, vertical light streaking through the letters.
 *
 * The smear is scroll-linked rather than timed. A stop arrives as three
 * separated colour channels and resolves into one as it reaches centre, then
 * separates again as it leaves - so the aberration is a readout of where the
 * reader is, not decoration playing on a loop. Standing still holds it sharp.
 */
export function PassageLine({ kicker, line, k, local }: Props) {
  const style = {
    "--k": k,
    "--local": local,
  } as CSSProperties;

  return (
    <div className="pl" style={style} aria-hidden={k >= 1}>
      <span className="pl__kicker">{kicker}</span>

      <div className="pl__type">
        <span className="pl__layer pl__layer--streak">{line}</span>
        <span className="pl__layer pl__layer--chroma-a">{line}</span>
        <span className="pl__layer pl__layer--chroma-b">{line}</span>
        <span className="pl__layer pl__layer--core">{line}</span>
      </div>
    </div>
  );
}
