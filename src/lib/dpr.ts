/**
 * How many device pixels to actually render.
 *
 * Every heavy surface in ECHO is a fullscreen fragment shader - the nebula's
 * domain-warped fbm, the road's perspective divide, the galaxy's 140,000
 * points. Fill rate is the entire cost, and fill rate is quadratic in this
 * number: a phone reporting 3 renders nine times the pixels of one reporting 1.
 *
 * Capping is close to free here because none of that content has a hard edge
 * to lose. It is glow, noise and soft points, already sitting under a grain
 * layer that is deliberately rendered at DPR 1 for the same reason. Type is
 * the thing that would show it, and every piece of type in this interface is
 * DOM or SVG, which this does not touch.
 *
 * Phones get a tighter cap than laptops. They report the highest ratios and
 * have the least to spend.
 */

export function renderDpr(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.devicePixelRatio || 1;
  return Math.min(raw, isHandheld() ? 1.75 : 2);
}

/**
 * A touch device with a small screen, rather than "narrow window".
 *
 * A desktop browser dragged narrow is still a desktop: it has a real GPU and a
 * mouse, and should keep the full treatment. What matters here is the pointer,
 * which is also what decides whether hover is a thing that exists.
 */
export function isHandheld(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900
  );
}
