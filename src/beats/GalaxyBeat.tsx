import { copy } from "@/copy";
import { useSequence } from "@/store";
import "./galaxy-beat.css";

/**
 * Beat 6. The galaxy is the only interactive object on the page, so the only
 * chrome here is one line and a target. The galaxy itself lives in the
 * persistent canvas; this is the invitation and the hit area over it.
 *
 * A returning visitor skips the ignition and profile entirely and drops
 * straight into the dive, because they have already been through it once.
 */
export function GalaxyBeat() {
  const phase = useSequence((s) => s.phase);
  const profile = useSequence((s) => s.profile);
  const setPhase = useSequence((s) => s.setPhase);

  if (phase !== "galaxy") return null;

  const enter = () => setPhase(profile ? "dive" : "ignition");

  return (
    <div className="gb" style={{ zIndex: "var(--z-content)" }}>
      <button
        className="gb__target"
        onClick={enter}
        aria-label={copy.galaxy.action}
      />

      <div className="gb__copy">
        <p className="gb__invite">{copy.galaxy.invite}</p>
        <button className="gb__action" onClick={enter}>
          <span>{copy.galaxy.action}</span>
          <i aria-hidden />
        </button>
      </div>
    </div>
  );
}
