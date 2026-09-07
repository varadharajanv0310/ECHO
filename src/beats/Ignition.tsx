import { useEffect } from "react";
import handsUrl from "@/assets/hands.jpg";
import burstUrl from "@/assets/burst.jpg";
import { useSequence } from "@/store/sequence";
import "./ignition.css";

/** Total length of the ignition before profile creation resolves out of it. */
const DURATION = 2450;

/**
 * Beat 7a. Hands reach in, a spark ignites between them, the frame blows out.
 *
 * The two reference images are composited with screen blending rather than cut
 * out: both are pure light on black, so screening drops the black to nothing
 * for free and keeps every soft edge and every grain speck intact. An alpha
 * matte would have had to invent those edges.
 *
 * The flash is one continuous ramp with a single peak, not a stutter - a
 * repeated hard flash at speed is a photosensitivity problem, and it is also
 * uglier.
 */
export function Ignition() {
  const setPhase = useSequence((s) => s.setPhase);

  useEffect(() => {
    const t = setTimeout(() => setPhase("profile"), DURATION);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <div className="ig" style={{ zIndex: "var(--z-content)" }}>
      <img className="ig__hands" src={handsUrl} alt="" aria-hidden />
      <div className="ig__spark" aria-hidden />
      <img className="ig__burst" src={burstUrl} alt="" aria-hidden />
      <div className="ig__flash" aria-hidden />
    </div>
  );
}
