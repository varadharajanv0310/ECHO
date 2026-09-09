# Contributing

Thanks for looking. This document covers how to run ECHO locally, how the
source is organised, and what a change is expected to satisfy before it lands.

## Table of contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Code style](#code-style)
- [Commit messages](#commit-messages)
- [Testing](#testing)
- [Accessibility requirements](#accessibility-requirements)
- [Performance budget](#performance-budget)
- [Pull requests](#pull-requests)

## Prerequisites

- **Node.js** 20 or newer
- **pnpm** 9 or newer (`corepack enable` will provide it)
- A browser with WebGL2. The application detects its absence and says so, but
  you cannot develop the scene without it.

## Getting started

```bash
pnpm install
pnpm dev
```

The dev server prints a local URL. There is nothing to configure: no
environment variables, no API keys, no services to start. The application is
entirely client-side.

## Scripts

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `pnpm dev`        | Vite dev server with HMR                       |
| `pnpm build`      | `tsc -b`, then a production build into `dist/` |
| `pnpm preview`    | Serve the built `dist/` locally                |
| `pnpm test`       | Run the Vitest suite once                      |
| `pnpm test:watch` | Vitest in watch mode                           |
| `pnpm coverage`   | The suite with v8 coverage                     |
| `pnpm typecheck`  | Types only, no emit                            |

## Project structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full account. The short version:

```
src/beats/       the opening sequence, one component per stage
src/scene/       everything inside the WebGL canvas
src/shaders/     GLSL
src/store/       zustand stores — the only mutable state
src/hooks/       React hooks
src/utils/       pure functions
src/services/    audio, echoes, the catalogue
src/constants/   tuning tables
src/ui/          windows, panels, chrome, keyboard navigation
src/components/  shared presentational pieces
src/types/       shared domain types
```

The dependency direction is one-way: `ui` and `beats` may read `store`;
`store` may read `lib`; `lib`, `shaders` and `types` depend on nothing above
them. A change that needs an arrow pointing the other way is a sign that the
thing belongs in a lower layer.

## Code style

- **TypeScript, strict.** No `any` in application code. If a third-party type
  is wrong, narrow it at the boundary rather than widening ours.
- **Named exports.** Default exports only where a tool requires one.
- **One component per file**, named the same as the file.
- **Component styles live beside the component** as a `.css` file the
  component imports.
- **Comments explain why, not what.** A comment that restates the line below
  it is noise; a comment recording why the obvious approach failed is the most
  valuable thing in the file. Several of the comments in this codebase exist
  because someone lost an hour to the thing they describe.
- **Public helpers, hooks and store actions carry TSDoc.** One sentence on what
  it is for, plus anything a caller could get wrong.
- Formatting follows the existing files: two-space indent, double quotes,
  semicolons.

## Commit messages

Write the subject as a sentence saying what the commit does to the product,
not what files it touched.

```
Make the sky clickable where it looks clickable
Give a conversation its own window
Take no for an answer on motion
```

Not `fix: update Sky.tsx` or `wip`. The body, where there is one, explains why
the change was needed and what was tried first.

## Testing

```bash
pnpm test
```

What is expected of a change:

- **New logic in `src/utils`, `src/services`, `src/store` or `src/scene/sky-data.ts` comes with
  tests.** These are pure, so there is no excuse not to.
- **Test the invariant, not the implementation.** The suite asserts that the
  world is deterministic, that replies never outnumber carries, that ids are
  unique, that `placeMe` is idempotent — properties that must hold whatever
  the internals become.
- **Query by role and accessible name** in component tests. If a control is
  hard to select that way, that is a finding about the control.
- **A bug fix comes with the test that would have caught it.** The focus trap
  in `Window.tsx` was inert under jsdom for a while; the test that exposed it
  is now the reason it stays working.

## Accessibility requirements

Every change is expected to keep these true. See
[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for the detail.

- Anything reachable by pointer is reachable by keyboard.
- New navigation actions are added to `src/ui/SkyNav.tsx` as well as to the
  canvas, and both call the same store action.
- Every interactive element has a visible focus state and an accessible name.
- New dialogs use the `Window` primitive, so they inherit the focus trap.
- Decorative elements are `aria-hidden`.
- Anything that moves respects `prefers-reduced-motion`.
- Touch targets are at least 44px under `pointer: coarse`.

## Performance budget

The scene is the expensive part, and the rules that keep it cheap are easy to
break by accident.

- **One WebGL context.** Do not mount a second `<Canvas>`, and do not unmount
  the existing one between beats.
- **Do not rebuild geometry per frame.** The sky is uploaded once and
  addressed by index; changing what is focused sets a uniform.
- **Nothing allocates inside `useFrame`.** No new vectors, no array methods
  that return arrays, no object literals.
- **Respect the DPR cap** in `src/utils/dpr.ts`.
- Derived values that feed the scene are memoised, and the store is read
  through selectors rather than whole.

## Pull requests

Before opening one:

```bash
pnpm typecheck && pnpm test && pnpm build
```

All three must pass. In the description, say what the change does, why it was
needed, and anything you tried that did not work — that last part saves the
next person the same hour.
