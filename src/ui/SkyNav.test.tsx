import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkyNav } from "./SkyNav";
import { useSequence, useUI } from "@/store";

/**
 * The keyboard equivalent of the sky.
 *
 * These tests exist because this component is the only way into the 3D view
 * without a pointer. Everything is queried by role and accessible name: if a
 * query here stops matching, the sky has stopped being reachable, which is
 * exactly the failure worth catching.
 */

const atSky = () => {
  useSequence.setState({ phase: "constellation" });
  useUI.setState({
    level: "cluster",
    constellation: null,
    star: null,
    planet: null,
    panel: null,
    profileOf: null,
    messaging: null,
  });
};

describe("SkyNav", () => {
  beforeEach(atSky);

  it("does not exist before you have arrived at the sky", () => {
    useSequence.setState({ phase: "passage" });
    const { container } = render(<SkyNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a navigation landmark with a name", () => {
    render(<SkyNav />);
    expect(
      screen.getByRole("navigation", { name: /sky navigation/i }),
    ).toBeInTheDocument();
  });

  it("lists every place as a real button", () => {
    render(<SkyNav />);
    const list = screen.getByRole("list");
    const items = screen.getAllByRole("button");
    expect(items.length).toBeGreaterThan(0);
    expect(list).toBeInTheDocument();
    // Each one carries the place and its description as its accessible name,
    // rather than only the fragment that happens to be visible.
    for (const b of items) expect(b).toHaveAccessibleName();
  });

  it("entering a place moves the store, not just the list", async () => {
    render(<SkyNav />);
    const first = screen.getAllByRole("button")[0];
    await userEvent.click(first);
    expect(useUI.getState().level).toBe("constellation");
    expect(useUI.getState().constellation).not.toBeNull();
  });

  it("offers a way back once you are inside a place", async () => {
    render(<SkyNav />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const back = screen.getByRole("button", { name: /back to/i });
    await userEvent.click(back);
    expect(useUI.getState().level).toBe("cluster");
  });

  it("standing at a person offers their profile", async () => {
    render(<SkyNav />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    // The first entry after Back is a person in this place.
    const people = screen
      .getAllByRole("button")
      .filter((b) => !/back to/i.test(b.textContent ?? ""));
    await userEvent.click(people[0]);
    expect(useUI.getState().level).toBe("star");

    const openProfile = screen.getByRole("button", { name: /profile/i });
    await userEvent.click(openProfile);
    expect(useUI.getState().profileOf).not.toBeNull();
  });

  it("Backspace goes up a level", async () => {
    render(<SkyNav />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(useUI.getState().level).toBe("constellation");

    screen.getAllByRole("button")[0].focus();
    await userEvent.keyboard("{Backspace}");
    expect(useUI.getState().level).toBe("cluster");
  });

  it("stays out of the way until something in it takes focus", async () => {
    render(<SkyNav />);
    const nav = screen.getByRole("navigation", { name: /sky navigation/i });
    expect(nav).toHaveAttribute("data-open", "false");

    // Tab rather than .focus(): this is the gesture that has to reveal it, and
    // it is the one React's focus capture actually sees.
    await userEvent.tab();
    expect(nav).toHaveAttribute("data-open", "true");
  });
});
