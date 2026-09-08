attribute float aStar;
attribute vec3 aColor;

uniform float uLevel;   // 0 cluster, 1 constellation, 2 star
uniform float uStar;    // the person you are standing at
uniform float uReveal;

varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // Only the system you are inside. Every orbit in the sky drawn at once is a
  // ball of wire, and from any distance the rings are smaller than the noise
  // in the starfield anyway.
  float mine = 1.0 - step(0.5, abs(aStar - uStar));
  vColor = aColor;
  vAlpha = mine * smoothstep(1.4, 1.95, uLevel) * uReveal;
}
