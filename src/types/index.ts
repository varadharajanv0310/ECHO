/**
 * The domain vocabulary of ECHO, in one place.
 *
 * Each type is declared next to the code that owns it - a `Star` is defined by
 * the module that generates the sky, a `Profile` by the store that holds it -
 * and re-exported here so that a consumer can learn the shape of the world
 * from a single import without reaching into another layer to do it.
 *
 * This module deliberately declares almost nothing itself. Duplicating a shape
 * here would mean two definitions drifting apart; the point is one definition
 * with one convenient door.
 *
 * @example
 * ```ts
 * import type { Star, Emission, Carried } from "@/types";
 * ```
 *
 * @packageDocumentation
 */

/* ------------------------------------------------------------------ world */

/**
 * The generated world: places, the people in them, and what those people are
 * carrying. Derived from a seed, so it is identical for everyone on a build.
 */
export type {
  /** One signal in orbit around a person. */
  Planet,
  /** One person, standing in a place. */
  Star,
  /** One place, with the people who listen there. */
  Constellation,
  /** The whole hierarchy: places, people, signals. */
  Sky,
} from "@/scene/sky-data";

/** A drawn name over the canvas, positioned in screen space. */
export type { SkyLabel } from "@/scene/sky-labels";

/** A node in the pre-authored constellation figures. */
export type { SignalNode } from "@/scene/constellation-data";

/* ------------------------------------------------------------- the person */

/**
 * Everything that belongs to the person using the application. This is the
 * only data that is persisted, and it never leaves the browser.
 */
export type {
  /** Who you are: name, mark, hue, traits, shelves. */
  Profile,
  /** Something you have said, and where you said it. */
  Emission,
  /** Something of somebody else's that you chose to carry. */
  Carried,
  /** One line in a conversation, yours or theirs. */
  DirectMessage,
  /** A record on a profile shelf. */
  Song,
  /** A labelled link on a profile. */
  Link,
  /** Display preferences: mode, accent, motion. */
  Settings,
  /** Dark or light. */
  ThemeMode,
  /** The four accent hues offered in settings. */
  Accent,
} from "@/store/sequence";

/* ------------------------------------------------------------ the session */

/** Which stage of the opening sequence is on screen. */
export type { Phase, LayerMix } from "@/store/sequence";

/** How deep into the sky you are standing. */
export type { SkyLevel, PanelId } from "@/store/ui";

/** The guided tour's current step. */
export type { Stage as TourStage } from "@/store/tour";

/* ------------------------------------------------------------- the social */

/**
 * The responses to a signal. These are derived from the signal's own id
 * rather than stored, which is what makes them stable across reloads.
 */
export type {
  /** One person picking a signal up and taking it somewhere. */
  Carry,
  /** One person answering a signal. */
  Reply,
} from "@/services/echoes";

/* -------------------------------------------------------------- the shelf */

/** A game or record that can sit on a profile shelf. */
export type { Entry, Cover } from "@/services/library";

/* ------------------------------------------------------------------ marks */

/** Which of the drawn glyphs a person chose to be. */
export type { MarkId } from "@/components/Mark";
