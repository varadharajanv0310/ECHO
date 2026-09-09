import { describe, it, expect } from "vitest";
import { buildSky, getSky, peopleIn, placeMe, syncMine, myStar } from "./sky-data";
import type { Carried, Emission } from "@/store/sequence";

describe("buildSky", () => {
  it("is deterministic, so the sky is the same on every machine", () => {
    const a = buildSky();
    const b = buildSky();
    expect(a.constellations.map((c) => c.world)).toEqual(
      b.constellations.map((c) => c.world),
    );
    expect(a.stars.map((s) => s.name)).toEqual(b.stars.map((s) => s.name));
    expect(a.planets.map((p) => p.text)).toEqual(b.planets.map((p) => p.text));
  });

  it("builds every place with people in it", () => {
    const sky = buildSky();
    expect(sky.constellations.length).toBeGreaterThan(0);
    for (const c of sky.constellations) {
      expect(c.stars.length).toBeGreaterThan(0);
      expect(c.world.trim()).not.toBe("");
      expect(c.blurb.trim()).not.toBe("");
    }
  });

  it("gives every person a place that exists", () => {
    const sky = buildSky();
    for (const s of sky.stars) {
      expect(sky.constellations[s.constellation]).toBeDefined();
    }
  });

  it("gives every signal an author that exists", () => {
    const sky = buildSky();
    for (const p of sky.planets) expect(sky.stars[p.star]).toBeDefined();
  });

  it("uses unique ids", () => {
    const sky = buildSky();
    expect(new Set(sky.planets.map((p) => p.id)).size).toBe(sky.planets.length);
    expect(new Set(sky.stars.map((s) => s.id)).size).toBe(sky.stars.length);
  });

  it("never gives one person the same sentence twice", () => {
    const sky = buildSky();
    for (const s of sky.stars) {
      const texts = s.planets.map((id) => sky.planets.find((p) => p.id === id)?.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it("draws a figure that only joins people in the same place", () => {
    const sky = buildSky();
    for (const c of sky.constellations) {
      for (const [a, b] of c.figure) {
        expect(c.stars).toContain(a);
        expect(c.stars).toContain(b);
      }
    }
  });
});

describe("peopleIn", () => {
  it("lists the names standing in a place", () => {
    const sky = buildSky();
    const c = sky.constellations[0];
    const names = peopleIn(sky, c.world);
    expect(names.length).toBe(c.stars.length);
    for (const n of names) expect(typeof n).toBe("string");
  });

  it("returns nothing for a place that does not exist", () => {
    expect(peopleIn(buildSky(), "Nowhere")).toEqual([]);
  });
});

describe("placeMe", () => {
  it("puts the reader in the sky exactly once", () => {
    const sky = getSky();
    const before = sky.stars.length;
    placeMe(sky, "varad", 276, ["3AM"]);
    const after = sky.stars.length;
    expect(myStar()).toBeGreaterThanOrEqual(0);
    placeMe(sky, "varad", 276, ["3AM"]);
    expect(sky.stars.length).toBe(after);
    expect(after).toBe(before + 1);
  });

  it("follows a rename rather than creating a second star", () => {
    const sky = getSky();
    placeMe(sky, "renamed", 300, ["3AM"]);
    expect(sky.stars[myStar()].name).toBe("renamed");
    expect(sky.stars[myStar()].hue).toBe(300);
  });

  it("joins the reader into the figure of their place", () => {
    const sky = getSky();
    const me = sky.stars[myStar()];
    const home = sky.constellations[me.constellation];
    expect(home.stars).toContain(me.id);
    expect(home.figure.some(([a, b]) => a === me.id || b === me.id)).toBe(true);
  });
});

describe("syncMine", () => {
  const emission = (id: number, text: string): Emission => ({
    id,
    world: "3AM",
    text,
    at: Date.now(),
    life: 24,
  });

  it("turns what you said into things orbiting you", () => {
    const sky = getSky();
    placeMe(sky, "varad", 276, ["3AM"]);
    syncMine(sky, [emission(1, "one"), emission(2, "two")], []);
    const mine = sky.stars[myStar()];
    expect(mine.planets).toHaveLength(2);
    const texts = mine.planets.map((id) => sky.planets.find((p) => p.id === id)?.text);
    expect(texts).toEqual(expect.arrayContaining(["one", "two"]));
  });

  it("rebuilds rather than accumulating", () => {
    const sky = getSky();
    syncMine(sky, [emission(1, "one")], []);
    syncMine(sky, [emission(1, "one")], []);
    expect(sky.stars[myStar()].planets).toHaveLength(1);
  });

  it("marks what you are carrying with whose it is", () => {
    const sky = getSky();
    const held: Carried = {
      id: 5,
      source: 2,
      from: "havel",
      hue: 320,
      text: "Third night of rain.",
      at: Date.now(),
      life: 24,
    };
    syncMine(sky, [], [held]);
    const borrowed = sky.planets.filter((p) => p.star === myStar() && p.borrowed);
    expect(borrowed).toHaveLength(1);
    expect(borrowed[0].borrowed?.from).toBe("havel");
    expect(borrowed[0].borrowed?.source).toBe(2);
  });

  it("keeps ids unique after a rebuild", () => {
    const sky = getSky();
    syncMine(sky, [emission(1, "a"), emission(2, "b")], []);
    expect(new Set(sky.planets.map((p) => p.id)).size).toBe(sky.planets.length);
  });
});
