export const vert = /* glsl */ `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const frag = /* glsl */ `
  uniform sampler2D u_map;
  uniform float     u_opacity;
  uniform float     u_active;    // 1.0 = this is the active card
  uniform vec2      u_tilt;      // (tiltRy/max,  -tiltRx/max)  −1..1
  uniform float     u_intensity;
  uniform float     u_size;      // specular radius in %  (0..100)
  uniform float     u_travel;    // light-position travel  (0..120)
  uniform float     u_diffuse;
  uniform float     u_shadow;

  varying vec2 v_uv;

  void main() {
    vec4 tex = texture2D(u_map, v_uv);

    // Gradient overlay (replaces the cardOverlay div)
    float t = 1.0 - v_uv.y;
    vec3  col = mix(tex.rgb, vec3(0.0), t * t * 0.55);

    if (u_active < 0.5) {
      gl_FragColor = vec4(col, tex.a * u_opacity);
      return;
    }

    float nx  = u_tilt.x;
    float ny  = u_tilt.y;
    float mag = min(length(vec2(nx, ny)), 1.0);

    if (mag < 0.015) {
      gl_FragColor = vec4(col, tex.a * u_opacity);
      return;
    }

    // ── Specular highlight (radial) ──────────────────────────
    float hx = clamp(0.5 - nx * u_travel * 0.01, 0.0, 1.0);
    float hy = clamp(0.5 + ny * u_travel * 0.01, 0.0, 1.0);
    vec2  lp = vec2(hx, hy);

    float d    = distance(v_uv, lp);
    float r    = u_size * 0.005;           // 52 → 0.26 UV units

    float peak = u_intensity * mag;
    float mid  = u_intensity * 0.12 * mag;
    float spec = 0.0;
    if (d < r) {
      float s = d / r;                     // 0 at centre, 1 at edge
      spec = s < 0.45
        ? mix(peak, mid,  s / 0.45)
        : mix(mid,  0.0, (s - 0.45) / 0.27);
    }

    // ── Diffuse + shadow (directional) ───────────────────────
    float litA = atan(-nx, -ny);           // matches CSS atan2(-nx,-ny)
    vec2  litV = vec2(cos(litA), sin(litA));
    vec2  fdir = v_uv - 0.5;
    float flen = length(fdir);
    vec2  fnorm = flen > 0.001 ? fdir / flen : vec2(0.0);

    float dp   = dot(fnorm, litV);
    float fade = 1.0 - min(flen * 2.0 / 0.55, 1.0);  // 55 % falloff

    float diff = max(0.0,  dp) * u_diffuse * mag * fade;
    float shad = max(0.0, -dp) * u_shadow  * mag * fade;

    col += vec3(spec + diff);
    col -= vec3(shad);
    col  = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, tex.a * u_opacity);
  }
`
