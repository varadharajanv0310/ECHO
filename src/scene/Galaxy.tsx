import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import vert from "@/shaders/galaxy.vert.glsl";
import frag from "@/shaders/galaxy.frag.glsl";
import { clamp, damp, remap } from "@/lib/utils";
import { useSequence } from "@/store/sequence";
import { tuning } from "@/lib/tuning";

const COUNT = 140000;
const RADIUS = 9;
const BRANCHES = 5;
const SPIN = 0.85;
const RANDOMNESS = 0.42;

/** Where the galaxy sits so it lands on the horizon at the end of the road. */
export const GALAXY_Y = 0.55;

const CORE = new THREE.Color("#fff3ff");
const MID = new THREE.Color("#b026ff");
const EDGE = new THREE.Color("#fa42b0");
const OUTER = new THREE.Color("#4f06f8");

/**
 * The galaxy at beat 6, and the thing the camera dives into at beat 9.
 *
 * Built as points on logarithmic arms with a power-biased radius, so density
 * climbs steeply toward the core the way it actually does. Rotation is
 * differential - inner stars orbit faster - which is what makes the arms trail
 * instead of the disc spinning rigidly like a wheel.
 *
 * It is the only interactive object on the page, and it answers to cursor
 * proximity before it is ever clicked.
 */
export function Galaxy() {
  const mode = useSequence((s) => s.settings.mode);
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const hover = useRef(0);
  // A jump straight to a beat must arrive settled, not animate in from the
  // component defaults - otherwise every review of a later beat is a race.
  const first = useRef(true);
  const { size } = useThree();

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const c = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Power bias piles stars into the core.
      const t = Math.pow(Math.random(), 1.45);
      const r = t * RADIUS;
      const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
      const spin = r * SPIN;

      const scatter = () =>
        Math.pow(Math.random(), 3) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        (r + 0.6);

      positions[i3] = Math.cos(branch + spin) * r + scatter();
      positions[i3 + 1] = scatter() * 0.28; // flattened disc
      positions[i3 + 2] = Math.sin(branch + spin) * r + scatter();

      // Core is near-white, arms run violet into magenta, halo goes deep.
      if (t < 0.18) c.copy(CORE).lerp(MID, t / 0.18);
      else if (t < 0.66) c.copy(MID).lerp(EDGE, (t - 0.18) / 0.48);
      else c.copy(EDGE).lerp(OUTER, (t - 0.66) / 0.34);

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 0.4 + Math.random() * Math.random() * 2.6;
      seeds[i] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 58 },
      uSpin: { value: 0.16 },
      uHover: { value: 0 },
      uReveal: { value: 0 },
      uDive: { value: 0 },
      uOpacity: { value: 0 },
      uLight: { value: 0 },
    }),
    [],
  );

  useFrame((state, dt) => {
    const m = mat.current;
    const p = points.current;
    if (!m || !p) return;

    const { phase, passageProgress, diveProgress } = useSequence.getState();
    const u = m.uniforms;
    u.uTime.value += dt;

    // Resolves in over the last stretch of the road, then holds.
    const past =
      phase === "galaxy" ||
      phase === "ignition" ||
      phase === "profile" ||
      phase === "dive" ||
      phase === "constellation";
    const reveal = past ? 1 : remap(passageProgress, 0.72, 1, 0, 0.9);
    // It holds the frame at beat 6, then drops back to a backdrop while the
    // profile is being made, so the form is the brightest thing on screen.
    const opacity =
      phase === "constellation"
        ? 0
        : phase === "dive"
          ? 1 - clamp(diveProgress / 0.55)
          : past
            ? phase === "profile"
              ? 0.16
              : 1
            : remap(passageProgress, 0.7, 1, 0, 1);

    // Cursor proximity, measured against where the galaxy actually is on screen.
    let target = 0;
    if (phase === "galaxy") {
      const gx = size.width * 0.5;
      const gy = size.height * (0.5 - GALAXY_Y / 3.5);
      const dx = state.pointer.x * size.width * 0.5 + size.width * 0.5 - gx;
      const dy = -state.pointer.y * size.height * 0.5 + size.height * 0.5 - gy;
      const dist = Math.hypot(dx, dy);
      target = clamp(1 - dist / (Math.min(size.width, size.height) * 0.55));
    }
    hover.current = damp(hover.current, target, 4, dt);

    if (import.meta.env.DEV) {
      (window as unknown as { galaxy: unknown }).galaxy = {
        scale: p.scale.x,
        pos: p.position.toArray(),
        u: Object.fromEntries(Object.entries(u).map(([k, v]) => [k, (v as { value: unknown }).value])),
        count: (p.geometry.getAttribute("position") as { count: number }).count,
      };
    }

    const snap = first.current;

    u.uHover.value = hover.current;
    u.uReveal.value = snap ? reveal : damp(u.uReveal.value, reveal, 2.2, dt);
    u.uOpacity.value =
      (snap ? opacity : damp(u.uOpacity.value / tuning.galaxy, opacity, 2.2, dt)) *
      tuning.galaxy;
    u.uSpin.value = damp(u.uSpin.value, 0.16 + hover.current * 0.22, 3, dt);
    // The dive stretches the galaxy past the camera as the warp takes over.
    u.uDive.value = phase === "dive" ? clamp(diveProgress / 0.5) : 0;
    u.uLight.value = mode === "light" ? 1 : 0;

    // A destination at the end of the road, not the whole sky. It only fills
    // the frame once the camera is actually going there.
    const scale =
      phase === "dive"
        ? 0.34 + clamp(diveProgress / 0.5) * 2.2
        : past
          ? phase === "profile"
            ? 0.5
            : 0.34
          : remap(passageProgress, 0.7, 1, 0.08, 0.34);
    p.scale.setScalar(snap ? scale : damp(p.scale.x, scale, 2, dt));
    first.current = false;
  });

  return (
    <points ref={points} geometry={geometry} position={[0, GALAXY_Y, 0]} rotation={[1.15, 0, 0.2]} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={mode === "light" ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}
