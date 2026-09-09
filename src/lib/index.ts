/**
 * The helper layer: pure functions and hooks with no knowledge of the
 * component tree above them.
 *
 * Nothing in here imports from `ui/`, `beats/` or `scene/`, which is what
 * makes it testable on its own and safe to call from anywhere. This barrel
 * exists so a consumer can take what it needs in one import rather than four.
 *
 * @packageDocumentation
 */

/** Class name composition, and the easing and interpolation maths. */
export { cn, clamp, remap, damp, easeOutExpo, easeInOutCubic } from "./utils";

/** Whether this machine can draw anything at all. */
export { hasWebGL } from "./webgl";

/** Resolution policy: how many device pixels are worth paying for. */
export { renderDpr, isHandheld } from "./dpr";

/** The derived social layer: who carried a signal, who answered it. */
export { echoesFor, lastCarry, replyTo, thread } from "./echoes";
export type { Carry, Reply } from "./echoes";

/** The shelves: games, records, cover art and the places people are from. */
export {
  GAMES,
  SONGS,
  PLACES,
  coverFor,
  pickFor,
  byId,
  placeLabel,
  handlesFor,
} from "./library";
export type { Entry, Cover } from "./library";

/** Sound: one shared context, started only on a real gesture. */
export { startAudio, setMuted, setAudioPhase, cue, isMuted, isStarted } from "./audio";

/** Hooks. */
export { useExit } from "./useExit";
export { useLenis, getLenis, PASSAGE_VH } from "./useLenis";
export { useUnseen, markSeen } from "./unseen";

/** Scene tuning constants, in one place so they can be found. */
export { tuning } from "./tuning";
