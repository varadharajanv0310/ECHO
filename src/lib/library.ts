/**
 * The catalogue people pick from.
 *
 * Covers are generated rather than fetched. ECHO makes no network requests, so
 * there is nowhere to load real artwork from - and inventing fake logos for
 * real games would look worse than owning the constraint. Each title gets a
 * deterministic gradient and monogram derived from its own name, so the shelf
 * reads as designed artwork rather than as missing images, and two people who
 * pick the same game get the same cover.
 */

export type Entry = {
  id: string;
  title: string;
  /** Artist for songs, studio or genre for games. */
  by: string;
};

export const GAMES: Entry[] = [
  { id: "g-hollow", title: "Hollow Knight", by: "Metroidvania" },
  { id: "g-outer", title: "Outer Wilds", by: "Exploration" },
  { id: "g-stardew", title: "Stardew Valley", by: "Farming" },
  { id: "g-elden", title: "Elden Ring", by: "Action RPG" },
  { id: "g-disco", title: "Disco Elysium", by: "RPG" },
  { id: "g-celeste", title: "Celeste", by: "Platformer" },
  { id: "g-undertale", title: "Undertale", by: "RPG" },
  { id: "g-portal", title: "Portal 2", by: "Puzzle" },
  { id: "g-journey", title: "Journey", by: "Adventure" },
  { id: "g-minecraft", title: "Minecraft", by: "Sandbox" },
  { id: "g-valorant", title: "Valorant", by: "Shooter" },
  { id: "g-league", title: "League of Legends", by: "MOBA" },
  { id: "g-zomboid", title: "Project Zomboid", by: "Survival" },
  { id: "g-nightreign", title: "Elden Ring Nightreign", by: "Co-op" },
  { id: "g-terraria", title: "Terraria", by: "Sandbox" },
  { id: "g-hades", title: "Hades", by: "Roguelike" },
  { id: "g-silent", title: "Silent Hill 2", by: "Horror" },
  { id: "g-nier", title: "NieR Automata", by: "Action RPG" },
  { id: "g-rdr", title: "Red Dead Redemption 2", by: "Open World" },
  { id: "g-witcher", title: "The Witcher 3", by: "RPG" },
  { id: "g-animal", title: "Animal Crossing", by: "Life Sim" },
  { id: "g-among", title: "Among Us", by: "Social" },
  { id: "g-rocket", title: "Rocket League", by: "Sports" },
  { id: "g-inside", title: "Inside", by: "Puzzle" },
];

export const SONGS: Entry[] = [
  { id: "s-nights", title: "Nights", by: "Frank Ocean" },
  { id: "s-mydream", title: "Space Song", by: "Beach House" },
  { id: "s-motion", title: "Motion Sickness", by: "Phoebe Bridgers" },
  { id: "s-nikes", title: "Weird Fishes", by: "Radiohead" },
  { id: "s-thelight", title: "The Light", by: "Common" },
  { id: "s-sunset", title: "Sunset Lover", by: "Petit Biscuit" },
  { id: "s-flashing", title: "Flashing Lights", by: "Kanye West" },
  { id: "s-bloom", title: "Bloom", by: "The Paper Kites" },
  { id: "s-heat", title: "Heat Waves", by: "Glass Animals" },
  { id: "s-alaska", title: "Alaska", by: "Maggie Rogers" },
  { id: "s-runaway", title: "Runaway", by: "Aurora" },
  { id: "s-ivy", title: "Ivy", by: "Frank Ocean" },
  { id: "s-cellar", title: "Cellar Door", by: "Ricky Montgomery" },
  { id: "s-electric", title: "Electric Feel", by: "MGMT" },
  { id: "s-first", title: "First Light", by: "Bonobo" },
  { id: "s-tokyo", title: "Tokyo Drift", by: "Teriyaki Boyz" },
  { id: "s-labyrinth", title: "Labyrinth", by: "Taylor Swift" },
  { id: "s-nothing", title: "Nothing New", by: "Phoebe Bridgers" },
  { id: "s-star", title: "Starlight", by: "Muse" },
  { id: "s-dream", title: "Dream a Little", by: "Doris Day" },
];

/** Stable per-title hash, so a cover never changes between sessions. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export type Cover = {
  /** Two-stop gradient plus an angle. */
  css: string;
  /** One or two letters, drawn large. */
  mono: string;
  hue: number;
};

/**
 * Cover art for a title, derived from its name.
 *
 * The hues stay inside the palette band the rest of ECHO uses, so a shelf of
 * twenty covers still looks like it belongs to this interface rather than to
 * twenty different ones.
 */
export function coverFor(title: string): Cover {
  const h = hash(title);
  const h2 = hash(title + "~");
  const hue = 236 + Math.floor(h * 110); // indigo through magenta
  const hue2 = (hue + 26 + Math.floor(h2 * 46)) % 360;
  const angle = 120 + Math.floor(h2 * 110);

  const words = title.split(/\s+/).filter(Boolean);
  const mono =
    words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : title.slice(0, 2).toUpperCase();

  return {
    hue,
    mono,
    css: `linear-gradient(${angle}deg, hsl(${hue} 82% ${38 + h * 16}%), hsl(${hue2} 76% ${16 + h2 * 12}%))`,
  };
}

/** Deterministic pick, so a person's shelf is theirs and never reshuffles. */
export function pickFor(seed: number, list: Entry[], n: number): string[] {
  const out: string[] = [];
  let x = (seed + 1) * 2654435761;
  for (let i = 0; i < n; i++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const id = list[x % list.length].id;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export const byId = (id: string): Entry | undefined =>
  GAMES.find((g) => g.id === id) ?? SONGS.find((s) => s.id === id);
