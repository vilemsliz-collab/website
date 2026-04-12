import type { CarouselCFG } from './carouselConfig'

export const lerp       = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (t: number) => t * t * (3 - 2 * t)
export const clamp      = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function seededRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    return (s >>> 0) / 0xFFFFFFFF
  }
}

export function buildRollBase(n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const r = seededRng(i * 6271 + 3491)
    return (r() - 0.5) * 2
  })
}

export interface CardTransform {
  tx: number
  ty: number
  tz: number
  rx: number
  ry: number
  rollDeg: number
  scale: number
  opacity: number
  zIndex: number
  isActive: boolean
}

export function computeCardTransforms(
  pos: number,
  n: number,
  cfg: CarouselCFG,
  stageWidth: number,
  rollBase: number[],
): CardTransform[] {
  const V_ARC = 0
  const R   = Math.min(stageWidth * cfg.R_MULT, cfg.R_MAX)
  const LAT = cfg.LAT.map(d => d * Math.PI / 180)

  const posW  = ((pos % n) + n) % n
  const i0t   = Math.floor(posW) % n
  const i1t   = (i0t + 1) % n
  const fracT = posW - Math.floor(posW)
  const isVStep = (i0t % 2 === 1)
  const arc   = isVStep ? Math.sin(Math.PI * fracT) : 0
  const vDir  = (Math.floor(i0t / 2) % 2 === 0) ? 1 : -1

  return Array.from({ length: n }, (_, i) => {
    let off = i - pos
    while (off >  n / 2) off -= n
    while (off < -n / 2) off += n

    const phi    = LAT[i % LAT.length]
    const theta  = off * (2 * Math.PI / n) * cfg.LON_SPREAD
    const abs    = Math.abs(off)
    const st     = smoothstep(Math.min(1, abs))
    const cosPhi = Math.cos(phi)
    const sinPhi = Math.sin(phi)

    let tyBonus = 0
    if (i === i0t) tyBonus =  arc * V_ARC * vDir
    if (i === i1t) tyBonus = -arc * V_ARC * vDir

    const tx     = cosPhi * Math.sin(theta) * R * st
    const ty     = sinPhi * R * st + tyBonus + cfg.Y_OFFSET
    const tz     = (cosPhi * Math.cos(theta) - 1) * R * st
    const facing = cosPhi * Math.cos(theta)
    const ry     = -(theta * 180 / Math.PI) * cfg.ROT_MULT * st
    const rx     = -(phi   * 180 / Math.PI) * cfg.ROT_MULT * st
    const rollDeg = rollBase[i] * cfg.ROLL_MAX
    const scale  = lerp(cfg.SCALE_ACTIVE, cfg.SCALE_SPHERE, st)
    const opacity = Math.max(0, Math.min(1, facing * cfg.OPACITY_MULT + cfg.OPACITY_BASE))
    const zIndex  = abs < 0.5 ? 20 : Math.max(1, Math.round(facing * 10 + 5))
    const isActive = abs < 0.5

    return { tx, ty, tz, rx, ry, rollDeg, scale, opacity, zIndex, isActive }
  })
}

export function perspAngle(fullDeg: number, fraction: number, halfDim: number, P: number): number {
  if (Math.abs(fullDeg) < 0.001) return 0
  const sign  = Math.sign(fullDeg)
  const r     = Math.abs(fullDeg) * Math.PI / 180
  const xFull = halfDim * Math.cos(r) * P / (P - halfDim * Math.sin(r))
  const xTgt  = halfDim + fraction * (xFull - halfDim)
  const A = P, B = xTgt, C = xTgt * P / halfDim
  const R = Math.hypot(A, B)
  const phi = Math.atan2(B, A) - Math.acos(Math.min(C / R, 1))
  return sign * phi * 180 / Math.PI
}
