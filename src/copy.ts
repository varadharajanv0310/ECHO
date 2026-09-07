/**
 * Every word in the interface lives here so the writing can be revised
 * without touching a component.
 */
export const copy = {
  wordmark: "ECHO",

  /** The one line on the loading screen. Not a tagline - a state of affairs. */
  voidCaption: "No one is carrying this yet",

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

  /**
   * The passage. Six stops, each one sentence. The order is the argument:
   * what it became, what we removed, what it costs, what a signal is, what
   * resonance does, what survives.
   */
  passage: [
    { kicker: "What it became", line: "The feed was designed never to end." },
    { kicker: "What we removed", line: "No followers. No likes. No reach you can buy." },
    { kicker: "What it costs", line: "Speaking is free. Being carried is not." },
    { kicker: "What a signal is", line: "A signal lives in a place, not on a profile." },
    { kicker: "What resonance does", line: "Every hop is a person who chose you." },
    { kicker: "What survives", line: "What nobody carries is gone by morning." },
  ],

  /** The last line of the passage, and the last feed. */
  lastLine: "This is the last feed you will ever scroll.",

  /** Beat 6. One line under the galaxy, inviting entry. */
  galaxy: {
    invite: "Everything inside was carried here by someone.",
    action: "Enter",
  },

  /** Beat 8. It must not read as a form. */
  profile: {
    title: "Before you can be carried",
    nameLabel: "Name",
    nameHint: "Not a username. Not unique. Not searchable.",
    namePlaceholder: "Say what to call you",
    markLabel: "Mark",
    markHint: "How you appear in someone else's sky.",
    colourLabel: "Colour",
    colourHint: "Amber is reserved for what is dying.",
    worldsLabel: "Worlds",
    worldsHint: "Where you will be listening. Choose at least one.",
    submit: "Emit",
    submitHint: "No email. No password. Nothing leaves this browser.",
  },

  /** Beat 10. */
  constellation: {
    arrival: "You are here. Nothing has been carried yet.",
    hint: "Drag to look. Scroll to move.",
    hops: "hops",
    fading: "Fading",
  },

  /**
   * Seeded signals. These are the only user content a stranger will ever read
   * here, so they are written rather than filled with lorem: short, specific,
   * and the kind of thing a person actually says into a room at night.
   */
  signals: [
    "Someone else is awake. That is all I wanted to know.",
    "The bakery on Cross Street closes at four now. Nobody told me.",
    "I have rewritten this six times and it still is not true.",
    "Third night of rain. The gutters are singing.",
    "Left the party early and do not regret it.",
    "My father called for no reason. We talked about nothing for an hour.",
    "There is a fox that uses my street like a corridor.",
    "I keep a list of things I will never say. It is getting long.",
    "Finished it. Eleven months. Nobody will notice and that is fine.",
    "The last train smells like wet coats and cheap oranges.",
    "Told her the truth. Waiting.",
    "Every song from that year still works. Unfair.",
    "Woke at 4 and the sky was already deciding something.",
    "I have started walking the long way home on purpose.",
    "It turns out I did want to be found.",
    "Nothing happened today. Recording it anyway.",
    "The heating finally kicked in and I nearly cried.",
    "Somebody carried mine last week. I still think about it.",
  ],

  /** Places, topics and moments. A signal belongs to one of these, never to you. */
  worlds: [
    "3AM",
    "The Commons",
    "Dead Air",
    "First Light",
    "The Long Now",
    "Open Sky",
  ],
} as const;
