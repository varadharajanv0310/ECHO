attribute float aGroup;
attribute vec3 aColor;

uniform float uLevel;
uniform float uGroup;
uniform float uReveal;

varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float inGroup = 1.0 - step(0.5, abs(aGroup - uGroup));
  // Figures are only drawn for the World you are standing in. Drawn everywhere
  // at once they are the thing that made the old sky unreadable.
  vColor = aColor;
  vAlpha = (uLevel > 0.5 ? inGroup : 0.0) * uReveal;
}
