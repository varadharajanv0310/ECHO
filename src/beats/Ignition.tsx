import { useEffect } from "react";
import handUrl from "@/assets/hand.png";
import { useSequence } from "@/store/sequence";
import "./ignition.css";

/** Total length of the ignition before profile creation resolves out of it. */
const DURATION = 2700;

/**
 * Beat 7a. Two hands reach in and pry the galaxy open.
 *
 * It happens on the galaxy's own screen. The galaxy is not covered or replaced
 * - it is still there in the persistent canvas, and the hands arrive over it,
 * take hold of it, and pull it apart. The previous version composited a
 * full-frame photograph of hands over the top, which read as a cutaway to
 * different footage rather than as something happening to the thing you just
 * clicked.
 *
 * One plate, mirrored. The light between the hands is a slit that widens as
 * they separate, so the white does not arrive as a flash on a timer - it
 * arrives because they pulled.
 *
 * The blow-out is a single ramp with one peak. A repeated hard flash at speed
 * is a photosensitivity problem, and it is also uglier.
 */
export function Ignition() {
  const setPhase = useSequence((s) => s.setPhase);
  const reducedFlash = useSequence((s) => s.settings.reducedFlash);

  useEffect(() => {
    const t = setTimeout(() => setPhase("profile"), DURATION);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <div
      className="ig"
      data-soft={reducedFlash}
      style={{ zIndex: "var(--z-content)" }}
    >
      <img className="ig__hand ig__hand--l" src={handUrl} alt="" aria-hidden />
      <img className="ig__hand ig__hand--r" src={handUrl} alt="" aria-hidden />
      <div className="ig__slit" aria-hidden />
      <div className="ig__flash" aria-hidden />
    </div>
  );
}
