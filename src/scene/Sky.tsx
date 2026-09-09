import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import vert from "@/shaders/sky.vert.glsl";
import frag from "@/shaders/sky.frag.glsl";
import linkVert from "@/shaders/link.vert.glsl";
import linkFrag from "@/shaders/link.frag.glsl";
import ringVert from "@/shaders/ring.vert.glsl";
import ringFrag from "@/shaders/ring.frag.glsl";
import { getSky, placeMe, syncMine, myStar } from "@/scene/sky-data";
import { skyLabels, type SkyLabel } from "@/scene/sky-labels";
import { clamp, damp } from "@/lib/utils";
import { isHandheld } from "@/lib/dpr";
import { cue } from "@/lib/audio";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { tuning } from "@/lib/tuning";

/** Camera distance at each level. Flying in is a real approach, not a swap. */
const DIST = { cluster: 74, constellation: 17, star: 2.6 };

/** Where the camera stands before the sky exists. Constant, so it is not
 *  rebuilt sixty times a second. */
const ENTRY_EYE = new THREE.Vector3(0, 0, 5);

/**
 * The aspect these distances were framed against.
 *
 * The camera's field of view is vertical, so on a tall thin screen the
 * horizontal field collapses and a sky framed on a laptop spills off both
 * edges - on a phone the six World names were half off-screen with no way to
 * know they were there. Standing further back restores the horizontal field.
 *
 * Widening the lens instead would be the other fix, and it is worse: holding
 * the horizontal field at a phone's aspect needs about 135 degrees vertical,
 * which bends the whole sky. Clamped, because past a point the sky should
 * simply be smaller rather than infinitely far away.
 */
const REF_ASPECT = 1.6;

/** Rough width of a label character, for the collision test. Handheld type
 *  is set smaller, and an estimate tuned for the desktop size would
 *  suppress labels that actually had room. */
const handheld = isHandheld();
const CHAR_W = handheld ? 4.5 : 5.6;
/** A signal's text is a sentence; on a 375px screen most of one does not fit. */
const LABEL_MAX = handheld ? 24 : 34;
const fitDist = (aspect: number) => clamp(REF_ASPECT / aspect, 1, 2.3);



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
  const ringMat = useRef<THREE.ShaderMaterial>(null);
  const { camera, size, gl } = useThree();

  const profile = useSequence((s) => s.profile);
  const emissions = useSequence((s) => s.emissions);
  const carried = useSequence((s) => s.carried);
  const friends = useSequence((s) => s.friends);
  const mode = useSequence((s) => s.settings.mode);

  // The reader is placed into the sky before geometry is built, and everything
  // they have said becomes planets around their own star. Rebuilding on change
  // is what makes Create actually do something.
  //
  // The wrapper is not decoration. getSky returns one shared instance that
  // placeMe and syncMine edit in place - they have to, or nothing else reading
  // the sky would see the change - which means the value handed back here is
  // the same object every time. The geometry memo below keys on it, and with a
  // stable identity it would never rebuild: a new signal would exist in the
  // store, and in the sky data, and simply not be drawn. A fresh wrapper round
  // the same arrays is what tells React the view has moved on.
  const sky = useMemo(() => {
    const s = getSky();
    if (profile) placeMe(s, profile.name, profile.hue, profile.worlds);
    syncMine(s, emissions, carried);
    return { ...s };
  }, [profile, emissions, carried]);

  /* ------------------------------------------------------------ geometry */
  const { geometry, links, rings, kinds, planetText, borrowed } = useMemo(() => {
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
      // aStar is the star's own id, not -1. It is what marks this one as the
      // person you are standing at, and getting it wrong dims the sun you
      // came to look at down to the brightness of its neighbours.
      push(1, s.id, s.x, s.y, s.z, c, 2.6, s.constellation, s.id);
    });

    planets.forEach((p) => {
      const s = stars[p.star];
      // Life runs violet through magenta; decay pulls it amber. A thing you
      // are carrying keeps the colour of whoever you took it from.
      c.setHSL((p.borrowed?.hue ?? s.hue) / 360, 1, 0.66).lerp(
        new THREE.Color("#ff7326"),
        p.age ** 2.4 * 0.85,
      );
      push(
        2,
        p.id,
        s.x,
        s.y,
        s.z,
        c,
        0.34 + p.carried * 0.06,
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

    // Orbit rings. The thing that turns a bright dot with specks near it into
    // a system you are standing inside: without the paths drawn, the planets
    // read as more stars that happen to be close.
    //
    // The ellipse is the same expression the vertex shader uses to place a
    // planet, evaluated all the way round instead of at one angle - so a
    // planet always sits exactly on its own line.
    const SEG = 96;
    const planetText = new Map<number, string>();
    const borrowed = new Map<number, string>();
    const rp: number[] = [];
    const rc: number[] = [];
    const rs: number[] = [];
    planets.forEach((p) => {
      const s = stars[p.star];
      planetText.set(p.id, p.text);
      if (p.borrowed) borrowed.set(p.id, p.borrowed.from);
      c.setHSL((p.borrowed?.hue ?? s.hue) / 360, 1, 0.66);
      const at = (a: number): [number, number, number] => [
        s.x + Math.cos(a) * p.radius,
        s.y + Math.sin(a) * p.radius * p.tilt,
        s.z + Math.sin(a) * p.radius,
      ];
      for (let i = 0; i < SEG; i++) {
        const a0 = (i / SEG) * Math.PI * 2;
        const a1 = ((i + 1) / SEG) * Math.PI * 2;
        rp.push(...at(a0), ...at(a1));
        rc.push(c.r, c.g, c.b, c.r, c.g, c.b);
        rs.push(s.id, s.id);
      }
    });
    const rgm = new THREE.BufferGeometry();
    rgm.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3));
    rgm.setAttribute("aColor", new THREE.Float32BufferAttribute(rc, 3));
    rgm.setAttribute("aStar", new THREE.Float32BufferAttribute(rs, 1));

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

    return {
      geometry: g,
      links: lgm,
      rings: rgm,
      kinds: kindMap,
      planetText,
      borrowed,
    };
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

  const ringUniforms = useMemo(
    () => ({
      uLevel: { value: 0 },
      uStar: { value: -1 },
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
  /**
   * Where the pointer is, in CSS pixels, and whether a tap is waiting.
   *
   * Not r3f's state.pointer, which only tracks pointermove. A touch tap can
   * arrive as pointerdown then pointerup with no move between them, so on a
   * phone the pick was resolved against wherever the last mouse-shaped event
   * had left it - usually nowhere - and tapping a star did nothing.
   *
   * Both kinds of input now write here, and a tap is resolved on the next
   * frame rather than inside the event: picking needs every point projected
   * through the current camera, which is work the frame loop is already doing
   * and an event handler would have to repeat.
   */
  const pos = useRef({ x: -1e4, y: -1e4 });
  const tap = useRef(false);
  /** Set by the pointer effect, called by the frame loop. */
  const commitRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0, ly = 0, dx0 = 0, dy0 = 0;

    const active = () =>
      useSequence.getState().phase === "constellation" &&
      useUI.getState().panel === null &&
      useUI.getState().profileOf === null &&
      useUI.getState().messaging === null;

    /**
     * Did this land on the sky, or on something in front of it?
     *
     * These listen on the window, because a drag has to keep working when the
     * pointer leaves the canvas. The cost is that everything drawn over the
     * sky - the dock, the rail, a label - also arrives here, and the old guard
     * against that was to stop picking entirely while a planet was open.
     *
     * Which meant that opening one thing somebody was carrying made every
     * other thing in their sky unclickable: no second planet, no going back to
     * the star, nothing until you closed it. Asking where the click actually
     * landed does the same job without turning the sky off.
     */
    const onSky = (e: PointerEvent) => e.target === el;

    const down = (e: PointerEvent) => {
      if (!active() || !onSky(e)) return;
      dragging = true;
      lx = dx0 = e.clientX;
      ly = dy0 = e.clientY;
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
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
      // Ten pixels rather than five: a finger is not a mouse and never lifts
      // from exactly where it landed.
      if (Math.hypot(e.clientX - dx0, e.clientY - dy0) > 10) return;
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      tap.current = true;
    };

    /** Resolved by the frame loop, once the pick has been recomputed. */
    const commit = () => {
      const i = hoverIdx.current;
      if (i < 0) return;
      const hit = kinds[i];
      cue("click");
      const ui = useUI.getState();

      if (hit.kind === 0) {
        ui.enterConstellation(hit.id);
      } else if (hit.kind === 1) {
        // Standing at somebody already? Then clicking them again is asking who
        // they are, not asking to go there.
        if (ui.level === "star" && ui.star === hit.id) {
          ui.openProfile(hit.id === myStar() ? "me" : hit.id);
          if (hit.id === myStar()) ui.setPanel("profile");
        } else {
          ui.enterStar(hit.id);
        }
      } else {
        ui.openPlanet(hit.id);
      }
    };
    commitRef.current = commit;

    const wheel = (e: WheelEvent) => {
      if (!active()) return;
      e.preventDefault();
      const l = useUI.getState().level;
      const base = DIST[l] * fitDist(size.width / size.height);
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
    // Also on resize: rotating a phone changes the aspect, and with it how far
    // back the camera has to stand to keep the sky in frame.
    cam.current.tDist = DIST[level] * fitDist(size.width / size.height);
  }, [level, size.width, size.height]);

  /* --------------------------------------------------------------- frame */
  const v = useMemo(() => new THREE.Vector3(), []);
  const placedRef = useRef<number[]>([]);
  const outRef = useRef<SkyLabel[]>([]);

  useFrame((_state, dt) => {
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
    if (ringMat.current) {
      ringMat.current.uniforms.uReveal.value = m.uniforms.uReveal.value;
      ringMat.current.uniforms.uLevel.value = m.uniforms.uLevel.value;
      ringMat.current.uniforms.uStar.value = m.uniforms.uStar.value;
      ringMat.current.uniforms.uLight.value = m.uniforms.uLight.value;
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
    camera.position.lerpVectors(ENTRY_EYE, v, blend);
    camera.lookAt(look);

    // Dev handle for the rig, alongside window.sky and window.ui. Framing the
    // sky is a numbers game and reading them beats guessing at a screenshot.
    if (import.meta.env.DEV) {
      (window as unknown as { rig: unknown }).rig = {
        dist: c.dist,
        tDist: c.tDist,
        dt,
        pos: camera.position.toArray(),
        look: look.toArray(),
      };
    }

    if (!g.visible || !here) return;

    /* ----------------------------------------------------------- picking */
    const px = pos.current.x;
    const py = pos.current.y;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const kindAttr = geometry.getAttribute("aKind") as THREE.BufferAttribute;
    const grpAttr = geometry.getAttribute("aGroup") as THREE.BufferAttribute;
    const starAttr = geometry.getAttribute("aStar") as THREE.BufferAttribute;
    const orbAttr = geometry.getAttribute("aOrbit") as THREE.BufferAttribute;
    const anchAttr = geometry.getAttribute("aAnchor") as THREE.BufferAttribute;

    const labels: SkyLabel[] = [];
    let best = -1;
    let bestD = Infinity;

    /**
     * How close counts as clicking a thing.
     *
     * One radius for everything does not work here, because these are drawn at
     * wildly different sizes: the person you are standing at fills a third of
     * the frame, and a planet is a speck. Thirty-four pixels made the sun
     * clickable only in its dead centre - the visible glow was inert, and
     * clicking a star to open who they are simply did nothing anywhere except
     * one exact point.
     *
     * Per-point instead, so the nearest thing whose own radius you are inside
     * wins. A planet still beats the sun it orbits, because the planet's
     * centre is nearer to the pointer than the sun's.
     */
    const reach = (k: number, i: number) =>
      k === 2
        ? 30
        : k === 1
          ? ui.level === "star" && starAttr.getX(i) === ui.star
            ? 120
            : 36
          : 40;

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
      if (d <= reach(k, i) && d < bestD) {
        bestD = d;
        best = i;
      }

      // Names are dropped once you are standing in a system - but only after
      // the pick above, so the neighbours stay clickable while they stop
      // shouting. The sun does not need naming either: the breadcrumb and the
      // plate in the corner both already say whose sky this is, and a third
      // copy lands directly on top of the glow.
      if (k === 1 && ui.level === "star") continue;

      const hit = kinds[i];
      // Planets are named here, where there are at most a handful of them and
      // they are the only reason to have come. Anywhere else this would be a
      // list of everything in the sky printed over the sky.
      const text =
        hit.kind === 0
          ? sky.constellations[hit.id].world
          : hit.kind === 1
            ? sky.stars[hit.id].name
            : (planetText.get(hit.id) ?? "");
      labels.push({
        x: sx,
        y: sy,
        kind: hit.kind,
        id: hit.id,
        hovered: false,
        text:
          text.length > LABEL_MAX
            ? `${text.slice(0, LABEL_MAX - 1)}…`
            : text,
        from: hit.kind === 2 ? borrowed.get(hit.id) : undefined,
        // Adding somebody did nothing you could see. Now their star is marked
        // wherever you meet it, so the sky is recognisably yours rather than
        // the same generated field for everyone.
        friend: hit.kind === 1 && friends.includes(hit.id),
      });
    }

    hoverIdx.current = best;
    m.uniforms.uHover.value = best;

    // A tap queued by the pointer handler waits for exactly this: the nearest
    // thing to where the finger landed, measured against the camera as it is
    // now.
    if (tap.current) {
      tap.current = false;
      commitRef.current();
    }

    if (best >= 0) {
      const h = kinds[best];
      const l = labels.find((x) => x.kind === h.kind && x.id === h.id);
      if (l) l.hovered = true;
    }

    // Drop labels that would sit on top of one another. A person carrying six
    // things has six sentences orbiting one point, and for most of every orbit
    // several of them are in the same part of the screen - overlapping type
    // that renders as neither sentence.
    //
    // Whatever is under the pointer is placed first and always survives, so
    // pointing at a crowded planet is how you read the one you want. The rest
    // are laid out in the order they were found, which is stable frame to
    // frame, so nothing flickers while things drift past each other.
    // The interface is also something a label can land on. These are the
    // regions the chrome occupies - the breadcrumb across the top, the rail
    // down the left, the identity plate in the corner, and the compose bar
    // along the bottom - and a name printed over any of them is unreadable
    // twice over.
    const W = size.width;
    const H = size.height;
    // Where the chrome is, so no label is printed underneath it. Written out
    // rather than built as an array of rectangles each frame, for the same
    // reason as below: none of it would survive the frame.
    //
    // The two layouts put the furniture in different places. On a handheld the
    // rail is a bar along the bottom and the identity plate has moved to the
    // top, so the desktop rectangles would protect the wrong half of the
    // screen and let labels sit under the rail.
    const clear = handheld
      ? (_x: number, y: number) => y > 132 && y < H - 152
      : (x: number, y: number) =>
          !(x > W * 0.5 - 260 && x < W * 0.5 + 260 && y < 54) &&
          !(x < 62 && y > 150 && y < 310) &&
          !(x < 150 && y > H - 120) &&
          !(x > W * 0.5 - 250 && x < W * 0.5 + 250 && y > H - 62);

    // Placement records are kept flat - x, y, half-width, repeating - in one
    // array that is reused between frames. The readable spelling of all this
    // is filter / concat / filter with an object per placed label, which
    // allocates four arrays, two closures and a few hundred objects every
    // frame before it has decided anything. None of it survives the frame, so
    // all of it is garbage the collector has to come back for.
    const placed = placedRef.current;
    const out = outRef.current;
    placed.length = 0;
    out.length = 0;

    const LINE = 19;
    const take = (l: SkyLabel) => {
      if (!clear(l.x, l.y)) return;
      // The attribution counts. A carried signal has " via <name>" appended
      // by CSS, which is not in l.text - leaving it out under-measured those
      // labels by exactly enough to push them off the edge.
      const chars = l.text.length + (l.from ? l.from.length + 5 : 0);
      const w = chars * CHAR_W + 16;
      // Nudge back inside the frame rather than letting it hang off the edge.
      // The label is centred on its point, so near an edge half of it is
      // simply gone - on a narrow screen that was most of them.
      l.x = clamp(l.x, w * 0.5 + 6, W - w * 0.5 - 6);
      for (let k = 0; k < placed.length; k += 3) {
        if (
          Math.abs(placed[k + 1] - l.y) < LINE &&
          Math.abs(placed[k] - l.x) * 2 < placed[k + 2] + w
        ) {
          return;
        }
      }
      placed.push(l.x, l.y, w);
      out.push(l);
    };

    // Hovered first, then everything else in the order it was found - two
    // passes rather than a sort, because at most one label is ever hovered.
    for (let i = 0; i < labels.length; i++) if (labels[i].hovered) take(labels[i]);
    for (let i = 0; i < labels.length; i++) if (!labels[i].hovered) take(labels[i]);

    skyLabels.list = out;
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

      <lineSegments geometry={rings} frustumCulled={false}>
        <shaderMaterial
          ref={ringMat}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          uniforms={ringUniforms}
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
