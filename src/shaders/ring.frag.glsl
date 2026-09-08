varying vec3 vColor;
varying float vAlpha;

uniform float uLight;

void main() {
  // Faint on purpose. The ring is there to say a thing is going around
  // something, not to be looked at.
  vec3 col = mix(vColor, vColor * 0.45, uLight);
  gl_FragColor = vec4(col, vAlpha * mix(0.26, 0.34, uLight));
}
