'use client'

import { useRef, useEffect } from 'react'

// ── Physics constants (mirror orbs-v6) ──────────────────────────────────────
const MAX_ORBS   = 6   // shader buffer always expects 6 slots
const PPO        = 16
const TOTAL_P    = MAX_ORBS * PPO
const WB         = 0.15
const MAX_ALONE  = 67
const PAIR_K     = 0.004
const INNER_SIZES = [72, 64, 58, 52, 48, 42, 38]
const RING_SIZES  = [44, 40, 38, 36, 34, 32, 30, 28]
const NI = INNER_SIZES.length
const NR = RING_SIZES.length
const ORB_SCALE  = 0.7
const NUM_ORBS   = 4

// ── Grayscale palettes for each orb ─────────────────────────────────────────
const PALETTES: Array<{ l: [number, number, number]; d: [number, number, number] }> = [
  { l: [0.92, 0.92, 0.92], d: [0.56, 0.56, 0.56] },
  { l: [0.80, 0.80, 0.80], d: [0.36, 0.36, 0.36] },
  { l: [0.88, 0.88, 0.88], d: [0.48, 0.48, 0.48] },
  { l: [0.75, 0.75, 0.75], d: [0.30, 0.30, 0.30] },
  { l: [0.85, 0.85, 0.85], d: [0.42, 0.42, 0.42] },
]

// ── WGSL shader (identical to orbs-v6) ──────────────────────────────────────
const SHADER = `
struct Uniforms {
  resolution: vec2f,
  dpr: f32,
  blendMode: f32,
  bb: array<vec4f, 6>,
}
struct Colors {
  light: array<vec4f, 6>,
  deep:  array<vec4f, 6>,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> pData: array<f32>;
@group(0) @binding(2) var<uniform> colors: Colors;
@group(0) @binding(3) var bgTex:  texture_2d<f32>;
@group(0) @binding(4) var bgSamp: sampler;

@vertex fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  let x = f32(i32(vi & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vi >> 1u)) * 4.0 - 1.0;
  return vec4f(x, y, 0.0, 1.0);
}

@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let p = fragCoord.xy / u.dpr;
  var f: array<f32, 6>;
  var grad = vec2f(0.0);

  for (var k = 0u; k < 6u; k++) {
    let bb = u.bb[k];
    if (p.x < bb.x || p.x > bb.z || p.y < bb.y || p.y > bb.w) { continue; }
    for (var i = 0u; i < 16u; i++) {
      let base = (k * 16u + i) * 3u;
      let pxy = vec2f(pData[base], pData[base + 1u]);
      let rr  = pData[base + 2u];
      let d   = p - pxy;
      let ir2 = 1.0 / (rr * rr);
      let t   = 1.0 - dot(d, d) * ir2 * 0.25;
      if (t > 0.0) {
        let t2 = t * t;
        let b  = t2 * t;
        f[k] += b;
        grad -= 1.5 * t2 * ir2 * d;
      }
    }
  }

  let tF = f[0] + f[1] + f[2] + f[3] + f[4] + f[5];

  if (tF < 0.05) {
    return vec4f(textureSampleLevel(bgTex, bgSamp, p / u.resolution, 0.0).rgb, 1.0);
  }

  let n2   = grad * inverseSqrt(max(dot(grad, grad), 1e-6));
  let surf = smoothstep(0.3, 1.2, tF);

  var tx = vec3f(1.0);
  var totalO: f32 = 0.0;
  for (var k = 0u; k < 6u; k++) {
    let sat = smoothstep(0.85, 3.5, f[k]);
    let a   = smoothstep(0.45, 0.85, f[k]);
    let o   = a * (0.38 + 0.32 * sat);
    if (o > 0.001) {
      let c = mix(colors.light[k].rgb, colors.deep[k].rgb, sat);
      tx *= mix(vec3f(1.0), c, o);
    }
    totalO += o;
  }
  totalO = min(totalO, 1.0);

  let uvBg = (p + n2 * surf * 20.0) / u.resolution;
  let bg   = textureSampleLevel(bgTex, bgSamp, uvBg, 0.0).rgb;

  let gray = dot(tx, vec3f(0.333));
  tx = clamp(mix(vec3f(gray), tx, 1.6), vec3f(0.0), vec3f(1.0));
  var col = mix(bg, tx, totalO);

  col += (smoothstep(0.4, 0.75, tF) - smoothstep(0.75, 2.5, tF)) * 0.35;

  let n3   = normalize(vec3f(n2, 1.0));
  let spec = pow(max(dot(n3, vec3f(0.298, -0.373, 0.745)), 0.0), 24.0);
  col += spec * surf * 0.4;

  return vec4f(min(col, vec3f(1.0)), 1.0);
}
`

export default function OrbBackground({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.gpu) return

    let rafId: number | null = null
    let dead = false

    async function init() {
      const adapter = await navigator.gpu!.requestAdapter()
      if (!adapter || dead) return
      const device = await adapter.requestDevice()
      if (dead) { device.destroy(); return }

      const gpuCtx = canvas!.getContext('webgpu')
      if (!gpuCtx) return
      const fmt = navigator.gpu!.getPreferredCanvasFormat()

      const DPR  = Math.min(devicePixelRatio, 2)
      const RDPR = Math.max(DPR * 0.5, 0.5)
      let W = canvas!.offsetWidth  || 300
      let H = canvas!.offsetHeight || 460

      // ── Buffers ────────────────────────────────────────────────────────────
      const uBuf = new Float32Array(28)
      for (let i = 0; i < 6; i++) {
        uBuf[4+i*4] = -99999; uBuf[5+i*4] = -99999
        uBuf[6+i*4] = -99999; uBuf[7+i*4] = -99999
      }
      const uniformBuf = device.createBuffer({ size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })

      const pBuf = new Float32Array(TOTAL_P * 3)
      for (let i = 0; i < TOTAL_P; i++) { pBuf[i*3] = -9999; pBuf[i*3+1] = -9999; pBuf[i*3+2] = 0.001 }
      const particleBuf = device.createBuffer({ size: pBuf.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })

      const cBuf = new Float32Array(48)
      for (let i = 0; i < 6; i++) {
        cBuf[i*4]    = 1;   cBuf[i*4+1]    = 1;   cBuf[i*4+2]    = 1;   cBuf[i*4+3]    = 0
        cBuf[24+i*4] = 0.5; cBuf[24+i*4+1] = 0.5; cBuf[24+i*4+2] = 0.5; cBuf[24+i*4+3] = 0
      }
      const colorBuf = device.createBuffer({ size: cBuf.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })

      const bgSampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })

      // ── Pipeline ───────────────────────────────────────────────────────────
      const shader = device.createShaderModule({ code: SHADER })
      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex:   { module: shader, entryPoint: 'vs' },
        fragment: { module: shader, entryPoint: 'fs', targets: [{ format: fmt }] },
        primitive: { topology: 'triangle-list' },
      })

      // ── Background texture (plain white) ───────────────────────────────────
      let bgTexture: GPUTexture | null = null
      let bindGroup: GPUBindGroup | null = null

      function rebuildBg() {
        const c = document.createElement('canvas')
        c.width = W * DPR; c.height = H * DPR
        const x = c.getContext('2d')!
        const grad = x.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.6)
        if (dark) {
          grad.addColorStop(0.00, '#1e1f2a')
          grad.addColorStop(0.60, '#14151e')
          grad.addColorStop(1.00, '#0d0e18')
        } else {
          grad.addColorStop(0.60, '#ffffff')
          grad.addColorStop(0.88, '#eff0f5')
          grad.addColorStop(1.00, '#e5e7f0')
        }
        x.fillStyle = grad
        x.fillRect(0, 0, c.width, c.height)

        if (bgTexture) bgTexture.destroy()
        bgTexture = device.createTexture({
          size: [c.width, c.height],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        device.queue.copyExternalImageToTexture({ source: c }, { texture: bgTexture }, [c.width, c.height])

        bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniformBuf } },
            { binding: 1, resource: { buffer: particleBuf } },
            { binding: 2, resource: { buffer: colorBuf } },
            { binding: 3, resource: bgTexture!.createView() },
            { binding: 4, resource: bgSampler },
          ],
        })
      }

      function resize() {
        W = canvas!.offsetWidth  || 300
        H = canvas!.offsetHeight || 460
        canvas!.width  = W * RDPR
        canvas!.height = H * RDPR
        gpuCtx!.configure({ device, format: fmt, alphaMode: 'opaque' })
        rebuildBg()
      }
      resize()

      // ── Colors ─────────────────────────────────────────────────────────────
      let colorsDirty = true
      function setColor(i: number, l: readonly [number, number, number], d: readonly [number, number, number]) {
        cBuf[i*4]    = l[0]; cBuf[i*4+1]    = l[1]; cBuf[i*4+2]    = l[2]; cBuf[i*4+3]    = 0
        cBuf[24+i*4] = d[0]; cBuf[24+i*4+1] = d[1]; cBuf[24+i*4+2] = d[2]; cBuf[24+i*4+3] = 0
        colorsDirty = true
      }
      for (let i = 0; i < NUM_ORBS; i++) setColor(i, PALETTES[i].l, PALETTES[i].d)
      device.queue.writeBuffer(colorBuf, 0, cBuf)
      colorsDirty = false

      // ── Physics ────────────────────────────────────────────────────────────
      const _t = new Float32Array(4)

      function push(px: number, py: number, vx: number, vy: number, r: number) {
        _t[0] = px; _t[1] = py; _t[2] = vx; _t[3] = vy
      }

      function wall(px: number, py: number, vx: number, vy: number, r: number) {
        if (px < r)       { px = r;     vx =  Math.abs(vx) * WB }
        else if (px > W - r) { px = W - r; vx = -Math.abs(vx) * WB }
        if (py < r)       { py = r;     vy =  Math.abs(vy) * WB }
        else if (py > H - r) { py = H - r; vy = -Math.abs(vy) * WB }
        _t[0] = px; _t[1] = py; _t[2] = vx; _t[3] = vy
      }

      type Particle = { x: number; y: number; vx: number; vy: number; r: number; rr: number; cp: number; fr: number; mass: number }
      type Core     = { x: number; y: number; vx: number; vy: number; r: number; rr: number; fr: number }
      type OrbPhys  = { core: Core; inner: Particle[]; ring: Particle[]; _all: (Core | Particle)[]; scale: number }

      function makeOrb(sx: number, sy: number): OrbPhys {
        const sc = Math.min(W, H) < 500 ? 0.5 : 1
        const core: Core = { x: sx + (Math.random() - 0.5) * 107 * sc, y: sy + (Math.random() - 0.5) * 107 * sc, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, r: 87, fr: 0.9992, rr: 120 }
        const inner: Particle[] = new Array(NI)
        for (let i = 0; i < NI; i++) {
          const r = INNER_SIZES[i] / 2
          inner[i] = { x: sx + (Math.random() - 0.5) * 340 * sc, y: sy + (Math.random() - 0.5) * 340 * sc, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, r, rr: r * 2.95, cp: 3e-4 + Math.random() * 6e-4, fr: 0.9985 + Math.random() * 1e-3, mass: 0.8 + Math.random() }
        }
        const ring: Particle[] = new Array(NR)
        for (let i = 0; i < NR; i++) {
          const r = RING_SIZES[i] / 2
          const a = Math.random() * Math.PI * 2
          const d = 20 + Math.random() * 200
          ring[i] = { x: sx + Math.cos(a) * d * sc + (Math.random() - 0.5) * 120 * sc, y: sy + Math.sin(a) * d * sc + (Math.random() - 0.5) * 120 * sc, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, r, rr: r * 2.68, cp: 2e-4 + Math.random() * 3e-4, fr: 0.9988 + Math.random() * 1e-3, mass: 1 + Math.random() * 1.5 }
        }
        return { core, inner, ring, _all: new Array(1 + NI + NR), scale: 1 }
      }

      function setOrbScale(ph: OrbPhys, s: number) {
        ph.scale = s
        ph.core.r = 87 * s; ph.core.rr = 120 * s
        for (let i = 0; i < NI; i++) { const br = INNER_SIZES[i] / 2; ph.inner[i].r = br * s; ph.inner[i].rr = br * 2.95 * s }
        for (let i = 0; i < NR; i++) { const br = RING_SIZES[i] / 2;  ph.ring[i].r  = br * s; ph.ring[i].rr  = br * 2.68 * s }
      }

      function stepPart(s: Particle, cx: number, cy: number, maxD: number, elas: number) {
        push(s.x, s.y, s.vx, s.vy, s.r)
        s.x = _t[0]; s.y = _t[1]; s.vx = _t[2]; s.vy = _t[3]
        const im = 1 / s.mass
        s.vx += (cx - s.x) * s.cp * im; s.vy += (cy - s.y) * s.cp * im
        const dx = s.x - cx, dy = s.y - cy, dc = Math.sqrt(dx * dx + dy * dy)
        if (dc > maxD) { const e = (dc - maxD) * elas / dc; s.vx -= dx * e; s.vy -= dy * e }
        s.vx *= s.fr; s.vy *= s.fr; s.x += s.vx; s.y += s.vy
        wall(s.x, s.y, s.vx, s.vy, s.r)
        s.x = _t[0]; s.y = _t[1]; s.vx = _t[2]; s.vy = _t[3]
      }

      function stepOrb(o: OrbPhys) {
        const c = o.core
        push(c.x, c.y, c.vx, c.vy, c.r)
        c.x = _t[0]; c.y = _t[1]; c.vx = _t[2]; c.vy = _t[3]
        c.vx *= c.fr; c.vy *= c.fr; c.x += c.vx; c.y += c.vy
        wall(c.x, c.y, c.vx, c.vy, c.r)
        c.x = _t[0]; c.y = _t[1]; c.vx = _t[2]; c.vy = _t[3]
        const sc = o.scale
        for (let i = 0; i < NI; i++) stepPart(o.inner[i], c.x, c.y, 200 * sc, 0.0024)
        for (let i = 0; i < NR; i++) stepPart(o.ring[i],  c.x, c.y, 240 * sc, 0.001)
        const all = o._all
        all[0] = c
        for (let i = 0; i < NI; i++) all[1 + i] = o.inner[i]
        for (let i = 0; i < NR; i++) all[1 + NI + i] = o.ring[i]
        const sMA = MAX_ALONE * sc, t2 = sMA * 1.3, len = all.length
        for (let i = 0; i < len; i++) {
          const a = all[i] as Particle
          let d1 = Infinity, d2 = Infinity, n1x = 0, n1y = 0, n2x = 0, n2y = 0
          for (let j = 0; j < len; j++) {
            if (i === j) continue
            const bj = all[j] as Particle
            const dx = bj.x - a.x, dy = bj.y - a.y, d = Math.sqrt(dx * dx + dy * dy)
            if (d < d1) { d2 = d1; n2x = n1x; n2y = n1y; d1 = d; n1x = bj.x; n1y = bj.y }
            else if (d < d2) { d2 = d; n2x = bj.x; n2y = bj.y }
          }
          if (d1 > sMA) { const f = (d1 - sMA) * PAIR_K / d1; a.vx += (n1x - a.x) * f; a.vy += (n1y - a.y) * f }
          if (d2 > t2)  { const f = (d2 - t2)  * PAIR_K * 0.5 / d2; a.vx += (n2x - a.x) * f; a.vy += (n2y - a.y) * f }
          a.vx += (Math.random() - 0.5) * 0.15
          a.vy += (Math.random() - 0.5) * 0.15
        }
      }

      function collide(a: OrbPhys, b: OrbPhys) {
        const dx = b.core.x - a.core.x, dy = b.core.y - a.core.y
        const d = Math.sqrt(dx * dx + dy * dy), m = a.core.r + b.core.r + 27
        if (d < m && d > 0.1) {
          const f = (m - d) * 0.02 / d
          a.core.vx -= dx * f; a.core.vy -= dy * f
          b.core.vx += dx * f; b.core.vy += dy * f
        }
      }

      // ── Spawn 4 orbs ───────────────────────────────────────────────────────
      const orbs: OrbPhys[] = []
      for (let i = 0; i < NUM_ORBS; i++) {
        const col = i % 2, row = Math.floor(i / 2)
        const sx = W * (0.25 + 0.5 * col) + (Math.random() - 0.5) * W * 0.1
        const sy = H * (0.25 + 0.5 * row) + (Math.random() - 0.5) * H * 0.15
        const o = makeOrb(sx, sy)
        setOrbScale(o, ORB_SCALE)
        orbs.push(o)
      }

      // ── ResizeObserver ─────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => { if (!dead) resize() })
      ro.observe(canvas!)

      // ── Render loop ────────────────────────────────────────────────────────
      function tick() {
        if (dead) return
        const n = orbs.length
        for (let i = 0; i < n; i++) stepOrb(orbs[i])
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) collide(orbs[i], orbs[j])

        for (let i = 0; i < n; i++) {
          const ph = orbs[i], base = i * PPO * 3
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, maxRR = 0
          pBuf[base] = ph.core.x; pBuf[base+1] = ph.core.y; pBuf[base+2] = ph.core.rr
          if (ph.core.x < x0) x0 = ph.core.x; if (ph.core.y < y0) y0 = ph.core.y
          if (ph.core.x > x1) x1 = ph.core.x; if (ph.core.y > y1) y1 = ph.core.y
          if (ph.core.rr > maxRR) maxRR = ph.core.rr
          for (let j = 0; j < NI; j++) {
            const off = base + (1 + j) * 3, p = ph.inner[j]
            pBuf[off] = p.x; pBuf[off+1] = p.y; pBuf[off+2] = p.rr
            if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y
            if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y
            if (p.rr > maxRR) maxRR = p.rr
          }
          for (let j = 0; j < NR; j++) {
            const off = base + (1 + NI + j) * 3, p = ph.ring[j]
            pBuf[off] = p.x; pBuf[off+1] = p.y; pBuf[off+2] = p.rr
            if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y
            if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y
            if (p.rr > maxRR) maxRR = p.rr
          }
          const margin = maxRR * 2, bi = 4 + i * 4
          uBuf[bi] = x0 - margin; uBuf[bi+1] = y0 - margin
          uBuf[bi+2] = x1 + margin; uBuf[bi+3] = y1 + margin
        }
        for (let i = n; i < MAX_ORBS; i++) {
          const bi = 4 + i * 4
          uBuf[bi] = -99999; uBuf[bi+1] = -99999; uBuf[bi+2] = -99999; uBuf[bi+3] = -99999
        }

        uBuf[0] = W; uBuf[1] = H; uBuf[2] = RDPR; uBuf[3] = dark ? 1 : 0
        device.queue.writeBuffer(uniformBuf,  0, uBuf)
        device.queue.writeBuffer(particleBuf, 0, pBuf)
        if (colorsDirty) { device.queue.writeBuffer(colorBuf, 0, cBuf); colorsDirty = false }

        if (!bindGroup) { rafId = requestAnimationFrame(tick); return }
        const encoder = device.createCommandEncoder()
        const pass = encoder.beginRenderPass({
          colorAttachments: [{ view: gpuCtx!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 1, g: 1, b: 1, a: 1 } }],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3)
        pass.end()
        device.queue.submit([encoder.finish()])

        rafId = requestAnimationFrame(tick)
      }

      rafId = requestAnimationFrame(tick)

      // Store cleanup refs on the outer scope
      ;(canvas as HTMLCanvasElement & { _orbCleanup?: () => void })._orbCleanup = () => {
        ro.disconnect()
        device.destroy()
        bgTexture?.destroy()
      }
    }

    init()

    return () => {
      dead = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      const c = canvas as HTMLCanvasElement & { _orbCleanup?: () => void }
      c._orbCleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
