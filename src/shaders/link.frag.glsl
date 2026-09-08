varying vec3 vColor;
varying float vAlpha;

uniform float uLight;

void main() {
  vec3 col = mix(vColor, vColor * 0.4, uLight);
  gl_FragColor = vec4(col, vAlpha * mix(0.75, 0.5, uLight));
}
