import * as THREE from "three";
import type { Sky } from "@/types";

/**
 * Turning the sky into buffers.
 *
 * Everything drawn - every World, every person, every signal in orbit - is one
 * points geometry with one draw call, plus two line geometries for the figures
 * between people and the orbit paths around a star. This module builds all
 * three from a `Sky` and nothing else.
 *
 * It used to be a hundred and seventy lines inside the component that draws
 * it, which meant the component was three quarters buffer arithmetic and one
 * quarter React. Out here it is a pure function: same sky in, same buffers
 * out, and testable without a canvas.
 *
 * @packageDocumentation
 */

/** What each drawn index actually is, so a pick can answer in domain terms. */
export type KindEntry = { kind: 0 | 1 | 2; id: number };

export type SkyGeometry = {
  /** Every place, person and signal, as one points geometry. */
  geometry: THREE.BufferGeometry;
  /** The figures traced between people in a place. */
  links: THREE.BufferGeometry;
  /** The orbit path each signal travels. */
  rings: THREE.BufferGeometry;
  /** Index → what it is. Parallel to the points geometry. */
  kinds: KindEntry[];
  /** Signal id → its text, for the labels. */
  planetText: Map<number, string>;
  /** Signal id → who it was taken from, for the ones being carried. */
  borrowed: Map<number, string>;
};

/** How many segments an orbit ring is drawn with. */
const SEG = 96;

/** The colour a signal turns as it runs out of time. Never a choice anywhere. */
const DECAY = new THREE.Color("#ff7326");

/**
 * Build every buffer the sky needs.
 *
 * @param sky - the world to draw, from `getSky()`
 */
export function buildSkyGeometry(sky: Sky): SkyGeometry {
  const { constellations, stars, planets } = sky;
  const n = constellations.length + stars.length + planets.length;

  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const anchor = new Float32Array(n * 3);
  const orbit = new Float32Array(n * 4);
  const sizes = new Float32Array(n);
  const seeds = new Float32Array(n);
  const idx = new Float32Array(n);
  const kind = new Float32Array(n);
  const grp = new Float32Array(n);
  const st = new Float32Array(n);
  const c = new THREE.Color();

  const kindMap: KindEntry[] = [];

  let w = 0;
  const push = (
    k: 0 | 1 | 2,
    id: number,
    x: number,
    y: number,
    z: number,
    colour: THREE.Color,
    sz: number,
    group: number,
    star: number,
    orb?: [number, number, number, number],
    anch?: [number, number, number],
  ) => {
    pos[w * 3] = x;
    pos[w * 3 + 1] = y;
    pos[w * 3 + 2] = z;
    col[w * 3] = colour.r;
    col[w * 3 + 1] = colour.g;
    col[w * 3 + 2] = colour.b;
    if (anch) {
      anchor[w * 3] = anch[0];
      anchor[w * 3 + 1] = anch[1];
      anchor[w * 3 + 2] = anch[2];
    }
    if (orb) {
      orbit[w * 4] = orb[0];
      orbit[w * 4 + 1] = orb[1];
      orbit[w * 4 + 2] = orb[2];
      orbit[w * 4 + 3] = orb[3];
    }
    sizes[w] = sz;
    seeds[w] = ((w * 37) % 100) / 100;
    idx[w] = w;
    kind[w] = k;
    grp[w] = group;
    st[w] = star;
    kindMap.push({ kind: k, id });
    w++;
  };

  constellations.forEach((cn) => {
    c.setHSL(0.78 + (cn.id % 4) * 0.02, 1, 0.72);
    push(0, cn.id, cn.x, cn.y, cn.z, c, 27, cn.id, -1);
  });

  stars.forEach((s) => {
    c.setHSL(s.hue / 360, 1, 0.68);
    // aStar is the star's own id, not -1. It is what marks this one as the
    // person you are standing at, and getting it wrong dims the sun you came
    // to look at down to the brightness of its neighbours.
    push(1, s.id, s.x, s.y, s.z, c, 2.6, s.constellation, s.id);
  });

  planets.forEach((p) => {
    const s = stars[p.star];
    // Life runs violet through magenta; decay pulls it amber. A thing you are
    // carrying keeps the colour of whoever you took it from.
    c.setHSL((p.borrowed?.hue ?? s.hue) / 360, 1, 0.66).lerp(
      DECAY,
      p.age ** 2.4 * 0.85,
    );
    push(
      2,
      p.id,
      s.x,
      s.y,
      s.z,
      c,
      0.34 + p.carried * 0.06,
      s.constellation,
      s.id,
      [p.radius, p.phase, p.speed, p.tilt],
      [s.x, s.y, s.z],
    );
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aAnchor", new THREE.BufferAttribute(anchor, 3));
  g.setAttribute("aOrbit", new THREE.BufferAttribute(orbit, 4));
  g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  g.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));
  g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
  g.setAttribute("aGroup", new THREE.BufferAttribute(grp, 1));
  g.setAttribute("aStar", new THREE.BufferAttribute(st, 1));

  // Orbit rings. The thing that turns a bright dot with specks near it into a
  // system you are standing inside: without the paths drawn, the signals read
  // as more stars that happen to be close.
  //
  // The ellipse is the same expression the vertex shader uses to place a
  // signal, evaluated all the way round instead of at one angle - so a signal
  // always sits exactly on its own line.
  const planetText = new Map<number, string>();
  const borrowed = new Map<number, string>();
  const rp: number[] = [];
  const rc: number[] = [];
  const rs: number[] = [];

  planets.forEach((p) => {
    const s = stars[p.star];
    planetText.set(p.id, p.text);
    if (p.borrowed) borrowed.set(p.id, p.borrowed.from);
    c.setHSL((p.borrowed?.hue ?? s.hue) / 360, 1, 0.66);

    const at = (a: number): [number, number, number] => [
      s.x + Math.cos(a) * p.radius,
      s.y + Math.sin(a) * p.radius * p.tilt,
      s.z + Math.sin(a) * p.radius,
    ];

    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * Math.PI * 2;
      const a1 = ((i + 1) / SEG) * Math.PI * 2;
      rp.push(...at(a0), ...at(a1));
      rc.push(c.r, c.g, c.b, c.r, c.g, c.b);
      rs.push(s.id, s.id);
    }
  });

  const rgm = new THREE.BufferGeometry();
  rgm.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3));
  rgm.setAttribute("aColor", new THREE.Float32BufferAttribute(rc, 3));
  rgm.setAttribute("aStar", new THREE.Float32BufferAttribute(rs, 1));

  // Figures: one traced line per World.
  const lp: number[] = [];
  const lc: number[] = [];
  const lg: number[] = [];

  constellations.forEach((cn) => {
    cn.figure.forEach(([a, b]) => {
      const A = stars[a];
      const B = stars[b];
      lp.push(A.x, A.y, A.z, B.x, B.y, B.z);
      lc.push(0.55, 0.2, 0.95, 0.75, 0.25, 0.7);
      lg.push(cn.id, cn.id);
    });
  });

  const lgm = new THREE.BufferGeometry();
  lgm.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  lgm.setAttribute("aColor", new THREE.Float32BufferAttribute(lc, 3));
  lgm.setAttribute("aGroup", new THREE.Float32BufferAttribute(lg, 1));

  return {
    geometry: g,
    links: lgm,
    rings: rgm,
    kinds: kindMap,
    planetText,
    borrowed,
  };
}
