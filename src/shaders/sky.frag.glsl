varying vec3 vColor;
varying float vAlpha;
varying float vLight;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float f = max(1.0 - d * 2.0, 0.0);
  float core = pow(f, 2.6);
  float halo = pow(f, 0.85) * 0.4;
  float a = (core + halo) * vAlpha;

  // Dark mode adds light to a black sky. Light mode lays ink on paper, so the
  // colour is darkened rather than emitted and the material blends normally
  // instead of additively - otherwise every star is invisible on white.
  vec3 col = mix(vColor, vColor * 0.42, vLight);
  gl_FragColor = vec4(col, mix(a * 0.85, min(a * 1.4, 1.0), vLight));
}
