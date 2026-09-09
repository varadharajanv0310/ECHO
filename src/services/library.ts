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
  { id: "g-bg3", title: "Baldur's Gate 3", by: "RPG" },
  { id: "g-hades2", title: "Hades II", by: "Roguelike" },
  { id: "g-sekiro", title: "Sekiro", by: "Action" },
  { id: "g-bloodborne", title: "Bloodborne", by: "Action" },
  { id: "g-deathstranding", title: "Death Stranding", by: "Adventure" },
  { id: "g-control", title: "Control", by: "Action" },
  { id: "g-returnal", title: "Returnal", by: "Roguelike" },
  { id: "g-subnautica", title: "Subnautica", by: "Survival" },
  { id: "g-rain", title: "Risk of Rain 2", by: "Roguelike" },
  { id: "g-slaythespire", title: "Slay the Spire", by: "Deckbuilder" },
  { id: "g-balatro", title: "Balatro", by: "Deckbuilder" },
  { id: "g-factorio", title: "Factorio", by: "Automation" },
  { id: "g-rimworld", title: "RimWorld", by: "Colony" },
  { id: "g-noita", title: "Noita", by: "Roguelike" },
  { id: "g-tunic", title: "Tunic", by: "Adventure" },
  { id: "g-hifi", title: "Hi-Fi Rush", by: "Rhythm" },
  { id: "g-pizzatower", title: "Pizza Tower", by: "Platformer" },
  { id: "g-cult", title: "Cult of the Lamb", by: "Roguelike" },
  { id: "g-gris", title: "GRIS", by: "Platformer" },
  { id: "g-spiritfarer", title: "Spiritfarer", by: "Management" },
  { id: "g-firewatch", title: "Firewatch", by: "Adventure" },
  { id: "g-nightinwoods", title: "Night in the Woods", by: "Adventure" },
  { id: "g-oxenfree", title: "Oxenfree", by: "Adventure" },
  { id: "g-kentucky", title: "Kentucky Route Zero", by: "Adventure" },
  { id: "g-deltarune", title: "Deltarune", by: "RPG" },
  { id: "g-persona5", title: "Persona 5", by: "RPG" },
  { id: "g-fez", title: "Fez", by: "Puzzle" },
  { id: "g-braid", title: "Braid", by: "Puzzle" },
  { id: "g-limbo", title: "Limbo", by: "Puzzle" },
  { id: "g-cs2", title: "Counter-Strike 2", by: "Shooter" },
  { id: "g-apex", title: "Apex Legends", by: "Shooter" },
  { id: "g-overwatch", title: "Overwatch 2", by: "Shooter" },
  { id: "g-fortnite", title: "Fortnite", by: "Shooter" },
  { id: "g-gtav", title: "GTA V", by: "Open world" },
  { id: "g-cyberpunk", title: "Cyberpunk 2077", by: "Open world" },
  { id: "g-botw", title: "Breath of the Wild", by: "Open world" },
  { id: "g-totk", title: "Tears of the Kingdom", by: "Open world" },
  { id: "g-mariokart", title: "Mario Kart 8", by: "Racing" },
  { id: "g-smash", title: "Smash Ultimate", by: "Fighting" },
  { id: "g-forza", title: "Forza Horizon 5", by: "Racing" },
  { id: "g-eldenshadow", title: "Shadow of the Erdtree", by: "Action" },
  { id: "g-lethal", title: "Lethal Company", by: "Co-op" },
  { id: "g-phasmo", title: "Phasmophobia", by: "Co-op" },
  { id: "g-valheim", title: "Valheim", by: "Survival" },
  { id: "g-palworld", title: "Palworld", by: "Survival" },
  { id: "g-vampire", title: "Vampire Survivors", by: "Roguelike" },
];

export const SONGS: Entry[] = [
  { id: "s-nights", title: "Nights", by: "Frank Ocean" },
  { id: "s-mydream", title: "Space Song", by: "Beach House" },
  { id: "s-motion", title: "Motion Sickness", by: "Phoebe Bridgers" },
  { id: "s-weirdfishes", title: "Weird Fishes", by: "Radiohead" },
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
  { id: "s-nikes", title: "Nikes", by: "Frank Ocean" },
  { id: "s-selfcontrol", title: "Self Control", by: "Frank Ocean" },
  { id: "s-whitefer", title: "White Ferrari", by: "Frank Ocean" },
  { id: "s-mydearmelancholy", title: "Call Out My Name", by: "The Weeknd" },
  { id: "s-fadeintoyou", title: "Fade Into You", by: "Mazzy Star" },
  { id: "s-silverspring", title: "Silver Springs", by: "Fleetwood Mac" },
  { id: "s-videogames", title: "Video Games", by: "Lana Del Rey" },
  { id: "s-ribs", title: "Ribs", by: "Lorde" },
  { id: "s-liability", title: "Liability", by: "Lorde" },
  { id: "s-blackout", title: "Blackout Days", by: "Phantogram" },
  { id: "s-mothersdaughter", title: "Sleep on the Floor", by: "The Lumineers" },
  { id: "s-holocene", title: "Holocene", by: "Bon Iver" },
  { id: "s-skinnylove", title: "Skinny Love", by: "Bon Iver" },
  { id: "s-reckoner", title: "Reckoner", by: "Radiohead" },
  { id: "s-nudes", title: "Nude", by: "Radiohead" },
  { id: "s-everything", title: "Everything In Its Right Place", by: "Radiohead" },
  { id: "s-instantcrush", title: "Instant Crush", by: "Daft Punk" },
  { id: "s-somethingaboutus", title: "Something About Us", by: "Daft Punk" },
  { id: "s-midnightcity", title: "Midnight City", by: "M83" },
  { id: "s-outrolo", title: "Outro", by: "M83" },
  { id: "s-agirl", title: "A Girl, A Bottle, A Boat", by: "Train" },
  { id: "s-supercut", title: "Supercut", by: "Lorde" },
  { id: "s-clairo", title: "Bags", by: "Clairo" },
  { id: "s-sofia", title: "Sofia", by: "Clairo" },
  { id: "s-japanese", title: "Be Sweet", by: "Japanese Breakfast" },
  { id: "s-mitski", title: "Nobody", by: "Mitski" },
  { id: "s-strangers", title: "Strangers", by: "Mitski" },
  { id: "s-fkatwigs", title: "Cellophane", by: "FKA twigs" },
  { id: "s-sundaymorning", title: "Sunday Morning", by: "The Velvet Underground" },
  { id: "s-pinkmoon", title: "Pink Moon", by: "Nick Drake" },
  { id: "s-riverflows", title: "River Flows In You", by: "Yiruma" },
  { id: "s-comptine", title: "Comptine d'un autre été", by: "Yann Tiersen" },
  { id: "s-experience", title: "Experience", by: "Ludovico Einaudi" },
  { id: "s-nuvole", title: "Nuvole Bianche", by: "Ludovico Einaudi" },
  { id: "s-teardrop", title: "Teardrop", by: "Massive Attack" },
  { id: "s-glory", title: "Glory Box", by: "Portishead" },
  { id: "s-untitled", title: "Untitled #1", by: "Sigur Rós" },
  { id: "s-hoppipolla", title: "Hoppípolla", by: "Sigur Rós" },
  { id: "s-intro", title: "Intro", by: "The xx" },
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

/**
 * Places a person might be, elsewhere.
 *
 * Handles rather than links, and never rendered as anchors. Nothing here is
 * verified and nothing is sent anywhere, so presenting a stranger's typed
 * string as a clickable destination would be claiming something ECHO has no
 * way to know.
 */
export const PLACES = [
  { id: "steam", label: "Steam" },
  { id: "spotify", label: "Spotify" },
  { id: "lastfm", label: "Last.fm" },
  { id: "bandcamp", label: "Bandcamp" },
  { id: "letterboxd", label: "Letterboxd" },
  { id: "github", label: "GitHub" },
  { id: "itch", label: "itch.io" },
  { id: "backloggd", label: "Backloggd" },
] as const;

export const placeLabel = (id: string) => PLACES.find((p) => p.id === id)?.label ?? id;

/** A handle for somebody the sky invented, stable to their star. */
export function handlesFor(seed: number, name: string) {
  const ids = pickFor(seed, PLACES as unknown as Entry[], 3);
  const tail = ["", "_", String(70 + (seed % 29)), ".", "-x"][seed % 5];
  return ids.map((id) => ({ label: id, value: `${name}${tail}` }));
}
