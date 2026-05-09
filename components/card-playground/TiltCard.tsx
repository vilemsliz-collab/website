'use client'

import { useRef, useEffect, useCallback, type MutableRefObject } from 'react'
import Image from 'next/image'
import { perspAngle, clamp } from '@/lib/carouselPhysics'
import CanvasVignetteBlur from './CanvasVignetteBlur'
import styles from './CardPlayground.module.css'

export interface TiltConfig  { max: number; stiffness: number; damping: number }
export interface GhostConfig { layers: number; opacity: number; blur: number; blend: string; variant: 'front' | 'behind' }
export interface LightConfig { intensity: number; size: number; travel: number; diffuse: number; shadow: number }
export interface RevealConfig { stagger: number; dur: number; blur: number; y: number }

interface Props {
  imgSrc: string
  line1: string
  line2: string
  tilt: TiltConfig
  ghost: GhostConfig
  light: LightConfig
  reveal: RevealConfig
  vignette: { blur: number; start: number }
  onRevealTrigger?: (fn: () => void) => void
  tiltRef?: MutableRefObject<{ rx: number; ry: number }>
}

const isMobile = () => navigator.maxTouchPoints > 0

export default function TiltCard({ imgSrc, line1, line2, tilt, ghost, light, reveal, vignette, onRevealTrigger, tiltRef }: Props) {
  const cardRef      = useRef<HTMLDivElement>(null)
  const shineRef     = useRef<HTMLDivElement>(null)
  const line1Ref     = useRef<HTMLParagraphElement>(null)
  const line2Ref     = useRef<HTMLParagraphElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const ghostClones  = useRef<HTMLDivElement[]>([])
  const cardWrapRef  = useRef<HTMLDivElement>(null)

  const tiltRx = useRef(0); const tiltRy = useRef(0)
  const tiltVx = useRef(0); const tiltVy = useRef(0)
  const tiltTx = useRef(0); const tiltTy = useRef(0)

  // Word reveal
  function wrapWords(el: HTMLElement) {
    const words = el.textContent?.trim().split(/\s+/) ?? []
    el.innerHTML = words.map(w => `<span class="${styles.word}">${w}</span>`).join(' ')
  }

  const applyRevealCSS = useCallback(() => {
    const root = document.documentElement
    root.style.setProperty('--card-blur', reveal.blur + 'px')
    root.style.setProperty('--card-y',    reveal.y    + 'px')
    root.style.setProperty('--card-dur',  reveal.dur  + 'ms')
  }, [reveal])

  const triggerReveal = useCallback(() => {
    const words = cardRef.current?.querySelectorAll(`.${styles.word}`)
    if (!words) return
    words.forEach(w => w.classList.remove(styles.wordVisible))
    applyRevealCSS()
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add(styles.wordVisible), i * reveal.stagger)
    })
  }, [applyRevealCSS, reveal.stagger])

  // Ghost clones
  const buildClones = useCallback(() => {
    ghostClones.current.forEach(c => c.remove())
    ghostClones.current = []
    const card = cardRef.current
    const wrap = cardWrapRef.current
    if (!card || !wrap) return
    const zVal = ghost.variant === 'front' ? '3' : '1'
    for (let i = 0; i < ghost.layers; i++) {
      const clone = card.cloneNode(true) as HTMLDivElement
      clone.removeAttribute('id')
      clone.classList.add(styles.ghostClone)
      clone.style.zIndex = zVal
      const content = clone.querySelector(`.${styles.cardContent}`) as HTMLElement | null
      if (content) content.style.visibility = 'hidden'
      wrap.insertBefore(clone, card)
      ghostClones.current.push(clone)
    }
  }, [ghost.layers, ghost.variant])

  const cfgRef = useRef({ tilt, ghost, light })
  cfgRef.current = { tilt, ghost, light }

  const drawGhosts = useCallback(() => {
    const { ghost: g } = cfgRef.current
    const mag = Math.abs(tiltRx.current) + Math.abs(tiltRy.current)
    if (mag < 0.3) { ghostClones.current.forEach(c => { c.style.opacity = '0' }); return }
    const P     = 800
    const card  = cardRef.current
    if (!card) return
    const halfW = card.offsetWidth  / 2
    const halfH = card.offsetHeight / 2
    ghostClones.current.forEach((clone, i) => {
      const scalar = (i + 1) / (g.layers + 1)
      const rx = perspAngle(tiltRx.current, scalar, halfH, P)
      const ry = perspAngle(tiltRy.current, scalar, halfW, P)
      clone.style.transform    = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      clone.style.opacity      = String(g.opacity * scalar)
      clone.style.filter       = g.blur > 0 ? `blur(${(g.blur * (1 - scalar)).toFixed(2)}px)` : ''
      clone.style.mixBlendMode = g.blend
    })
  }, [])

  const updateShine = useCallback(() => {
    const shine = shineRef.current
    if (!shine) return
    const { tilt: t, light: l } = cfgRef.current
    const maxT = t.max || 12
    const nx =  tiltRy.current / maxT
    const ny = -tiltRx.current / maxT
    const mag = Math.min(Math.hypot(nx, ny), 1)
    if (mag < 0.015) { shine.style.background = 'none'; return }

    const hx = (50 - nx * l.travel).toFixed(1)
    const hy = (50 + ny * l.travel).toFixed(1)
    const specPeak  = (l.intensity * mag).toFixed(3)
    const specMid   = (l.intensity * 0.12 * mag).toFixed(3)
    const sz        = l.size
    const litAngle  = (Math.atan2(-nx, -ny) * 180 / Math.PI).toFixed(1)
    const diffAmt   = (l.diffuse * mag).toFixed(3)
    const shadowAmt = (l.shadow  * mag).toFixed(3)

    shine.style.background = [
      `radial-gradient(ellipse ${sz}% ${sz}% at ${hx}% ${hy}%, rgba(255,255,255,${specPeak}) 0%, rgba(255,255,255,${specMid}) 45%, transparent 72%)`,
      `linear-gradient(${litAngle}deg, rgba(255,255,255,${diffAmt}) 0%, transparent 55%)`,
      `linear-gradient(${(+litAngle + 180).toFixed(1)}deg, rgba(0,0,0,${shadowAmt}) 0%, transparent 60%)`,
    ].join(',')
  }, [])

  useEffect(() => {
    let rafId: number

    function tiltLoop() {
      const { tilt: t } = cfgRef.current
      tiltVx.current += (tiltTx.current - tiltRx.current) * t.stiffness
      tiltVy.current += (tiltTy.current - tiltRy.current) * t.stiffness
      tiltVx.current *= t.damping
      tiltVy.current *= t.damping
      tiltRx.current += tiltVx.current
      tiltRy.current += tiltVy.current
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${tiltRx.current.toFixed(3)}deg) rotateY(${tiltRy.current.toFixed(3)}deg)`
      }
      if (tiltRef) {
        tiltRef.current.rx = tiltRx.current
        tiltRef.current.ry = tiltRy.current
      }
      drawGhosts()
      updateShine()
      rafId = requestAnimationFrame(tiltLoop)
    }
    rafId = requestAnimationFrame(tiltLoop)

    function onMouseMove(e: MouseEvent) {
      if (isMobile()) return
      const max = cfgRef.current.tilt.max
      tiltTy.current =  (e.clientX / window.innerWidth  - 0.5) * 2 * max
      tiltTx.current = -(e.clientY / window.innerHeight - 0.5) * 2 * max
    }
    function onGyro(e: DeviceOrientationEvent) {
      const max = cfgRef.current.tilt.max
      const gamma = e.gamma ?? 0
      const beta  = e.beta  ?? 0
      tiltTy.current = clamp( (gamma / 30) * max, -max, max)
      tiltTx.current = clamp(((beta - 45) / 30) * max, -max, max)
    }

    let permBtn: HTMLButtonElement | null = null
    let permBtnClick: (() => void) | null = null

    if (isMobile()) {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DOE.requestPermission === 'function') {
        permBtn = document.createElement('button')
        permBtn.textContent = 'enable tilt'
        permBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;border:1px solid rgba(0,0,0,0.15);background:#1c1b1f;color:#fff;font-family:monospace;font-size:12px;cursor:pointer;z-index:999'
        document.body.appendChild(permBtn)
        permBtnClick = () => {
          DOE.requestPermission!()
            .then(state => {
              if (state === 'granted') window.addEventListener('deviceorientation', onGyro)
              permBtn?.remove(); permBtn = null
            })
            .catch(() => { permBtn?.remove(); permBtn = null })
        }
        permBtn.addEventListener('click', permBtnClick)
      } else {
        window.addEventListener('deviceorientation', onGyro)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('deviceorientation', onGyro)
      if (permBtn && permBtnClick) permBtn.removeEventListener('click', permBtnClick)
      permBtn?.remove()
    }
  }, [drawGhosts, updateShine, tiltRef])

  // Init words + clones
  useEffect(() => {
    if (line1Ref.current) wrapWords(line1Ref.current)
    if (line2Ref.current) wrapWords(line2Ref.current)
    buildClones()
    applyRevealCSS()
    triggerReveal()
  }, [buildClones, applyRevealCSS, triggerReveal])

  // Expose reveal trigger to parent
  useEffect(() => {
    if (onRevealTrigger) onRevealTrigger(triggerReveal)
  }, [onRevealTrigger, triggerReveal])

  return (
    <div ref={cardWrapRef} className={styles.cardWrap} data-resistance>
      <div ref={cardRef} className={styles.card}>
        <Image
          ref={imgRef}
          className={styles.cardBg}
          src={imgSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 92vw, 364px"
          style={{ objectFit: 'cover' }}
          priority
        />
        <CanvasVignetteBlur imgRef={imgRef} blur={vignette.blur} start={vignette.start} />
        <div className={styles.cardOverlay} />
        <div ref={shineRef} className={styles.cardShine} />
        <div className={styles.cardContent} data-resistance>
          <p ref={line1Ref} className={`type-label-medium ${styles.cardLine}`} data-cursor="text" />
          <p ref={line2Ref} className={`type-headline-medium ${styles.cardLine}`} data-cursor="text" />
          <button className={`${styles.cardBtn} ${styles.word}`} aria-label="View project">›</button>
        </div>
      </div>
    </div>
  )
}
