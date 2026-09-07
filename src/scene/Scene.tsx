import { Canvas } from "@react-three/fiber";
import { Road } from "./Road";

/**
 * The persistent canvas.
 *
 * Mounted once for beats 3 through 10 and never unmounted. Road, galaxy, warp
 * and constellation are objects inside one world with one camera, so moving
 * between them is a camera move and a crossfade of uniforms rather than four
 * components tearing down and rebuilding. That is the only way the handoffs
 * are genuinely seamless instead of well-timed.
 *
 * Transparent, so the particle field and the void still read underneath.
 */
export function Scene() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: "var(--z-scene)" }}
    >
      <Canvas
        dpr={[1, 3]}
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 70 }}
        style={{ background: "transparent" }}
      >
        <Road />
      </Canvas>
    </div>
  );
}
