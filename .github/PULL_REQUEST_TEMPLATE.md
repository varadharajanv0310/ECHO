## What this changes

## Why

## What you tried first

The thing that did not work is often the most useful part of a pull request.
If there was one, say so here.

## Checklist

- [ ] `pnpm verify` passes (typecheck, lint, tests, build)
- [ ] New logic in `lib/`, `store/` or `sky-data.ts` comes with tests
- [ ] Anything reachable by pointer is reachable by keyboard
- [ ] New navigation is in `SkyNav.tsx` as well as the canvas, calling the same store action
- [ ] Interactive elements have a visible focus state and an accessible name
- [ ] Anything that moves respects `prefers-reduced-motion`
- [ ] Nothing allocates inside `useFrame`
- [ ] Still one WebGL context
