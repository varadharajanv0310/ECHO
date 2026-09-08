attribute float aSize;
attribute float aSeed;
attribute float aIndex;
attribute vec3 aColor;
/** 0 = constellation core, 1 = star, 2 = planet. */
attribute float aKind;
/** Which constellation this belongs to. */
attribute float aGroup;
/** Which star this belongs to (planets only). */
attribute float aStar;
/** Orbit: radius, phase, speed, tilt. Only meaningful for planets. */
attribute vec4 aOrbit;
/** World position of the star a planet orbits. */
attribute vec3 aAnchor;

uniform float uTime;
uniform float uScale;
uniform float uLevel;   // 0 cluster, 1 constellation, 2 star
uniform float uGroup;   // focused constellation, -1 for none
uniform float uStar;    // focused star, -1 for none
uniform float uHover;
uniform float uReveal;
uniform float uLight;   // 1 in light mode

varying vec3 vColor;
varying float vAlpha;
varying float vLight;

void main() {
  vec3 pos = position;

  // Planets are not placed, they orbit. Position is derived every frame from
  // the star they belong to, so a person's things move around them.
  if (aKind > 1.5) {
    float a = aOrbit.y + uTime * aOrbit.z;
    vec3 o = vec3(cos(a) * aOrbit.x, sin(a) * aOrbit.x * aOrbit.w, sin(a) * aOrbit.x);
    pos = aAnchor + o;
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.78 + 0.22 * sin(uTime * (0.4 + aSeed * 0.8) + aSeed * 30.0);

  // Visibility is a function of where you are. Everything exists in one space
  // at all times; what changes is what is worth looking at.
  float inGroup = 1.0 - step(0.5, abs(aGroup - uGroup));
  float inStar = 1.0 - step(0.5, abs(aStar - uStar));

  float show = 0.0;
  float size = aSize;

  if (aKind < 0.5) {
    // Constellation cores: the whole sky at cluster level, and only the one
    // you are inside once you are inside it.
    show = uLevel < 0.5 ? 1.0 : inGroup * 0.55;
    size *= uLevel < 0.5 ? 1.0 : 0.22;
  } else if (aKind < 1.5) {
    // Stars: a faint dust from outside, individuals once you are in.
    show = uLevel < 0.5 ? 0.16 : inGroup;
    if (uLevel > 1.5) show *= inStar > 0.5 ? 1.0 : 0.28;
    size *= uLevel < 0.5 ? 0.55 : 1.0;
  } else {
    // Planets exist only for the star you are standing at.
    show = uLevel > 1.5 ? inStar : 0.0;
  }

  float hovered = (1.0 - step(0.5, abs(uHover - aIndex)));

  gl_PointSize = size * uScale * twinkle * (1.0 + hovered * 0.7) / -mv.z;

  vColor = mix(aColor, vec3(1.0), hovered * 0.45);
  vAlpha = show * twinkle * uReveal * (1.0 + hovered * 0.8);
  vLight = uLight;
}
