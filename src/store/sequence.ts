import { create } from "zustand";

/**
 * The ten beats, collapsed to the eight states the app actually holds.
 * Beats 3-5 are one continuous scroll and share the `passage` state;
 * `passage.progress` distinguishes them.
 */
export const PHASES = [
  "void", // Beat 1  - loading, nebula, falling figure
  "reveal", // Beat 2  - the wordmark resolves
  "passage", // Beats 3-5 - the road, the argument, the narrowing
  "galaxy", // Beat 6  - the galaxy at the end of the road
  "ignition", // Beat 7a - hands, spark, flashframe
  "profile", // Beat 8  - profile creation
  "dive", // Beat 9  - the warp
  "constellation", // Beat 10 - arrival
] as const;

export type Phase = (typeof PHASES)[number];

/**
 * Per-phase mix for the persistent background layers. The brief calls for the
 * particle field to be near-invisible during loading and strongest during the
 * passage, and for grain to be present at all times but not uniform.
 */
export type LayerMix = {
  particles: number;
  nebula: number;
  grain: number;
  vignette: number;
};

export const LAYER_MIX: Record<Phase, LayerMix> = {
  void: { particles: 0.08, nebula: 0.55, grain: 0.26, vignette: 0.92 },
  reveal: { particles: 0.22, nebula: 1.0, grain: 0.3, vignette: 0.78 },
  passage: { particles: 1.0, nebula: 0.0, grain: 0.34, vignette: 0.62 },
  galaxy: { particles: 0.5, nebula: 0.0, grain: 0.32, vignette: 0.8 },
  ignition: { particles: 0.3, nebula: 0.0, grain: 0.55, vignette: 0.2 },
  profile: { particles: 0.65, nebula: 0.0, grain: 0.4, vignette: 0.85 },
  dive: { particles: 0.0, nebula: 0.0, grain: 0.62, vignette: 0.35 },
  constellation: { particles: 0.35, nebula: 0.0, grain: 0.36, vignette: 0.8 },
};

const STORAGE_KEY = "echo.profile";
const SETTINGS_KEY = "echo.settings";

export type Song = { title: string; artist: string };
export type Link = { label: string; value: string };

export type Profile = {
  name: string;
  hue: number;
  mark: string;
  worlds: string[];
  /** One line, written at creation. */
  bio: string;
  /** How this person listens. Chosen at creation, editable later. */
  traits: string[];

  /* Everything below is added later, from the profile panel. */
  status?: string;
  /** Catalogue ids, not free text, so covers and metadata are consistent. */
  songs?: string[];
  games?: string[];
  favouriteGame?: string;
  links?: Link[];
  /** Banner gradient angle, chosen from a small set. */
  banner?: number;
};

/** Something you emitted. Lives in the sky at your own star. */
export type Emission = {
  id: number;
  world: string;
  text: string;
  at: number;
  /** Hours it was given. */
  life: number;
};

/**
 * Something of somebody else's that you picked up.
 *
 * Carrying is the only verb ECHO actually rests on - a signal travels because
 * people choose to hold it, and dies when they stop. It keeps the name and the
 * colour of where it came from, so a system full of carried things reads as a
 * person who has been listening rather than a person who has been posting.
 */
export type Carried = {
  id: number;
  /** The planet in the generated sky this came from, so it cannot be taken twice. */
  source: number;
  from: string;
  hue: number;
  text: string;
  at: number;
  life: number;
};

export type DirectMessage = {
  id: number;
  /** Star id of the other person. */
  withStar: number;
  name: string;
  text: string;
  at: number;
  mine: boolean;
};

export type ThemeMode = "dark" | "light";
export type Accent = "violet" | "magenta" | "indigo" | "ice";

export type Settings = {
  mode: ThemeMode;
  accent: Accent;
  /** Suppresses the flashframe and hard cuts. */
  reducedFlash: boolean;
  /** 0-1 multiplier over the grain layer. */
  grain: number;
  receive: string[];
  show: string[];
  whoCanAdd: "anyone" | "carried" | "nobody";
};

export const DEFAULT_SETTINGS: Settings = {
  mode: "dark",
  accent: "violet",
  reducedFlash: false,
  grain: 1,
  receive: ["Carries", "Replies", "Signals from my Worlds"],
  show: ["Signals still travelling", "Signals fading"],
  whoCanAdd: "carried",
};

function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

/** Small persisted lists. Everything ECHO knows lives in this browser. */
function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, v: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode */
  }
}

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type SequenceState = {
  phase: Phase;
  /** 0-1, how far the preload + minimum-dwell gate has got. Drives nebula intensity. */
  bootProgress: number;
  /** 0-1 across the whole scrolling passage. */
  passageProgress: number;
  /** 0-1 through the dive, so the galaxy and the warp can move together. */
  diveProgress: number;
  profile: Profile | null;
  settings: Settings;

  setPhase: (p: Phase) => void;
  advance: () => void;
  setBootProgress: (n: number) => void;
  setPassageProgress: (n: number) => void;
  setDiveProgress: (n: number) => void;
  /** Everything the person has actually done, rather than seeded. */
  emissions: Emission[];
  carried: Carried[];
  friends: number[];
  dms: DirectMessage[];

  setProfile: (p: Profile) => void;
  patchProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;

  emit: (world: string, text: string, life: number) => void;
  carry: (source: number, from: string, hue: number, text: string) => void;
  drop: (source: number) => void;
  toggleFriend: (star: number) => void;
  sendDM: (star: number, name: string, text: string) => void;
};

/**
 * Ids that are unique even within one millisecond.
 *
 * Date.now() alone is not: two things made in the same tick get the same id,
 * which collides React keys and - since a signal's id is also the seed for
 * what the sky does with it - gives them identical replies from identical
 * people. Still time-ordered, so newest-first sorting still works.
 */
let lastId = 0;
function newId() {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
}

/** `?phase=galaxy` jumps straight to a beat. `?reset` clears persistence. */
function initialPhase(): Phase {
  if (typeof window === "undefined") return "void";
  const params = new URLSearchParams(window.location.search);

  if (params.has("reset")) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode */
    }
  }

  const forced = params.get("phase");
  if (forced && (PHASES as readonly string[]).includes(forced)) {
    return forced as Phase;
  }

  // A returning visitor with a profile lands in their own sky. They do not
  // re-watch the entry sequence on every visit; replay lives in the profile.
  return readProfile() ? "constellation" : "void";
}

/**
 * Jumping straight to a beat past the passage has to arrive with the passage
 * already spent, or the entry sequence is still sitting on top of it.
 */
function initialPassageProgress(phase: Phase): number {
  if (typeof window === "undefined") return 0;
  const jump = new URLSearchParams(window.location.search).get("p");
  if (jump !== null) return Math.min(1, Math.max(0, parseFloat(jump) || 0));
  return PHASES.indexOf(phase) > PHASES.indexOf("passage") ? 1 : 0;
}

const START: Phase = initialPhase();

export const useSequence = create<SequenceState>((set, get) => ({
  phase: START,
  bootProgress: 0,
  passageProgress: initialPassageProgress(START),
  diveProgress: START === "constellation" ? 1 : 0,
  profile: readProfile(),
  settings: readSettings(),
  emissions: readList("echo.emissions"),
  carried: readList("echo.carried"),
  friends: readList("echo.friends"),
  dms: readList("echo.dms"),

  setPhase: (phase) => set({ phase }),

  advance: () => {
    const i = PHASES.indexOf(get().phase);
    if (i < PHASES.length - 1) set({ phase: PHASES[i + 1] });
  },

  setBootProgress: (bootProgress) => set({ bootProgress }),
  setPassageProgress: (passageProgress) => set({ passageProgress }),
  setDiveProgress: (diveProgress) => set({ diveProgress }),

  setProfile: (profile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* private mode - the sequence still works, it just won't be remembered */
    }
    set({ profile });
  },

  patchProfile: (patch) => {
    const next = { ...(get().profile as Profile), ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    set({ profile: next });
  },

  /**
   * Emitting is the one thing here that changes the sky. A signal goes into a
   * World and appears at your own star immediately, because there is no server
   * to wait for and nothing to confirm.
   */
  emit: (world, text, life) => {
    const next = [
      { id: newId(), world, text, at: Date.now(), life },
      ...get().emissions,
    ];
    writeList("echo.emissions", next);
    set({ emissions: next });
  },

  /**
   * Pick something up. It starts orbiting you as well, and its clock restarts -
   * which is the whole mechanism: a thing survives exactly as long as people
   * keep choosing to hold it.
   */
  carry: (source, from, hue, text) => {
    if (get().carried.some((c) => c.source === source)) return;
    const next = [
      { id: newId(), source, from, hue, text, at: Date.now(), life: 24 },
      ...get().carried,
    ];
    writeList("echo.carried", next);
    set({ carried: next });
  },

  /** Put it down again. Nothing else is holding it up. */
  drop: (source) => {
    const next = get().carried.filter((c) => c.source !== source);
    writeList("echo.carried", next);
    set({ carried: next });
  },

  toggleFriend: (star) => {
    const cur = get().friends;
    const next = cur.includes(star)
      ? cur.filter((x) => x !== star)
      : [...cur, star];
    writeList("echo.friends", next);
    set({ friends: next });
  },

  sendDM: (star, name, text) => {
    const next = [
      { id: newId(), withStar: star, name, text, at: Date.now(), mine: true },
      ...get().dms,
    ];
    writeList("echo.dms", next);
    set({ dms: next });
  },

  setSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    set({ settings: next });
  },
}));

/** Convenience selector - the layer mix for whatever phase is current. */
export const useLayerMix = () => LAYER_MIX[useSequence((s) => s.phase)];

// Dev-only handle so the sequence can be inspected and driven from the console
// while tuning: echo.getState(), echo.setState({ passageProgress: 0.5 }).
if (import.meta.env.DEV) {
  (window as unknown as { echo: typeof useSequence }).echo = useSequence;
}
