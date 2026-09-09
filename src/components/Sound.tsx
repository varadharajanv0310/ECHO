import { useEffect, useState } from "react";
import { cue, isMuted, setAudioPhase, setMuted, startAudio } from "@/services/audio";
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
    if (phase === "dive") cue("dive");
    if (phase === "constellation") cue("arrive");
  }, [phase]);

  // Every button in the interface gets the same tap, from one listener rather
  // than a call wired into each control. Buttons that already play something
  // of their own opt out with data-silent.
  useEffect(() => {
    const tap = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("button, .u-chip, .rail__btn");
      if (!el || el.hasAttribute("data-silent")) return;
      cue("click");
    };
    document.addEventListener("click", tap, true);
    return () => document.removeEventListener("click", tap, true);
  }, []);

  if (!audible) return null;

  return (
    <button
      type="button"
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
