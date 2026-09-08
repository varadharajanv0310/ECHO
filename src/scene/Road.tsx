import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import frag from "@/shaders/road.frag.glsl";
import vert from "@/shaders/road.vert.glsl";
import { damp, remap } from "@/lib/utils";
import { useSequence } from "@/store/sequence";
import { tuning } from "@/lib/tuning";

/**
 * The road at beats 3 to 5.
 *
 * A full-screen shader rather than geometry: the reference is flowing liquid
 * light with no surface and no edges, which is a fragment problem, not a mesh
 * problem. Scroll drives travel, so the road is still whenever the reader is.
 */
export function Road() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const first = useRef(true);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uScroll: { value: 0 },
      uNarrow: { value: 0 },
      uFade: { value: 0 },
      uDest: { value: 0 },
      uBoost: { value: 1 },
      uLight: { value: 0 },
    }),
    [],
  );

  useFrame((_, dt) => {
    const m = mat.current;
    if (!m) return;
    const { phase, passageProgress: p } = useSequence.getState();
    const u = m.uniforms;

    u.uTime.value += dt;
    u.uRes.value.set(size.width, size.height);

    const active = phase === "passage" || phase === "galaxy";
    // Arrives as the wordmark leaves, holds through the passage.
    const fade = active ? Math.min(1, remap(p, 0, 0.09, 0.35, 1)) : 0;

    const snap = first.current;
    const narrow = remap(p, 0.62, 1, 0, 1);
    const dest = phase === "galaxy" ? 1.5 : remap(p, 0.55, 1, 0.06, 1.15);

    u.uFade.value = snap ? fade : damp(u.uFade.value, fade, 2.4, dt);
    u.uScroll.value = snap ? p : damp(u.uScroll.value, p, 8, dt);
    u.uNarrow.value = snap ? narrow : damp(u.uNarrow.value, narrow, 3, dt);
    u.uDest.value = snap ? dest : damp(u.uDest.value, dest, 2.5, dt);
    u.uBoost.value = tuning.road;
    u.uLight.value = useSequence.getState().settings.mode === "light" ? 1 : 0;
    first.current = false;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
      />
    </mesh>
  );
}
