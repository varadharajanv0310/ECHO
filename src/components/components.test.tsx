import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Mark, MARKS } from "./Mark";
import { Hud } from "./Hud";
import { Wordmark } from "./Wordmark";
import { useSequence, useUI, DEFAULT_SETTINGS } from "@/store";
import type { MarkId } from "@/types";

beforeEach(() => {
  useSequence.setState({
    phase: "constellation",
    profile: {
      name: "Wren",
      hue: 276,
      mark: "star",
      worlds: ["The Long Quiet"],
      bio: "listening",
      traits: ["Calm"],
    },
    emissions: [],
    carried: [],
    friends: [],
    dms: [],
    settings: { ...DEFAULT_SETTINGS },
  });
  useUI.setState({ level: "cluster", constellation: null, star: null, panel: null });
});

describe("Mark", () => {
  it("draws every mark in the catalogue without throwing", () => {
    for (const m of MARKS) {
      const { container, unmount } = render(
        <Mark mark={m as MarkId} hue={276} size={24} />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      unmount();
    }
  });

  it("is decorative, so it is not announced twice alongside the name it sits by", () => {
    const { container } = render(<Mark mark="star" hue={276} size={24} />);
    const svg = container.querySelector("svg");
    // Either hidden from the tree, or carrying its own name - never an
    // unlabelled graphic that a screen reader has to guess at.
    const hidden = svg?.getAttribute("aria-hidden") === "true";
    const named = !!svg?.getAttribute("aria-label") || !!svg?.querySelector("title");
    expect(hidden || named).toBe(true);
  });

  it("takes the hue it is given", () => {
    const { container } = render(<Mark mark="star" hue={322} size={24} />);
    expect(container.innerHTML).toContain("322");
  });
});

describe("Hud", () => {
  it("is a contentinfo landmark with a name", () => {
    render(<Hud />);
    expect(
      screen.getByRole("contentinfo", { name: /session status/i }),
    ).toBeInTheDocument();
  });
});

describe("Wordmark", () => {
  it("is the page heading, and carries a readable name", () => {
    render(<Wordmark state="in" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAccessibleName();
  });
});
