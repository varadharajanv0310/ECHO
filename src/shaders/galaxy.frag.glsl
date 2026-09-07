varying vec3 vColor;
varying float vFade;

uniform float uOpacity;

/**
 * Soft point sprite. Two falloffs stacked - a tight core and a wide halo - so
 * bright stars bleed into black rather than stopping at a hard circular edge,
 * which is the difference between a galaxy and a field of dots.
 */
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float f = max(1.0 - d * 2.0, 0.0);
  float core = pow(f, 2.2);
  float halo = pow(f, 0.9) * 0.3;

  // Additive blending already scales colour by alpha. Folding the falloff into
  // the colour as well squares it, which leaves every point a near-invisible
  // pinprick and the whole galaxy a smudge.
  // 140k additive sprites overlap hard toward the core; without pulling the
  // per-point contribution down the centre clips to flat white.
  float a = (core + halo) * vFade * uOpacity * 0.10;
  gl_FragColor = vec4(vColor, a);
}
