attribute float aScale;
attribute float aSeed;
attribute vec3 aColor;

uniform float uTime;
uniform float uSize;
uniform float uSpin;
uniform float uHover;   // 0-1, cursor proximity
uniform float uReveal;  // 0-1, how much the galaxy has resolved
uniform float uDive;    // 0-1, the dive

varying vec3 vColor;
varying float vFade;

void main() {
  vec3 pos = position;

  float r = length(pos.xz);

  // Differential rotation. The core turns faster than the arms, which is what
  // makes the arms trail rather than the whole thing spinning like a disc.
  float ang = uTime * uSpin * (1.6 / (r + 1.2));
  float c = cos(ang), s = sin(ang);
  pos.xz = mat2(c, -s, s, c) * pos.xz;

  // Cursor proximity lifts the disc and loosens the arms. The galaxy notices.
  float breathe = sin(uTime * 0.7 + aSeed * 6.28) * 0.5 + 0.5;
  pos *= 1.0 + uHover * (0.05 + breathe * 0.05);
  pos.y += uHover * breathe * 0.06 * (1.0 - r * 0.1);

  // The dive stretches the field along the view axis.
  pos.z -= uDive * (2.0 + aSeed * 6.0);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.7 + 0.3 * sin(uTime * 1.9 + aSeed * 40.0);
  gl_PointSize = uSize * aScale * twinkle * (1.0 + uHover * 0.35);
  gl_PointSize *= 1.0 / -mv.z;

  vColor = aColor;
  // Stars nearest the core resolve first, so the galaxy ignites outward.
  vFade = smoothstep(0.0, 1.0, uReveal * 1.8 - r * 0.12) * twinkle;
}
