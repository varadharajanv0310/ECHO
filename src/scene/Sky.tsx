import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import vert from "@/shaders/sky.vert.glsl";
import frag from "@/shaders/sky.frag.glsl";
import linkVert from "@/shaders/link.vert.glsl";
import linkFrag from "@/shaders/link.frag.glsl";
import { getSky } from "./sky-data";
import { clamp, damp } from "@/lib/utils";
import { cue } from "@/lib/audio";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { tuning } from "@/lib/tuning";

/** Camera distance at each level. Flying in is a real approach, not a swap. */
const DIST = { cluster: 74, constellation: 17, star: 4.6 };

export type SkyLabel = {
  x: number;
  y: number;
  text: string;
  kind: 0 | 1 | 2;
  id: number;
  hovered: boolean;
};

/**
 * Screen positions for the DOM label layer, rewritten every frame.
 *
 * Labels are DOM rather than sprites because they are type - names of places
 * and names of people - and type rendered into a texture at this scale is
 * always slightly wrong. This is the one place the 3D and the interface have
 * to agree, so the projection is done once, here, and read from there.
 */
export const skyLabels: { list: SkyLabel[] } = { list: [] };

/**
 * The sky.
 *
 * Everything - every World, every person, everything they let go of - lives in
 * one space at one set of coordinates, all the time. Moving between levels is
 * the camera flying to a different part of it and the shader deciding what is
 * worth drawing from there. Nothing mounts, nothing unmounts, and there is no
 * transition to design because arriving somewhere *is* the transition.
 *
 * That is also what fixes the clutter. The old sky drew two hundred nodes and
 * every connection between them at once, from one distance. Here you see seven
 * places; you only see people once you are inside a place; and you only see
 * what a person is carrying once you are standing at them.
 */
export function Sky() {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const linkMat = useRef<THREE.ShaderMaterial>(null);
  const { camera, size, gl } = useThree();

  const sky = useMemo(() => getSky(), []);
  const mode = useSequence((s) => s.settings.mode);

  /* ------------------------------------------------------------ geometry */
  const { geometry, links, kinds } = useMemo(() => {
    const { constellations, stars, planets } = sky;
    const n = constellations.length + stars.length + planets.length;

    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const anchor = new Float32Array(n * 3);
    const orbit = new Float32Array(n * 4);
    const sizes = new Float32Array(n);
    const seeds = new Float32Array(n);
    const idx = new Float32Array(n);
    const kind = new Float32Array(n);
    const grp = new Float32Array(n);
    const st = new Float32Array(n);
    const c = new THREE.Color();

    /** Index → what it is, so picking can report back in domain terms. */
    const kindMap: { kind: 0 | 1 | 2; id: number }[] = [];

    let w = 0;
    const push = (
      k: 0 | 1 | 2,
      id: number,
      x: number,
      y: number,
      z: number,
      colour: THREE.Color,
      sz: number,
      group: number,
      star: number,
      orb?: [number, number, number, number],
      anch?: [number, number, number],
    ) => {
      pos[w * 3] = x;
      pos[w * 3 + 1] = y;
      pos[w * 3 + 2] = z;
      col[w * 3] = colour.r;
      col[w * 3 + 1] = colour.g;
      col[w * 3 + 2] = colour.b;
      if (anch) {
        anchor[w * 3] = anch[0];
        anchor[w * 3 + 1] = anch[1];
        anchor[w * 3 + 2] = anch[2];
      }
      if (orb) {
        orbit[w * 4] = orb[0];
        orbit[w * 4 + 1] = orb[1];
        orbit[w * 4 + 2] = orb[2];
        orbit[w * 4 + 3] = orb[3];
      }
      sizes[w] = sz;
      seeds[w] = (w * 37 % 100) / 100;
      idx[w] = w;
      kind[w] = k;
      grp[w] = group;
      st[w] = star;
      kindMap.push({ kind: k, id });
      w++;
    };

    constellations.forEach((cn) => {
      c.setHSL(0.78 + (cn.id % 4) * 0.02, 1, 0.72);
      push(0, cn.id, cn.x, cn.y, cn.z, c, 27, cn.id, -1);
    });

    stars.forEach((s) => {
      c.setHSL(s.hue / 360, 1, 0.68);
      push(1, s.id, s.x, s.y, s.z, c, 2.6, s.constellation, -1);
    });

    planets.forEach((p) => {
      const s = stars[p.star];
      // Life runs violet through magenta; decay pulls it amber.
      c.setHSL(s.hue / 360, 1, 0.66).lerp(new THREE.Color("#ff7326"), p.age ** 2.4 * 0.85);
      push(
        2,
        p.id,
        s.x,
        s.y,
        s.z,
        c,
        0.5 + p.carried * 0.09,
        s.constellation,
        s.id,
        [p.radius, p.phase, p.speed, p.tilt],
        [s.x, s.y, s.z],
      );
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aAnchor", new THREE.BufferAttribute(anchor, 3));
    g.setAttribute("aOrbit", new THREE.BufferAttribute(orbit, 4));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
    g.setAttribute("aGroup", new THREE.BufferAttribute(grp, 1));
    g.setAttribute("aStar", new THREE.BufferAttribute(st, 1));

    // Figures: one traced line per World.
    const lp: number[] = [];
    const lc: number[] = [];
    const lg: number[] = [];
    constellations.forEach((cn) => {
      cn.figure.forEach(([a, b]) => {
        const A = stars[a];
        const B = stars[b];
        lp.push(A.x, A.y, A.z, B.x, B.y, B.z);
        lc.push(0.55, 0.2, 0.95, 0.75, 0.25, 0.7);
        lg.push(cn.id, cn.id);
      });
    });
    const lgm = new THREE.BufferGeometry();
    lgm.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
    lgm.setAttribute("aColor", new THREE.Float32BufferAttribute(lc, 3));
    lgm.setAttribute("aGroup", new THREE.Float32BufferAttribute(lg, 1));

    return { geometry: g, links: lgm, kinds: kindMap };
  }, [sky]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 120 },
      uLevel: { value: 0 },
      uGroup: { value: -1 },
      uStar: { value: -1 },
      uHover: { value: -1 },
      uReveal: { value: 0 },
      uLight: { value: 0 },
    }),
    [],
  );

  const linkUniforms = useMemo(
    () => ({
      uLevel: { value: 0 },
      uGroup: { value: -1 },
      uReveal: { value: 0 },
      uLight: { value: 0 },
    }),
    [],
  );

  /* ------------------------------------------------------------ controls */
  const cam = useRef({
    theta: 0.5,
    phi: 1.15,
    dist: DIST.cluster,
    tTheta: 0.5,
    tPhi: 1.15,
    tDist: DIST.cluster,
  });
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const hoverIdx = useRef(-1);

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0, ly = 0, dx0 = 0, dy0 = 0;

    const active = () =>
      useSequence.getState().phase === "constellation" &&
      useUI.getState().panel === null &&
      useUI.getState().planet === null;

    const down = (e: PointerEvent) => {
      if (!active()) return;
      dragging = true;
      lx = dx0 = e.clientX;
      ly = dy0 = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging || !active()) return;
      cam.current.tTheta -= (e.clientX - lx) * 0.004;
      cam.current.tPhi = clamp(cam.current.tPhi - (e.clientY - ly) * 0.004, 0.35, 2.6);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      const was = dragging;
      dragging = false;
      if (!was || !active()) return;
      if (Math.hypot(e.clientX - dx0, e.clientY - dy0) > 5) return;

      const i = hoverIdx.current;
      if (i < 0) return;
      const hit = kinds[i];
      cue("click");
      const ui = useUI.getState();
      if (hit.kind === 0) ui.enterConstellation(hit.id);
      else if (hit.kind === 1) ui.enterStar(hit.id);
      else ui.openPlanet(hit.id);
    };
    const wheel = (e: WheelEvent) => {
      if (!active()) return;
      e.preventDefault();
      const l = useUI.getState().level;
      const base = DIST[l];
      cam.current.tDist = clamp(
        cam.current.tDist + e.deltaY * 0.02,
        base * 0.45,
        base * 1.9,
      );
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
  }, [gl, kinds]);

  // Reset the orbit distance whenever the level changes, so arriving somewhere
  // always arrives at a sane framing.
  const level = useUI((s) => s.level);
  useEffect(() => {
    cam.current.tDist = DIST[level];
  }, [level]);

  /* --------------------------------------------------------------- frame */
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const m = mat.current;
    const g = group.current;
    if (!m || !g) return;

    const { phase, diveProgress } = useSequence.getState();
    const ui = useUI.getState();
    const here = phase === "constellation";
    const arriving = phase === "dive";

    m.uniforms.uTime.value += dt;

    const reveal = here ? 1 : arriving ? clamp((diveProgress - 0.55) / 0.45) : 0;
    m.uniforms.uReveal.value = damp(m.uniforms.uReveal.value, reveal, 2.4, dt);
    if (linkMat.current) {
      linkMat.current.uniforms.uReveal.value = m.uniforms.uReveal.value;
      linkMat.current.uniforms.uLevel.value = m.uniforms.uLevel.value;
      linkMat.current.uniforms.uGroup.value = m.uniforms.uGroup.value;
      linkMat.current.uniforms.uLight.value = m.uniforms.uLight.value;
    }
    g.visible = m.uniforms.uReveal.value > 0.003;

    const lvl = ui.level === "star" ? 2 : ui.level === "constellation" ? 1 : 0;
    m.uniforms.uLevel.value = damp(m.uniforms.uLevel.value, lvl, 5, dt);
    m.uniforms.uGroup.value = ui.constellation ?? -1;
    m.uniforms.uStar.value = ui.star ?? -1;
    m.uniforms.uScale.value = (size.height / 9) * tuning.galaxy;
    m.uniforms.uLight.value = mode === "light" ? 1 : 0;

    /* ------------------------------------------------------------ camera */
    // What the camera orbits: the whole sky, a World, or a person.
    if (ui.level === "star" && ui.star !== null) {
      const s = sky.stars[ui.star];
      target.set(s.x, s.y, s.z);
    } else if (ui.level === "constellation" && ui.constellation !== null) {
      const c = sky.constellations[ui.constellation];
      target.set(c.x, c.y, c.z);
    } else {
      target.set(0, 0, 0);
    }

    const c = cam.current;
    c.theta = damp(c.theta, c.tTheta, 3, dt);
    c.phi = damp(c.phi, c.tPhi, 3, dt);
    c.dist = damp(c.dist, c.tDist, 2.6, dt);
    if (here && ui.panel === null) c.tTheta += dt * 0.01;

    look.lerp(target, 1 - Math.exp(-2.6 * dt));

    const blend = here ? 1 : arriving ? clamp((diveProgress - 0.6) / 0.4) : 0;
    v.set(
      look.x + Math.sin(c.phi) * Math.cos(c.theta) * c.dist,
      look.y + Math.cos(c.phi) * c.dist,
      look.z + Math.sin(c.phi) * Math.sin(c.theta) * c.dist,
    );
    camera.position.lerpVectors(new THREE.Vector3(0, 0, 5), v, blend);
    camera.lookAt(look);

    if (!g.visible || !here) return;

    /* ----------------------------------------------------------- picking */
    const px = (state.pointer.x * 0.5 + 0.5) * size.width;
    const py = (-state.pointer.y * 0.5 + 0.5) * size.height;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const kindAttr = geometry.getAttribute("aKind") as THREE.BufferAttribute;
    const grpAttr = geometry.getAttribute("aGroup") as THREE.BufferAttribute;
    const starAttr = geometry.getAttribute("aStar") as THREE.BufferAttribute;
    const orbAttr = geometry.getAttribute("aOrbit") as THREE.BufferAttribute;
    const anchAttr = geometry.getAttribute("aAnchor") as THREE.BufferAttribute;

    const labels: SkyLabel[] = [];
    let best = -1;
    let bestD = 34;

    for (let i = 0; i < posAttr.count; i++) {
      const k = kindAttr.getX(i);

      // Only what is actually on screen at this level is pickable, so you can
      // never click a person through the wall of the World they are in.
      if (k === 0 && ui.level !== "cluster") continue;
      if (k === 1 && (ui.level === "cluster" || grpAttr.getX(i) !== ui.constellation)) continue;
      if (k === 2 && (ui.level !== "star" || starAttr.getX(i) !== ui.star)) continue;

      if (k === 2) {
        const a = orbAttr.getY(i) + m.uniforms.uTime.value * orbAttr.getZ(i);
        const r = orbAttr.getX(i);
        v.set(
          anchAttr.getX(i) + Math.cos(a) * r,
          anchAttr.getY(i) + Math.sin(a) * r * orbAttr.getW(i),
          anchAttr.getZ(i) + Math.sin(a) * r,
        );
      } else {
        v.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      }

      v.project(camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * size.width;
      const sy = (-v.y * 0.5 + 0.5) * size.height;

      const d = Math.hypot(sx - px, sy - py);
      if (d < bestD) {
        bestD = d;
        best = i;
      }

      const hit = kinds[i];
      // Planets are only named when you point at one. A person can be carrying
      // nine things and nine labels over one star is not a sky, it is a list.
      if (k === 2) continue;
      labels.push({
        x: sx,
        y: sy,
        kind: hit.kind,
        id: hit.id,
        hovered: false,
        text:
          hit.kind === 0
            ? sky.constellations[hit.id].world
            : sky.stars[hit.id].name,
      });
    }

    hoverIdx.current = best;
    m.uniforms.uHover.value = best;

    if (best >= 0) {
      const h = kinds[best];
      const l = labels.find((x) => x.kind === h.kind && x.id === h.id);
      if (l) l.hovered = true;
    }
    skyLabels.list = labels;
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={links} frustumCulled={false}>
        <shaderMaterial
          ref={linkMat}
          vertexShader={linkVert}
          fragmentShader={linkFrag}
          uniforms={linkUniforms}
          transparent
          depthWrite={false}
          blending={mode === "light" ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </lineSegments>

      <points ref={points} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={mode === "light" ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
