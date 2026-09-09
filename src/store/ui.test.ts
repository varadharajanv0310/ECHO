import { describe, it, expect, beforeEach } from "vitest";
import { useUI } from "./ui";
import { getSky } from "@/scene/sky-data";

beforeEach(() => {
  useUI.setState({
    level: "cluster",
    constellation: null,
    star: null,
    planet: null,
    panel: null,
    profileOf: null,
    messaging: null,
  });
});

describe("navigating the sky", () => {
  it("flies into a place", () => {
    useUI.getState().enterConstellation(0);
    expect(useUI.getState().level).toBe("constellation");
    expect(useUI.getState().constellation).toBe(0);
  });

  it("stands at somebody and derives their place from them", () => {
    const sky = getSky();
    const star = sky.stars[3];
    useUI.getState().enterStar(star.id);
    expect(useUI.getState().level).toBe("star");
    expect(useUI.getState().constellation).toBe(star.constellation);
  });

  it("refuses a person who does not exist rather than showing an empty sky", () => {
    useUI.getState().enterStar(99999);
    expect(useUI.getState().level).toBe("cluster");
    expect(useUI.getState().star).toBeNull();
  });

  it("comes back out one level at a time", () => {
    const sky = getSky();
    useUI.getState().enterStar(sky.stars[3].id);
    useUI.getState().back();
    expect(useUI.getState().level).toBe("constellation");
    useUI.getState().back();
    expect(useUI.getState().level).toBe("cluster");
  });

  it("does nothing at the top", () => {
    useUI.getState().back();
    expect(useUI.getState().level).toBe("cluster");
  });
});

describe("one window at a time", () => {
  it("opening a conversation closes a profile", () => {
    useUI.getState().openProfile(2);
    useUI.getState().openMessages(2);
    expect(useUI.getState().messaging).toBe(2);
    expect(useUI.getState().profileOf).toBeNull();
  });

  it("opening a profile closes a conversation", () => {
    useUI.getState().openMessages(2);
    useUI.getState().openProfile(2);
    expect(useUI.getState().profileOf).toBe(2);
    expect(useUI.getState().messaging).toBeNull();
  });

  it("opening a panel closes everything else", () => {
    useUI.getState().openMessages(2);
    useUI.getState().setPanel("search");
    expect(useUI.getState().panel).toBe("search");
    expect(useUI.getState().messaging).toBeNull();
  });

  it("travelling closes whatever was open", () => {
    const sky = getSky();
    useUI.getState().setPanel("search");
    useUI.getState().enterStar(sky.stars[1].id);
    expect(useUI.getState().panel).toBeNull();
  });
});
