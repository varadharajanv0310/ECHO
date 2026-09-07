attribute float aSize;
attribute float aSeed;
attribute float aIndex;
attribute vec3 aColor;
attribute float aFade;

uniform float uTime;
uniform float uScale;
uniform float uReveal;
uniform float uHovered;
uniform float uHoverIndex;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  // Signals breathe at their own rate. Nothing here is synchronised, because
  // nothing here is scheduled.
  float pulse = 0.82 + 0.18 * sin(uTime * (0.5 + aSeed) + aSeed * 22.0);

  // An index attribute rather than gl_VertexID: that is GLSL ES 3.0 only, and
  // three compiles ShaderMaterial as GLSL1 by default.
  float hovered = (1.0 - step(0.5, abs(uHoverIndex - aIndex))) * uHovered;

  gl_PointSize = aSize * uScale * pulse * (1.0 + hovered * 0.9) / -mv.z;

  vColor = mix(aColor, vec3(1.0), hovered * 0.5);
  vAlpha = aFade * pulse * uReveal * (1.0 + hovered * 1.2);
}
