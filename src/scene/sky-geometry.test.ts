import { describe, it, expect } from "vitest";
import { buildSkyGeometry } from "./sky-geometry";
import { getSky } from "./sky-data";

/**
 * The geometry builder is the reason the whole sky is one draw call, and it is
 * pure: same sky in, same buffers out. That makes the invariants the shader
 * depends on testable without a canvas - and those invariants are exactly the
 * kind that fail silently, because a wrong attribute does not throw, it just
 * draws the wrong thing.
 */
describe("buildSkyGeometry", () => {
  const sky = getSky();
  const built = buildSkyGeometry(sky);

  it("draws every place, person and signal exactly once", () => {
    const expected = sky.constellations.length + sky.stars.length + sky.planets.length;
    expect(built.geometry.getAttribute("position").count).toBe(expected);
    expect(built.kinds).toHaveLength(expected);
  });

  it("carries every attribute the vertex shader reads", () => {
    for (const name of [
      "position",
      "aColor",
      "aAnchor",
      "aOrbit",
      "aSize",
      "aSeed",
      "aIndex",
      "aKind",
      "aGroup",
      "aStar",
    ]) {
      expect(built.geometry.getAttribute(name), name).toBeDefined();
    }
  });

  it("keeps the kind map parallel to the points it describes", () => {
    const kind = built.geometry.getAttribute("aKind");
    built.kinds.forEach((entry, i) => {
      expect(kind.getX(i)).toBe(entry.kind);
    });
  });

  it("orders the buffer places, then people, then signals", () => {
    const c = sky.constellations.length;
    const s = sky.stars.length;
    expect(built.kinds[0].kind).toBe(0);
    expect(built.kinds[c].kind).toBe(1);
    expect(built.kinds[c + s].kind).toBe(2);
  });

  it("gives a person their own id rather than -1", () => {
    // Getting this wrong dims the star you came to look at down to the
    // brightness of its neighbours, and nothing throws.
    const aStar = built.geometry.getAttribute("aStar");
    const c = sky.constellations.length;
    sky.stars.forEach((star, i) => {
      expect(aStar.getX(c + i)).toBe(star.id);
    });
  });

  it("anchors every signal to the star it orbits", () => {
    const anchor = built.geometry.getAttribute("aAnchor");
    const offset = sky.constellations.length + sky.stars.length;
    sky.planets.forEach((p, i) => {
      const s = sky.stars[p.star];
      expect(anchor.getX(offset + i)).toBeCloseTo(s.x);
      expect(anchor.getY(offset + i)).toBeCloseTo(s.y);
      expect(anchor.getZ(offset + i)).toBeCloseTo(s.z);
    });
  });

  it("gives every signal its orbit, so the shader can place it", () => {
    const orbit = built.geometry.getAttribute("aOrbit");
    const offset = sky.constellations.length + sky.stars.length;
    sky.planets.forEach((p, i) => {
      expect(orbit.getX(offset + i)).toBeCloseTo(p.radius);
      expect(orbit.getW(offset + i)).toBeCloseTo(p.tilt);
    });
  });

  it("draws one closed ring per signal", () => {
    // 96 segments, two vertices each.
    expect(built.rings.getAttribute("position").count).toBe(
      sky.planets.length * 96 * 2,
    );
  });

  it("draws two vertices per figure edge", () => {
    const edges = sky.constellations.reduce((n, c) => n + c.figure.length, 0);
    expect(built.links.getAttribute("position").count).toBe(edges * 2);
  });

  it("can look up the text of every signal it drew", () => {
    expect(built.planetText.size).toBe(sky.planets.length);
    for (const p of sky.planets) expect(built.planetText.get(p.id)).toBe(p.text);
  });

  it("records who a carried signal came from, and only for carried ones", () => {
    const carried = sky.planets.filter((p) => p.borrowed);
    expect(built.borrowed.size).toBe(carried.length);
    for (const p of carried) {
      expect(built.borrowed.get(p.id)).toBe(p.borrowed!.from);
    }
  });

  it("is deterministic: the same sky produces the same buffers", () => {
    const again = buildSkyGeometry(sky);
    const a = built.geometry.getAttribute("position").array;
    const b = again.geometry.getAttribute("position").array;
    expect(Array.from(b)).toEqual(Array.from(a));
  });
});
