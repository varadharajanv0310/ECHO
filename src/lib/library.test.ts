import { describe, it, expect } from "vitest";
import { GAMES, SONGS, PLACES, byId, coverFor, handlesFor, pickFor, placeLabel } from "./library";

describe("catalogue", () => {
  it("has no duplicate ids across games and songs", () => {
    const ids = [...GAMES, ...SONGS].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every entry a title and an attribution", () => {
    for (const e of [...GAMES, ...SONGS]) {
      expect(e.title.trim().length).toBeGreaterThan(0);
      expect(e.by.trim().length).toBeGreaterThan(0);
    }
  });

  it("is large enough that a shelf of six rarely repeats", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(24);
    expect(SONGS.length).toBeGreaterThanOrEqual(20);
  });
});

describe("byId", () => {
  it("finds games and songs", () => {
    expect(byId(GAMES[0].id)?.title).toBe(GAMES[0].title);
    expect(byId(SONGS[0].id)?.title).toBe(SONGS[0].title);
  });

  it("returns undefined for something that is not there", () => {
    expect(byId("does-not-exist")).toBeUndefined();
  });
});

describe("coverFor", () => {
  it("is stable for a title, so art never changes between visits", () => {
    expect(coverFor("Hollow Knight")).toEqual(coverFor("Hollow Knight"));
  });

  it("gives different titles different art", () => {
    expect(coverFor("Hollow Knight").css).not.toBe(coverFor("Outer Wilds").css);
  });

  it("stays inside the palette", () => {
    // Amber is reserved for decay and must never appear on cover art.
    for (const e of [...GAMES, ...SONGS]) {
      const { hue } = coverFor(e.title);
      expect(hue).toBeGreaterThanOrEqual(200);
      expect(hue).toBeLessThanOrEqual(360);
    }
  });

  it("produces a monogram for any title", () => {
    expect(coverFor("Hollow Knight").mono).toBeTruthy();
    expect(coverFor("x").mono).toBeTruthy();
  });
});

describe("pickFor", () => {
  it("is stable for a seed", () => {
    expect(pickFor(7, GAMES, 6)).toEqual(pickFor(7, GAMES, 6));
  });

  it("gives different people different shelves", () => {
    expect(pickFor(1, GAMES, 6)).not.toEqual(pickFor(2, GAMES, 6));
  });

  it("never repeats an entry on one shelf", () => {
    for (let seed = 0; seed < 40; seed++) {
      const shelf = pickFor(seed, GAMES, 6);
      expect(new Set(shelf).size).toBe(shelf.length);
    }
  });

  it("only returns ids that exist", () => {
    for (const id of pickFor(3, SONGS, 5)) expect(byId(id)).toBeDefined();
  });
});

describe("places", () => {
  it("labels every known place", () => {
    for (const p of PLACES) expect(placeLabel(p.id)).toBe(p.label);
  });

  it("falls back to the raw id for an unknown place", () => {
    expect(placeLabel("mystery")).toBe("mystery");
  });

  it("gives somebody stable handles", () => {
    expect(handlesFor(4, "havel")).toEqual(handlesFor(4, "havel"));
  });

  it("only issues handles for real places", () => {
    const ids = PLACES.map((p) => p.id);
    for (const h of handlesFor(9, "tern")) expect(ids).toContain(h.label);
  });
});
