import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExit } from "./useExit";

describe("useExit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows a value straight away and is not closing", () => {
    const { result } = renderHook(() => useExit("menu", 200));
    expect(result.current.shown).toBe("menu");
    expect(result.current.closing).toBe(false);
  });

  it("holds the last value while it animates away", () => {
    const { result, rerender } = renderHook(({ v }) => useExit(v, 200), {
      initialProps: { v: "menu" as string | null },
    });

    rerender({ v: null });
    // Still on screen, and now marked as leaving - which is the whole point:
    // an element cannot animate out of a tree it has already left.
    expect(result.current.shown).toBe("menu");
    expect(result.current.closing).toBe(true);
  });

  it("drops the value once the animation has had its time", () => {
    const { result, rerender } = renderHook(({ v }) => useExit(v, 200), {
      initialProps: { v: "menu" as string | null },
    });

    rerender({ v: null });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.shown).toBeNull();
    expect(result.current.closing).toBe(false);
  });

  it("a value arriving during the exit cancels it rather than queueing", () => {
    const { result, rerender } = renderHook(({ v }) => useExit(v, 200), {
      initialProps: { v: "menu" as string | null },
    });

    rerender({ v: null });
    rerender({ v: "search" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.shown).toBe("search");
    expect(result.current.closing).toBe(false);
  });

  it("works with a number, which is how a star id is held", () => {
    const { result, rerender } = renderHook(({ v }) => useExit(v, 100), {
      initialProps: { v: 0 as number | null },
    });
    // Zero is a real star id, not an absence.
    expect(result.current.shown).toBe(0);

    rerender({ v: null });
    expect(result.current.shown).toBe(0);
    expect(result.current.closing).toBe(true);
  });
});

describe("hasWebGL", () => {
  // The answer is probed once and cached for the life of the module, which is
  // right in a browser and means each test here needs its own copy.
  const fresh = async () => {
    vi.resetModules();
    return (await import("@/utils/webgl")).hasWebGL;
  };

  it("says no rather than throwing when there is no context to be had", async () => {
    // jsdom implements no WebGL at all, which is exactly the machine this
    // function exists to detect. It must answer, not raise.
    const probe = await fresh();
    expect(() => probe()).not.toThrow();
    expect(probe()).toBe(false);
  });

  it("says yes when a context can be created", async () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      getExtension: () => null,
    })) as never;

    const probe = await fresh();
    expect(probe()).toBe(true);

    HTMLCanvasElement.prototype.getContext = original;
  });

  it("caches, so it never holds a second context against the browser limit", async () => {
    const original = HTMLCanvasElement.prototype.getContext;
    const getContext = vi.fn(() => ({ getExtension: () => null }));
    HTMLCanvasElement.prototype.getContext = getContext as never;

    const probe = await fresh();
    probe();
    probe();
    probe();
    expect(getContext).toHaveBeenCalledTimes(1);

    HTMLCanvasElement.prototype.getContext = original;
  });
});
