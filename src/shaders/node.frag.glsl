varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float f = max(1.0 - d * 2.0, 0.0);
  float core = pow(f, 2.6);
  float halo = pow(f, 0.8) * 0.4;

  gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
}
