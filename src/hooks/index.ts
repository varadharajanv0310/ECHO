/**
 * React hooks.
 *
 * Each one owns a piece of behaviour that more than one component needs and
 * that none of them should own: a delayed unmount, the smoothed scroll, the
 * count of things that arrived while you were not looking.
 *
 * @packageDocumentation
 */

/** Hold a value while it animates away, so it can leave the tree afterwards. */
export { useExit } from "./useExit";

/** The smoothed scroll that drives the opening sequence. */
export { useLenis, getLenis, PASSAGE_VH } from "./useLenis";

/** How many things have arrived since the dashboard was last opened. */
export { useUnseen, markSeen } from "./useUnseen";
