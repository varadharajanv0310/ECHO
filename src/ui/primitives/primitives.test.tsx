import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  Chip,
  Card,
  Field,
  Badge,
  EmptyState,
  LoadingState,
  Skeleton,
  ErrorBoundary,
} from "./index";

describe("Button", () => {
  it("always states its type, so it cannot submit a form by accident", () => {
    render(<Button>Carry this</Button>);
    expect(screen.getByRole("button", { name: "Carry this" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("can still be a submit button when that is what is wanted", () => {
    render(<Button type="submit">Emit</Button>);
    expect(screen.getByRole("button", { name: "Emit" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("passes a disabled state through", () => {
    render(<Button disabled>Emit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Chip", () => {
  it("reports its state to assistive technology, not only in colour", async () => {
    const onClick = vi.fn();
    render(
      <Chip selected onClick={onClick}>
        Dead Air
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Dead Air" });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalled();
  });

  it("is unpressed by default", () => {
    render(<Chip>3AM</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Card", () => {
  it("gives its heading a real heading level", () => {
    render(<Card title="What reaches you">body</Card>);
    expect(
      screen.getByRole("heading", { name: "What reaches you" }),
    ).toBeInTheDocument();
  });

  it("works without a heading", () => {
    render(<Card>body</Card>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("cannot produce an unlabelled control", () => {
    render(<Field label="The signal" />);
    expect(screen.getByLabelText("The signal")).toBeInTheDocument();
  });

  it("keeps the label for assistive technology when it is hidden visually", () => {
    render(<Field label="Search signals" hideLabel />);
    const input = screen.getByLabelText("Search signals");
    expect(input).toBeInTheDocument();
    // Hidden by class, not by removing the association.
    expect(document.querySelector("label")).toHaveClass("sr-only");
  });

  it("associates a hint with the control that it explains", () => {
    render(<Field label="The signal" hint="Say it once" />);
    expect(screen.getByLabelText("The signal")).toHaveAccessibleDescription(
      "Say it once",
    );
  });

  it("can be a textarea and stay labelled", () => {
    render(<Field label="What belongs here" multiline />);
    const el = screen.getByLabelText("What belongs here");
    expect(el.tagName).toBe("TEXTAREA");
  });
});

describe("feedback states", () => {
  it("an empty region says what would be there", () => {
    render(<EmptyState>Nothing matches</EmptyState>);
    expect(screen.getByText("Nothing matches")).toBeInTheDocument();
  });

  it("a wait is announced politely rather than silently", () => {
    render(<LoadingState label="Loading the sky" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading the sky");
  });

  it("the skeleton is decorative and hidden from the tree", () => {
    const { container } = render(<Skeleton lines={3} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".u-skeleton__line")).toHaveLength(3);
  });

  it("a badge is not a control", () => {
    render(<Badge>Calm</Badge>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Calm")).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  // React logs the caught error itself; that is noise here, not a finding.
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  function Boom(): never {
    throw new Error("the sky fell");
  }

  it("shows the children while nothing is wrong", () => {
    render(
      <ErrorBoundary>
        <p>the sky</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("the sky")).toBeInTheDocument();
  });

  it("catches, and says so as an alert rather than going blank", () => {
    render(
      <ErrorBoundary label="The sky">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/the sky fell/)).toBeInTheDocument();
  });

  it("reassures that nothing written has been lost", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/has been lost/i)).toBeInTheDocument();
  });

  it("offers a way back", async () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("takes a custom fallback when one is given", () => {
    render(
      <ErrorBoundary fallback={(e) => <p>caught: {e.message}</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("caught: the sky fell")).toBeInTheDocument();
  });
});
