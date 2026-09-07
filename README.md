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

**Live: https://varadharajanv0310.github.io/ECHO/**

Built for **The Frontend Odyssey 2026**. Frontend only — no backend, no
database, no server-side code. Everything runs in the browser on a static build,
and nothing ever leaves it.

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

The whole thing is one continuous piece of choreography, so reviewing a later
beat should not mean replaying the earlier ones every time.

| URL | What it does |
| --- | --- |
| `/` | Normal entry. First visit runs the full sequence. |
| `/?reset` | Clears the stored profile and replays from the void. |
| `/?phase=galaxy` | Jumps straight to a beat. Any phase name works. |
| `/?phase=passage&p=0.62` | Jumps to a point inside the passage. |
| `/?debug` | Opens the tuning panel on the deployed build. |

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

| Beat | State | What happens |
| --- | --- | --- |
| 1 | `void` | Loading. Starfield, nebula cloud, a falling figure. |
| 2 | `reveal` | The void stains. ECHO resolves out of the nebula. |
| 3–5 | `passage` | The bleed becomes a road. Six stops. The galaxy appears. |
| 6 | `galaxy` | The only interactive object on the page. |
| 7a | `ignition` | Hands reach in, a spark ignites, the frame blows out. |
| 7b | — | A returning visitor skips 7a and 8 and dives straight in. |
| 8 | `profile` | Name, mark, colour, Worlds. No email, no password. |
| 9 | `dive` | The warp. |
| 10 | `constellation` | Arrival. The sky settles. |

Two structural decisions carry the whole thing:

**Beats 1 and 2 are one component.** The void does not unmount and the reveal
does not mount. The nebula, the figure and the wordmark are all present
throughout; only their visibility changes. That is what lets the void *stain*
into the reveal instead of cutting to it.

**Beats 3 through 10 are one canvas.** Road, galaxy, warp and constellation are
objects inside a single world with a single camera, mounted once and never
unmounted. Moving between them is a camera move and a crossfade of uniforms
rather than four components tearing down and rebuilding — which is the only way
the handoffs are genuinely seamless rather than well-timed.

---

## Structure

```
src/
  beats/        one folder per beat of the sequence
  components/
    layers/     persistent fixed layers (grain, vignette)
    ui/         the three provided components, modified
  scene/        the persistent r3f canvas and everything in it
  shaders/      GLSL, imported through vite-plugin-glsl
  store/        the sequence phase machine
  lib/          scroll, audio, tuning, maths
  copy.ts       every word in the interface
refs/           reference imagery, not shipped
```

**Stack.** Vite, React 19, TypeScript, Tailwind v4, three.js / react-three-fiber,
Lenis, GSAP, zustand. Fonts self-hosted via Fontsource.

---

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

The rule is enforced by the interface rather than written in a guideline:
**amber is absent from the colours you can choose in profile creation**, because
it is the colour a signal turns when it is dying.

**Type.** Archivo Variable for display — a grotesque that holds at 19vw under a
prism smear, with a width axis the wordmark animates so ECHO physically widens
as it resolves. Geist Mono for system voice, labels and credit blocks.

**Texture.** Film grain over everything at fixed screen density, rendered at DPR
1 so it belongs to the screen and not to the content. It *screens* rather than
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

## Techniques worth naming

**Anisotropic blur is what makes the bleed work.** A CSS `blur()` is isotropic
and gives a soft halo. The references all show light falling in *strands*. An
SVG `feGaussianBlur` with a two-value `stdDeviation` blurs roughly six times
harder vertically than horizontally, which turns every letter stem into its own
falling strand. The same trick, at a different scale, is what turns noise into
lanes on the road.

**The road is a fragment shader, not geometry.** Below the horizon the screen is
reprojected onto a ground plane by the perspective divide, and the noise is
sampled compressed across the road and stretched along it. The reference is
flowing liquid light with no surface and no edges — that is a fragment problem.

**The constellation is a propagation tree.** Every signal attaches to the signal
that carried it, by preferential attachment. The shape of the sky *is* the
mechanic: branches thin with distance from the source, and what nobody carried
sits alone on the edge going amber.

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

## Known scope

Desktop is the target, per the brief and the hackathon's "webapp" framing. A
deliberately art-directed mobile treatment — tighter camera bounds and larger
nodes rather than a shrunken desktop layout — is the next piece of work, along
with the full signal-and-carry interaction inside the constellation.

## Deploying

Pushes to `main` build and publish to GitHub Pages automatically.
