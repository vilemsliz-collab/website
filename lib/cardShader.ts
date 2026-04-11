export const vert = /* glsl */ `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const frag = /* glsl */ `
  uniform sampler2D u_map;
  uniform sampler2D u_text;      // text overlay (canvas texture, pre-multiplied alpha)
  uniform float     u_opacity;
  uniform vec2      u_uvScale;   // object-fit: cover scale  (default 1,1)
  uniform vec2      u_uvOffset;  // object-fit: cover offset (default 0,0)

  varying vec2 v_uv;

  // Rounded corners — 32px radius on 364×555 card
  const float RX = 0.0879;   // 32 / 364
  const float RY = 0.0577;   // 32 / 555

  void main() {
    // ── Rounded corner discard ───────────────────────────────
    vec2 abs_uv = abs(v_uv - 0.5);
    if (abs_uv.x > (0.5 - RX) && abs_uv.y > (0.5 - RY)) {
      float nx = (abs_uv.x - (0.5 - RX)) / RX;
      float ny = (abs_uv.y - (0.5 - RY)) / RY;
      if (nx * nx + ny * ny > 1.0) discard;
    }

    // ── Texture sample with cover UV transform ───────────────
    vec2 uv  = v_uv * u_uvScale + u_uvOffset;
    vec4 tex = texture2D(u_map, uv);

    // ── Bottom gradient (darkens bottom for text legibility) ─
    float t = 1.0 - v_uv.y;
    vec3 col = mix(tex.rgb, vec3(0.0), t * t * 0.55);

    // ── Text overlay (alpha-composite over gradient) ─────────
    vec4 txt = texture2D(u_text, v_uv);
    col = mix(col, txt.rgb, txt.a);

    gl_FragColor = vec4(col, tex.a * u_opacity);
  }
`
