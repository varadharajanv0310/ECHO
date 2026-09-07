"use client";

import { useEffect, useRef } from "react";
import ECHO_FRAG from "@/shaders/echo-nebula.frag.glsl";
import { damp } from "@/lib/utils";

const VERT = `#version 300 es
precision highp float;
in vec2 position;
void main(){
  gl_Position = vec4(position, 0.0, 1.0);
}`;

type Props = {
  className?: string;
  paused?: boolean;
  /** Time multiplier. Slow (0.3-0.5) so it broods rather than churns. */
  speed?: number;
  /** Master brightness. Ramped from the sequence, not baked in. */
  intensity?: number;
  /** Nebula cloud amount - the body of the loading image. */
  cloud?: number;
  /** Polar point-light field amount. Low in the void, high for the reveal. */
  lights?: number;
  /** Starfield amount. */
  starAmt?: number;
  /** Tunnel tightness of the polar warp. */
  warpAmt?: number;
  /** 0 = even field, 1 = light gathers toward the bottom edge. */
  riseAmt?: number;
  fragmentSource?: string;
  /** How fast the animated uniforms chase their targets. */
  responsiveness?: number;
  onShaderError?: (err: string) => void;
};

/**
 * Raw WebGL2 point-light field, polar warped.
 *
 * Every animated prop is mirrored into a ref and read inside the render loop.
 * The stock component listed them as effect dependencies, which recompiled and
 * relinked the whole program on every change - unusable for ramping intensity
 * frame by frame, which is exactly what the loading sequence needs.
 */
export function NebulaShader({
  className = "absolute inset-0",
  paused = false,
  speed = 0.35,
  intensity = 1,
  cloud = 1,
  lights = 0.35,
  starAmt = 1,
  warpAmt = 0.05,
  riseAmt = 0,
  fragmentSource = ECHO_FRAG,
  responsiveness = 1.6,
  onShaderError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Props are targets. The loop chases them, so a phase change eases the
  // field open instead of snapping it, and nothing here re-renders per frame.
  const live = useRef({
    paused, speed, intensity, cloud, lights, starAmt, warpAmt, riseAmt, responsiveness,
  });
  live.current = {
    paused, speed, intensity, cloud, lights, starAmt, warpAmt, riseAmt, responsiveness,
  };

  const errRef = useRef(onShaderError);
  errRef.current = onShaderError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(sh) || "shader compile error";
        gl.deleteShader(sh);
        throw new Error(info);
      }
      return sh;
    };

    let program: WebGLProgram;
    try {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "program link error");
      }
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    } catch (e) {
      errRef.current?.(String(e instanceof Error ? e.message : e));
      return;
    }

    gl.useProgram(program);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(program, "time"),
      resolution: gl.getUniformLocation(program, "resolution"),
      intensity: gl.getUniformLocation(program, "intensity"),
      cloud: gl.getUniformLocation(program, "cloud"),
      lights: gl.getUniformLocation(program, "lights"),
      starAmt: gl.getUniformLocation(program, "starAmt"),
      warpAmt: gl.getUniformLocation(program, "warpAmt"),
      riseAmt: gl.getUniformLocation(program, "riseAmt"),
    };

    // Premultiplied source-over. The shader writes light; wherever it writes
    // nothing, whatever is underneath survives.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      // Uncapped device pixel ratio. The grain is applied at screen density on
      // a layer above this, so the shader wants every pixel it can get.
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("resize", resize);
    resize();

    // Wall-clock time advanced by the live speed, so changing speed bends the
    // animation forward from where it is rather than jumping.
    let raf = 0;
    let last = performance.now();
    let shaderTime = 0;

    const cur = {
      speed: live.current.speed,
      intensity: live.current.intensity,
      cloud: live.current.cloud,
      lights: live.current.lights,
      starAmt: live.current.starAmt,
      warpAmt: live.current.warpAmt,
      riseAmt: live.current.riseAmt,
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const s = live.current;
      if (s.paused) return;

      const k = s.responsiveness;
      cur.speed = damp(cur.speed, s.speed, k, dt);
      cur.intensity = damp(cur.intensity, s.intensity, k, dt);
      cur.cloud = damp(cur.cloud, s.cloud, k, dt);
      cur.lights = damp(cur.lights, s.lights, k, dt);
      cur.starAmt = damp(cur.starAmt, s.starAmt, k, dt);
      cur.warpAmt = damp(cur.warpAmt, s.warpAmt, k, dt);
      cur.riseAmt = damp(cur.riseAmt, s.riseAmt, k, dt);

      shaderTime += dt * cur.speed;

      gl.useProgram(program);
      gl.uniform1f(u.time, shaderTime);
      gl.uniform1f(u.intensity, cur.intensity);
      gl.uniform1f(u.cloud, cur.cloud);
      gl.uniform1f(u.lights, cur.lights);
      gl.uniform1f(u.starAmt, cur.starAmt);
      gl.uniform1f(u.warpAmt, cur.warpAmt);
      gl.uniform1f(u.riseAmt, cur.riseAmt);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(program);
    };
  }, [fragmentSource]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

export default NebulaShader;
