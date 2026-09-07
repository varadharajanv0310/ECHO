#version 300 es
precision highp float;

/**
 * The loading field.
 *
 * Three layers, mixed by uniform so the same shader carries both the brooding
 * void of beat 1 and the surge of beat 2:
 *
 *   stars   screen-space, three densities, slow twinkle. Not warped - stars
 *           do not bend, and warping them was what made the first version
 *           read as a lens flare rather than a sky.
 *   cloud   domain-warped fbm, violet through magenta with hot pink cores,
 *           shaped by a falloff biased below centre. This is the body of the
 *           reference image and it was entirely missing before.
 *   lights  the original polar-warped point-light field, kept low in the void
 *           and brought up for the reveal, where it becomes the light bursting
 *           out from behind the wordmark.
 *
 * Writes premultiplied alpha so the particle layer and the void show through.
 */

out vec4 O;

uniform float time;
uniform vec2 resolution;
uniform float intensity; // master
uniform float cloud;     // nebula cloud amount
uniform float lights;    // polar point-light amount
uniform float starAmt;   // starfield amount
uniform float warpAmt;   // tunnel tightness of the polar warp
uniform float riseAmt;   // 0 = even, 1 = light gathers toward the bottom edge

#define FC gl_FragCoord.xy
#define R resolution
#define T time

const vec3 VIOLET = vec3(0.690, 0.149, 1.000);
const vec3 VIOLET_DEEP = vec3(0.310, 0.024, 0.973);
const vec3 MAGENTA = vec3(1.000, 0.149, 0.720);
const vec3 PINK_HOT = vec3(1.000, 0.451, 0.780);
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

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1, 0));
  float c = hash21(i + vec2(0, 1));
  float d = hash21(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0., a = .5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) {
    v += a * vnoise(p);
    p = m * p;
    a *= .5;
  }
  return v;
}

/* ------------------------------------------------------------------ stars */

vec3 starfield(vec2 uv) {
  vec3 c = vec3(0.);
  for (float k = 0.; k < 3.; k++) {
    float scale = 46. + k * 78.;
    vec2 gp = uv * scale;
    vec2 id = floor(gp);
    vec2 f = fract(gp) - .5;

    float h = hash21(id + k * 37.13);
    if (h < .82) continue;

    vec2 off = (vec2(hash21(id + 11.7), hash21(id + 23.9)) - .5) * .68;
    float d = length(f - off);

    float core = smoothstep(.055, .0, d);
    float halo = smoothstep(.22, .0, d) * .16;
    float tw = .55 + .45 * sin(T * 1.7 + h * 63.);

    vec3 tint = mix(vec3(.72, .78, 1.), vec3(1., .82, .93), hash21(id + 5.3));
    c += (core + halo) * tw * tint * (.5 + .8 * h);
  }
  return c;
}

/* ------------------------------------------------------------------ cloud */

vec3 nebulaCloud(vec2 uv) {
  vec2 p = uv * 1.55;
  p += vec2(T * .011, -T * .0065);

  // Domain warping - fbm fed through fbm - is what gives the billowing,
  // filament-y structure instead of smooth blobs.
  vec2 q = vec2(fbm(p + vec2(1.7, 9.2)), fbm(p + vec2(8.3, 2.8)));
  float n1 = fbm(p * 1.35 + q * 1.15);
  float n2 = fbm(p * 2.7 - q * .85 + 4.1);

  // The mass sits just below centre, as in the reference.
  vec2 c = uv - vec2(0.02, -0.10);
  float falloff = exp(-dot(c, c) * 2.35);

  float d1 = pow(max(n1, 0.), 2.1) * falloff;
  float d2 = pow(max(n2, 0.), 2.9) * falloff;

  vec3 col = VIOLET_DEEP * d1 * 1.55;
  col += VIOLET * d1 * d2 * 3.4;
  col += MAGENTA * pow(d2, 1.35) * 2.1;
  col += PINK_HOT * pow(d2, 3.4) * 3.2;
  return col;
}

/* ----------------------------------------------------------- point lights */

vec3 pattern(vec2 uv) {
  vec3 col = vec3(0.);
  for (float i = .0; i++ < 20.;) {
    float a = rnd(i);
    vec2 n = vec2(a, fract(a * 34.56));
    vec2 p = sin(n * (T + 7.) + T * .5);
    float d = dot(uv - p, uv - p);
    // The epsilon softens the singularity at each light. Without it the polar
    // warp turns every point into a hard lens flare.
    col += .0019 / (d + .014) * hue(dot(uv, uv) + i * .125 + T);
  }
  return col;
}

void main(void) {
  vec2 uv = (FC - .5 * R) / min(R.x, R.y);
  vec3 col = vec3(0.);

  col += starfield(uv) * starAmt;
  col += nebulaCloud(uv) * cloud;

  if (lights > .001) {
    float a = atan(uv.x, uv.y);
    float b = length(uv);
    vec2 p = vec2(a * 5. / 6.28318, warpAmt / tan(b) + T);
    p = fract(p) - .5;
    col += pattern(p * 2.4) * lights;
  }

  // Violet bleeding up from below and behind the figure (Beat 2).
  float ny = FC.y / R.y;
  col *= mix(1.0, mix(1.45, 0.5, ny), riseAmt);

  col *= intensity;

  float lum = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  O = vec4(col, lum);
}
