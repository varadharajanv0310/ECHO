varying vec2 vUv;

/**
 * Full-screen pass. Position is written straight to clip space, so the quad
 * fills the viewport regardless of where the camera is or what else is in the
 * scene - which matters because this canvas also has to hold the galaxy, the
 * warp and the constellation later.
 */
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
