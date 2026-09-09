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
import { buildSkyGeometry } from "@/scene/sky-geometry";
import { clamp, damp } from "@/utils/math";
import { isHandheld } from "@/utils/dpr";
import { cue } from "@/services/audio";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { tuning } from "@/constants/tuning";

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
  const { geometry, links, rings, kinds, planetText, borrowed } = useMemo(
    () => buildSkyGeometry(sky),
    [sky],
  );

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
    let lx = 0,
      ly = 0,
      dx0 = 0,
      dy0 = 0;

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
      if (k === 1 && (ui.level === "cluster" || grpAttr.getX(i) !== ui.constellation))
        continue;
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
        text: text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX - 1)}…` : text,
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
