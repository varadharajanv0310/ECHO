import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, damp } from "@/utils/math";
import { useSequence } from "@/store/sequence";

const COUNT = 3200;
const RADIUS = 15;
const LENGTH = 150;
const BASE_SPEED = 8;

/** Seconds: accelerate, hold, then decelerate into the constellation. */
const ACCEL = 0.9;
const HOLD = 1.6;
const DECEL = 2.2;
const TOTAL = ACCEL + HOLD + DECEL;

type P = {
  x: number;
  y: number;
  z: number;
  speed: number;
  length: number;
};

/**
 * Beat 9. The dive.
 *
 * This is the provided warp tunnel with its Canvas, its composer and its
 * opaque background stripped out, reduced to a scene object that lives inside
 * the persistent canvas. As shipped it was a self-contained opaque <Canvas>,
 * and mounting one of those at beat 9 is a visible cut by construction: an
 * opaque black rectangle appearing while it compiles shaders and uploads
 * geometry cannot be crossfaded into. Here it is always resident and simply
 * accelerates from nothing.
 *
 * It decelerates into the constellation rather than cutting, so the streaks
 * settle into stars instead of being replaced by them.
 */
export function WarpField() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const elapsed = useRef(0);
  const shown = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo<P[]>(() => {
    const out: P[] = [];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * (RADIUS - 1.5);
      out.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        z: (Math.random() - 0.5) * LENGTH,
        speed: 0.5 + Math.random() * 0.5,
        length: 1 + Math.random() * 2,
      });
    }
    return out;
  }, []);

  const mode = useSequence((s) => s.settings.mode);

  /**
   * On black the streaks are light, multiplied past white so bloom catches
   * them. On paper that is invisible, so they become dark ink laid down with
   * normal alpha - the same streaks, drawn rather than emitted. Without this
   * the whole dive simply does not happen in light mode.
   */
  const material = useMemo(() => {
    const light = mode === "light";
    return new THREE.MeshBasicMaterial({
      color: light
        ? new THREE.Color("#4a1080")
        : new THREE.Color("#b026ff").multiplyScalar(4),
      toneMapped: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
  }, [mode]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;

    const { phase, setDiveProgress, setPhase } = useSequence.getState();

    if (phase === "dive") {
      elapsed.current += dt;
      const t = elapsed.current;
      setDiveProgress(clamp(t / TOTAL));
      if (t >= TOTAL) setPhase("constellation");
    } else if (phase !== "constellation") {
      elapsed.current = 0;
    }

    // Envelope: rush up, hold flat out, then bleed off as the sky arrives.
    let env = 0;
    if (phase === "dive") {
      const t = elapsed.current;
      env =
        t < ACCEL
          ? Math.pow(t / ACCEL, 1.7)
          : t < ACCEL + HOLD
            ? 1
            : Math.pow(1 - (t - ACCEL - HOLD) / DECEL, 2.1);
    }
    shown.current = damp(shown.current, env, 9, dt);

    const speed = BASE_SPEED * (0.08 + shown.current * 0.92);
    material.opacity = Math.min(1, shown.current * (mode === "light" ? 0.85 : 1.5));
    m.visible = shown.current > 0.002;
    if (!m.visible) return;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.z += speed * p.speed * dt * 50;
      if (p.z > 5) {
        p.z = -LENGTH / 2;
        p.speed = 0.5 + Math.random() * 0.5;
      }
      dummy.position.set(p.x, p.y, p.z);
      // Streaks stretch with speed, so deceleration visibly shortens them
      // back into points rather than just slowing down.
      dummy.scale.set(0.04, 0.04, p.length + speed * p.speed * 0.5);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      material={material}
      frustumCulled={false}
      visible={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
    </instancedMesh>
  );
}
