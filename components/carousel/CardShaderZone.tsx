'use client'

import { useRef, useEffect } from 'react'
import { createCursorShader } from '../cursor/cursorShader'
import styles from './CarouselDOMScene.module.css'

export default function CardShaderZone() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const shader = createCursorShader(canvas)
    if (!shader) return

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      shader.resize(width, height)
    })
    ro.observe(canvas)

    let rafId: number
    const t0 = performance.now()
    function frame(now: number) {
      // Same blob shader as cursor: slow ambient rotation, no velocity lean, light blobs
      shader.render((now - t0) * 0.001, 0, 0, 1, 0.28, 0.28, 0.12, 1.2)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      shader.destroy()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.cardShaderCanvas} />
}
