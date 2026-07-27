/** Flat normal-to-RGB with saturation + slight hue twist so facets rainbow harder. */
export const normalRgbShader = {
  vertexShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    attribute float loftU;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vLoftU = loftU;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    uniform float uOpacity;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec3 n = normalize(vWorldNormal);
      if (!gl_FrontFacing) n = -n;

      vec3 base = n * 0.5 + 0.5;
      float lum = dot(base, vec3(0.299, 0.587, 0.114));
      base = clamp(mix(vec3(lum), base, 1.55), 0.0, 1.0);

      float hue = fract(atan(n.y, n.x) / 6.2831853 + n.z * 0.25 + 0.55);
      vec3 spectral = hsv2rgb(vec3(hue, 0.85, 1.0));
      vec3 c = mix(base, spectral, 0.55);
      c = c * 0.92 + 0.08;
      gl_FragColor = vec4(c, uOpacity);
    }
  `,
};

/** View-dependent thin-film holographic wash. */
export const holoShader = {
  vertexShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    attribute float loftU;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vLoftU = loftU;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    uniform vec3 uCameraPos;
    uniform float uTime;
    uniform float uOpacity;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec3 n = normalize(vWorldNormal);
      if (!gl_FrontFacing) n = -n;
      vec3 v = normalize(uCameraPos - vWorldPos);
      float ndv = abs(dot(n, v));
      float fresnel = pow(1.0 - ndv, 2.2);

      float phase =
        vWorldPos.x * 0.22
        + vWorldPos.y * 0.16
        + n.x * 0.35
        + n.y * 0.2
        + fresnel * 0.85
        + uTime * 0.04;
      float hue = fract(0.82 + phase);
      vec3 core = hsv2rgb(vec3(hue, 0.88, 0.98));
      vec3 rim = hsv2rgb(vec3(fract(hue + 0.22 + fresnel * 0.15), 0.75, 1.0));
      vec3 col = mix(core, rim, smoothstep(0.15, 0.95, fresnel));
      col = mix(col, hsv2rgb(vec3(fract(phase * 1.7 + 0.35), 0.7, 1.0)), 0.25 * (1.0 - ndv));
      col += vec3(1.0) * pow(fresnel, 3.5) * 0.4;
      gl_FragColor = vec4(col, uOpacity);
    }
  `,
};

/**
 * Hybrid default: normalRGB × thin-film.
 * flatness↑ → more foil + magenta core; flatness↓ → more facet color + green center bias.
 */
export const hybridShader = {
  vertexShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    attribute float loftU;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vLoftU = loftU;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying float vLoftU;
    uniform vec3 uCameraPos;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uFilmMix;
    uniform float uFlatness;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec3 n = normalize(vWorldNormal);
      if (!gl_FrontFacing) n = -n;
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      float ndv = abs(dot(n, viewDir));
      float fresnel = pow(1.0 - ndv, 2.2);

      // --- normalRGB branch ---
      vec3 base = n * 0.5 + 0.5;
      float lum = dot(base, vec3(0.299, 0.587, 0.114));
      base = clamp(mix(vec3(lum), base, 1.55), 0.0, 1.0);
      float nHue = fract(atan(n.y, n.x) / 6.2831853 + n.z * 0.25 + 0.55);
      vec3 spectral = hsv2rgb(vec3(nHue, 0.85, 1.0));
      vec3 normalCol = mix(base, spectral, 0.55) * 0.92 + 0.08;

      // Bar bias: pull center face toward lime/cyan-green when volumetric
      float centerMask = 1.0 - smoothstep(0.22, 0.55, abs(vLoftU - 0.5));
      float barBias = (1.0 - uFlatness) * centerMask;
      vec3 greenCenter = hsv2rgb(vec3(0.38, 0.78, 0.95));
      normalCol = mix(normalCol, greenCenter, barBias * 0.55);

      // --- thin-film branch ---
      float phase =
        vWorldPos.x * 0.22
        + vWorldPos.y * 0.16
        + n.x * 0.35
        + n.y * 0.2
        + fresnel * 0.85
        + uTime * 0.04
        + vLoftU * 0.15;
      // Card: magenta core (~0.82–0.92 hue); bar: allow green mid
      float cardHue = fract(0.84 + phase * 0.35 + vWorldPos.y * 0.08);
      float barHue = fract(0.42 + phase * 0.55 + (vLoftU - 0.5) * 0.4);
      float hue = mix(barHue, cardHue, uFlatness);
      vec3 core = hsv2rgb(vec3(hue, mix(0.75, 0.9, uFlatness), 0.98));
      vec3 rim = hsv2rgb(vec3(fract(hue + 0.2 + fresnel * 0.12), 0.72, 1.0));
      vec3 film = mix(core, rim, smoothstep(0.12, 0.92, fresnel));
      film = mix(film, hsv2rgb(vec3(fract(phase * 1.6 + 0.3), 0.68, 1.0)), 0.22 * (1.0 - ndv));
      film += vec3(1.0) * pow(fresnel, 3.5) * 0.35;

      vec3 col = mix(normalCol, film, clamp(uFilmMix, 0.0, 1.0));
      gl_FragColor = vec4(col, uOpacity);
    }
  `,
};
