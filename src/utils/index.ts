/**
 * Pure functions.
 *
 * Nothing here holds state, touches the DOM beyond a one-shot feature probe,
 * or knows that React exists. Everything is testable by calling it.
 *
 * @packageDocumentation
 */

/** Interpolation, easing and class-name composition. */
export { cn, clamp, remap, damp, easeOutExpo, easeInOutCubic } from "./math";

/** Resolution policy: how many device pixels are worth paying for. */
export { renderDpr, isHandheld } from "./dpr";

/** Whether this machine can draw anything at all. */
export { hasWebGL } from "./webgl";
