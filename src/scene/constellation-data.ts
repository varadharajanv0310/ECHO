import { copy } from "@/copy";

export type SignalNode = {
  x: number;
  y: number;
  z: number;
  parent: number;
  hops: number;
  /** 0-1. How far through its life this signal is. 1 is gone by morning. */
  age: number;
  world: string;
  text: string;
  /** Who let it go. Not an owner - just where it entered. */
  author: string;
  /** How many signals this one went on to seed. */
  carried: number;
};

/**
 * Names, not handles. Nothing here is unique and nothing is searchable by it,
 * which is the point: two people called nine are simply two people called nine.
 */
export const NAMES = [
  "havel",
  "orpheline",
  "nine",
  "brackish",
  "sunday",
  "vale",
  "tern",
  "moth",
  "cinder",
  "quiet dog",
  "north",
  "almost",
  "verity",
  "sixth",
  "low tide",
  "paper",
  "arden",
  "still",
  "gallery",
  "wren",
];

/** Deterministic, so the sky is the same one every time you come back to it. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Roughly half what it was. The tree reads as a structure you can follow only
 * when you can see between the branches; past that it is just a bright mass.
 */
const COUNT = 112;

/**
 * The constellation is a propagation tree, not a scatter.
 *
 * Every signal is attached to the signal that carried it, chosen by
 * preferential attachment, so the shape of the sky is the mechanic made
 * visible: reach is earned one hop at a time, branches thin as they get
 * further from the source, and the things nobody carried are single points
 * on the edge going amber.
 *
 * The user's own node is index 0 at the origin. Everything else grew out of it.
 */
export function buildConstellation(seed = 20260908): SignalNode[] {
  const rand = rng(seed);
  const nodes: SignalNode[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      parent: -1,
      hops: 0,
      age: 0,
      world: copy.worlds[0],
      text: "",
      author: "",
      carried: 0,
    },
  ];

  for (let i = 1; i < COUNT; i++) {
    // Preferential attachment: signals that were carried get carried again.
    let parent = 0;
    let best = -1;
    for (let k = 0; k < 3; k++) {
      const c = Math.floor(rand() * nodes.length);
      const weight = nodes[c].carried + 1 / (nodes[c].hops + 1);
      if (weight > best) {
        best = weight;
        parent = c;
      }
    }

    const p = nodes[parent];
    const hops = p.hops + 1;

    // Push outward from the origin so the tree opens up rather than knotting.
    // At the origin there is no outward direction yet, so the first generation
    // radiates freely - otherwise the whole sky grows off to one side.
    const atOrigin = p.x === 0 && p.z === 0;
    const outward = atOrigin
      ? rand() * Math.PI * 2
      : Math.atan2(p.z, p.x) + (rand() - 0.5) * 1.7;
    const dist = 3.8 + rand() * 5.0 + hops * 0.7;

    nodes.push({
      x: p.x + Math.cos(outward) * dist,
      y: p.y + (rand() - 0.5) * 2.6,
      z: p.z + Math.sin(outward) * dist,
      parent,
      hops,
      // Deeper in the tree means older and closer to fading.
      age: Math.min(1, rand() * 0.55 + hops * 0.07),
      world: copy.worlds[Math.floor(rand() * copy.worlds.length)],
      text: copy.signals[Math.floor(rand() * copy.signals.length)],
      author: NAMES[Math.floor(rand() * NAMES.length)],
      carried: 0,
    });
    p.carried += 1;
  }

  return nodes;
}
