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
  void: { particles: 0.08, nebula: 0.55, grain: 0.4, vignette: 0.92 },
  reveal: { particles: 0.22, nebula: 1.0, grain: 0.46, vignette: 0.78 },
  passage: { particles: 1.0, nebula: 0.0, grain: 0.52, vignette: 0.62 },
  galaxy: { particles: 0.5, nebula: 0.0, grain: 0.48, vignette: 0.8 },
  ignition: { particles: 0.3, nebula: 0.0, grain: 0.85, vignette: 0.2 },
  profile: { particles: 0.65, nebula: 0.0, grain: 0.6, vignette: 0.85 },
  dive: { particles: 0.0, nebula: 0.0, grain: 0.95, vignette: 0.35 },
  constellation: { particles: 0.35, nebula: 0.0, grain: 0.55, vignette: 0.8 },
};

const STORAGE_KEY = "echo.profile";

type Profile = { name: string; hue: number; mark: string; worlds: string[] };

export type HoveredSignal = {
  text: string;
  world: string;
  hops: number;
  age: number;
  hue: string;
} | null;

function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
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
  /** The signal under the cursor in the constellation, or null. */
  hoveredSignal: HoveredSignal;
  profile: Profile | null;

  setPhase: (p: Phase) => void;
  advance: () => void;
  setBootProgress: (n: number) => void;
  setPassageProgress: (n: number) => void;
  setDiveProgress: (n: number) => void;
  setHoveredSignal: (s: HoveredSignal) => void;
  setProfile: (p: Profile) => void;
};

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
  hoveredSignal: null,
  profile: readProfile(),

  setPhase: (phase) => set({ phase }),

  advance: () => {
    const i = PHASES.indexOf(get().phase);
    if (i < PHASES.length - 1) set({ phase: PHASES[i + 1] });
  },

  setBootProgress: (bootProgress) => set({ bootProgress }),
  setPassageProgress: (passageProgress) => set({ passageProgress }),
  setDiveProgress: (diveProgress) => set({ diveProgress }),
  setHoveredSignal: (hoveredSignal) => set({ hoveredSignal }),

  setProfile: (profile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* private mode - the sequence still works, it just won't be remembered */
    }
    set({ profile });
  },
}));

/** Convenience selector - the layer mix for whatever phase is current. */
export const useLayerMix = () => LAYER_MIX[useSequence((s) => s.phase)];

// Dev-only handle so the sequence can be inspected and driven from the console
// while tuning: echo.getState(), echo.setState({ passageProgress: 0.5 }).
if (import.meta.env.DEV) {
  (window as unknown as { echo: typeof useSequence }).echo = useSequence;
}
