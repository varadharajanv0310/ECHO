import { useEffect } from "react";
import { useSequence } from "@/store";
import "./ignition.css";

/** How long the galaxy takes to open before profile creation resolves. */
const DURATION = 1900;

/**
 * Beat 7a. The galaxy opens.
 *
 * There were hands here that reached in and pried it apart. They never read as
 * hands touching the galaxy - they read as a cutaway to different footage
 * pasted over it - so they are gone. What is left is the thing they were
 * supposed to cause: light forcing its way out of the core until it takes the
 * frame.
 *
 * One ramp with a single peak. A repeated hard flash at speed is a
 * photosensitivity problem and it is also uglier.
 */
export function Ignition() {
  const setPhase = useSequence((s) => s.setPhase);
  const reducedFlash = useSequence((s) => s.settings.reducedFlash);

  useEffect(() => {
    const t = setTimeout(() => setPhase("profile"), DURATION);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <div className="ig" data-soft={reducedFlash} style={{ zIndex: "var(--z-content)" }}>
      <div className="ig__bloom" aria-hidden />
      <div className="ig__flash" aria-hidden />
    </div>
  );
}
