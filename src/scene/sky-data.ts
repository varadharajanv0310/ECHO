import { copy } from "@/copy";

/**
 * The sky, as a real hierarchy.
 *
 *   Cluster        everything, seen from outside
 *   Constellation  a World. A place, a topic or a moment.
 *   Star           one person, inside that World
 *   Planet         one thing that person let go of
 *
 * This is what gives Worlds a job. They were a tag on a signal, which is
 * exactly why they felt like set dressing - nothing in the interface was ever
 * a World, so choosing one meant nothing. Here a World *is* a place you fly
 * into, and the people in it are the only people you can see from inside it.
 * Leaving a World is leaving somewhere.
 */

export type Planet = {
  id: number;
  star: number;
  text: string;
  kind: "note" | "song" | "image" | "link";
  /** Orbit geometry. */
  radius: number;
  phase: number;
  speed: number;
  tilt: number;
  /** 0-1 through its life. 1 is gone by morning. */
  age: number;
  carried: number;
};

export type Star = {
  id: number;
  constellation: number;
  name: string;
  hue: number;
  traits: string[];
  x: number;
  y: number;
  z: number;
  planets: number[];
};

export type Constellation = {
  id: number;
  world: string;
  blurb: string;
  x: number;
  y: number;
  z: number;
  stars: number[];
  /** Star-to-star pairs that draw the figure. */
  figure: [number, number][];
};

export type Sky = {
  constellations: Constellation[];
  stars: Star[];
  planets: Planet[];
};

const NAMES = [
  "havel", "orpheline", "nine", "brackish", "sunday", "vale", "tern", "moth",
  "cinder", "north", "almost", "verity", "sixth", "low tide", "paper", "arden",
  "still", "gallery", "wren", "quiet dog", "ember", "halfmoon", "sable", "pike",
  "junot", "meridian", "olive", "rook", "sundial", "wax", "hollow", "iris",
];

const BLURBS: Record<string, string> = {
  "3AM": "For the hours nobody else is awake for.",
  "The Commons": "Anything, said plainly, to whoever is here.",
  "Dead Air": "Things that got no reply and are said anyway.",
  "First Light": "Beginnings, and the mornings after.",
  "The Long Now": "Slow things. Nothing urgent has ever belonged here.",
  "Open Sky": "No subject. Say what you like.",
};

const KINDS: Planet["kind"][] = ["note", "note", "note", "song", "image", "link"];

/** Deterministic, so the sky is the same one every time you come back to it. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildSky(seed = 20260908): Sky {
  const rand = rng(seed);

  const constellations: Constellation[] = [];
  const stars: Star[] = [];
  const planets: Planet[] = [];

  const worlds = copy.worlds;

  worlds.forEach((world, ci) => {
    // Golden angle around a shallow bowl. Even spacing without a visible grid,
    // and crucially far enough apart that the cluster reads as separate places
    // rather than one crowd.
    const a = ci * 2.39996;
    const r = 26 + (ci % 3) * 6 + rand() * 3;

    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const cy = (rand() - 0.5) * 13;

    const starIds: number[] = [];
    const count = 5 + Math.floor(rand() * 5);

    for (let s = 0; s < count; s++) {
      const sa = (s / count) * Math.PI * 2 + rand() * 0.7;
      const sr = 2.6 + rand() * 3.4;
      const id = stars.length;

      const planetIds: number[] = [];
      const pcount = 2 + Math.floor(rand() * 5);
      for (let p = 0; p < pcount; p++) {
        const pid = planets.length;
        planets.push({
          id: pid,
          star: id,
          text: copy.signals[Math.floor(rand() * copy.signals.length)],
          kind: KINDS[Math.floor(rand() * KINDS.length)],
          radius: 0.55 + p * 0.32 + rand() * 0.12,
          phase: rand() * Math.PI * 2,
          // Slow. These are things a person is carrying, not a screensaver,
          // and a fast orbit is also a target you cannot click.
          speed: 0.045 + rand() * 0.075,
          tilt: (rand() - 0.5) * 0.5,
          age: rand() * 0.9,
          carried: Math.floor(rand() * rand() * 9),
        });
        planetIds.push(pid);
      }

      stars.push({
        id,
        constellation: ci,
        name: NAMES[(ci * 7 + s * 3) % NAMES.length],
        hue: 262 + Math.floor(rand() * 62),
        traits: [
          copy.traits[Math.floor(rand() * copy.traits.length)],
          copy.traits[Math.floor(rand() * copy.traits.length)],
        ],
        x: cx + Math.cos(sa) * sr,
        y: cy + (rand() - 0.5) * 2.6,
        z: cz + Math.sin(sa) * sr,
        planets: planetIds,
      });
      starIds.push(id);
    }

    // The figure: a nearest-neighbour chain, which is how a real constellation
    // is drawn - a line somebody traced between the stars they could see, not
    // every possible connection. That restraint is why the sky stays readable.
    const figure: [number, number][] = [];
    const remaining = [...starIds];
    let current = remaining.shift()!;
    while (remaining.length) {
      let best = 0;
      let bestD = Infinity;
      remaining.forEach((id, i) => {
        const A = stars[current];
        const B = stars[id];
        const d = (A.x - B.x) ** 2 + (A.y - B.y) ** 2 + (A.z - B.z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      const next = remaining.splice(best, 1)[0];
      figure.push([current, next]);
      current = next;
    }

    constellations.push({
      id: ci,
      world,
      blurb: BLURBS[world] ?? "",
      x: cx,
      y: cy,
      z: cz,
      stars: starIds,
      figure,
    });
  });

  return { constellations, stars, planets };
}

/** One shared instance. The sky does not get rebuilt when a panel opens. */
let cached: Sky | null = null;
export function getSky(): Sky {
  if (!cached) cached = buildSky();
  return cached;
}
