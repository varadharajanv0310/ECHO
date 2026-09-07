#version 300 es
precision highp float;

/**
 * Base shader by Matthias Hurrle (@atzedent).
 * Palette remapped for ECHO, and made compositable.
 *
 * Two departures from the stock shader:
 *
 * 1. hue() no longer cycles the full rainbow. The stock macro puts cyan and
 *    green on screen in the first frame anyone sees. This stays inside violet
 *    through magenta, with amber only creeping into the brightest cores.
 *
 * 2. It writes premultiplied alpha instead of an opaque black rectangle, so
 *    the particle field and the void can show through underneath it. Without
 *    this the "persistent background layer" is invisible for the whole of
 *    beats 1 and 2, and the handoff out of the loading screen has to be a cut.
 */

out vec4 O;

uniform float time;
uniform vec2 resolution;
uniform float intensity; // master brightness - ramps as loading completes
uniform float warpAmt;   // tunnel tightness of the polar warp
uniform float riseAmt;   // 0 = even, 1 = light gathers toward the bottom edge

#define FC gl_FragCoord.xy
#define R resolution
#define T time

const vec3 VIOLET = vec3(0.690, 0.149, 1.000);
const vec3 MAGENTA = vec3(1.000, 0.149, 0.720);
const vec3 AMBER = vec3(1.000, 0.451, 0.102);

vec3 hue(float a) {
  float t = .5 + .5 * cos(6.28318 * a);
  vec3 c = mix(VIOLET, MAGENTA, t);
  return mix(c, AMBER, pow(t, 8.) * .4);
}

float rnd(float a) {
  vec2 p = fract(a * vec2(12.9898, 78.233));
  p += dot(p, p * 345.);
  return fract(p.x * p.y);
}

vec3 pattern(vec2 uv) {
  vec3 col = vec3(0.);
  for (float i = .0; i++ < 20.;) {
    float a = rnd(i);
    vec2 n = vec2(a, fract(a * 34.56));
    vec2 p = sin(n * (T + 7.) + T * .5);
    float d = dot(uv - p, uv - p);
    // The epsilon softens the singularity at each light. Without it the polar
    // warp turns every point into a hard lens flare; with it they read as
    // overlapping clouds, which is what the loading reference actually is.
    col += .0019 / (d + .014) * hue(dot(uv, uv) + i * .125 + T);
  }
  return col;
}

void main(void) {
  vec2 uv = (FC - .5 * R) / min(R.x, R.y);
  vec3 col = vec3(0.);

  float s = 2.4;
  float a = atan(uv.x, uv.y);
  float b = length(uv);

  vec2 p = vec2(a * 5. / 6.28318, warpAmt / tan(b) + T);
  p = fract(p) - .5;
  col += pattern(p * s);

  // Violet bleeding up from below and behind the figure (Beat 2).
  float ny = FC.y / R.y;
  col *= mix(1.0, mix(1.45, 0.5, ny), riseAmt);

  col *= intensity;

  float lum = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  O = vec4(col, lum);
}
