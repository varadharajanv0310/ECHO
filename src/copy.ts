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

  /** Shown when the browser cannot give us a WebGL context at all. */
  noWebGL: {
    lede: "This browser cannot open a WebGL context, and every part of ECHO you came to see - the nebula, the road, the galaxy, the sky - is drawn with one. Nothing is broken at your end or ours; the graphics are simply switched off.",
    fixTitle: "Usually one of these",
    fixes: [
      "Hardware acceleration is off. In Chrome it is Settings → System → Use graphics acceleration when available.",
      "You are on a remote desktop or a virtual machine, where it is off by default.",
      "The browser has blocklisted the graphics driver. A different browser on the same machine will often work.",
    ],
    foot: "The idea does not need the graphics. The field guide has all of it in writing.",
  },

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
    bioLabel: "One line",
    bioHint: "Not a bio. What you are here for.",
    bioPlaceholder: "Say why you are listening",
    traitsLabel: "What you are like",
    traitsHint: "Up to three. This is how people find each other here.",
    submit: "Emit",
    submitHint: "No email. No password. Nothing leaves this browser.",
  },

  /**
   * Temperaments rather than interests. On a platform with no follower graph,
   * this is most of how one person finds another worth listening to.
   */
  traits: [
    "Night owl",
    "Early riser",
    "Good listener",
    "Overthinker",
    "Straight talker",
    "Romantic",
    "Funny",
    "Curious",
    "Creative",
    "Calm",
    "Adventurous",
    "Homebody",
    "Music obsessed",
    "Bookworm",
    "Gamer",
  ],


  /** Beat 10. */
  constellation: {
    /**
     * Takes the count, so the line cannot drift from the sky it describes -
     * it said seven for a sky that has six. Spelled out, because a numeral in
     * the middle of that sentence reads like a stat.
     */
    arrival: (n: number) =>
      `${["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"][n] ?? n} places. Nothing here reached you by itself.`,
    hintCluster: "Drag to look. Click a world to go in.",
    hintWorld: "Click a person to stand at them.",
    hintStar: "Click something they are carrying.",
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
    "The upstairs neighbour has learned a second song. Progress.",
    "Bought flowers for no one. They are on the sill.",
    "I have been pronouncing it wrong for eleven years.",
    "There is a light on across the courtyard. There always is.",
    "Quit at 2pm. Walked to the river. No conclusions.",
    "The dog next door knows my footsteps and not my name.",
    "Made the soup my grandmother made. Close, not right.",
    "Everyone I asked said they were fine.",
    "Found a receipt from a day I would otherwise have lost.",
    "The bus driver waited for me. Small thing. Not small.",
    "I am the only one still using this word.",
    "Cut my own hair. It is a decision now.",
    "Snow that did not settle. Counted anyway.",
    "Read the whole thing standing up in the shop.",
    "My hands remember the old passcode.",
    "Sat in the car outside for ten minutes first.",
    "Nobody has used the good plates in a year.",
    "The tide was further out than I have ever seen it.",
    "Said yes too fast and meant it.",
    "There is a chair on the roof opposite. I have never seen anyone in it.",
    "Learned the word for this feeling. It is not English.",
    "Stayed for the credits. Alone in there.",
    "The lift has been broken so long it is just stairs now.",
    "Wrote the message. Did not send it. Kept it.",
    "Four in the morning is a different city.",
    "Someone left a piano in the alley. It is nearly in tune.",
    "I miss a version of myself that was worse at everything.",
    "The heat came on at 6 and I have been awake since.",
    "Threw out the box I had been keeping for a better box.",
    "Told nobody. Telling this.",
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
