'use client'

import { useRef, useEffect, type RefObject } from 'react'
import styles from './CardPlayground.module.css'

const ZOOM_N = 16

interface Props {
  imgRef: RefObject<HTMLImageElement | null>
  blur: number
  start: number
}

export default function CanvasVignetteBlur({ imgRef, blur, start }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function render() {
    const canvas = canvasRef.current
    const img    = imgRef.current
    const card   = canvas?.parentElement
    if (!canvas || !img || !card || !img.complete) return

    const w = card.offsetWidth
    const h = card.offsetHeight
    if (!w || !h) return

    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = w / 2
    const cy = h / 2
    const spread = blur * 0.008 // slider 14 → 0.112

    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = 1 / ZOOM_N
    for (let i = 0; i < ZOOM_N; i++) {
      const scale = 1 + (i / (ZOOM_N - 1)) * spread
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)
      ctx.translate(-cx, -cy)
      ctx.drawImage(img, 0, 0, w, h)
      ctx.restore()
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'destination-in'
    const r    = Math.hypot(cx, cy)
    const grad = ctx.createRadialGradient(cx, cy, r * start / 100, cx, cy, r)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    if (img.complete) render()
    else img.addEventListener('load', render)
    window.addEventListener('resize', render)
    return () => {
      img.removeEventListener('load', render)
      window.removeEventListener('resize', render)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render when blur/start props change
  useEffect(() => { render() })

  return <canvas ref={canvasRef} className={styles.cardZoomBlur} />
}
