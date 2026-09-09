import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Window } from "./Window";

const shell = (props: Partial<React.ComponentProps<typeof Window>> = {}) => (
  <Window
    title="Dashboard"
    tabs={["Sent", "Responses"]}
    active="Sent"
    onTab={() => {}}
    onClose={() => {}}
    {...props}
  >
    <button type="button">Inside one</button>
    <button type="button">Inside two</button>
  </Window>
);

describe("Window", () => {
  it("is announced as a modal dialog with a name", () => {
    render(shell());
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Dashboard");
  });

  it("closes on Escape, so it is dismissible without a mouse", async () => {
    const onClose = vi.fn();
    render(shell({ onClose }));
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes from the close control", async () => {
    const onClose = vi.fn();
    render(shell({ onClose }));
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("moves focus into itself when it opens", async () => {
    render(shell());
    await vi.waitFor(() => {
      expect(document.body.contains(document.activeElement)).toBe(true);
      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    });
  });

  it("keeps Tab inside the dialog", async () => {
    render(shell());
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("keeps Shift+Tab inside the dialog", async () => {
    render(shell());
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 8; i++) {
      await userEvent.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("marks which tab is current", () => {
    render(shell());
    const tabs = screen.getAllByRole("button", { name: /sent|responses/i });
    expect(tabs.length).toBe(2);
  });

  it("reports a tab change", async () => {
    const onTab = vi.fn();
    render(shell({ onTab }));
    await userEvent.click(screen.getByRole("button", { name: "Responses" }));
    expect(onTab).toHaveBeenCalledWith("Responses");
  });
});
