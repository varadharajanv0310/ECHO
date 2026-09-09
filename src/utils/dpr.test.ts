import { describe, it, expect, vi, afterEach } from "vitest";
import { renderDpr, isHandheld } from "./dpr";

const setEnv = (dpr: number, width: number, coarse: boolean) => {
  Object.defineProperty(window, "devicePixelRatio", { value: dpr, configurable: true });
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  window.matchMedia = ((q: string) => ({
    matches: q.includes("coarse") ? coarse : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => vi.restoreAllMocks());

describe("renderDpr", () => {
  it("caps a desktop at 2, because fill rate is quadratic in this", () => {
    setEnv(3, 1920, false);
    expect(renderDpr()).toBe(2);
  });

  it("caps a handheld tighter", () => {
    setEnv(3, 390, true);
    expect(renderDpr()).toBe(1.75);
  });

  it("never scales a low ratio up", () => {
    setEnv(1, 1920, false);
    expect(renderDpr()).toBe(1);
  });
});

describe("isHandheld", () => {
  it("needs both a coarse pointer and a small screen", () => {
    setEnv(2, 390, true);
    expect(isHandheld()).toBe(true);
  });

  it("does not treat a narrow desktop window as a phone", () => {
    setEnv(2, 500, false);
    expect(isHandheld()).toBe(false);
  });

  it("does not treat a large touchscreen as a phone", () => {
    setEnv(2, 1600, true);
    expect(isHandheld()).toBe(false);
  });
});
