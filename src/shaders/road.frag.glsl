varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uScroll; // 0-1 across the whole passage
uniform float uNarrow; // 0-1, the passage constricting toward the end
uniform float uFade;   // master opacity, so the road can arrive and leave
uniform float uDest;   // brightness of the thing at the end of the road
uniform float uBoost;  // live exposure, tuned by eye
uniform float uLight;  // 1 in light mode

const vec3 VIOLET = vec3(0.690, 0.149, 1.000);
const vec3 VIOLET_DEEP = vec3(0.310, 0.024, 0.973);
const vec3 MAGENTA = vec3(1.000, 0.149, 0.720);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 stars(vec2 p) {
  vec3 c = vec3(0.0);
  for (float k = 0.0; k < 2.0; k += 1.0) {
    float scale = 52.0 + k * 84.0;
    vec2 gp = p * scale;
    vec2 id = floor(gp);
    vec2 f = fract(gp) - 0.5;
    float h = hash21(id + k * 31.7);
    if (h < 0.85) continue;
    vec2 off = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * 0.6;
    float d = length(f - off);
    float tw = 0.6 + 0.4 * sin(uTime * 1.4 + h * 51.0);
    c += smoothstep(0.05, 0.0, d) * tw * mix(vec3(0.74, 0.8, 1.0), vec3(1.0, 0.84, 0.94), hash21(id + 2.2));
  }
  return c;
}

/**
 * The road.
 *
 * Below the horizon the screen is reprojected onto a ground plane by dividing
 * by distance from the horizon line - the standard perspective divide, which
 * is what makes the streaks rush at the camera and converge to a point rather
 * than merely scrolling. Travel is driven by scroll, so the road only moves
 * when a person moves it.
 *
 * The noise is sampled with a strongly anisotropic scale: compressed across
 * the road, stretched along it. That is what turns cloud into lanes of light,
 * the same trick as the anisotropic blur on the wordmark bleed - and it is
 * literally the same light, since the road is where the bleed goes.
 */
void main() {
  vec2 p = vUv - 0.5;
  p.x *= uRes.x / uRes.y;

  float horizonY = 0.07;
  float travel = uTime * 0.05 + uScroll * 9.0;

  vec3 col = vec3(0.0);

  // ------------------------------------------------------------------ sky
  if (p.y > horizonY) {
    col += stars(p) * 0.85;
    float haze = fbm(p * 2.2 + vec2(uTime * 0.008, 0.0));
    col += VIOLET_DEEP * pow(max(haze - 0.35, 0.0), 2.0) * 1.1;
  }

  // --------------------------------------------------------------- ground
  float hy = horizonY - p.y;
  if (hy > 0.0015) {
    // Perspective divide. z is world distance; at the bottom of the frame it
    // is close to 1 and it runs away to infinity at the horizon.
    float z = 1.0 / hy;
    float narrow = mix(1.0, 3.4, uNarrow);
    vec2 g = vec2(p.x * z * narrow, z + travel);

    // Compressed across the road, stretched along it: cloud becomes lanes.
    float n1 = fbm(vec2(g.x * 0.55, g.y * 0.16));
    float n2 = fbm(vec2(g.x * 1.15 + 11.0, g.y * 0.34 - travel * 0.2));
    float ridge = pow(max(n1 * 0.75 + n2 * 0.6 - 0.34, 0.0), 2.0);

    float fog = exp(-z * 0.05);
    float lane = exp(-abs(p.x) * z * 0.10);
    // The passage constricting also calms it: the last line has to be read.
    float b = ridge * fog * lane * 5.6 * (1.0 - uNarrow * 0.62);

    col += VIOLET_DEEP * b * 1.5;
    col += VIOLET * pow(b, 1.35) * 2.0;
    col += MAGENTA * pow(b, 2.2) * 2.3;
    col += vec3(1.0) * pow(b, 4.5) * 1.15;

    // A wet sheen close to camera, so the road reads as liquid rather than fog.
    float sheen = exp(-z * 0.5) * pow(max(n2 - 0.4, 0.0), 1.5) * 1.7 * (1.0 - uNarrow * 0.7);
    col += mix(VIOLET, MAGENTA, 0.5) * sheen;
  }

  // -------------------------------------------------------------- horizon
  float band = exp(-abs(p.y - horizonY) * 30.0);
  col += mix(VIOLET, vec3(1.0), 0.35) * band * (0.18 + uScroll * 0.45);

  // The destination, brightening as the road runs out.
  float d = length(vec2(p.x * 1.5, (p.y - horizonY) * 2.4));
  col += mix(VIOLET, vec3(1.0), 0.45) * exp(-d * 7.5) * uDest;
  col += MAGENTA * exp(-d * 2.6) * uDest * 0.35;

  float lum = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);

  // Light mode is not the same picture with the colours swapped. On paper the
  // road is pigment: the same shapes, but the brightest parts are the darkest
  // ink and the whole thing is laid down with normal alpha instead of added.
  // Inverting the finished frame gives a washed grey; this keeps the hues.
  vec3 ink = mix(col / max(lum, 0.001), vec3(1.0), 0.15) * 0.42;
  vec3 outCol = mix(col, ink, uLight);
  float outA = mix(lum, clamp(lum * 1.25, 0.0, 0.92), uLight);

  gl_FragColor = vec4(outCol * uFade * uBoost, outA * uFade * uBoost);
}
