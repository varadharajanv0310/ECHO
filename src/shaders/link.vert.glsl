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
  // The figure belongs to the World. Standing at one person it is a set of
  // lines running off the edge of the frame past the thing you came to see, so
  // it fades out as the system fades in.
  float away = 1.0 - smoothstep(1.3, 1.9, uLevel);
  vAlpha = (uLevel > 0.5 ? inGroup : 0.0) * uReveal * away;
}
