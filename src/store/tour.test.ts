import { describe, it, expect, beforeEach } from "vitest";
import { useTour, CARDS, RAIL } from "./tour";

beforeEach(() => {
  localStorage.clear();
  useTour.setState({ stage: null, step: 0, seen: false });
});

describe("first run", () => {
  it("opens with a welcome", () => {
    useTour.getState().begin();
    expect(useTour.getState().stage).toBe("welcome");
  });

  it("does not run again once it has been seen", () => {
    useTour.setState({ seen: true });
    useTour.getState().begin();
    expect(useTour.getState().stage).toBeNull();
  });

  it("walks welcome, then the cards, then the controls, then stops", () => {
    const t = useTour.getState();
    t.begin();
    t.next();
    expect(useTour.getState().stage).toBe("cards");
    for (let i = 0; i < CARDS; i++) useTour.getState().next();
    expect(useTour.getState().stage).toBe("rail");
    for (let i = 0; i < RAIL; i++) useTour.getState().next();
    expect(useTour.getState().stage).toBeNull();
    expect(useTour.getState().seen).toBe(true);
  });

  it("goes back through the cards and into the welcome", () => {
    const t = useTour.getState();
    t.begin(); t.next(); t.next();
    expect(useTour.getState().step).toBe(1);
    useTour.getState().back();
    expect(useTour.getState().step).toBe(0);
    useTour.getState().back();
    expect(useTour.getState().stage).toBe("welcome");
  });

  it("remembers being finished across a reload", () => {
    useTour.getState().begin();
    useTour.getState().end();
    expect(localStorage.getItem("echo.tourSeen")).toBe("1");
  });

  it("can be replayed on request without pretending it is a first visit", () => {
    useTour.setState({ seen: true });
    useTour.getState().restart();
    expect(useTour.getState().stage).toBe("welcome");
    expect(useTour.getState().seen).toBe(true);
  });
});
