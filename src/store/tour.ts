import { create } from "zustand";

/**
 * The first five minutes.
 *
 * ECHO does almost nothing that a social network is expected to do, which is
 * the point of it and also the problem with it: somebody arriving has no
 * feed to scroll, no counts to read and no obvious next click. Left alone
 * they will drag the sky around for a while and leave without finding out
 * that any of it means anything.
 *
 * So the tour is not decoration. It runs once, in three parts - a welcome, a
 * short deck explaining what the place is, and then a pass over the rail
 * pointing at each control - and it can be run again from the menu.
 */

const KEY = "echo.tourSeen";

export type Stage = "welcome" | "cards" | "rail" | null;

type TourState = {
  stage: Stage;
  /** Index within whichever stage is running. */
  step: number;
  /** True once it has been finished or dismissed, on this browser. */
  seen: boolean;

  begin: () => void;
  next: () => void;
  back: () => void;
  /** Finish, and remember that it has been finished. */
  end: () => void;
  restart: () => void;
};

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode */
  }
}

/** How many steps each stage has. The tour walks off the end into the next. */
export const CARDS = 6;
export const RAIL = 5;

export const useTour = create<TourState>((set, get) => ({
  stage: null,
  step: 0,
  seen: read(),

  begin: () => {
    if (get().seen) return;
    set({ stage: "welcome", step: 0 });
  },

  next: () => {
    const { stage, step } = get();
    if (stage === "welcome") return set({ stage: "cards", step: 0 });
    if (stage === "cards") {
      return step + 1 < CARDS
        ? set({ step: step + 1 })
        : set({ stage: "rail", step: 0 });
    }
    if (stage === "rail") {
      return step + 1 < RAIL ? set({ step: step + 1 }) : get().end();
    }
  },

  back: () => {
    const { stage, step } = get();
    if (step > 0) return set({ step: step - 1 });
    if (stage === "cards") return set({ stage: "welcome", step: 0 });
    if (stage === "rail") return set({ stage: "cards", step: CARDS - 1 });
  },

  end: () => {
    write();
    set({ stage: null, step: 0, seen: true });
  },

  /** From the menu. Does not clear `seen` - watching it again is not arriving. */
  restart: () => set({ stage: "welcome", step: 0 }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { tour: unknown }).tour = useTour;
}
