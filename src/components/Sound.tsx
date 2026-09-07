import { useEffect, useState } from "react";
import {
  cue,
  isMuted,
  setAudioPhase,
  setMuted,
  startAudio,
} from "@/lib/audio";
import { useSequence } from "@/store/sequence";
import "./sound.css";

/**
 * Drives the soundscape from the sequence, and offers the only global control
 * in the interface.
 *
 * The toggle does not appear until there is something to hear - showing a mute
 * button over a silent loading screen would be advertising a feature rather
 * than offering one.
 */
export function Sound() {
  const phase = useSequence((s) => s.phase);
  const passageProgress = useSequence((s) => s.passageProgress);
  const [muted, setM] = useState(isMuted);
  const [audible, setAudible] = useState(false);

  // Audio can only begin inside a gesture, so it begins on the first scroll.
  useEffect(() => {
    const begin = () => {
      startAudio();
      setAudible(true);
    };
    window.addEventListener("wheel", begin, { once: true, passive: true });
    window.addEventListener("pointerdown", begin, { once: true, passive: true });
    window.addEventListener("keydown", begin, { once: true });
    return () => {
      window.removeEventListener("wheel", begin);
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
    };
  }, []);

  useEffect(() => {
    setAudioPhase(phase, passageProgress);
  }, [phase, passageProgress]);

  useEffect(() => {
    if (phase === "ignition") cue("spark");
    if (phase === "constellation") cue("arrive");
  }, [phase]);

  if (!audible) return null;

  return (
    <button
      className="snd"
      style={{ zIndex: "var(--z-hud)" }}
      onClick={() => {
        const next = !muted;
        setM(next);
        setMuted(next);
        if (!next) cue("tick");
      }}
      aria-pressed={muted}
      aria-label={muted ? "Unmute" : "Mute"}
    >
      <span className="snd__bars" data-off={muted} aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
