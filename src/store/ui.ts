import { create } from "zustand";
import { getSky } from "@/scene/sky-data";

export const PANELS = ["profile", "menu", "create", "search", "dashboard"] as const;
export type PanelId = (typeof PANELS)[number];

/**
 * Where you are in the sky.
 *
 *   cluster        all the Worlds at once
 *   constellation  inside one World, seeing its people
 *   star           at one person, seeing what they let go of
 */
export type SkyLevel = "cluster" | "constellation" | "star";

type UIState = {
  /** Which panel window is open, or null for the bare sky. */
  panel: PanelId | null;
  /** Active tab within the open panel, keyed by panel. */
  tab: Record<PanelId, string>;

  level: SkyLevel;
  constellation: number | null;
  star: number | null;
  /** The planet whose contents are open in the reader, if any. */
  planet: number | null;
  /** Whose profile is open. A star id, or "me", or null. */
  profileOf: number | "me" | null;

  setPanel: (p: PanelId | null) => void;
  setTab: (p: PanelId, t: string) => void;

  enterConstellation: (i: number) => void;
  enterStar: (i: number) => void;
  openPlanet: (i: number | null) => void;
  openProfile: (who: number | "me") => void;
  closeProfile: () => void;
  /** One level out. */
  back: () => void;
};

export const useUI = create<UIState>((set) => ({
  panel: null,
  tab: {
    profile: "Board",
    menu: "Settings",
    create: "Signal",
    search: "Signals",
    dashboard: "Overview",
  },
  level: "cluster",
  constellation: null,
  star: null,
  planet: null,
  profileOf: null,

  setPanel: (panel) =>
    set({ panel, profileOf: panel === "profile" ? "me" : null }),
  setTab: (p, t) => set((s) => ({ tab: { ...s.tab, [p]: t } })),

  enterConstellation: (constellation) =>
    set({ level: "constellation", constellation, star: null, planet: null, panel: null }),

  // Standing at a person implies being in their World. Search and the
  // dashboard both jump straight to a star, and without this the sky has no
  // World selected and the person you came to see is filtered out of view.
  // Standing at somebody. The World is derived from the star rather than
  // trusted from the caller, because you can arrive here from search or the
  // dashboard without having flown through the World first - and the sky only
  // draws a group it has been told it is inside.
  //
  // A star that does not exist is refused outright. Setting the level without
  // a World renders a correct-looking but completely empty sky, which is a
  // much worse failure than the jump simply not happening.
  enterStar: (star) => {
    const who = getSky().stars[star];
    if (!who) return;
    set({
      level: "star",
      star,
      constellation: who.constellation,
      planet: null,
      profileOf: null,
      panel: null,
    });
  },

  openPlanet: (planet) => set({ planet }),

  openProfile: (profileOf) => set({ profileOf, panel: null }),
  closeProfile: () => set({ profileOf: null }),

  back: () =>
    set((s) =>
      s.planet !== null
        ? { planet: null }
        : s.level === "star"
          ? { level: "constellation", star: null }
          : s.level === "constellation"
            ? { level: "cluster", constellation: null }
            : {},
    ),
}));

// Dev-only handle, so panel state can be driven from the console while tuning.
if (import.meta.env.DEV) {
  (window as unknown as { ui: typeof useUI }).ui = useUI;
}
