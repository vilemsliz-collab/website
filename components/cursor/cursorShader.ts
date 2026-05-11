// ── WebGL2 cursor shader — polynomial blob vapor ─────────────────────────────
// 8 particles orbiting in a ring, animated by time in GLSL.
// Very low alpha — almost-transparent vapor that reacts to velocity.
// Polynomial blob kernel from orbs-v5: t = 1 - |d|²/(4r²); b = t³

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_vel;       // screen px/frame, y-down
uniform vec2  u_res;       // canvas size in physical px
uniform float u_invert;
uniform float u_ring_r;    // particle orbit radius (UV, default 0.21)
uniform float u_blob_r;    // particle influence radius (UV, default 0.22)
uniform float u_rot_speed; // ring rotation speed (default 0.38)
uniform float u_alpha_scale; // alpha multiplier (default 1.0)

out vec4 out_color;

const float PI = 3.14159265;
const int   N  = 8;

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = uv - 0.5;
  p.x    *= u_res.x / max(u_res.y, 1.0);   // aspect-correct

  // ── Velocity lean: cluster shifts toward leading wall ──────────────────────
  float speed = length(u_vel);
  vec2  vdir  = speed > 0.5 ? normalize(u_vel) : vec2(0.0);
  float lean  = clamp(speed * 0.009, 0.0, 0.24);
  // Flip y: screen y-down vs GL y-up
  vec2  center = vec2(vdir.x, -vdir.y) * lean;

  // ── 8-particle polynomial blob field ──────────────────────────────────────
  float f    = 0.0;
  vec2  grad = vec2(0.0);
  float ir2  = 1.0 / (u_blob_r * u_blob_r);
  float rot  = u_time * u_rot_speed;

  for (int i = 0; i < N; i++) {
    float fi   = float(i);
    float a    = fi * (2.0 * PI / float(N)) + rot;
    // Per-particle breathing so the ring feels organic
    float r    = u_ring_r + 0.045 * sin(rot * 1.6 + fi * 1.13);
    vec2  pos  = center + vec2(cos(a), sin(a)) * r;

    vec2  d    = p - pos;
    float t    = 1.0 - dot(d, d) * ir2 * 0.25;
    if (t > 0.0) {
      float b  = t * t * t;          // C1-smooth polynomial blob
      f       += b;
      grad    -= 1.5 * t * t * ir2 * d;
    }
  }

  float boundary = smoothstep(0.006, 0.022, f);
  if (boundary < 0.001) { out_color = vec4(0.0); return; }

  // ── Surface normal from gradient ──────────────────────────────────────────
  vec2  n2   = grad * inversesqrt(max(dot(grad, grad), 1e-6));
  vec3  n3   = normalize(vec3(n2, 1.2));

  // ── Specular highlight (key light) ────────────────────────────────────────
  float spec = pow(max(dot(n3, vec3(0.298, -0.373, 0.745)), 0.0), 24.0);

  // ── Fresnel edge glow ─────────────────────────────────────────────────────
  float edge = smoothstep(0.3, 0.65, f) - smoothstep(0.65, 2.2, f);

  // ── Compose: near-black vapor, very low alpha ─────────────────────────────
  float alpha = clamp((f * 0.07 + spec * 0.42 + edge * 0.18) * u_alpha_scale, 0.0, 0.85) * boundary;

  // Luminance: just specular + edge catch; dark on light bg, light on dark bg
  float lum = spec * 0.55 + edge * 0.12;
  vec3  col = mix(vec3(lum * 0.15), vec3(1.0 - lum * 0.15), u_invert);

  out_color = vec4(col, alpha);
}
`

export interface CursorShader {
  canvas:  HTMLCanvasElement
  render:  (time: number, velX: number, velY: number, invert: number,
            ringR: number, blobR: number, rotSpeed: number, alphaScale: number) => void
  resize:  (w: number, h: number) => void
  destroy: () => void
}

export function createCursorShader(canvas: HTMLCanvasElement): CursorShader | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false })
  if (!gl) return null

  // Enable alpha blending
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  function compileShader(type: number, src: string) {
    const s = gl!.createShader(type)!
    gl!.shaderSource(s, src)
    gl!.compileShader(s)
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error('CursorShader compile error:', gl!.getShaderInfoLog(s))
    }
    return s
  }

  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('CursorShader link error:', gl.getProgramInfoLog(prog))
    return null
  }
  gl.useProgram(prog)

  // Fullscreen quad
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
  const posLoc = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

  const uTime      = gl.getUniformLocation(prog, 'u_time')
  const uVel       = gl.getUniformLocation(prog, 'u_vel')
  const uRes       = gl.getUniformLocation(prog, 'u_res')
  const uInvert    = gl.getUniformLocation(prog, 'u_invert')
  const uRingR     = gl.getUniformLocation(prog, 'u_ring_r')
  const uBlobR     = gl.getUniformLocation(prog, 'u_blob_r')
  const uRotSpeed  = gl.getUniformLocation(prog, 'u_rot_speed')
  const uAlphaScale= gl.getUniformLocation(prog, 'u_alpha_scale')

  return {
    canvas,
    render(time, velX, velY, invert, ringR, blobR, rotSpeed, alphaScale) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime,       time)
      gl.uniform2f(uVel,        velX, velY)
      gl.uniform2f(uRes,        canvas.width, canvas.height)
      gl.uniform1f(uInvert,     invert)
      gl.uniform1f(uRingR,      ringR)
      gl.uniform1f(uBlobR,      blobR)
      gl.uniform1f(uRotSpeed,   rotSpeed)
      gl.uniform1f(uAlphaScale, alphaScale)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    resize(w, h) {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    },
    destroy() {
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    },
  }
}
