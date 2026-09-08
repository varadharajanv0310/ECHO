import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import vert from "@/shaders/node.vert.glsl";
import frag from "@/shaders/node.frag.glsl";
import { buildConstellation } from "./constellation-data";
import { clamp, damp } from "@/lib/utils";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { cue } from "@/lib/audio";

const VIOLET = new THREE.Color("#b026ff");
const MAGENTA = new THREE.Color("#fa42b0");
const DEEP = new THREE.Color("#4f06f8");
const AMBER = new THREE.Color("#ff7326");
const WHITE = new THREE.Color("#ffffff");

/** Where the camera flies: down the axis of the warp tunnel. */
const FLIGHT = new THREE.Vector3(0, 0, 5);

/**
 * Beat 10, and the destination.
 *
 * Signals are drawn as points and the hops between them as line segments, so
 * what you are looking at is the propagation tree itself. Colour carries the
 * life of a signal: violet through magenta while it is travelling, amber as it
 * dies. The user's own node sits white at the centre with nothing attached to
 * it yet.
 *
 * Navigation is a damped orbit written by hand rather than OrbitControls,
 * because the whole piece is built on the idea that motion has weight and
 * stops when you stop. Controls that keep sliding, or that snap, would be the
 * one place the interface stopped agreeing with itself.
 */
export function Constellation() {
  const group = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const { camera, size, gl } = useThree();

  const nodes = useMemo(() => buildConstellation(), []);

  const { geometry, lines, colors } = useMemo(() => {
    const n = nodes.length;
    const positions = new Float32Array(n * 3);
    const cols = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const seeds = new Float32Array(n);
    const fades = new Float32Array(n);
    const indices = new Float32Array(n);
    const c = new THREE.Color();

    for (let i = 0; i < n; i++) {
      const nd = nodes[i];
      positions[i * 3] = nd.x;
      positions[i * 3 + 1] = nd.y;
      positions[i * 3 + 2] = nd.z;

      if (i === 0) {
        c.copy(WHITE);
      } else {
        // Life runs violet into magenta; decay pulls the whole thing amber.
        const reach = clamp(nd.carried / 5);
        c.copy(VIOLET).lerp(MAGENTA, reach);
        if (nd.hops > 3) c.lerp(DEEP, clamp((nd.hops - 3) / 5) * 0.6);
        c.lerp(AMBER, Math.pow(nd.age, 2.4) * 0.85);
      }

      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      // Reach makes a signal brighter, but nothing outshines your own node.
      sizes[i] = i === 0 ? 150 : Math.min(96, 24 + nd.carried * 14);
      seeds[i] = ((i * 37) % 100) / 100;
      indices[i] = i;
      // What nobody carried has almost nothing left.
      fades[i] = i === 0 ? 1 : 0.35 + (1 - nd.age) * 0.65;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(cols, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aFade", new THREE.BufferAttribute(fades, 1));
    g.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));

    // One segment per hop.
    const segs: number[] = [];
    const segCols: number[] = [];
    for (let i = 1; i < n; i++) {
      const nd = nodes[i];
      const p = nodes[nd.parent];
      segs.push(p.x, p.y, p.z, nd.x, nd.y, nd.z);
      const a = 0.5 * (1 - nd.age);
      segCols.push(0.44 * a, 0.12 * a, 0.75 * a, 0.55 * a, 0.16 * a, 0.62 * a);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    lg.setAttribute("color", new THREE.Float32BufferAttribute(segCols, 3));

    return { geometry: g, lines: lg, colors: cols };
  }, [nodes]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 1 },
      uReveal: { value: 0 },
      uHovered: { value: 0 },
      uHoverIndex: { value: -1 },
    }),
    [],
  );

  // ------------------------------------------------------------- controls
  const cam = useRef({
    theta: 0.4,
    phi: 1.12,
    dist: 46,
    tTheta: 0.4,
    tPhi: 1.12,
    tDist: 34,
  });

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    let downX = 0;
    let downY = 0;

    // Only the bare sky is navigable. With a window open the pointer belongs
    // to the window, or dragging inside a form would spin the constellation.
    const active = () =>
      useSequence.getState().phase === "constellation" &&
      useUI.getState().panel === null &&
      useUI.getState().openSignal === null;

    const down = (e: PointerEvent) => {
      if (!active()) return;
      dragging = true;
      lx = downX = e.clientX;
      ly = downY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging || !active()) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      cam.current.tTheta -= dx * 0.004;
      // Never let the camera roll past the poles.
      cam.current.tPhi = clamp(cam.current.tPhi - dy * 0.004, 0.35, 2.6);
    };
    const up = (e: PointerEvent) => {
      const wasDragging = dragging;
      dragging = false;
      if (!wasDragging || !active()) return;

      // A click is a press that did not travel. Anything further than a few
      // pixels was someone moving the sky, not choosing something in it.
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 5) return;
      if (hoverIdx.current > 0) {
        cue("click");
        useUI.getState().setOpenSignal(hoverIdx.current);
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!active()) return;
      e.preventDefault();
      cam.current.tDist = clamp(cam.current.tDist + e.deltaY * 0.03, 8, 90);
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("wheel", wheel, { passive: false });

    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  // --------------------------------------------------------------- frame
  const projected = useMemo(() => new THREE.Vector3(), []);
  const orbit = useMemo(() => new THREE.Vector3(), []);
  const hoverIdx = useRef(-1);

  useFrame((state, dt) => {
    const m = mat.current;
    const g = group.current;
    if (!m || !g) return;

    const { phase, diveProgress, setHoveredSignal } = useSequence.getState();
    const here = phase === "constellation";
    const arriving = phase === "dive";

    m.uniforms.uTime.value += dt;

    const reveal = here ? 1 : arriving ? clamp((diveProgress - 0.55) / 0.45) : 0;
    m.uniforms.uReveal.value = damp(m.uniforms.uReveal.value, reveal, 2.4, dt);
    if (lineMat.current) {
      lineMat.current.opacity = m.uniforms.uReveal.value * 0.9;
    }
    g.visible = m.uniforms.uReveal.value > 0.003;

    // ------------------------------------------------------------- camera
    // This component owns the camera for the whole build. The warp tunnel is
    // built around a camera sitting at the origin looking down -Z, so leaving
    // the orbit position in place during the dive shows the tunnel side-on as
    // a disc. The orbit is blended in only as the warp decelerates, which is
    // also what makes the arrival a settle rather than a cut.
    const c = cam.current;
    c.theta = damp(c.theta, c.tTheta, 3, dt);
    c.phi = damp(c.phi, c.tPhi, 3, dt);
    c.dist = damp(c.dist, c.tDist, 2.2, dt);

    // A very slow unattended drift, so a still sky is not a dead one.
    if (here) c.tTheta += dt * 0.012;

    const blend = here ? 1 : arriving ? clamp((diveProgress - 0.6) / 0.4) : 0;
    orbit.set(
      Math.sin(c.phi) * Math.cos(c.theta) * c.dist,
      Math.cos(c.phi) * c.dist,
      Math.sin(c.phi) * Math.sin(c.theta) * c.dist,
    );
    camera.position.lerpVectors(FLIGHT, orbit, blend);
    camera.lookAt(0, 0, 0);
    m.uniforms.uScale.value = size.height / 12;

    if (!g.visible) return;

    // ------------------------------------------------- hover picking
    if (!here) return;
    const px = (state.pointer.x * 0.5 + 0.5) * size.width;
    const py = (-state.pointer.y * 0.5 + 0.5) * size.height;

    let bestI = -1;
    let bestD = 34;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 1; i < pos.count; i++) {
      projected.set(pos.getX(i), pos.getY(i), pos.getZ(i)).project(camera);
      if (projected.z > 1) continue;
      const sx = (projected.x * 0.5 + 0.5) * size.width;
      const sy = (-projected.y * 0.5 + 0.5) * size.height;
      const d = Math.hypot(sx - px, sy - py);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }

    if (bestI !== hoverIdx.current) {
      hoverIdx.current = bestI;
      m.uniforms.uHoverIndex.value = bestI;
      const nd = bestI >= 0 ? nodes[bestI] : null;
      setHoveredSignal(
        nd
          ? {
              text: nd.text,
              world: nd.world,
              hops: nd.hops,
              age: nd.age,
              hue: `rgb(${Math.round(colors[bestI * 3] * 255)}, ${Math.round(colors[bestI * 3 + 1] * 255)}, ${Math.round(colors[bestI * 3 + 2] * 255)})`,
            }
          : null,
      );
    }
    m.uniforms.uHovered.value = damp(
      m.uniforms.uHovered.value,
      bestI >= 0 ? 1 : 0,
      10,
      dt,
    );
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={lines} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
