# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Content Security Policy on the deployed page, and `rel="noopener noreferrer"`
  on every link that leaves the site.
- `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `docs/API.md` and
  `docs/TESTING.md`.
- Favicon, web app manifest, `robots.txt` and `sitemap.xml`, none of which
  previously existed.
- oxlint with the `jsx-a11y`, `react` and `unicorn` rule sets, and Prettier 3, with `lint`,
  `format` and `verify` scripts.
- A `ci.yml` workflow running typecheck, lint, tests, coverage, build and a
  dependency audit on every push and pull request.
- `prefers-color-scheme` support: the theme now follows the operating system on
  a first visit, in both the application and the field guide.
- `forced-colors` and `prefers-contrast` support, so the glass surfaces the
  interface is built from survive high-contrast mode.
- Explicit `htmlFor` label association on every form control, and an explicit
  `type` on all 67 buttons.

### Changed

- The field guide is a complete HTML document: doctype, `<html lang>`, charset,
  viewport, a `<main>` landmark and its own metadata. It previously began at
  `<title>` and ended at a closing `div`.
- Its fonts load asynchronously rather than blocking first paint.
- README sections renamed to conventional names, with a tech stack table,
  prerequisites, installation steps, contributing, licence and acknowledgements.

### Fixed

- Several controls had a `<span>` above them instead of a `<label>` attached to
  them, leaving them with no programmatic name.
- Buttons without a `type` defaulted to `submit` inside a form.

## [0.1.0] - 2026-09-09

The build submitted to The Frontend Odyssey 2026.

### Added

- **The sequence.** Ten beats from a nebula through a road, a galaxy, an
  ignition and a profile, into the sky. One WebGL context for all of it.
- **The sky.** Places, the people who listen in them, and what those people are
  carrying, drawn as a single points program with orbits derived in the vertex
  shader.
- **Signals.** Compose into a place, choose how long it lives, watch it appear
  at your own star. No ranking, no feed order, no counts.
- **Carrying.** The only way anything travels. Every carry resets the clock;
  nothing else does.
- **People.** Profiles with marks, hues, traits, shelves for games and records,
  and conversations in their own window.
- **Search, dashboard, create and menu**, as four rail destinations.
- **A guided tour**, and a written field guide at `/guide.html`.
- **Light mode**, drawn as ink on paper rather than as an inverted frame.
- **Reduced motion** honoured at the CSS level and inside the scene.
- **Keyboard navigation** of the 3D view through a parallel list of real
  controls, a focus trap in every dialog, and a skip link.
- **A four-tier responsive system** driven by width, with touch refinements
  gated separately on `pointer: coarse`.
- **102 tests** across the pure logic and the dialog primitive.
- **ARCHITECTURE.md, CONTRIBUTING.md, docs/ACCESSIBILITY.md** and an MIT licence.

[Unreleased]: https://github.com/varadharajanv0310/ECHO/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/varadharajanv0310/ECHO/releases/tag/v0.1.0
