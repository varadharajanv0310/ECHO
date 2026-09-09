import { describe, it, expect } from "vitest";
import { clamp, damp, remap } from "./utils";

describe("clamp", () => {
  it("holds a value inside the range", () => {
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(-3)).toBe(0);
    expect(clamp(9)).toBe(1);
  });

  it("respects an explicit range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-15, -10, 10)).toBe(-10);
  });

  it("returns the bound when the value sits exactly on it", () => {
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
  });
});

describe("damp", () => {
  it("moves toward the target without overshooting", () => {
    const next = damp(0, 10, 5, 0.016);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it("converges on the target over many steps", () => {
    let v = 0;
    for (let i = 0; i < 500; i++) v = damp(v, 10, 5, 0.016);
    expect(v).toBeCloseTo(10, 3);
  });

  it("is frame-rate independent within tolerance", () => {
    // The whole point of exponential damping: the same elapsed time gives the
    // same result whether it arrived in one long frame or many short ones.
    let slow = 0;
    slow = damp(slow, 10, 5, 0.1);
    let fast = 0;
    for (let i = 0; i < 10; i++) fast = damp(fast, 10, 5, 0.01);
    expect(Math.abs(slow - fast)).toBeLessThan(0.001);
  });

  it("stays put when it is already there", () => {
    expect(damp(7, 7, 5, 0.016)).toBeCloseTo(7, 10);
  });
});

describe("remap", () => {
  it("maps a range onto another", () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(0, 0, 10, 20, 30)).toBe(20);
  });

  it("clamps outside the input range", () => {
    expect(remap(-5, 0, 10, 0, 100)).toBe(0);
    expect(remap(50, 0, 10, 0, 100)).toBe(100);
  });

  it("handles an inverted output range", () => {
    expect(remap(0, 0, 10, 100, 0)).toBe(100);
    expect(remap(10, 0, 10, 100, 0)).toBe(0);
  });
});
