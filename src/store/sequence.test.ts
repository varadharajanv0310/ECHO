import { describe, it, expect, beforeEach } from "vitest";
import { useSequence, DEFAULT_SETTINGS } from "./sequence";

const reset = () => {
  localStorage.clear();
  useSequence.setState({
    emissions: [], carried: [], friends: [], dms: [],
    profile: null, settings: { ...DEFAULT_SETTINGS },
  });
};

describe("emit", () => {
  beforeEach(reset);

  it("publishes a signal into a place, newest first", () => {
    useSequence.getState().emit("3AM", "one", 24);
    useSequence.getState().emit("Open Sky", "two", 12);
    const { emissions } = useSequence.getState();
    expect(emissions).toHaveLength(2);
    expect(emissions[0].text).toBe("two");
    expect(emissions[0].world).toBe("Open Sky");
    expect(emissions[0].life).toBe(12);
  });

  it("gives every signal a unique id even within one millisecond", () => {
    for (let i = 0; i < 50; i++) useSequence.getState().emit("3AM", `s${i}`, 24);
    const ids = useSequence.getState().emissions.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("persists so a reload does not lose it", () => {
    useSequence.getState().emit("3AM", "remembered", 24);
    expect(JSON.parse(localStorage.getItem("echo.emissions")!)[0].text).toBe("remembered");
  });
});

describe("carry", () => {
  beforeEach(reset);

  it("picks something up and keeps whose it is", () => {
    useSequence.getState().carry(3, "havel", 320, "Third night of rain.");
    const [held] = useSequence.getState().carried;
    expect(held.source).toBe(3);
    expect(held.from).toBe("havel");
    expect(held.hue).toBe(320);
  });

  it("refuses to carry the same thing twice", () => {
    useSequence.getState().carry(3, "havel", 320, "x");
    useSequence.getState().carry(3, "havel", 320, "x");
    expect(useSequence.getState().carried).toHaveLength(1);
  });

  it("puts it down again", () => {
    useSequence.getState().carry(3, "havel", 320, "x");
    useSequence.getState().drop(3);
    expect(useSequence.getState().carried).toHaveLength(0);
  });

  it("ignores dropping something never held", () => {
    useSequence.getState().carry(3, "havel", 320, "x");
    useSequence.getState().drop(99);
    expect(useSequence.getState().carried).toHaveLength(1);
  });
});

describe("connections and messages", () => {
  beforeEach(reset);

  it("adds and removes a connection", () => {
    useSequence.getState().toggleFriend(4);
    expect(useSequence.getState().friends).toContain(4);
    useSequence.getState().toggleFriend(4);
    expect(useSequence.getState().friends).not.toContain(4);
  });

  it("keeps what a reply was about", () => {
    useSequence.getState().sendDM(0, "havel", "same here", "The bakery closes at four.");
    const [dm] = useSequence.getState().dms;
    expect(dm.onText).toBe("The bakery closes at four.");
    expect(dm.mine).toBe(true);
    expect(dm.withStar).toBe(0);
  });

  it("sends a plain message with no subject", () => {
    useSequence.getState().sendDM(0, "havel", "hello");
    expect(useSequence.getState().dms[0].onText).toBeUndefined();
  });
});

describe("settings", () => {
  beforeEach(reset);

  it("merges a change rather than replacing everything", () => {
    useSequence.getState().setSettings({ mode: "light" });
    const s = useSequence.getState().settings;
    expect(s.mode).toBe("light");
    expect(s.accent).toBe(DEFAULT_SETTINGS.accent);
  });

  it("persists preferences", () => {
    useSequence.getState().setSettings({ grain: 0 });
    expect(JSON.parse(localStorage.getItem("echo.settings")!).grain).toBe(0);
  });
});
