import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileWindow } from "./ProfileWindow";
import { MessageWindow } from "./MessageWindow";
import { Rail } from "./Rail";
import { useSequence, useUI, DEFAULT_SETTINGS } from "@/store";
import { getSky } from "@/scene/sky-data";

const profile = {
  name: "Wren",
  hue: 276,
  mark: "star",
  worlds: ["The Long Quiet"],
  bio: "listening",
  traits: ["Calm"],
  games: [],
  songs: [],
  links: [],
};

beforeEach(() => {
  useSequence.setState({
    phase: "constellation",
    profile,
    emissions: [],
    carried: [],
    friends: [],
    dms: [],
    settings: { ...DEFAULT_SETTINGS },
  });
  useUI.setState({
    level: "cluster",
    constellation: null,
    star: null,
    planet: null,
    panel: null,
    profileOf: null,
    messaging: null,
    tab: {
      create: "Signal",
      dashboard: "Overview",
      menu: "Settings",
      profile: "Board",
      search: "Signals",
    },
  });
});

describe("Rail", () => {
  it("is a navigation landmark", () => {
    render(<Rail />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("offers every destination as a named control", () => {
    render(<Rail />);
    for (const name of [/profile/i, /menu/i, /create/i, /search/i, /dashboard/i]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("opens the destination it names", async () => {
    render(<Rail />);
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(useUI.getState().panel).toBe("search");
  });

  it("marks the open destination as current", async () => {
    render(<Rail />);
    const search = screen.getByRole("button", { name: /search/i });
    await userEvent.click(search);
    expect(search).toHaveAttribute("data-on", "true");
  });
});

describe("ProfileWindow", () => {
  it("shows your own name in an editable, labelled field", () => {
    render(<ProfileWindow star={null} />);
    expect(screen.getByLabelText(/your name/i)).toHaveValue("Wren");
  });

  it("writes an edit straight through to the store", async () => {
    render(<ProfileWindow star={null} />);
    await userEvent.type(screen.getByLabelText(/status/i), "quiet");
    expect(useSequence.getState().profile?.status).toBe("quiet");
  });

  it("makes your own shelf operable from the keyboard", async () => {
    render(<ProfileWindow star={null} />);
    await userEvent.click(screen.getByRole("button", { name: /^games$/i }));

    const tiles = screen
      .getAllByRole("button", { name: /./ })
      .filter((b) => b.className.includes("pw__tile"));
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0]).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tiles[0]);
    expect(useSequence.getState().profile?.games?.length).toBe(1);
    expect(tiles[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("somebody else's shelf is a picture, not a control", async () => {
    render(<ProfileWindow star={2} />);
    await userEvent.click(screen.getByRole("button", { name: /^games$/i }));
    const tiles = screen
      .queryAllByRole("button")
      .filter((b) => b.className.includes("pw__tile"));
    expect(tiles).toHaveLength(0);
  });
});

describe("MessageWindow", () => {
  it("names the conversation after the person", () => {
    const them = getSky().stars[3];
    render(<MessageWindow star={3} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(them.name);
  });

  it("says the thread is empty rather than showing nothing", () => {
    render(<MessageWindow star={3} />);
    expect(screen.getByText(/nothing said yet/i)).toBeInTheDocument();
  });

  it("sends what was typed, and clears the field", async () => {
    const them = getSky().stars[3];
    render(<MessageWindow star={3} />);

    const field = screen.getByLabelText(new RegExp(`message ${them.name}`, "i"));
    await userEvent.type(field, "are you still there");
    await userEvent.click(screen.getByRole("button", { name: /^send$/i }));

    const mine = useSequence.getState().dms.filter((d) => d.mine);
    expect(mine).toHaveLength(1);
    expect(mine[0].text).toBe("are you still there");
    expect(mine[0].withStar).toBe(3);
    expect(field).toHaveValue("");
  });

  it("will not send an empty message", () => {
    render(<MessageWindow star={3} />);
    expect(screen.getByRole("button", { name: /^send$/i })).toBeDisabled();
  });

  it("adding somebody from the conversation reaches the store", async () => {
    render(<MessageWindow star={3} />);
    await userEvent.click(screen.getByRole("button", { name: /add friend/i }));
    expect(useSequence.getState().friends).toContain(3);
  });
});
