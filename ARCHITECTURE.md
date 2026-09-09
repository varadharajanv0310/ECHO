# Architecture

ECHO is a client-only single-page application. There is no server, no
database and no network call after the bundle and its fonts have loaded.
Everything a person creates lives in their own browser, and everything the
world contains is derived from a seed rather than fetched.

This document describes how the source is arranged and why, so that a change
can be made without reading all of it first.

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Directory structure](#directory-structure)
- [Layers](#layers)
- [Data flow](#data-flow)
- [State management](#state-management)
- [Rendering pipeline](#rendering-pipeline)
- [Routing and navigation](#routing-and-navigation)
- [Styling](#styling)
- [Accessibility architecture](#accessibility-architecture)
- [Testing strategy](#testing-strategy)
- [Build and deployment](#build-and-deployment)
- [Design decisions](#design-decisions)

## Overview

The application is one continuous scene rather than a set of pages. A person
scrolls through an opening sequence, arrives at a cluster of places, zooms
into one of them, stands at a person, and reads what that person is carrying.
Panels — create, search, dashboard, profile, messages — open over the top of
that scene without unmounting it.

Three properties shape every decision below:

1. **One canvas.** A single WebGL context is created once and lives for the
   whole session. Beats change what is drawn, never whether the renderer
   exists.
2. **Derived, not stored.** The world — places, people, what they carry, who
   replied — is a pure function of a seed and of the handful of things the
   person has actually done. Nothing is persisted except the person's own
   profile, signals, carries and messages.
3. **Two front doors.** Every navigation action is reachable both by pointer
   (the 3D view) and by keyboard (a real list of buttons). Neither is a
   summary of the other; they call the same store actions.

## Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | Vite 8 | Native ESM dev server, Rollup production build, first-class GLSL plugin |
| Language | TypeScript 7 (strict) | Every module is typed; `any` is not used in application code |
| UI runtime | React 19 | Concurrent rendering, transitions, stable `Suspense` |
| 3D | three.js 0.185 + @react-three/fiber 9 | Declarative scene graph over one WebGL renderer |
| Shaders | GLSL via `vite-plugin-glsl` | Shaders are source files, not template strings |
| State | zustand 5 | Three small stores, selector subscriptions, no provider tree |
| Styling | Tailwind v4 plus a stylesheet per component | Utilities for layout, real CSS for the parts that are design |
| Smooth scroll | Lenis | Frame-synced scroll drives the opening sequence |
| Testing | Vitest 5, Testing Library, jsdom | Same transform pipeline as the app, no second build |

## Directory structure

```
src/
├── App.tsx              Composition root: landmarks, beats, panels
├── main.tsx             Entry point, mounts App
├── beats/               Scroll-driven stages of the opening sequence
├── scene/               Everything inside the WebGL canvas
├── shaders/             GLSL, one file per program stage
├── store/               zustand stores (sequence, ui, tour)
├── lib/                 Pure helpers and hooks, no React tree assumptions
├── components/          Presentational pieces shared across beats
│   ├── layers/          Full-screen visual layers (grain, vignette)
│   └── ui/              Background effects
├── ui/                  Application chrome: windows, panels, navigation
│   └── panels/          The four rail destinations
├── types/               Shared domain types re-exported for consumers
├── test/                Vitest setup
└── assets/              Static imports
```

## Layers

The source is layered, and the dependency arrows only ever point downward.

```
        ┌──────────────────────────────────────────────┐
        │  App.tsx — composition root                  │
        └───────────────┬──────────────────────────────┘
                        │
        ┌───────────────▼──────────────┐  ┌───────────────────────┐
        │  ui/ — chrome, panels,       │  │  beats/ — the         │
        │  windows, keyboard nav       │  │  opening sequence     │
        └───────────────┬──────────────┘  └──────────┬────────────┘
                        │                            │
        ┌───────────────▼────────────────────────────▼────────────┐
        │  store/ — sequence, ui, tour                            │
        │  the only mutable state in the application              │
        └───────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────▼──────────────┐  ┌───────────────────────┐
        │  scene/ — canvas contents,   │  │  lib/ — pure helpers,  │
        │  world derivation            │  │  hooks, math           │
        └───────────────┬──────────────┘  └──────────┬────────────┘
                        │                            │
        ┌───────────────▼────────────────────────────▼────────────┐
        │  shaders/ · types/ — leaves, depend on nothing           │
        └──────────────────────────────────────────────────────────┘
```

Rules that hold throughout:

- `lib/` imports nothing from `ui/`, `beats/` or `scene/`. It is testable in
  isolation, and most of its tests run without a DOM.
- `store/` imports from `lib/` only. Stores never import components.
- `scene/` and `ui/` may both read stores; they never read each other.
- `shaders/` and `types/` are leaves.

## Data flow

```
seed ──► scene/sky-data.ts ──► the world (places, people, signals)
                    │
                    ▼
  store/sequence.ts ── what the person has said, carried, sent
                    │
                    ▼
  lib/echoes.ts ──► responses, carriers, replies (derived from hashes)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   scene/Sky.tsx           ui/ panels, windows, SkyNav
   (draws it)              (reads and writes it)
```

The world is generated once by a seeded linear congruential generator, so two
people opening the same build see the same places and the same names. Social
activity — who carried a signal, who replied, who stayed silent — is derived
from a hash of the signal's own id rather than from a timer or a random draw,
which is what lets it be stable across reloads without storing anything.

## State management

Three zustand stores, each with a single responsibility:

| Store | File | Holds |
| --- | --- | --- |
| `useSequence` | `src/store/sequence.ts` | The person: profile, signals emitted, carries, friends, direct messages, settings. Persisted to `localStorage`. |
| `useUI` | `src/store/ui.ts` | Where you are and what is open: level, focused place, focused person, open panel, open window. Not persisted. |
| `useTour` | `src/store/tour.ts` | The guided tour's stage machine. |

Components subscribe with selectors (`useUI((s) => s.level)`) so that a change
to one field does not re-render everything that touches the store. Actions are
plain functions on the store; there are no reducers, thunks or middleware
beyond zustand's own persistence.

## Rendering pipeline

One `<Canvas>` is mounted in `src/scene/Scene.tsx` and never unmounts. Inside
it:

- **Nebula** (`shaders/echo-nebula.frag.glsl`) — domain-warped fbm, the
  background of the opening sequence.
- **Road** (`shaders/road.*.glsl`) — a perspective divide in the fragment
  shader rather than geometry.
- **Galaxy** (`shaders/galaxy.*.glsl`) — roughly 140,000 points in one draw
  call.
- **Sky** (`shaders/sky.*.glsl`) — the entire hierarchy of places, people and
  signals as a single points program. Orbits are derived in the vertex shader
  from an index, so moving a signal around its star costs nothing on the CPU.
- **Links and rings** — line and ring programs for the figures drawn between
  people and the orbits around a star.

Everything the sky contains is uploaded once as attribute buffers and
addressed by index. Changing which star is focused sets a uniform; it does not
rebuild geometry.

Device pixel ratio is capped in `src/lib/dpr.ts` (2 on desktop, 1.75 on
handhelds) so that a high-density display does not quadruple the fragment
count for no visible gain.

## Routing and navigation

There is no router. Navigation is a state machine in `src/store/ui.ts` with
three levels:

```
cluster  ──enterConstellation──►  constellation  ──enterStar──►  star
   ◄────────────back──────────────      ◄────────back───────────
```

Panels and windows are orthogonal to level: at most one window is open at a
time, and opening one does not change where you are standing. `back()` is the
single exit from every level, and it is bound to the Back control and to
Backspace inside the keyboard navigation.

## Styling

- **Tokens** live in `src/index.css`: colour, radius, the z-index ladder,
  motion durations.
- **`--accent-h`** is a single hue custom property. Every glass surface,
  border and glow derives from it, so tinting a whole window to a person's
  colour is one property assignment rather than a theme object.
- **`--ink` / `--ink-2` / `--ink-3`** are the type ramp, and they flip
  wholesale between the dark and light modes.
- **`src/ui/responsive.css`** holds the breakpoint system: four width tiers
  (mobile up to 640, tablet 641–1024, laptop 1025–1440, wide 1441 and up), a
  fluid type scale on `clamp()`, a 4px spacing scale, plus short-landscape
  and print rules.
- **`src/ui/handheld.css`** holds small-screen layout, gated on width. Rules
  that are genuinely about the input device — hit target size, dropping the
  drawn cursor — are separated into a `pointer: coarse` block.

Component styles sit next to their component (`message-window.css` beside
`MessageWindow.tsx`) and are imported by it.

## Accessibility architecture

A canvas is one opaque element to assistive technology, so the 3D view alone
would close the application to anyone not using a mouse. The answer is a
parallel structure rather than a compromise:

- `src/ui/SkyNav.tsx` renders the same hierarchy as real `<button>` elements
  inside a `<nav>`, calling the same store actions the pointer does. It is
  off-screen until focus enters it.
- `src/ui/Window.tsx` implements a focus trap: focus moves into the dialog on
  open, Tab and Shift+Tab cycle within it, Escape closes it, and focus returns
  to whatever opened it.
- Landmarks: `<main>` in `App.tsx`, `<nav>` in `SkyNav`, `<footer>` in
  `Hud.tsx`, `role="dialog"` on every window.
- A polite live region in `App.tsx` announces each phase change.
- Decorative canvas overlays carry `aria-hidden="true"`.

The full account, including what was tested and how, is in
[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Testing strategy

Vitest runs against the same Vite transform pipeline as the application, so
there is no second build configuration to keep in step.

- **Pure logic** (`src/lib`, `src/store`, `src/scene/sky-data.ts`) is tested
  directly: determinism, boundaries, and the invariants the rest of the app
  assumes.
- **Components** are tested with Testing Library through the accessibility
  tree — queries are by role and name, so a test that passes is also evidence
  that the element is reachable.
- Coverage is collected with v8 and reported for the logic layers.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run them.

## Build and deployment

```
pnpm build     # tsc -b, then vite build → dist/
pnpm preview   # serve dist/ locally
```

`tsc -b` runs first and the build fails on any type error, so a broken type
cannot reach a bundle. Deployment is a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that builds with `GITHUB_PAGES=1` — which
sets the base path — and publishes `dist/` to GitHub Pages.

## Design decisions

**Why no router?** There are three levels and one open panel. A router would
add a dependency, a provider and a URL contract in exchange for state that a
fifteen-line store already expresses. Deep linking is not a goal: the point of
the piece is that you arrive somewhere and travel from there.

**Why derive the social layer instead of storing it?** Storing it would mean
either a server or a growing blob in `localStorage` that drifts out of step
with a rebuilt world. Deriving it from the signal's own id means the response
to a thing is a property of the thing: stable forever, costing nothing.

**Why one canvas for the whole session?** Creating a WebGL context is
expensive and losing one is unrecoverable without a reload. Mounting it once
also means the opening sequence and the sky are the same camera moving, which
is the entire premise of the piece.

**Why hand-written CSS alongside Tailwind?** Utilities are good at layout and
awkward for a design system with a hue variable at its centre. The split is
deliberate: Tailwind for structure, real stylesheets for anything that carries
the look.

**Why is `pointer: coarse` separated from width?** A narrow desktop window is
not a phone, but it needs the phone's layout; a touch laptop is not narrow,
but it needs the phone's hit targets. Conflating the two produced a layout
that only adapted on real devices, which is the opposite of responsive.
