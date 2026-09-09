/**
 * Whether this browser can actually draw the thing.
 *
 * ECHO is a WebGL piece: the nebula, the road, the galaxy and the sky are all
 * shaders, and without a context there is nothing to look at. That is not a
 * rare situation - hardware acceleration is off by default in a lot of remote
 * desktops and VMs, some corporate images blocklist the driver, and older
 * machines fail on the context request itself.
 *
 * Without this check the failure is silent and total: the DOM layers still
 * mount, so the page shows a wordmark on black and behaves as though it is
 * working. Somebody would reasonably conclude the whole thing is broken.
 *
 * Probed once, on a throwaway canvas, and the context is released immediately
 * so it does not sit against the browser's limit on live contexts.
 */
let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined") return (cached = false);
  // ?nogl forces the fallback, so it can be reviewed on a machine that has
  // working WebGL. Same family as ?phase= and ?debug.
  if (new URLSearchParams(location.search).has("nogl")) return (cached = false);

  try {
    const c = document.createElement("canvas");
    const gl =
      (c.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (c.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return (cached = false);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return (cached = true);
  } catch {
    return (cached = false);
  }
}
