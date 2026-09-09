/**
 * The stateful layer.
 *
 * These modules own something that outlives a render: a Web Audio graph, a
 * catalogue, or a derivation with its own rules. They are not components and
 * not hooks, and nothing above them should reach past them to what they hold.
 *
 * @packageDocumentation
 */

/** One shared audio context, started only on a real gesture. */
export { startAudio, setMuted, setAudioPhase, cue, isMuted, isStarted } from "./audio";

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
