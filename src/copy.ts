/**
 * Every word in the interface lives here so the writing can be revised
 * without touching a component.
 */
export const copy = {
  wordmark: "ECHO",

  hud: {
    mark: "ECHO",
    index: "NO. 001",
  },

  /** System voice. Never addresses the user, never sells. */
  status: {
    void: "Listening",
    reveal: "Signal acquired",
    passage: "Inbound",
    galaxy: "Awaiting carrier",
    ignition: "Ignition",
    profile: "Unregistered signal",
    dive: "In transit",
    constellation: "Arrived",
  },

  /** Poster credit block, in the language of the reference set. */
  credit: ["ECHO", "FIRST TRANSMISSION / NO. 001", "NOTHING HERE SURVIVES ALONE"],

  scrollCue: "Scroll",
} as const;
