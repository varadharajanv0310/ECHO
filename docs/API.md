# API Reference

The public surface of ECHO's internal modules: the three stores, the hooks, the
derivation functions and the domain types. Everything here is importable
through a barrel — `@/store`, `@/lib`, `@/types` — rather than by reaching into
a file.

- [Stores](#stores)
- [Hooks](#hooks)
- [World generation](#world-generation)
- [The derived social layer](#the-derived-social-layer)
- [Utilities](#utilities)
- [Types](#types)

---

## Stores

Three zustand stores. Subscribe with a selector so a change to one field does
not re-render everything that touches the store.

```ts
import { useSequence, useUI, useTour } from "@/store";

const level = useUI((s) => s.level);
const back = useUI((s) => s.back);
```

### `useSequence`

The person, and where they are in the opening sequence. Persisted to
`localStorage`.

**State**

| Field             | Type              | Meaning                                |
| ----------------- | ----------------- | -------------------------------------- |
| `phase`           | `Phase`           | Which of the eight beats is on screen  |
| `bootProgress`    | `number`          | 0–1 through the preload gate           |
| `passageProgress` | `number`          | 0–1 across the scrolling passage       |
| `diveProgress`    | `number`          | 0–1 through the warp                   |
| `profile`         | `Profile \| null` | Who you are, or `null` before creation |
| `settings`        | `Settings`        | Theme, accent, motion, grain, filters  |
| `emissions`       | `Emission[]`      | Signals you have sent                  |
| `carried`         | `Carried[]`       | Signals of others you are carrying     |
| `friends`         | `number[]`        | Star ids you have added                |
| `dms`             | `DirectMessage[]` | Every line of every conversation       |

**Actions**

| Signature                                 | Effect                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `setPhase(p: Phase): void`                | Jump to a beat. Uniforms snap rather than animate in.                          |
| `advance(): void`                         | Move to the next beat in `PHASES`.                                             |
| `setBootProgress(n: number): void`        | Drives nebula intensity during load.                                           |
| `setPassageProgress(n: number): void`     | Drives the road and the argument.                                              |
| `setDiveProgress(n: number): void`        | Drives the galaxy and the warp together.                                       |
| `setProfile(p: Profile): void`            | Create the profile and persist it.                                             |
| `patchProfile(p: Partial<Profile>): void` | Merge a change into the profile.                                               |
| `setSettings(s: Partial<Settings>): void` | Merge display preferences.                                                     |
| `emit(world, text, life): void`           | Send a signal into a place for `life` hours. Appears at your star immediately. |
| `carry(source, from, hue, text): void`    | Pick up somebody's signal. Refuses a duplicate `source`.                       |
| `drop(source: number): void`              | Stop carrying it.                                                              |
| `toggleFriend(star: number): void`        | Add or remove a person.                                                        |
| `sendDM(star, name, text, onText?): void` | Say something. `onText` records the signal it was about.                       |

`useLayerMix()` is a convenience selector returning the `LayerMix` for the
current phase.

### `useUI`

Where you are standing and what is open. Deliberately **not** persisted —
reloading should put you back in the sky, not back inside a panel.

**State**

| Field           | Type                      | Meaning                                    |
| --------------- | ------------------------- | ------------------------------------------ |
| `level`         | `SkyLevel`                | `"cluster"`, `"constellation"` or `"star"` |
| `constellation` | `number \| null`          | The focused place                          |
| `star`          | `number \| null`          | The focused person                         |
| `planet`        | `number \| null`          | The opened signal                          |
| `panel`         | `PanelId \| null`         | Which rail destination is open             |
| `profileOf`     | `number \| null`          | Whose profile is open                      |
| `messaging`     | `number \| null`          | Which conversation is open                 |
| `tab`           | `Record<PanelId, string>` | The remembered tab per panel               |

**Actions**

| Signature                                   | Effect                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `enterConstellation(id: number): void`      | Zoom into a place.                                                  |
| `enterStar(id: number): void`               | Stand at a person. Ignores an id with no star.                      |
| `openPlanet(id: number): void`              | Open one signal.                                                    |
| `openProfile(star: number): void`           | Open a profile over the sky.                                        |
| `closeProfile(): void`                      | Close it.                                                           |
| `openMessages(star: number): void`          | Open a conversation in its own window.                              |
| `closeMessages(): void`                     | Close it.                                                           |
| `setPanel(p: PanelId \| null): void`        | Open a rail destination, or close it. At most one window at a time. |
| `setTab(panel: PanelId, tab: string): void` | Remember a tab.                                                     |
| `back(): void`                              | Up one level. The single exit from everywhere.                      |

### `useTour`

The guided tour's stage machine. `stage` is `"welcome" \| "cards" \| "rail" \| null`;
`restart()` replays it. `CARDS` and `RAIL` are the step counts.

---

## Hooks

### `useExit<T>(value: T | null, ms: number)`

CSS-driven unmounting. Holds the last non-null value for `ms` after it goes
null so an element can animate away before it leaves the tree.

```ts
const { shown, closing } = useExit(panel, 190);
```

Returns `{ shown, closing }` — `shown` is the held value, `closing` is true
while it is on its way out.

### `useLenis()`

Mounts the smoothed scroll and binds it to the sequence. `getLenis()` returns
the live instance; `PASSAGE_VH` is the passage's scroll length, which is
shorter on a handheld.

Any nested scroller must carry `data-lenis-prevent`, or Lenis's `preventDefault`
on wheel and touch makes it inert.

### `useUnseen(): number`

How many things have arrived since the dashboard was last opened. `markSeen()`
clears it.

---

## World generation

### `getSky(): Sky`

The whole hierarchy — places, people, signals — generated from a seed by a
linear congruential generator, so every reader on a build sees the same world.
Memoised; call it freely.

### `placeMe(): void`

Puts your own star into the sky. Idempotent.

### `syncMine(): void`

Rebuilds your star's signals from `emissions` and `carried`, marking carried
ones as borrowed so they keep the colour of where they came from.

### `myStar(): number`

The id of your own star, or `-1` before one exists. Always call it rather than
caching the value: the sky is rebuilt when things are said.

### `skyLabels(...): SkyLabel[]`

Screen-space positions for the names drawn over the canvas, with the collision
test that suppresses whatever will not fit.

---

## The derived social layer

Nothing in this section is stored. Every value is derived from a hash of the
signal's own id, which is what makes it identical on every reload without a
server and without a growing blob in `localStorage`.

| Function                                      | Returns                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| `echoesFor(e: Emission, who: string[], now?)` | The carries and replies a signal has attracted so far  |
| `lastCarry(e: Emission, who: string[], now?)` | The most recent carry, or `null`                       |
| `replyTo(dm: DirectMessage, now?)`            | The answer to a message, if there is one               |
| `thread(mine: DirectMessage[], now?)`         | A full conversation, ordered, with replies interleaved |

Guarantees the test suite holds these to: determinism for a given id, a reveal
that only ever grows with time, carriers drawn from the right place, a silence
rate between 10% and 60%, and never more replies than carries.

---

## Utilities

| Function                                                        | Purpose                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `clamp(n, min?, max?)`                                          | Bound a number, defaults 0–1                                          |
| `remap(n, a, b, c, d)`                                          | Move a value from one range to another                                |
| `damp(current, target, lambda, dt)`                             | Frame-rate independent approach. Use instead of `lerp` in `useFrame`. |
| `easeOutExpo(t)`, `easeInOutCubic(t)`                           | Easing                                                                |
| `cn(...inputs)`                                                 | Class name composition                                                |
| `renderDpr()`                                                   | Device pixel ratio cap: 2 desktop, 1.75 handheld                      |
| `isHandheld()`                                                  | Coarse pointer **and** a narrow screen                                |
| `hasWebGL()`                                                    | Whether there is a context to draw into                               |
| `cue(kind)`                                                     | One-shot sound. `"spark" \| "arrive" \| "tick" \| "click" \| "dive"`  |
| `startAudio()`, `setMuted(m)`, `setAudioPhase(phase, progress)` | The shared audio context                                              |

---

## Types

Every domain type is re-exported from `@/types`:

```ts
import type { Star, Emission, Carried, Profile } from "@/types";
```

`Planet`, `Star`, `Constellation`, `Sky`, `SkyLabel`, `SignalNode`, `Profile`,
`Emission`, `Carried`, `DirectMessage`, `Song`, `Link`, `Settings`,
`ThemeMode`, `Accent`, `Phase`, `LayerMix`, `SkyLevel`, `PanelId`, `TourStage`,
`Carry`, `Reply`, `Entry`, `Cover`, `MarkId`.

Each is declared next to the code that owns it and re-exported there, so there
is one definition and one convenient door. See
[ARCHITECTURE.md](../ARCHITECTURE.md) for the layering that makes that safe.
