'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import s from './StarAnimationCanvas.module.css'

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

const SPOT_COUNT = 9

export default function StarAnimationCanvas() {
  const boxRef  = useRef<HTMLDivElement>(null)
  const gradRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box  = boxRef.current!
    const grad = gradRef.current!

    const mapX = new Spring(13, 6)
    const mapY = new Spring(13, 6)
    mapX.value = mapX.target = box.offsetWidth  / 2
    mapY.value = mapY.target = box.offsetHeight * 0.62

    const spots = Array.from({ length: SPOT_COUNT }, (_, i) => {
      const sprX = new Spring(10, 4)
      const sprY = new Spring(10, 4)
      const a = (i / SPOT_COUNT) * Math.PI * 2
      const r = 35 + Math.random() * 25
      sprX.value = sprX.target = Math.cos(a) * r
      sprY.value = sprY.target = Math.sin(a) * r
      return { sprX, sprY, nextRetarget: 0 }
    })

    let hoverPoint: { x: number; y: number } | null = null
    let isVisible = true
    let rafId = 0
    let lastT = performance.now()

    const onMouseMove = (e: MouseEvent) => {
      const rect = box.getBoundingClientRect()
      hoverPoint = {
        x: ((e.clientX - rect.left) / rect.width)  * box.offsetWidth,
        y: ((e.clientY - rect.top)  / rect.height) * box.offsetHeight,
      }
    }
    const onMouseLeave = () => { hoverPoint = null }
    box.addEventListener('mousemove', onMouseMove)
    box.addEventListener('mouseleave', onMouseLeave)

    function loop(now: number) {
      const dt  = Math.min((now - lastT) / 1000, 1 / 30)
      lastT = now
      const t   = now / 1000
      const TAU = Math.PI * 2

      const w  = box.offsetWidth
      const h  = box.offsetHeight
      const cx = w / 2
      const cy = h * 0.62
      const wx = cx + Math.sin(t * 0.13  * TAU) * w * 0.17
      const wy = cy - Math.sin(t * 0.097 * TAU + 1.3) * h * 0.10

      if (hoverPoint) {
        mapX.setTarget(wx * 0.35 + hoverPoint.x * 0.65)
        mapY.setTarget(wy * 0.35 + hoverPoint.y * 0.65)
      } else {
        mapX.setTarget(wx)
        mapY.setTarget(wy)
      }
      mapX.tick(dt)
      mapY.tick(dt)
      grad.style.setProperty('--map-x', `${mapX.value.toFixed(1)}px`)
      grad.style.setProperty('--map-y', `${mapY.value.toFixed(1)}px`)

      const amp = w * 0.31 + Math.sin(t * 0.11 * TAU + 0.7) * w * 0.06
      spots.forEach((sp, i) => {
        if (t > sp.nextRetarget) {
          sp.sprX.setTarget((Math.random() - 0.5) * 2 * amp)
          sp.sprY.setTarget((Math.random() - 0.5) * 2 * amp)
          sp.nextRetarget = t + 3 + Math.random() * 5
        }
        sp.sprX.tick(dt)
        sp.sprY.tick(dt)
        grad.style.setProperty(`--c${i}-dx`, `${sp.sprX.value.toFixed(1)}px`)
        grad.style.setProperty(`--c${i}-dy`, `${sp.sprY.value.toFixed(1)}px`)
      })

      rafId = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting
      if (visible === isVisible) return
      isVisible = visible
      if (visible) {
        lastT = performance.now()
        rafId = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(rafId); rafId = 0
      }
    }, { threshold: 0 })
    io.observe(box)

    lastT = performance.now()
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      io.disconnect()
      box.removeEventListener('mousemove', onMouseMove)
      box.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div ref={boxRef} className={s.starBox}>
      <div ref={gradRef} className={s.gradientMap} aria-hidden="true" />
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
