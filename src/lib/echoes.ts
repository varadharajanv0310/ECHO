import type { Emission } from "@/store/sequence";

/**
 * What comes back.
 *
 * ECHO's whole claim is that a thing you say reaches nobody unless somebody
 * chooses to carry it, and that it dies if nobody does. Until now the second
 * half was true and the first half never happened: nothing in the app could
 * ever carry anything, so the Responses tab was a room that could only be
 * empty and the clock on every signal only ever ran down.
 *
 * Everyone else in this sky is generated, so what they do with your signal is
 * generated too. It is derived rather than stored: a hash of the signal's id
 * decides whether it travels at all, who picks it up and when, and the result
 * is the same on every render and across a reload without a timer or a written
 * record anywhere. Time is the only input that moves.
 *
 * Most things get nothing. That is the point - a reply here has to mean
 * somebody decided to leave one.
 */

export type Carry = { at: number; by: string };
export type Reply = { id: number; at: number; from: string; text: string };

const REPLIES = [
  "Carried this.",
  "Read it three times.",
  "Same, most nights.",
  "This one stayed with me.",
  "Passing it on.",
  "I know exactly the street you mean.",
  "Took it into The Long Now.",
  "Was about to write something like this.",
  "Kept it.",
  "You said it better than I would have.",
  "Still thinking about this one.",
  "Sending it to somebody who needs it.",
];

/** Stable scramble of an integer. */
function hash(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * When things happen to a signal, in seconds after it was sent.
 *
 * Front-loaded on purpose. Somebody looking at this for five minutes has to
 * see the sky answer them at least once, or the idea never demonstrates
 * itself - but the later ones are far enough out that it does not feel like a
 * machine replying on a schedule.
 */
const BEATS = [38, 145, 320, 700, 1500];

/**
 * Everything that has happened to one signal by now.
 *
 * The people are passed in rather than looked up here. This module would
 * otherwise import the sky and the sky imports this, and a cycle that happens
 * to work because of when each function runs is not something to leave lying
 * around.
 */
export function echoesFor(e: Emission, who: string[], now = Date.now()) {
  const carries: Carry[] = [];
  const replies: Reply[] = [];
  if (who.length === 0) return { carries, replies };

  BEATS.forEach((secs, i) => {
    const h = hash(e.id * 31 + i);
    // Roughly two in five for the first beat, thinning out after. Silence is
    // the common case and has to stay that way.
    const happens = h % 100 < [42, 30, 22, 16, 12][i];
    if (!happens) return;

    const at = e.at + secs * 1000;
    if (at > now) return;

    const from = who[(h >>> 8) % who.length];
    carries.push({ at, by: from });

    // A second hash rather than another slice of the first. Bits of one hash
    // are not independent enough for two unrelated choices, and the visible
    // result was different people repeatedly saying the same sentence.
    const g = hash(e.id * 31 + i + 0x5f5e);

    // A carry is the act. A reply is somebody additionally choosing to say
    // something, which is rarer and is the only thing the dashboard counts as
    // a response.
    if (g % 100 < 55) {
      replies.push({
        id: e.id * 16 + i,
        at,
        from,
        text: REPLIES[(g >>> 9) % REPLIES.length],
      });
    }
  });

  return { carries, replies };
}

/**
 * When a signal's clock last restarted.
 *
 * Every carry resets it - that is the one rule the Create panel states, and
 * this is where it becomes true.
 */
export function lastCarry(e: Emission, who: string[], now = Date.now()) {
  const { carries } = echoesFor(e, who, now);
  return carries.length ? carries[carries.length - 1].at : e.at;
}
