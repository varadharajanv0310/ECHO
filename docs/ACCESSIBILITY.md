# Accessibility

ECHO is a WebGL piece, and a canvas is a single opaque element to a screen
reader and to the tab key. Left alone, that would close the whole application
to anyone not using a mouse. This document records what was done about it,
what was tested, how to repeat the tests, and what is still not solved.

Target: **WCAG 2.2 Level AA**.

## Table of contents

- [Summary](#summary)
- [Keyboard navigation](#keyboard-navigation)
- [Screen reader support](#screen-reader-support)
- [Semantic structure and landmarks](#semantic-structure-and-landmarks)
- [Focus management](#focus-management)
- [Colour and contrast](#colour-and-contrast)
- [Motion and vestibular safety](#motion-and-vestibular-safety)
- [Touch targets](#touch-targets)
- [Responsive and zoom](#responsive-and-zoom)
- [Testing](#testing)
- [Known limitations](#known-limitations)

## Summary

| Area                                          | Status | Where                                   |
| --------------------------------------------- | ------ | --------------------------------------- |
| Keyboard operable end to end                  | Done   | `src/ui/SkyNav.tsx`, `src/ui/Rail.tsx`  |
| Skip link to main content                     | Done   | `src/App.tsx`, `src/ui/ui.css`          |
| Visible focus indicator on every control      | Done   | `src/ui/ui.css`                         |
| Focus trap and restore in dialogs             | Done   | `src/ui/Window.tsx`                     |
| Landmarks (`main`, `nav`, `footer`, `dialog`) | Done   | `src/App.tsx`, `src/components/Hud.tsx` |
| Live region for state changes                 | Done   | `src/App.tsx`                           |
| Decorative graphics hidden from AT            | Done   | canvas overlay layers                   |
| `prefers-reduced-motion` honoured             | Done   | `src/index.css`, motion settings        |
| Touch targets at least 44px                   | Done   | `src/ui/handheld.css`                   |
| Reflow to 320px without horizontal scroll     | Done   | `src/ui/responsive.css`                 |
| axe-core violations                           | 0      | see [Testing](#testing)                 |

## Keyboard navigation

The 3D sky cannot be tabbed into, so it has a keyboard equivalent rather than
a keyboard patch.

`src/ui/SkyNav.tsx` renders the same hierarchy the canvas draws — places, then
the people in a place, then what a person is carrying — as a `<nav>`
containing a list of real `<button>` elements. Those buttons call exactly the
same store actions the pointer path calls, so the two ways of moving cannot
drift apart. It sits off-screen until focus enters it, at which point it
becomes visible: a keyboard user needs to see where they are, and a sighted
mouse user should never have a list of names over their sky.

| Key                 | Effect                                            |
| ------------------- | ------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move through the rail, then the sky navigation    |
| `Enter` / `Space`   | Activate the focused control                      |
| `Backspace`         | Go up one level (place → cluster, person → place) |
| `Escape`            | Close whatever window or panel is open            |

Tab order in a production build is: skip link → the five rail buttons → sky
navigation → any open window (trapped, see below). No control is reachable by
pointer that is not reachable by keyboard.

## Screen reader support

- Every button in the sky navigation carries an `aria-label` giving the full
  context rather than the visible fragment: "Mira Vance, in The Long Quiet"
  rather than "Mira Vance".
- The heading above the list states the current level and location, so moving
  a level announces where you have arrived.
- A polite live region in `src/App.tsx` announces each phase change:

  ```jsx
  <p className="sr-only" role="status" aria-live="polite">
    {copy.status[phase]}
  </p>
  ```

- The pooled label elements drawn over the canvas in `src/ui/SkyHud.tsx` are
  visual echoes of what the canvas already shows. They are removed from the
  accessibility tree with `tabIndex = -1` and `aria-hidden="true"` so they do
  not double every name.
- Decorative full-screen layers — grain, vignette, particle background — carry
  `aria-hidden="true"`.

## Semantic structure and landmarks

| Landmark      | Element                                              | File                     |
| ------------- | ---------------------------------------------------- | ------------------------ |
| `main`        | `<main id="main" tabIndex={-1} aria-label="ECHO">`   | `src/App.tsx`            |
| `navigation`  | `<nav aria-label="Sky navigation">`                  | `src/ui/SkyNav.tsx`      |
| `contentinfo` | `<footer aria-label="Session status">`               | `src/components/Hud.tsx` |
| `dialog`      | `<section role="dialog" aria-modal aria-labelledby>` | `src/ui/Window.tsx`      |

Headings descend without skipping levels within a view. Lists of things are
`<ul>` / `<li>`; a conversation is a sequence of `<article>` elements; facts
about a person are a `<dl>`.

## Focus management

`src/ui/Window.tsx` is the only dialog primitive, so focus behaviour is
implemented once:

1. On open, the element that had focus is captured as the opener.
2. Focus moves to the first focusable control inside the dialog.
3. `Tab` from the last control wraps to the first; `Shift+Tab` from the first
   wraps to the last. Focus cannot leave the dialog while it is open.
4. `Escape` closes it.
5. On close, focus returns to the opener.

The focusable-element filter deliberately checks `hidden`, `aria-hidden` and
the computed `display` / `visibility` rather than `offsetParent`. `offsetParent`
is a layout question, and there is no layout engine under jsdom, so filtering
on it emptied the list and silently disabled the trap in tests. This was caught
by `src/ui/Window.test.tsx` and is asserted there.

The focus ring is global and never removed:

```css
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid hsl(var(--accent-h) 95% 72%);
  outline-offset: 3px;
  border-radius: var(--r-sm);
}
```

A skip link is the first focusable element on the page and moves focus to
`#main`.

## Colour and contrast

Type is expressed as three tokens — `--ink`, `--ink-2`, `--ink-3` — which flip
wholesale between the dark and light modes rather than being tinted per
component. Body text and interactive labels meet 4.5:1 against their surface;
large display type and the mono microlabels meet 3:1.

Colour is never the only carrier of meaning. A carried signal is marked by a
state word and a filled control, not only by a hue change; a person you have
added reads "Added" as well as changing colour.

The interface offers a light mode for anyone who finds a dark field of stars
hard to read, and it is a genuine inversion — ink on paper — rather than a
grey wash.

## Motion and vestibular safety

The piece is built on continuous motion, which makes this the most important
setting in it.

- `prefers-reduced-motion: reduce` is honoured at the CSS level and is also
  read into the motion settings, so it damps the scene and not just the
  transitions.
- The reduced state is a real alternative rather than an absence: transitions
  become instant, drift and parallax stop, and the sky holds still.
- The setting is also exposed in the menu, because a person may want the
  quieter version on a machine whose OS preference says otherwise.
- Nothing flashes more than three times a second.

## Touch targets

In `src/ui/handheld.css`, under `@media (pointer: coarse)`:

```css
.rail__btn,
.win__close,
.u-chip,
.u-btn,
.win__tab {
  min-height: 44px;
}
```

WCAG 2.5.8 asks for 24 by 24 CSS pixels; 44 is the comfortable size on a
phone, so that is the floor. The drawn cursor is also removed under
`pointer: coarse`, because a custom cursor without a mouse is a lie.

## Responsive and zoom

`src/ui/responsive.css` defines four width tiers and a fluid type scale, all
keyed on width rather than on the pointing device, so a browser zoomed to 200%
gets the same adaptation a small screen gets. Content reflows to a single
column and produces no horizontal scrolling down to 320px.

A short landscape window — a phone turned sideways, or a split screen — is
handled separately, because it has width but no height and the vertical chrome
is what has to give way.

## Testing

Automated:

```bash
pnpm test          # Vitest, includes the dialog and focus-trap assertions
pnpm coverage      # the same run with v8 coverage
```

`src/ui/Window.test.tsx` asserts the dialog role and accessible name, Escape
to close, focus entry on open, and containment under both `Tab` and
`Shift+Tab`. Component queries throughout the suite are by role and accessible
name, so a passing test is itself evidence that the control is exposed.

axe-core was run against a production build on five views — the sky, a
profile, the dashboard, the create panel and search — and reports **0
violations**. Re-run it by serving `dist/` and injecting axe:

```bash
pnpm build && pnpm preview
```

Manual checks performed:

- Full keyboard traversal of every view with no mouse.
- Tab order verified against visual order in a production build.
- Reflow at 1600, 1280, 900 and 390 CSS pixels with no horizontal overflow.
- `prefers-reduced-motion` forced on, confirming the scene damps.
- Light and dark modes checked for contrast on body text and controls.

## Known limitations

Stated plainly, because a document that claims everything is solved is not
worth reading.

- **The canvas itself is not described.** The sky navigation is a complete
  functional equivalent — you can reach and open everything — but it does not
  narrate the picture. A blind user gets the structure and the words, not the
  composition.
- **Spatial relationships are lost.** "Near", "far" and "in the same figure as"
  are meaningful in the visual view and are only partly conveyed by the "in
  <place>" phrasing in the labels.
- **No WebGL means no scene.** Without a working context the application shows
  a stated fallback rather than a non-visual version of the world.
- **Not tested with a physical screen reader** across NVDA, JAWS and VoiceOver.
  The tree is verified programmatically and by role-based queries; verbosity
  and announcement order in each specific reader are not.
