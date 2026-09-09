# Testing

```bash
pnpm test        # run once
pnpm test:watch  # watch mode
pnpm coverage    # with v8 coverage
```

Vitest runs against the same Vite transform pipeline as the application, so
there is no second build configuration to keep in step: the same aliases, the
same GLSL plugin, the same TypeScript.

## What is tested, and why that split

The codebase divides cleanly into three kinds of thing, and each is tested the
way it can honestly be tested.

**Pure logic** — `src/lib`, `src/store`, `src/scene/sky-data.ts`. Deterministic
functions and state machines with no DOM and no GPU. These are tested directly
and thoroughly, because there is no excuse not to.

**Components** — tested through the accessibility tree with Testing Library.
Queries are by role and accessible name, never by class or test id, so a test
that passes is also evidence that the control is reachable by somebody using a
screen reader. A control that is awkward to select this way is a finding about
the control, not about the test.

**Shaders and the scene** — not unit tested. A test that asserts a uniform was
set proves nothing about what appears on screen, and jsdom has no GPU. These
are verified against a real browser instead, which is the only honest way to
check a shader.

## The invariants

The suite asserts properties that must hold whatever the internals become,
rather than restating the implementation:

| Area       | Held to                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sky-data` | The world is identical for a given seed; figures reference real stars; no person repeats a sentence; `placeMe` is idempotent; `syncMine` rebuilds and marks borrowed signals             |
| `echoes`   | Determinism per signal id; the reveal only grows with time; carriers come from the right place; silence between 10% and 60%; replies never outnumber carries; threads ordered and unique |
| `library`  | No duplicate ids; cover art stable for a title; palette hues stay in 200–360; shelf picks unique                                                                                         |
| `utils`    | `clamp`, `remap`, and `damp`'s frame-rate independence — the same approach over the same wall-clock time regardless of frame rate                                                        |
| `dpr`      | Caps at 2 and 1.75; `isHandheld` requires a coarse pointer **and** a narrow screen, not either                                                                                           |
| `sequence` | Emit assigns unique ids and persists; carry refuses duplicates; drop removes; settings merge rather than replace                                                                         |
| `ui`       | Navigation moves between the three levels; `enterStar` refuses a star that does not exist; only one window is open at a time                                                             |
| `tour`     | The stage machine advances and replays                                                                                                                                                   |
| `Window`   | Dialog role and accessible name; Escape closes; focus enters on open; Tab and Shift+Tab are both contained                                                                               |

## A bug fix comes with its test

The focus trap in `Window.tsx` filtered candidate elements on `offsetParent`.
That is a layout question, and jsdom has no layout engine, so the filter
emptied the list and the trap was silently inert under test while appearing to
work in a browser. The test that exposed it is the reason it stays working.

That is the standard: when something breaks, the fix lands with the test that
would have caught it.

## Coverage

```bash
pnpm coverage
```

Collected with v8 over the logic layers — `src/lib`, `src/store` and
`src/scene/sky-data.ts`. The component and scene layers are deliberately
outside that measurement: a coverage number that counts JSX executed during a
render tells you a component mounted, not that it works.

## Writing a new test

- Put it beside what it tests: `echoes.ts` → `echoes.test.ts`.
- Assert the invariant, not the current output. If a refactor that preserves
  behaviour breaks your test, the test was about the implementation.
- In component tests, query by role and name:

  ```ts
  screen.getByRole("button", { name: /carry/i });
  ```

- Reach for a real user event over a synthetic one where the difference
  matters — a click that must pass through a real pointer sequence.
- `src/test/setup.ts` handles the rest: `jest-dom` matchers, `matchMedia` and
  `requestAnimationFrame` stubs, and cleanup with `localStorage.clear()` after
  every test, so nothing leaks between them.
