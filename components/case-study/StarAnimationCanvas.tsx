'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import s from './StarAnimationCanvas.module.css'
import { useAnimationControls } from './AnimationControls'

class Spring {
  value = 0; target = 0; velocity = 0
  constructor(public k: number, public d: number) {}
  setTarget(t: number) { this.target = t }
  tick(dt: number) {
    const f = -this.k * (this.value - this.target) - this.d * this.velocity
    this.velocity += f * dt
    this.value    += this.velocity * dt
  }
}

const SPOT_COUNT  = 9
const GRAD_SCALE  = 4
const BLOB_R      = 54   // 108px div — visually matches circle-210px + blur-70px feel
const BLOB_COLORS = ['#aaff00','#00e05c','#00e05c','#00ff2b','#00ff2b','#aaff00','#00e05c','#00ff2b','#00e05c'] as const

export default function StarAnimationCanvas() {
  const boxRef  = useRef<HTMLDivElement>(null)
  const gradRef = useRef<HTMLDivElement>(null)
  const blobRefs = useRef<HTMLDivElement[]>([])

  const { params } = useAnimationControls()
  const paramsRef = useRef(params)
  useEffect(() => { paramsRef.current = params }, [params])

  useEffect(() => {
    const box  = boxRef.current!
    const grad = gradRef.current!

    const mapX = new Spring(3, 1.6)
    const mapY = new Spring(3, 1.6)

    let boxW = 0, boxH = 0
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      boxW = width; boxH = height
      mapX.value = mapX.target = boxW / 2
      mapY.value = mapY.target = boxH / 2
    })
    ro.observe(box)

    const spots = Array.from({ length: SPOT_COUNT }, (_, i) => {
      const sprX = new Spring(2.5, 1.4)
      const sprY = new Spring(2.5, 1.4)
      const phase = (i / SPOT_COUNT) * Math.PI * 2   // base angle on the ring
      const wobble = (Math.random() - 0.5) * 0.18    // ±0.18 rad jitter per blob
      sprX.value = sprX.target = 0
      sprY.value = sprY.target = 0
      return { sprX, sprY, phase, wobble }
    })

    let hoverPoint: { x: number; y: number } | null = null
    let isVisible = true
    let rafId = 0
    let lastT = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = box.getBoundingClientRect()
      hoverPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => { hoverPoint = null }
    box.addEventListener('mousemove', onMouseMove)
    box.addEventListener('mouseleave', onMouseLeave)

    function loop(now: number) {
      const dt  = lastT === 0 ? 1 / 60 : Math.max(1 / 240, Math.min(1 / 30, (now - lastT) / 1000))
      lastT = now
      const t   = now / 1000

      const p = paramsRef.current
      const rotRad = (p.rotation * Math.PI) / 180   // deg/s → rad/s

      const cx = boxW / 2
      const cy = boxH / 2

      if (hoverPoint) {
        mapX.setTarget(cx * 0.35 + hoverPoint.x * 0.65)
        mapY.setTarget(cy * 0.35 + hoverPoint.y * 0.65)
      } else {
        mapX.setTarget(cx)
        mapY.setTarget(cy)
      }
      mapX.tick(dt)
      mapY.tick(dt)

      const radius = boxW * 0.31
      const angle  = t * rotRad
      const blobEls = blobRefs.current
      spots.forEach((sp, i) => {
        // Live physics — read each frame so slider changes apply immediately.
        sp.sprX.k = sp.sprY.k = p.stiffness
        sp.sprX.d = sp.sprY.d = p.damping

        const a = sp.phase + angle + sp.wobble
        sp.sprX.setTarget(Math.cos(a) * radius)
        sp.sprY.setTarget(Math.sin(a) * radius)
        sp.sprX.tick(dt)
        sp.sprY.tick(dt)

        const bx = (mapX.value + sp.sprX.value - BLOB_R) / GRAD_SCALE
        const by = (mapY.value + sp.sprY.value - BLOB_R) / GRAD_SCALE
        const el = blobEls[i]
        if (el) el.style.transform = `translate3d(${bx.toFixed(2)}px,${by.toFixed(2)}px,0)`
      })

      rafId = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting
      if (visible === isVisible) return
      isVisible = visible
      if (visible) {
        lastT = 0
        rafId = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(rafId); rafId = 0
      }
    }, { threshold: 0 })
    io.observe(box)

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      io.disconnect()
      ro.disconnect()
      box.removeEventListener('mousemove', onMouseMove)
      box.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div ref={boxRef} className={s.starBox}>
      <div ref={gradRef} className={s.gradientMap} aria-hidden="true">
        {BLOB_COLORS.map((color, i) => (
          <div key={i} ref={el => { if (el) blobRefs.current[i] = el }} className={s.blob} style={{ background: color }} />
        ))}
      </div>
      <Image
        src="/wrike-star-animation/star-foreground.png"
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={s.starForeground}
        style={{ objectFit: 'cover' }}
      />
    </div>
  )
}
