import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp n into [min, max]. */
export const clamp = (n: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, n));

/** Map n from [inMin, inMax] to [outMin, outMax], clamped. */
export const remap = (
  n: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => outMin + (outMax - outMin) * clamp((n - inMin) / (inMax - inMin));

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export const easeOutExpo = (t: number) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
