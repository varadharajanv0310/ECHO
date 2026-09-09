import { describe, it, expect } from "vitest";
import { echoesFor, lastCarry, replyTo, thread } from "./echoes";
import type { DirectMessage, Emission } from "@/store/sequence";

const WHO = ["havel", "tern", "north", "sixth", "wren", "ember"];
const NOW = 1_800_000_000_000;

const signal = (id: number, agoMs = 0): Emission => ({
  id,
  world: "3AM",
  text: "The quiet part of the night is the only part that tells the truth.",
  at: NOW - agoMs,
  life: 24,
});

describe("echoesFor", () => {
  it("is deterministic: the same signal and clock give the same result", () => {
    const e = signal(4242, 60 * 60 * 1000);
    const a = echoesFor(e, WHO, NOW);
    const b = echoesFor(e, WHO, NOW);
    expect(a).toEqual(b);
  });

  it("returns nothing for a signal sent a moment ago", () => {
    const { carries, replies } = echoesFor(signal(7, 1000), WHO, NOW);
    expect(carries).toHaveLength(0);
    expect(replies).toHaveLength(0);
  });

  it("only reports events that have already happened", () => {
    const e = signal(99, 60 * 60 * 1000);
    const { carries } = echoesFor(e, WHO, NOW);
    for (const c of carries) expect(c.at).toBeLessThanOrEqual(NOW);
  });

  it("reveals more as time passes and never takes anything back", () => {
    const e = signal(1234);
    const early = echoesFor(e, WHO, e.at + 60 * 1000).carries;
    const later = echoesFor(e, WHO, e.at + 60 * 60 * 1000).carries;
    expect(later.length).toBeGreaterThanOrEqual(early.length);
    expect(later.slice(0, early.length)).toEqual(early);
  });

  it("credits somebody who is actually in that place", () => {
    for (let id = 0; id < 60; id++) {
      const { carries } = echoesFor(signal(id, 60 * 60 * 1000), WHO, NOW);
      for (const c of carries) expect(WHO).toContain(c.by);
    }
  });

  it("leaves a meaningful share of signals untouched", () => {
    // Silence has to be a real outcome or the mechanic means nothing.
    let silent = 0;
    const total = 400;
    for (let id = 0; id < total; id++) {
      if (echoesFor(signal(id, 60 * 60 * 1000), WHO, NOW).carries.length === 0)
        silent++;
    }
    expect(silent / total).toBeGreaterThan(0.1);
    expect(silent / total).toBeLessThan(0.6);
  });

  it("cannot reply without having carried", () => {
    for (let id = 0; id < 80; id++) {
      const { carries, replies } = echoesFor(signal(id, 60 * 60 * 1000), WHO, NOW);
      expect(replies.length).toBeLessThanOrEqual(carries.length);
    }
  });

  it("copes with an empty place", () => {
    expect(echoesFor(signal(3, 60 * 60 * 1000), [], NOW)).toEqual({
      carries: [],
      replies: [],
    });
  });
});

describe("lastCarry", () => {
  it("falls back to when it was sent if nobody carried it", () => {
    const e = signal(11, 1000);
    expect(lastCarry(e, WHO, NOW)).toBe(e.at);
  });

  it("reports the most recent carry, which is what resets the clock", () => {
    const e = signal(1234, 60 * 60 * 1000);
    const { carries } = echoesFor(e, WHO, NOW);
    if (carries.length) {
      expect(lastCarry(e, WHO, NOW)).toBe(carries[carries.length - 1].at);
      expect(lastCarry(e, WHO, NOW)).toBeGreaterThan(e.at);
    }
  });
});

const mine = (id: number, agoMs: number): DirectMessage => ({
  id,
  withStar: 0,
  name: "havel",
  text: "Been meaning to say your shelf is elite.",
  at: NOW - agoMs,
  mine: true,
});

describe("replyTo", () => {
  it("never answers a message that is not yours", () => {
    expect(replyTo({ ...mine(1, 60 * 60 * 1000), mine: false }, NOW)).toEqual([]);
  });

  it("answers as the person you were talking to", () => {
    for (let id = 1; id < 40; id++) {
      for (const r of replyTo(mine(id, 60 * 60 * 1000), NOW)) {
        expect(r.name).toBe("havel");
        expect(r.mine).toBe(false);
        expect(r.withStar).toBe(0);
      }
    }
  });

  it("is deterministic", () => {
    const m = mine(9, 60 * 60 * 1000);
    expect(replyTo(m, NOW)).toEqual(replyTo(m, NOW));
  });

  it("leaves some messages unanswered", () => {
    let quiet = 0;
    for (let id = 1; id < 200; id++) {
      if (replyTo(mine(id, 60 * 60 * 1000), NOW).length === 0) quiet++;
    }
    expect(quiet).toBeGreaterThan(0);
  });
});

describe("thread", () => {
  it("returns messages oldest first", () => {
    const out = thread([mine(1, 3000e3), mine(2, 2000e3), mine(3, 1000e3)], NOW);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].at).toBeGreaterThanOrEqual(out[i - 1].at);
    }
  });

  it("keeps every message you sent", () => {
    const sent = [mine(1, 3000e3), mine(2, 2000e3)];
    const out = thread(sent, NOW);
    for (const m of sent) expect(out).toContainEqual(m);
  });

  it("gives every message a unique key", () => {
    const out = thread([mine(1, 3000e3), mine(2, 2000e3), mine(3, 1000e3)], NOW);
    expect(new Set(out.map((m) => m.id)).size).toBe(out.length);
  });

  it("is empty for an empty conversation", () => {
    expect(thread([], NOW)).toEqual([]);
  });
});
