# ECHO

A social platform where content does not belong to you. It belongs to a place,
it travels through people, and it dies if nobody carries it.

You emit a **signal** into a **World** — a place, a topic, a moment. It never
sits on your profile. From there it travels outward only when a human chooses
to carry it. Reach is earned one hop at a time. A signal that lands travels far.
A signal that lands with nobody fades within a day and is gone.

There is no ranking function anywhere in the system, no followers, no likes, no
view counts, no paid reach, no infinite scroll, and no data collection. None of
these are enforced rules. They are consequences of the architecture, which is
the strongest form of the claim.

Built for **The Frontend Odyssey 2026**. Frontend only — no backend, no
database, no server-side code. Everything runs in the browser on a static build.

---

## Running it

```bash
pnpm install
```

```bash
pnpm dev
```

The dev server runs on port 5180.

```bash
pnpm build
```

## Reviewing it

The entry sequence is one continuous piece of choreography, so reviewing a
later beat should not mean scrolling the whole thing every time.

| URL | What it does |
| --- | --- |
| `/` | Normal entry. First visit runs the full sequence. |
| `/?reset` | Clears the stored profile and replays from the void. |
| `/?phase=reveal` | Jumps straight to a beat. Any phase name works. |
| `/?debug` | Opens the tuning panel on a deployed build. |

Phase names: `void`, `reveal`, `passage`, `galaxy`, `ignition`, `profile`,
`dive`, `constellation`.

### The tuning panel

`leva` is mounted in development and behind `?debug` in production. It carries
live sliders for grain amount, speck size, bite and cadence; particle count and
density; nebula boost; and vignette. Everything is a **multiplier over the
per-phase mix**, so dragging a slider scales the whole curve rather than
flattening the relationship between phases.

---

## The sequence

Ten beats. The states the app actually holds collapse beats 3–5 into one, since
they are a single continuous scroll distinguished by scroll progress.

| Beat | State | What happens |
| --- | --- | --- |
| 1 | `void` | Loading. Nebula brooding, a falling figure, grain already present. |
| 2 | `reveal` | The void stains. ECHO resolves out of the nebula. |
| 3–5 | `passage` | The bleed becomes a road. Five stops. The galaxy comes into view. |
| 6 | `galaxy` | The only interactive object on the page. |
| 7a | `ignition` | Hands reach in, a spark ignites, the frame blows out. |
| 8 | `profile` | Name, mark, colour, Worlds. No email, no password. |
| 9 | `dive` | The warp. |
| 10 | `constellation` | Arrival. The sky settles. |

Beats 1 and 2 are deliberately **one component**. The void does not unmount and
the reveal does not mount — the nebula, the figure and the wordmark are all
present throughout, and only their visibility changes. That is what lets the
void stain into the reveal rather than cut to it.

---

## Structure

```
src/
  beats/        one folder per beat of the sequence
  components/
    layers/     persistent fixed layers (grain, vignette)
    ui/         the three provided components, modified
  shaders/      GLSL, imported through vite-plugin-glsl
  store/        the sequence phase machine
  copy.ts       every word in the interface
refs/           reference imagery, not shipped
```

## Visual identity

**Palette**, sampled from the reference set rather than guessed. The references
mass at hue 258–300 and tail to 324, with almost no warm content anywhere —
which is why amber is rare here too.

| Token | Value | Role |
| --- | --- | --- |
| `--color-void` | `#04030A` | Ground. Near-total black, shifted toward violet. |
| `--color-violet-deep` | `#4F06F8` | The road. |
| `--color-violet` | `#8B2FF8` | Life, propagation. |
| `--color-violet-bright` | `#B026FF` | Resonance. |
| `--color-magenta` | `#FA42B0` | Reach. |
| `--color-amber` | `#FF7326` | **Decay and death only.** Used at a whisper. |
| `--color-spark` | `#FFFFFF` | Ignition. |

Life is violet, death is amber, ignition is white. Brightness carries a hue as
well as a luminance, which is what stops the interface going flat purple.

**Type.** Archivo Variable for display — a grotesque that holds at 19vw under a
prism smear, with a width axis the wordmark animates so ECHO physically widens
as it resolves. Geist Mono for system voice, labels and credit blocks. Both
self-hosted.

**Texture.** Heavy film grain over everything at fixed screen density, applied
at DPR 1 so it belongs to the screen and not to the content. It screens rather
than overlays, because in a frame that is ninety percent black the grain has to
live in the blacks.

---

## Notes on the provided components

All three shipped as page-level demos and needed structural changes to work as
layers in a sequence.

**`nebula-shader.tsx`** — the stock `hue()` cycles the full rainbow and puts
cyan and green on screen in the first frame anyone sees. Remapped to violet
through magenta with amber only in the brightest cores. More importantly it
cleared to opaque black, which made the persistent particle layer invisible for
the whole of beats 1 and 2; it now writes premultiplied alpha so light
composites over whatever is underneath. Animated uniforms were also effect
dependencies, which relinked the program on every change — they are read from a
ref inside the loop instead, and damped, so phase changes ease rather than snap.

**`fluid-particles-background.tsx`** — was an `h-screen` page wrapper that
centred its children. Now a fixed, non-interactive layer with a damped opacity
prop driven per phase, dark-only, violet-tinted per particle, and DPR-aware.

**`galaxy-warp.tsx`** — not yet integrated. It will not be used as shipped: as a
self-contained opaque `<Canvas>` it cannot enter without a visible cut. It gets
reduced to a scene component inside the persistent canvas.

---

## Deploying

Pushes to `main` build and publish to GitHub Pages. Enable it once under
**Settings → Pages → Source → GitHub Actions**.

## Status

Stage A complete: foundation, beat 1, beat 2.
