import { create } from "zustand";

export const PANELS = ["profile", "menu", "create", "search", "dashboard"] as const;
export type PanelId = (typeof PANELS)[number];

type UIState = {
  /** Which panel window is open, or null for the bare sky. */
  panel: PanelId | null;
  /** Active tab within the open panel, keyed by panel. */
  tab: Record<PanelId, string>;
  /** The signal node opened from the constellation, if any. */
  openSignal: number | null;

  setPanel: (p: PanelId | null) => void;
  setTab: (p: PanelId, t: string) => void;
  setOpenSignal: (i: number | null) => void;
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
  openSignal: null,

  setPanel: (panel) => set({ panel, openSignal: null }),
  setTab: (p, t) => set((s) => ({ tab: { ...s.tab, [p]: t } })),
  setOpenSignal: (openSignal) => set({ openSignal, panel: null }),
}));

// Dev-only handle, so panel state can be driven from the console while tuning.
if (import.meta.env.DEV) {
  (window as unknown as { ui: typeof useUI }).ui = useUI;
}
