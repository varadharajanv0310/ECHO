import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePanel } from "./CreatePanel";
import { SearchPanel } from "./SearchPanel";
import { DashboardPanel } from "./DashboardPanel";
import { MenuPanel } from "./MenuPanel";
import { useSequence, useUI, DEFAULT_SETTINGS } from "@/store";

/**
 * The four rail destinations.
 *
 * Queried by role and accessible name throughout, so each of these is two
 * assertions at once: that the panel does what it says, and that a person
 * using a screen reader can find the control that does it.
 */

const profile = {
  name: "Wren",
  hue: 276,
  mark: "star",
  worlds: ["The Long Quiet", "Dead Air"],
  bio: "listening",
  traits: ["Calm"],
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

describe("CreatePanel", () => {
  it("names its composer, so it can be reached without a mouse", () => {
    render(<CreatePanel />);
    expect(screen.getByLabelText(/the signal/i)).toBeInTheDocument();
  });

  it("refuses to emit nothing", () => {
    render(<CreatePanel />);
    expect(screen.getByRole("button", { name: /emit into/i })).toBeDisabled();
  });

  it("emits into the chosen place, and says it is gone", async () => {
    render(<CreatePanel />);
    await userEvent.type(screen.getByLabelText(/the signal/i), "Third night of rain");
    const emit = screen.getByRole("button", { name: /emit into/i });
    expect(emit).toBeEnabled();
    await userEvent.click(emit);

    const emissions = useSequence.getState().emissions;
    expect(emissions).toHaveLength(1);
    expect(emissions[0].text).toBe("Third night of rain");
    expect(screen.getByRole("heading", { name: /it is out/i })).toBeInTheDocument();
  });

  it("carries the lifetime the person chose onto the signal", async () => {
    render(<CreatePanel />);
    await userEvent.click(screen.getByRole("button", { name: /^three days$/i }));
    await userEvent.type(screen.getByLabelText(/the signal/i), "A long one");
    await userEvent.click(screen.getByRole("button", { name: /emit into/i }));
    expect(useSequence.getState().emissions[0].life).toBe(72);
  });
});

describe("SearchPanel", () => {
  it("labels its field even though the label is not drawn", () => {
    render(<SearchPanel />);
    expect(screen.getByLabelText(/search signals/i)).toBeInTheDocument();
  });

  it("narrows the results to what was typed", async () => {
    render(<SearchPanel />);
    const before = screen.getAllByRole("button", { name: /·/ }).length;
    await userEvent.type(screen.getByLabelText(/search signals/i), "zzzqq");
    expect(await screen.findByText(/nothing matches/i)).toBeInTheDocument();
    expect(before).toBeGreaterThan(0);
  });

  it("says so when a filter leaves nobody", async () => {
    render(<SearchPanel />);
    await userEvent.click(screen.getByRole("button", { name: /^people$/i }));
    await userEvent.type(screen.getByLabelText(/search people/i), "zzzqq");
    expect(await screen.findByText(/nobody listening/i)).toBeInTheDocument();
  });
});

describe("DashboardPanel", () => {
  it("is empty and says so before anything has been said", () => {
    render(<DashboardPanel />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/dashboard/i);
  });

  it("shows a signal once one exists", async () => {
    useSequence.getState().emit("The Long Quiet", "The gutters are singing", 24);
    render(<DashboardPanel />);
    await userEvent.click(screen.getByRole("button", { name: /^sent$/i }));
    expect(await screen.findByText(/gutters are singing/i)).toBeInTheDocument();
  });
});

describe("MenuPanel", () => {
  it("exposes the motion setting as a real toggle with a pressed state", async () => {
    render(<MenuPanel />);
    await userEvent.click(screen.getByRole("button", { name: /accessibility/i }));

    const reduce = screen.getByRole("button", { name: /reduce flashing/i });
    expect(reduce).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(reduce);
    expect(useSequence.getState().settings.reducedFlash).toBe(true);
    expect(reduce).toHaveAttribute("aria-pressed", "true");
  });

  it("labels the grain slider", async () => {
    render(<MenuPanel />);
    await userEvent.click(screen.getByRole("button", { name: /accessibility/i }));
    expect(screen.getByLabelText(/grain/i)).toBeInTheDocument();
  });

  it("keeps a setting change rather than replacing the rest", async () => {
    render(<MenuPanel />);
    const before = useSequence.getState().settings.receive.length;
    const card = screen.getByRole("heading", {
      name: /what reaches you/i,
    }).parentElement!;
    await userEvent.click(within(card).getByRole("button", { name: /^carries$/i }));

    const after = useSequence.getState().settings;
    expect(after.receive.length).toBe(before - 1);
    expect(after.accent).toBe(DEFAULT_SETTINGS.accent);
    expect(after.grain).toBe(DEFAULT_SETTINGS.grain);
  });
});
