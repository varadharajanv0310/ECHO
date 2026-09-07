# ECHO — Provided Components

Three components for the ECHO build. Two share the filename `light-speed.tsx` as shipped and **will overwrite each other** — the renames below are mandatory, not optional.

| File | Export | What it is | Used for |
|---|---|---|---|
| `/components/ui/galaxy-warp.tsx` | `GalaxyWarp` | react-three-fiber instanced-mesh warp tunnel with bloom | Beat 9 — the dive into the constellation |
| `/components/ui/nebula-shader.tsx` | `NebulaShader` | Raw WebGL2 fragment shader, polar-warped point-light field | Beats 1–2 — loading screen and wordmark reveal |
| `/components/ui/fluid-particles-background.tsx` | `FluidParticlesBackground` | Perlin-noise canvas particle field | Persistent background layer, whole site |

## Install

```bash
npm install three @react-three/fiber @react-three/postprocessing
```

`NebulaShader` and `FluidParticlesBackground` have no npm dependencies. All three import `cn` from `@/lib/utils` (except `NebulaShader`, which does not).

---

# 1. `galaxy-warp.tsx`

A camera travelling down a cylinder of stretched instanced spheres, bloomed to neon. Renamed from `LightSpeed` / `LightSpeedProps`.

```tsx
"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { cn } from "@/lib/utils";

export interface GalaxyWarpProps {
  /**
   * Number of particles (stars/lines).
   * @default 2000
   */
  particleCount?: number;
  /**
   * Base speed of the warp effect.
   * @default 4
   */
  speed?: number;
  /**
   * Base color of the emitted light streaks.
   * @default "#33b2ff"
   */
  lightColor?: string;
  /**
   * Intensity of the bloom glow.
   * @default 3.0
   */
  intensity?: number;
  /**
   * Extent of the cylinder radius in which particles spawn.
   * @default 25
   */
  radius?: number;
  /**
   * Length of the cylinder before particles loop back.
   * @default 150
   */
  cylinderLength?: number;
  className?: string;
}

function Particles({
  count,
  baseSpeed,
  lightColor,
  intensity,
  radius,
  cylinderLength,
}: {
  count: number;
  baseSpeed: number;
  lightColor: string;
  intensity: number;
  radius: number;
  cylinderLength: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Object3D to help apply transforms to individual instanced items
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particle properties
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Start further away from the center to leave a "tunnel" for the camera
      const r = 2 + Math.random() * (radius - 2);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      let z = (Math.random() - 0.5) * cylinderLength;
      let speedMultiplier = 0.5 + Math.random() * 0.5;

      // Pre-warm the particle simulation by 1.5 seconds
      for (let j = 0; j < 90; j++) {
        z += baseSpeed * speedMultiplier * (1 / 60) * 50;
        if (z > 5) {
          z = -cylinderLength / 2;
          speedMultiplier = 0.5 + Math.random() * 0.5;
        }
      }

      temp.push({
        x,
        y,
        z,
        // Individual random speed multiplier to give depth variation
        speedMultiplier,
        // Individual random length to look more organic
        length: 1 + Math.random() * 2,
        angle,
        radius: r,
      });
    }
    return temp;
  }, [count, radius, cylinderLength]);

  const bloomColor = useMemo(() => {
    const color = new THREE.Color(lightColor);
    color.multiplyScalar(intensity);
    return color;
  }, [lightColor, intensity]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // We update each particle's matrix and apply rotation/translation
    particles.forEach((particle, i) => {
      // Move particle towards the camera (+Z)
      // delta makes the movement frame-rate independent.
      const moveDistance = baseSpeed * particle.speedMultiplier * delta * 50;
      particle.z += moveDistance;

      // If a particle passes the camera (z > 5), loop it back to the far end
      if (particle.z > 5) {
        particle.z = -cylinderLength / 2;
        particle.speedMultiplier = 0.5 + Math.random() * 0.5;
      }

      // We place the dummy at the particle coordinates
      dummy.position.set(particle.x, particle.y, particle.z);
      // We scale the length on the Z-axis to mimic motion blur/stretched UV spheres
      // The faster it moves, the more stretched it appears
      const stretchZ =
        particle.length + baseSpeed * particle.speedMultiplier * 0.5;
      // X and Y are scaled small to look thin (like streaks)
      dummy.scale.set(0.04, 0.04, stretchZ);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    // Tell Three.js the matrix data has been updated and deserves a re-render
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color={bloomColor}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

export function GalaxyWarp({
  particleCount = 1000,
  speed = 2.4,
  lightColor = "#b026ff",
  intensity = 3.0,
  radius = 25,
  cylinderLength = 150,
  className,
}: GalaxyWarpProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#05070b]",
        className,
      )}
    >
      {/*
        Camera looks down -Z axis. FOV 90 for a wider warping look.
        It simulates a camera traveling in a cylinder.
      */}
      <Canvas camera={{ position: [0, 0, 5], fov: 90 }} dpr={[1, 2]}>
        {/* The fog fades out clipping edges in the distance */}
        <fogExp2 attach="fog" args={["#000000", 0.025]} />
        <color attach="background" args={["#000000"]} />

        <Particles
          count={particleCount}
          baseSpeed={speed}
          lightColor={lightColor}
          intensity={intensity}
          radius={radius}
          cylinderLength={cylinderLength}
        />

        <EffectComposer>
          {/* Bloom takes any value > 1 and makes it emit a neon outer glow */}
          <Bloom
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            intensity={1.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default GalaxyWarp;
```

### ECHO settings

```tsx
<GalaxyWarp
  lightColor="#b026ff"
  speed={8}
  particleCount={2500}
  intensity={4}
  radius={15}
/>
```

Tight radius so streaks rush close past the camera. `dpr={[1, 2]}` can be raised — do not lower it. Entry and exit must be seamless with no visible mount or cut, and the warp decelerates into the constellation rather than cutting.

---

# 2. `nebula-shader.tsx`

Twenty animated point lights bleeding into each other through polar-warped coordinates. Renamed from `LightSpeed`. Shader by Matthias Hurrle (@atzedent).

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

const DEFAULT_FRAG = `#version 300 es
precision highp float;
/*********
* made by Matthias Hurrle (@atzedent)
*/
out vec4 O;
uniform float time;
uniform vec2 resolution;

#define FC gl_FragCoord.xy
#define R  resolution
#define T  time
#define hue(a) (.6+.6*cos(6.3*(a)+vec3(0,83,21)))

float rnd(float a) {
  vec2 p = fract(a * vec2(12.9898, 78.233));
  p += dot(p, p*345.);
  return fract(p.x * p.y);
}
vec3 pattern(vec2 uv) {
  vec3 col = vec3(0.);
  for (float i=.0; i++<20.;) {
    float a = rnd(i);
    vec2 n = vec2(a, fract(a*34.56));
    vec2 p = sin(n*(T+7.) + T*.5);
    float d = dot(uv-p, uv-p);
    col += .00125/d * hue(dot(uv,uv) + i*.125 + T);
  }
  return col;
}
void main(void) {
  vec2 uv = (FC - .5 * R) / min(R.x, R.y);
  vec3 col = vec3(0.);
  float s = 2.4;
  float a = atan(uv.x, uv.y);
  float b = length(uv);
  uv = vec2(a * 5. / 6.28318, .05 / tan(b) + T);
  uv = fract(uv) - .5;
  col += pattern(uv * s);
  O = vec4(col, 1.);
}`;

/** Minimal passthrough vertex shader */
const DEFAULT_VERT = `#version 300 es
precision highp float;
in vec2 position;
void main(){
  gl_Position = vec4(position, 0.0, 1.0);
}`;

type Props = {
  /** Tailwind classes controlling size/layout. Defaults to fullscreen. */
  className?: string;
  /** Pause the animation. */
  paused?: boolean;
  /** Multiply time (1 = normal speed). */
  speed?: number;
  /** Override fragment shader if you want to experiment. */
  fragmentSource?: string;
  /** Optional: handle shader compile errors. */
  onShaderError?: (err: string) => void;
};

function NebulaShader({
  className = "relative w-screen h-screen bg-black overflow-hidden",
  paused = false,
  speed = 1,
  fragmentSource = DEFAULT_FRAG,
  onShaderError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const buffersRef = useRef<{ vbo: WebGLBuffer | null }>({ vbo: null });
  const uniformsRef = useRef<{ time?: WebGLUniformLocation; resolution?: WebGLUniformLocation }>({});
  const rafRef = useRef<number>(0);

  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = (canvas.getContext("webgl2") as WebGL2RenderingContext) || null;

    if (!gl) {
      setWebglOk(false);
      return;
    }
    setWebglOk(true);
    glRef.current = gl;

    // --- helpers
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(sh) || "Shader compile error";
        gl.deleteShader(sh);
        throw new Error(info);
      }
      return sh;
    };

    const link = (vs: WebGLShader, fs: WebGLShader) => {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(prog) || "Program link error";
        gl.deleteProgram(prog);
        throw new Error(info);
      }
      return prog;
    };

    // try compile
    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;
    let prog: WebGLProgram | null = null;

    try {
      vs = compile(gl.VERTEX_SHADER, DEFAULT_VERT);
      fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      prog = link(vs, fs);
    } catch (err: any) {
      onShaderError?.(String(err?.message || err));
      // fallback to default fragment if custom failed
      if (fragmentSource !== DEFAULT_FRAG) {
        try {
          fs = compile(gl.FRAGMENT_SHADER, DEFAULT_FRAG);
          prog = link(vs!, fs);
        } catch (err2: any) {
          onShaderError?.(String(err2?.message || err2));
          setWebglOk(false);
          return;
        }
      } else {
        setWebglOk(false);
        return;
      }
    }

    programRef.current = prog;
    gl.useProgram(prog);

    // full-screen quad
    const vbo = gl.createBuffer();
    buffersRef.current.vbo = vbo;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const locPos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    uniformsRef.current.time = gl.getUniformLocation(prog, "time")!;
    uniformsRef.current.resolution = gl.getUniformLocation(prog, "resolution")!;

    // DPR-aware size
    const resize = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const cssW = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniformsRef.current.resolution!, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("resize", resize);
    resize();

    // render loop
    let start = performance.now();
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (paused) return;

      const now = (t - start) * 0.001 * (speed || 1);
      gl.useProgram(programRef.current);
      gl.uniform1f(uniformsRef.current.time!, now);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    rafRef.current = requestAnimationFrame(loop);

    // cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", resize);

      if (gl && programRef.current) {
        const p = programRef.current;
        const attachedShaders = gl.getAttachedShaders(p) || [];
        attachedShaders.forEach((s) => gl.deleteShader(s));
        gl.deleteProgram(p);
      }
      if (gl && buffersRef.current.vbo) {
        gl.deleteBuffer(buffersRef.current.vbo);
      }
    };
  }, [fragmentSource, paused, speed, onShaderError]);

  return (
    <div className={className}>
      {!webglOk && (
        <div className="absolute inset-0 grid place-items-center text-center text-neutral-200">
          <div className="max-w-md px-6">
            <h2 className="text-xl font-semibold mb-2">WebGL not supported</h2>
            <p className="text-sm opacity-80">
              Your browser or device doesn't support WebGL 2.0 or the shader failed to compile.
            </p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export { NebulaShader };
```

## REQUIRED — the palette fix

The stock `hue()` macro cycles the full rainbow and will put cyan, green and yellow on screen in the **first frame anyone sees**. That breaks the ECHO palette immediately.

Pass this in via the `fragmentSource` prop. Do not edit `DEFAULT_FRAG` — the component's compile-failure fallback depends on it staying intact.

```ts
export const ECHO_FRAG = `#version 300 es
precision highp float;
/*********
* base shader by Matthias Hurrle (@atzedent)
* palette remapped for ECHO
*/
out vec4 O;
uniform float time;
uniform vec2 resolution;

#define FC gl_FragCoord.xy
#define R  resolution
#define T  time

const vec3 VIOLET  = vec3(0.690, 0.149, 1.000);
const vec3 MAGENTA = vec3(1.000, 0.149, 0.720);
const vec3 AMBER   = vec3(1.000, 0.451, 0.102);

// Violet -> magenta across the cycle, amber only at the extremes.
vec3 hue(float a) {
  float t = .5 + .5 * cos(6.28318 * a);
  vec3 c = mix(VIOLET, MAGENTA, t);
  return mix(c, AMBER, pow(t, 8.) * .4);
}

float rnd(float a) {
  vec2 p = fract(a * vec2(12.9898, 78.233));
  p += dot(p, p*345.);
  return fract(p.x * p.y);
}

vec3 pattern(vec2 uv) {
  vec3 col = vec3(0.);
  for (float i=.0; i++<20.;) {
    float a = rnd(i);
    vec2 n = vec2(a, fract(a*34.56));
    vec2 p = sin(n*(T+7.) + T*.5);
    float d = dot(uv-p, uv-p);
    col += .00125/d * hue(dot(uv,uv) + i*.125 + T);
  }
  return col;
}

void main(void) {
  vec2 uv = (FC - .5 * R) / min(R.x, R.y);
  vec3 col = vec3(0.);
  float s = 2.4;
  float a = atan(uv.x, uv.y);
  float b = length(uv);
  uv = vec2(a * 5. / 6.28318, .05 / tan(b) + T);
  uv = fract(uv) - .5;
  col += pattern(uv * s);
  O = vec4(col, 1.);
}`;
```

The `pow(t, 8.) * .4` term controls how much amber creeps into the brightest cores. Tune by eye.

### ECHO settings

```tsx
<NebulaShader fragmentSource={ECHO_FRAG} speed={0.35} />
```

Slow, so it broods rather than churns. Ramp `speed` and the layer's opacity upward as loading completes and the wordmark resolves out of it. The falling figure from reference image 6 composites **on top of** this shader, not inside it.

The `dpr` cap of 2 in `resize()` can be raised. Do not lower it.

---

# 3. `fluid-particles-background.tsx`

Perlin-noise flow field, 2000 particles, trails via semi-transparent overpaint.

```tsx
"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CyberBackgroundProps {
  children?: React.ReactNode;
  particleCount?: number;
  noiseIntensity?: number;
  particleSize?: { min: number; max: number };
  className?: string;
}

// Helper function for Perlin Noise
function createNoise() {
  const permutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  const p = new Array(512);
  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  function grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return {
    simplex3: (x: number, y: number, z: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;

      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);

      const u = fade(x);
      const v = fade(y);
      const w = fade(z);

      const A = p[X] + Y;
      const AA = p[A] + Z;
      const AB = p[A + 1] + Z;
      const B = p[X + 1] + Y;
      const BA = p[B] + Z;
      const BB = p[B + 1] + Z;

      return lerp(
        w,
        lerp(
          v,
          lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
          lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z)),
        ),
        lerp(
          v,
          lerp(
            u,
            grad(p[AA + 1], x, y, z - 1),
            grad(p[BA + 1], x - 1, y, z - 1),
          ),
          lerp(
            u,
            grad(p[AB + 1], x, y - 1, z - 1),
            grad(p[BB + 1], x - 1, y - 1, z - 1),
          ),
        ),
      );
    },
  };
}

const COLOR_SCHEME = {
  light: {
    particle: {
      color: "rgba(0, 0, 0, 0.07)",
    },
    background: "rgba(255, 255, 255, 0.12)",
  },
  dark: {
    particle: {
      color: "rgba(255, 255, 255, 0.07)",
    },
    background: "rgba(0, 0, 0, 0.12)",
  },
} as const;

interface Particle {
  x: number;
  y: number;
  size: number;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

export const FluidParticlesBackground = ({
  children,
  particleCount = 2000,
  noiseIntensity = 0.003,
  particleSize = { min: 0.5, max: 2 },
  className,
}: CyberBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noise = createNoise();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size:
        Math.random() * (particleSize.max - particleSize.min) +
        particleSize.min,
      velocity: { x: 0, y: 0 },
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 50,
    }));

    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const scheme = isDark ? COLOR_SCHEME.dark : COLOR_SCHEME.light;

      // Clear canvas with a semi-transparent background to create trails
      ctx.fillStyle = scheme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.life += 1;
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }

        const opacity =
          Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.15;

        const n = noise.simplex3(
          particle.x * noiseIntensity,
          particle.y * noiseIntensity,
          Date.now() * 0.0001,
        );

        const angle = n * Math.PI * 4;
        particle.velocity.x = Math.cos(angle) * 2;
        particle.velocity.y = Math.sin(angle) * 2;

        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [particleCount, noiseIntensity, particleSize, noise]);

  return (
    <div
      className={cn(
        "relative w-full h-screen overflow-hidden",
        "bg-white dark:bg-black",
        className,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
```

## REQUIRED — three modifications

As shipped this is a **page wrapper**, not a background. It is `h-screen`, it centres its children, and it will fight every layout in the site. Three changes:

**1. Make it a fixed layer, not a wrapper.** Replace the returned JSX with a single fixed, non-interactive layer behind all content. Drop the `children` prop and the centring wrapper entirely. Mount it once at the app root.

```tsx
return (
  <div
    className={cn(
      "fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black",
      className,
    )}
    style={{ opacity }}
  >
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
  </div>
);
```

**2. Force dark.** Delete the `document.documentElement.classList.contains("dark")` check and the `light` half of `COLOR_SCHEME`. ECHO has no light mode. Hardcode the trail overpaint to `rgba(0, 0, 0, 0.12)`.

**3. Tint the particles violet.** The white fill is wrong. Replace with a violet that varies slightly per particle so the field isn't flat:

```ts
// Assign once at particle creation:
hue: 275 + Math.random() * 35,   // violet -> magenta

// Then in the draw call:
ctx.fillStyle = `hsla(${particle.hue}, 100%, 65%, ${opacity})`;
```

Also add an `opacity` prop so the layer can be modulated per section: near-invisible during the loading screen, strongest during the passage. Drive it from the sequence state machine.

Do not reduce `particleCount` from 2000. Raise it if it looks better.

---

## Filename collision — read this

`galaxy-warp.tsx` and `nebula-shader.tsx` both ship as `light-speed.tsx` and both export `LightSpeed`. If you save them under their original names the second will silently overwrite the first and you will lose the warp tunnel. Rename on save, exactly as above.
