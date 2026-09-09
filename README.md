# ECHO

[![CI](https://github.com/varadharajanv0310/ECHO/actions/workflows/ci.yml/badge.svg)](https://github.com/varadharajanv0310/ECHO/actions/workflows/ci.yml)
[![Deploy](https://github.com/varadharajanv0310/ECHO/actions/workflows/deploy.yml/badge.svg)](https://github.com/varadharajanv0310/ECHO/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B6DF0.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![three.js](https://img.shields.io/badge/three.js-r185-000000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-202%20passing-3FB950)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-76%25-3FB950)](#coverage)

### [Open the sky →](https://varadharajanv0310.github.io/ECHO/) · [Field guide →](https://varadharajanv0310.github.io/ECHO/guide.html)

![The cluster: six places, and nothing else on screen](docs/shots/cluster.jpg)

A social platform where content does not belong to you. It belongs to a place,
it travels through people, and it dies if nobody carries it.

You emit a **signal** into a **World** — a place, a topic, a moment. It never
sits on your profile. From there it travels outward only when a human chooses
to carry it. Reach is earned one hop at a time. A signal that lands travels far.
A signal that lands with nobody fades and is gone — in twelve hours, a day or
three, depending on what you gave it.

There is no ranking function anywhere in the system, no followers, no likes, no
view counts, no paid reach, no infinite scroll, and no data collection. None of
these are enforced rules. They are consequences of the architecture, which is
the strongest form of the claim.

Built for **The Frontend Odyssey 2026**. Frontend only — no backend, no
database, no server-side code. Everything runs in the browser on a static build,
and nothing ever leaves it.

---

## Features

Every required capability, where it is implemented, and how to reach it in the
running app.

### 1. Content Creation & Sharing

Users create content and share it into the network.

|                    |                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Create**         | `src/ui/panels/CreatePanel.tsx` — compose a post, choose the place it is published to, and set how long it lives (12 hours / 1 day / 3 days).                                                                         |
| **Publish**        | `emit()` in `src/store/sequence.ts` — writes the post and renders it immediately in the 3D scene.                                                                                                                     |
| **Share / repost** | `carry()` in `src/store/sequence.ts`, control in `src/ui/SkyDock.tsx` — resharing another user's post adds it to your own space, credits the original author, and extends its lifetime. This is the sharing mechanic. |
| **Reply**          | `sendDM()` with subject context — replying to a post keeps a reference to what it replied to.                                                                                                                         |
| **Try it**         | Rail → **+** → pick a place → write → _Emit_. Then open anyone's post and press _Carry this_.                                                                                                                         |

### 2. Content Discovery

Users find content and other users through multiple discovery surfaces.

|                      |                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Search**           | `src/ui/panels/SearchPanel.tsx` — full-text search across all posts and all users, with filters by place and by post lifetime. |
| **Browse**           | Four-level spatial browse — all places → one place → one user → their posts (`src/scene/Sky.tsx`).                             |
| **Explore by topic** | Six topic communities. Entering one shows only the users publishing there.                                                     |
| **Activity feed**    | Dashboard → _Responses_ — replies and reshares your content received.                                                          |
| **Try it**           | Rail → **search icon**, or click any place in the 3D view to browse into it.                                                   |

### 3. Personalized Experience

Every user configures their own identity and their own interface.

|                 |                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Profile**     | `src/ui/ProfileWindow.tsx` — display name, status, bio, avatar mark, banner, and interest tags.                                            |
| **Theming**     | User-selected accent colour drives the entire interface through one `--accent-h` custom property, plus light/dark mode. Profile → _Theme_. |
| **Interests**   | Curated catalogue of 70 games and 59 songs (`src/services/library.ts`); the shelf a user builds is shown on their profile.                 |
| **Connections** | Add users; their star is marked everywhere you meet them and they are listed in the Dashboard.                                             |
| **Preferences** | `src/ui/panels/MenuPanel.tsx` — notification settings, visibility settings, motion and grain controls, all persisted.                      |
| **Try it**      | Rail → **profile icon** → _Theme_.                                                                                                         |

### 4. Navigation & User Flow

|                        |                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Primary navigation** | Persistent rail, `src/ui/Rail.tsx` — five destinations, `<nav>` landmark, active state, keyboard reachable. |
| **Breadcrumb**         | `src/ui/SkyHud.tsx` — always shows current location and every level is clickable to go back.                |
| **Back**               | Explicit back control at every depth, plus browser-consistent behaviour.                                    |
| **Onboarding flow**    | `src/ui/Tour.tsx` — a guided first-run walkthrough plus coach marks over each control.                      |
| **Deep links**         | `?phase=` routes to any stage for direct entry.                                                             |

### 5. Responsive & Accessible UI

|                |                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsive** | Breakpoint system in `src/ui/responsive.css` — mobile, tablet, laptop and wide tiers, plus touch refinements. Fluid type and spacing throughout via `clamp()`.                                                                               |
| **Accessible** | Semantic landmarks, heading hierarchy, skip link, ARIA roles and labels, focus trap in dialogs, full keyboard navigation including the 3D scene, visible focus states, `prefers-reduced-motion` support, and a documented no-WebGL fallback. |
| **Verified**   | See `docs/ACCESSIBILITY.md`.                                                                                                                                                                                                                 |

### 6. Creative & Original Design

An original interaction model, not a restyled feed. Content is addressed to a
place rather than an audience; it propagates only by user action; and it expires
without it. The interface is a custom WebGL environment with hand-written GLSL,
a synthesised audio score, and a variable-font wordmark treatment — no UI kit,
no component library, no template.

---

## Tech Stack

| Concern       | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| Build tool    | Vite 8 (Rollup/rolldown production build)                |
| Language      | TypeScript 7, `strict`                                   |
| UI runtime    | React 19                                                 |
| 3D            | three.js 0.185 with @react-three/fiber 9                 |
| Shaders       | GLSL, compiled by `vite-plugin-glsl`                     |
| State         | zustand 5                                                |
| Styling       | Tailwind v4 plus a stylesheet per component              |
| Smooth scroll | Lenis                                                    |
| Testing       | Vitest 5, Testing Library, jsdom                         |
| Linting       | oxlint, with `jsx-a11y`, `react` and `unicorn` rule sets |
| Formatting    | Prettier 3                                               |
| CI/CD         | GitHub Actions to GitHub Pages                           |

See [ARCHITECTURE.md](ARCHITECTURE.md) for why each of these was chosen.

## Getting Started

### Prerequisites

- **Node.js** 20 or newer
- **pnpm** 9 or newer — `corepack enable` will provide it
- A browser with WebGL2

There is nothing else to configure: no environment variables, no API keys and
no services to start. See [.env.example](.env.example), which exists to say so.

### Installation

```bash
git clone https://github.com/varadharajanv0310/ECHO.git
```

```bash
cd ECHO && pnpm install
```

### Running locally

```bash
pnpm dev
```

The dev server runs on port 5180.

### Building for production

```bash
pnpm build
```

### Scripts

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `pnpm dev`        | Vite dev server with HMR, on port 5180         |
| `pnpm build`      | `tsc -b`, then a production build into `dist/` |
| `pnpm preview`    | Serve the built `dist/` locally                |
| `pnpm test`       | Run the Vitest suite once                      |
| `pnpm test:watch` | Vitest in watch mode                           |
| `pnpm coverage`   | The suite with v8 coverage                     |
| `pnpm typecheck`  | Types only, no emit                            |

## Testing

```bash
pnpm test         # 202 tests, 17 files
pnpm coverage     # the same run with v8 coverage
pnpm verify       # typecheck, lint, test and build in one go
```

**202 tests across 17 files**, run with Vitest against the same Vite transform
pipeline as the application — the same aliases, the same GLSL plugin, the same
TypeScript — so there is no second build configuration to drift out of step.

| Layer                | Files                                       | What is held to                                                                                                                                |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| World generation     | `sky-data`, `sky-geometry`                  | Determinism for a seed; figures reference real stars; nobody repeats a sentence; `placeMe` idempotent                                          |
| Derived social layer | `echoes`                                    | Stable per signal id; the reveal only grows with time; carriers come from the right place; silence 10–60%; replies never outnumber carries     |
| Stores               | `sequence`, `ui`, `tour`                    | Unique ids; carry refuses duplicates; settings merge rather than replace; one window at a time; `enterStar` refuses a star that does not exist |
| Feature API          | `features`                                  | Every conventional name reaches the mechanic it claims to; advertised caps are real; search is genuinely unranked                              |
| Hooks and utilities  | `useExit`, `webgl`, `math`, `dpr`           | Delayed unmount holds and cancels correctly; `damp` is frame-rate independent; the WebGL probe answers rather than throwing, and caches        |
| UI primitives        | `primitives`                                | A button always states its type; a chip always reports `aria-pressed`; a field cannot be unlabelled; the boundary catches and recovers         |
| Components           | `SkyNav`, panels, windows, `Rail`, `Window` | Landmarks and roles; keyboard navigation; focus trap; every panel's real behaviour                                                             |

### Coverage

|            |           |
| ---------- | --------- |
| Statements | **76.5%** |
| Branches   | **63.0%** |
| Functions  | **72.1%** |
| Lines      | **79.1%** |

Thresholds are set at 60% across all four and enforced in CI, so removing a
test is a visible decision rather than a silent one. Coverage is collected
over the logic layers — `utils`, `hooks`, `services`, `store` and the world
generator. The scene and the components are deliberately outside that number:
a percentage that counts JSX executed during a render tells you a component
mounted, not that it works.

### How these tests are written

Three rules, and they are the reason the suite is worth having rather than
merely large.

**Queried by role and accessible name, never by class or test id.** Every
component assertion is therefore two assertions at once: that the thing works,
and that somebody using a screen reader can find the control that does it. A
control that is awkward to select this way is a finding about the control.

**Asserting the invariant, not the implementation.** The suite says the world
is deterministic, that replies never outnumber carries, that ids are unique,
that search returns the same order twice and that order is not the stored one.
A refactor that preserves behaviour does not break these.

**A bug fix arrives with the test that would have caught it.** The focus trap
in `Window.tsx` filtered candidates on `offsetParent`, which is a layout
question — and jsdom has no layout engine, so the filter emptied the list and
the trap was silently inert under test while appearing to work in a browser.
The test that exposed it is the reason it stays working. The same applies to
the sky's `aStar` attribute, which was `-1` instead of the star's own id: a
wrong vertex attribute does not throw, it just draws the wrong thing, so the
only way that surfaces is a test or a pair of eyes.

### What is not unit tested, and why

The shaders and the scene. A test asserting that a uniform was set proves
nothing about what appears on screen, and jsdom has no GPU. These are verified
against a real browser instead — which is the only honest way to check a
shader, and how the geometry extraction above was confirmed before it landed.

## Engineering

The parts of this that are not visible in a screenshot.

### Code quality

|                                                |                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `console.log` in application code              | **0**                                                                                                                          |
| `any` in application code                      | **0**                                                                                                                          |
| `innerHTML`, `dangerouslySetInnerHTML`, `eval` | **0**                                                                                                                          |
| `TODO` / `FIXME` / `@ts-ignore`                | **0**                                                                                                                          |
| TypeScript                                     | `strict`, plus `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| Lint                                           | oxlint — correctness, security and accessibility rules as errors                                                               |
| Build gate                                     | `tsc -b` runs before `vite build`, so a type error cannot reach a bundle                                                       |

Configuration files are inside the typecheck too, which is how two real bugs
surfaced: a manual-chunk function that fell off its end without returning, and
a plugin being handed an option it does not have.

### Architecture

Layered, with the dependency arrows pointing one way only —
`ui`/`beats` → `store` → `services`/`hooks`/`utils` → `types`/`constants`.
Barrels at each layer make the direction visible in the imports rather than
only in a diagram. See [ARCHITECTURE.md](ARCHITECTURE.md).

There is also a [feature layer](src/features) that gives every capability its
conventional name — `createPost`, `sharePost`, `searchPosts`, `toggleFollow`,
`sendMessage` — delegating to the mechanics underneath. ECHO names things
after what they mean rather than what they resemble, and that is a good
decision for the product and a bad one for anybody reading the source for the
first time. The bridge is written down rather than left to be inferred.

### Accessibility

|                                 |                                                         |
| ------------------------------- | ------------------------------------------------------- |
| axe-core violations             | **0** across sky, profile, dashboard, create and search |
| ARIA attributes                 | 86                                                      |
| Label associations (`htmlFor`)  | 13, covering every form control                         |
| Buttons with an explicit `type` | 67 of 67                                                |
| Landmarks                       | `main`, `nav`, `contentinfo`, `dialog`                  |

The 3D view has a full keyboard equivalent in [`SkyNav.tsx`](src/ui/SkyNav.tsx)
— the same hierarchy as real buttons, calling the same store actions, so the
two paths cannot drift apart. Dialogs trap and restore focus. Motion respects
`prefers-reduced-motion`; the theme follows `prefers-color-scheme`; high
contrast and forced-colours modes are handled rather than ignored. The full
account, including what is **not** solved, is in
[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

### Responsive

26 media queries across four width tiers, plus **4 container queries** on the
window body — because a profile is two columns at 1180px and one at 600px, and
which it should be depends on the width of the window, not the width of the
monitor. Fluid type and spacing throughout via `clamp()`. Breakpoints are
keyed on width; touch refinements such as 44px hit targets are gated
separately on `pointer: coarse`, because a narrow desktop window is not a
phone and a touch laptop is not narrow.

### Performance

- One WebGL context for the entire session; nothing mounts or unmounts between
  beats.
- The whole sky is **one draw call** — every place, person and signal in a
  single points geometry, with orbits derived in the vertex shader.
- The six panels are **code-split** and prefetched on idle, so the split costs
  a round trip that has already happened by the time anything is clicked.
- three.js and React are separate chunks with their own cache lifetimes.
- Search defers its query with `useDeferredValue` and memoises its rows behind
  a stable callback, so typing paints before it filters.
- Device pixel ratio is capped at 2, and 1.75 on handhelds.
- Nothing allocates inside `useFrame`.

### Security

No backend, no database, no authentication, no network call after the bundle
loads — which removes most of a threat model rather than mitigating it. What
remains is handled: a Content Security Policy, `nosniff`, a referrer policy,
`rel="noopener noreferrer"` on every external link, length caps at every input,
and a dependency audit on each push. See [SECURITY.md](SECURITY.md).

## Documentation

| Document                                           | What is in it                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Layering, data flow, state, the rendering pipeline, and the reasoning behind each choice                                 |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)     | Keyboard model, screen reader support, focus management, contrast, motion, what was tested, and what is still not solved |
| [CONTRIBUTING.md](CONTRIBUTING.md)                 | Setup, code style, testing expectations, the accessibility bar and the performance budget                                |
| [docs/echo-components.md](docs/echo-components.md) | The provided components, and what was done with them                                                                     |
| [LICENSE](LICENSE)                                 | MIT                                                                                                                      |

## Usage

The whole thing is one continuous piece of choreography, so reviewing a later
beat should not mean replaying the earlier ones every time.

| URL                      | What it does                                            |
| ------------------------ | ------------------------------------------------------- |
| `/`                      | Normal entry. First visit runs the full sequence.       |
| `/?reset`                | Clears the stored profile and replays from the void.    |
| `/?phase=galaxy`         | Jumps straight to a beat. Any phase name works.         |
| `/?phase=passage&p=0.62` | Jumps to a point inside the passage.                    |
| `/?debug`                | Opens the tuning panel on the deployed build.           |
| `/?nogl`                 | Forces the no-WebGL fallback, on a machine that has it. |

Phase names: `void`, `reveal`, `passage`, `galaxy`, `ignition`, `profile`,
`dive`, `constellation`.

A jump lands **settled** rather than animating in from component defaults —
uniforms snap to target on the first frame — so reviewing a later beat is never
a race against the damping.

### The tuning panel

`leva` is mounted in development and behind `?debug` in production. Grain
amount, speck size, bite and cadence; particle count and density; nebula boost;
road and galaxy exposure; vignette.

Everything is a **multiplier over the per-phase mix**, so dragging a slider
scales the whole curve rather than flattening the relationship between phases.
Exposure knobs are written to a plain mutable object and read inside animation
frames, never rendered from — otherwise every pixel of slider movement would
re-render the tree.

---

## The sequence

| Beat | State           | What happens                                              |
| ---- | --------------- | --------------------------------------------------------- |
| 1    | `void`          | Loading. Starfield, nebula cloud, a falling figure.       |
| 2    | `reveal`        | The void stains. ECHO resolves out of the nebula.         |
| 3–5  | `passage`       | The bleed becomes a road. Six stops. The galaxy appears.  |
| 6    | `galaxy`        | The only interactive object on the page.                  |
| 7a   | `ignition`      | A sub drops, a spark ignites, the frame blows out.        |
| 7b   | —               | A returning visitor skips 7a and 8 and dives straight in. |
| 8    | `profile`       | Name, mark, colour, Worlds. No email, no password.        |
| 9    | `dive`          | The warp.                                                 |
| 10   | `constellation` | Arrival. The sky settles.                                 |

![The wordmark resolving out of the nebula](docs/shots/reveal.jpg)
_Beat 2. The bleed is an SVG `feGaussianBlur` with a two-value `stdDeviation`,
blurring six times harder vertically than horizontally, so every letter stem
becomes its own falling strand._

![The galaxy, the only interactive object on the page](docs/shots/galaxy.jpg)
_Beat 6. Click it._

Two structural decisions carry the whole thing:

**Beats 1 and 2 are one component.** The void does not unmount and the reveal
does not mount. The nebula, the figure and the wordmark are all present
throughout; only their visibility changes. That is what lets the void _stain_
into the reveal instead of cutting to it.

**Beats 3 through 10 are one canvas.** Road, galaxy, warp and constellation are
objects inside a single world with a single camera, mounted once and never
unmounted. Moving between them is a camera move and a crossfade of uniforms
rather than four components tearing down and rebuilding — which is the only way
the handoffs are genuinely seamless rather than well-timed.

---

## The sky, once you are in it

Four levels, and the trail across the top always says which one you are in.

| Level   | What it is                                        | What you can do                                                   |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Cluster | Six places                                        | Drag to look. Click a place to fly into it.                       |
| Place   | The people standing in it, joined into a figure   | Click a person to stand at them.                                  |
| Person  | Their star, with their signals on rings around it | Click a signal to read it. Click them again to open who they are. |
| Signal  | One thing somebody said                           | Read it, reply, or **carry** it.                                  |

![A place, with its people joined into a figure](docs/shots/world.jpg)
_A place. Only the people standing in it are drawn, and the figure between them
is a nearest-neighbour chain — you are joined to it when you arrive._

![Standing at your own star, three signals on rings around it](docs/shots/system.jpg)
_Standing at somebody. Their signals orbit them, newest closest in, each
labelled with what it actually says._

**Carrying is the only verb that matters.** Opening somebody else's signal lets
you carry it: it starts orbiting your star as well, keeps their name and their
colour, is labelled _via them_, and its clock restarts. It is the only way
anything travels and the only way anything survives. Put it down and nothing
else is holding it up.

![Reading one of somebody's signals, with the carry control](docs/shots/someone.jpg)
_Opening a signal. How many people are carrying it, how long it has left, and
the one button that changes anything for anybody else._

**Colour is identity.** Everyone picks a hue. It tints their star, their
profile window, and your cursor while you are with them, through a single
`--accent-h` custom property that every glass surface derives from. Nothing in
the interface hardcodes a violet. A carried signal keeps _its author's_ hue, so
your own system shows at a glance what you wrote and what you are holding for
other people.

**Amber is reserved.** It is the only warm colour in the palette and it means
one thing: dying. It is deliberately absent from the colours you can pick for
yourself.

**You find out who.** A carry is reported by name — _carried by north_, or
_carried by nobody_ — never as a count. Which person chose to hold your thing
is the whole payoff of the mechanic, and a number is the one thing ECHO refuses
to put on anybody's work.

**Replies keep their subject.** Answering something of somebody's carries what
it was about, so a reply never arrives as a message from nowhere. People answer
back, too — about half the time, after a few minutes — so a thread reads as two
people rather than a transcript of you talking to a wall.

**Adding somebody marks their star.** A dot in their own accent, wherever you
meet them in the sky, and a list in the dashboard of the ones you have not
spoken to yet. The sky stops being the same generated field for everyone.

**One badge, on your own inbox.** The dashboard carries a dot when something has
landed since you last looked. It is a count of things waiting to be read rather
than a measure of how well anything did, and it goes back to nothing the moment
you read them.

### The five controls

|               |                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**   | Name, one line, mark, banner, colour; shelves for games and music from a catalogue with generated cover art; handles for anywhere else you are.                                        |
| **Menu**      | Ground and accent, grain, reduced flashing, what reaches you, the opening sequence again, the tutorial again, the field guide.                                                         |
| **Create**    | Choose a place, write it, give it 12 hours / a day / three days. It appears immediately, orbiting your star.                                                                           |
| **Search**    | Signals and people. Results are scrambled by a hash of the id — stable between renders, and unrelated to who wrote a thing or when. There is no best result in a place with no scores. |
| **Dashboard** | Split three ways: what you **sent** and how long it has left, what came **back**, and the people you are actually **talking to**.                                                      |

![A profile: banner, mark, traits, shelves for games and music](docs/shots/profile.jpg)
_A profile. The window is tinted by that person's hue — visiting somebody
should feel like walking into their room, not reading their row in a database._

![The dashboard, split into sent, responses and messages](docs/shots/dashboard.jpg)
_The dashboard. Every clock runs down; the only thing that resets one is
somebody choosing to carry what you said._

### Onboarding

ECHO does almost nothing a social network is expected to do, so somebody landing
in the sky has no feed to scroll and no obvious next click. A tour runs once per
browser: a welcome, six cards on what the place is, then a pass along the rail
with each control lit in turn and a note beside it. The card art is drawn rather
than screenshotted — half of what needs explaining is not a state the interface
is ever in at one moment. It can be replayed from the menu.

![A tutorial card explaining carrying](docs/shots/tour.jpg)

The longer version is the **[field guide](https://varadharajanv0310.github.io/ECHO/guide.html)**,
which ships from the same build.

### When it cannot run

Every part of ECHO worth seeing is a shader, so there is a real screen for a
browser that cannot open a WebGL context — what is wrong, the three things it
usually is, and the two links that still work. Hardware acceleration is off by
default on a lot of remote desktops and virtual machines. `?nogl` forces it.

`prefers-reduced-motion` is honoured: the flashframe softens by default and the
decorative animations collapse. The scroll-driven parts stay, because the road
only moves when a reader moves it.

### Light mode

Not an inversion. The mode is a `uLight` uniform inside each shader, so hues
survive and glow becomes pigment — the sun at a person's star turns from a
bright core into dense ink on paper. In the interface, type comes from `--ink`
in three weights defined once per mode, so a new surface is legible in both
without being remembered twice.

![The same star in light mode, drawn as ink on paper](docs/shots/light.jpg)

---

## Project Structure

```
src/
  beats/        one folder per beat of the entry sequence
  components/
    layers/     persistent fixed layers (grain, vignette)
    ui/         the three provided components, modified
  scene/        the persistent r3f canvas and everything in it
    sky-data.ts the generated hierarchy, and where you are placed in it
  shaders/      GLSL, imported through vite-plugin-glsl
  store/        sequence phase machine, sky navigation, tour
  ui/           everything that lives over the sky
    panels/     menu, create, search, dashboard
    primitives/ Button, Chip, Card, Field, EmptyState, ErrorBoundary
    profile/    the profile window's tab bodies
  features/     every capability under its conventional name
  types/        the domain vocabulary, in one import
  test/         Vitest setup
  hooks/        scroll, delayed unmount, unseen count
  utils/        maths, resolution policy, feature probes
  services/     audio, echoes, the catalogue
  constants/    scene tuning
  copy.ts       every word in the interface
public/
  guide.html    the field guide, shipped alongside the app
```

**Stack.** Vite, React 19, TypeScript, Tailwind v4, three.js / react-three-fiber
/ postprocessing, Lenis, zustand. Fonts self-hosted via Fontsource. `leva` is a
dev dependency only. No animation library: presence is CSS keyframes gated on a
`data-closing` attribute by a small `useExit` hook, which owns its own unmount
rather than hoping something unmounts late.

---

## Design System

**Palette**, sampled from the reference set rather than guessed. The references
mass at hue 258–300 and tail to 324, with almost no warm content anywhere —
which is why amber is rare here too.

| Token                   | Value     | Role                                             |
| ----------------------- | --------- | ------------------------------------------------ |
| `--color-void`          | `#04030A` | Ground. Near-total black, shifted toward violet. |
| `--color-violet-deep`   | `#4F06F8` | The road.                                        |
| `--color-violet`        | `#8B2FF8` | Life, propagation.                               |
| `--color-violet-bright` | `#B026FF` | Resonance.                                       |
| `--color-magenta`       | `#FA42B0` | Reach.                                           |
| `--color-amber`         | `#FF7326` | **Decay and death only.** Used at a whisper.     |
| `--color-spark`         | `#FFFFFF` | Ignition.                                        |

Life is violet, death is amber, ignition is white. Brightness carries a hue as
well as a luminance, which is what stops the interface going flat purple.

The rule is enforced by the interface rather than written in a guideline:
**amber is absent from the colours you can choose in profile creation**, because
it is the colour a signal turns when it is dying.

**Type.** Archivo Variable for display — a grotesque that holds at 19vw under a
prism smear, with a width axis the wordmark animates so ECHO physically widens
as it resolves. Geist Mono for system voice, labels and credit blocks.

**Texture.** Film grain over everything at fixed screen density, rendered at DPR
1 so it belongs to the screen and not to the content. It _screens_ rather than
overlays, because in a frame that is ninety percent black the grain has to live
in the blacks. It reshuffles at 24fps rather than at display rate — grain that
changes every frame at 120Hz stops looking like emulsion and starts looking like
a broken signal.

**Motion.** Almost everything is still. When something moves, it moved because a
person did. The road only travels while you scroll. The prism smear on the
passage type is scroll-linked rather than timed, so it reports where the reader
is instead of playing on a loop. The constellation orbit is damped by hand
rather than using OrbitControls, because controls that keep sliding would be the
one place the interface stopped agreeing with itself.

---

## Technical Highlights

**Anisotropic blur is what makes the bleed work.** A CSS `blur()` is isotropic
and gives a soft halo. The references all show light falling in _strands_. An
SVG `feGaussianBlur` with a two-value `stdDeviation` blurs roughly six times
harder vertically than horizontally, which turns every letter stem into its own
falling strand. The same trick, at a different scale, is what turns noise into
lanes on the road.

**The road is a fragment shader, not geometry.** Below the horizon the screen is
reprojected onto a ground plane by the perspective divide, and the noise is
sampled compressed across the road and stretched along it. The reference is
flowing liquid light with no surface and no edges — that is a fragment problem.

**The sky is a hierarchy, not a graph.** An earlier build drew every signal as
one propagation tree, and two hundred nodes at one zoom level is a tangle
nobody can read. It is now four levels you travel through - cluster, place,
person, and the things orbiting them - generated from a seeded PRNG so it is
identical on every visit and on every machine. All of it, every place, person
and signal, is one `THREE.Points` draw call; what changes between levels is a
`uLevel` uniform deciding what is worth looking at. Planets are not positioned
on the CPU at all: the vertex shader derives each orbit from a radius, a phase
and a tilt every frame.

**Decay is derived, never stored.** What the sky does with your signal - who
picks it up, when, and whether anyone ever does - is a hash of the signal's id
against the clock. Identical on every render and across a reload, with no timer
and nothing written down, and about a quarter of signals are never carried at
all. Time is the only input that moves.

**The audio is synthesised, not loaded.** A drone of detuned oscillators through
a moving lowpass, brown noise for air, and short transients for moments a person
caused. Browsers refuse to start audio before a gesture, so it starts on the
first scroll — which is also the first moment anything in the piece moves
because a person moved it.

---

## Notes on the provided components

All three shipped as page-level demos and needed structural changes to work as
layers in a sequence.

**`nebula-shader.tsx`** — the stock `hue()` cycles the full rainbow and puts
cyan and green on screen in the first frame anyone sees; remapped to violet
through magenta with amber only in the brightest cores. It also cleared to
opaque black, which made the persistent particle layer invisible for the whole
of beats 1 and 2 — it now writes premultiplied alpha so light composites over
whatever is underneath. Animated uniforms were effect dependencies, which
relinked the shader program on every change; they are read from a ref inside the
loop instead, and damped. Two layers were added that the loading reference
needs and the stock shader had no notion of: a screen-space starfield and a
domain-warped fbm nebula cloud.

**`fluid-particles-background.tsx`** — was an `h-screen` page wrapper that
centred its children. Now a fixed, non-interactive layer with a damped opacity
prop driven per phase, dark-only, violet-tinted per particle, and DPR-aware.

**`galaxy-warp.tsx`** — deliberately not used as shipped. As a self-contained
opaque `<Canvas>` it cannot enter without a visible cut: an opaque black
rectangle appearing while it compiles shaders and uploads geometry is not
something you can crossfade into. The same maths lives in `scene/WarpField.tsx`
as an object inside the persistent canvas, always resident, accelerating from
nothing and decelerating so the streaks shorten back into stars.

---

## Roadmap

Where this goes next, in the order it would be worth doing.

**Near term**

- [ ] Container queries for the panels, so a window adapts to its own width
      rather than the viewport's
- [ ] Virtualised search results, for when a sky has thousands of signals
- [ ] Per-place figures authored by hand, rather than derived, for the six
      opening Worlds
- [ ] A second pass on the sound design: the cues are one-shots, and the sky
      should have a floor

**Further out**

- [ ] Deep links into a place or a person, so a sky can be shared as a URL
- [ ] Export and import of a profile, as a file the reader holds
- [ ] An optional peer channel, so two browsers can share one sky without a
      server between them
- [ ] Narration of the canvas itself for screen readers — the sky navigation
      gives the structure, but not the composition

## Deployment

Pushes to `main` build and publish to GitHub Pages automatically, via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow
typechecks and runs the test suite before it builds, so a failing test stops a
deploy rather than shipping with it.

Every push and pull request also runs [`ci.yml`](.github/workflows/ci.yml):
typecheck, lint, tests, coverage, build, and a dependency audit.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup,
the code style, what a change is expected to prove, and the accessibility and
performance bars it has to clear.

In short, before opening a pull request:

```bash
pnpm verify
```

That runs typecheck, lint, tests and build in one go — the same four things CI
will run.

## License

[MIT](LICENSE) © V Varadharajan.

## Acknowledgements

- **The Frontend Odyssey 2026** for the brief, and for the constraint that
  made it interesting: frontend only, no backend, no database.
- **[three.js](https://threejs.org)** and
  **[@react-three/fiber](https://r3f.docs.pmnd.rs)**, which are the reason a
  single canvas can hold a whole sky.
- **[Lenis](https://lenis.darkroom.engineering)** for scroll that behaves like
  a camera move rather than a scrollbar.
- **[zustand](https://zustand.docs.pmnd.rs)**, for state that needed no
  provider tree.
- **Archivo** and **Geist Mono**, the two variable faces the whole visual
  identity rests on.
