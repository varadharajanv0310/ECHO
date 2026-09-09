/**
 * The state layer: three zustand stores, and nothing else in the application
 * holds mutable state.
 *
 * They are separated by lifetime rather than by feature. `useSequence` is the
 * person and survives a reload; `useUI` is where you are standing right now
 * and deliberately does not; `useTour` is a small machine that only matters
 * once.
 *
 * Components subscribe with selectors so that a change to one field does not
 * re-render everything that touches a store:
 *
 * @example
 * ```ts
 * import { useUI } from "@/store";
 *
 * const level = useUI((s) => s.level);      // re-renders on level only
 * const back  = useUI((s) => s.back);       // a stable action reference
 * ```
 *
 * @packageDocumentation
 */

/** The person: profile, signals, carries, friends, messages, settings. */
export {
  useSequence,
  useLayerMix,
  PHASES,
  LAYER_MIX,
  DEFAULT_SETTINGS,
} from "./sequence";
export type {
  Phase,
  LayerMix,
  Profile,
  Emission,
  Carried,
  DirectMessage,
  Song,
  Link,
  Settings,
  ThemeMode,
  Accent,
} from "./sequence";

/** Where you are and what is open. Not persisted. */
export { useUI, PANELS } from "./ui";
export type { SkyLevel, PanelId } from "./ui";

/** The guided tour's stage machine. */
export { useTour, CARDS, RAIL } from "./tour";
export type { Stage as TourStage } from "./tour";
