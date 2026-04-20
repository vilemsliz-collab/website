'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'
import styles from './Cursor.module.css'

// ── Config (live-tweakable via configRef) ─────────────────────────────────────
export interface CursorConfig {
  followK:    number   // 0.28 — position spring
  blobSpeed:  number   // 18   — px/frame threshold for elongation
  blobMax:    number   // 0.42 — max elongation factor
  shapeK:     number   // 0.22 — width/height morph spring
  invertK:    number   // 0.10 — dark-bg invert spring
  // Metaball organic shape
  metaballAmp: number  // 0.10 — per-corner oscillation amplitude (0 = perfect circle)
  // Backdrop distortion — two levels (default vs card/link)
  backdropScale:     number  // 0  — cursor body distortion in default state
  backdropScaleCard: number  // 82 — cursor body distortion in card/link state
  // Scroll rings
  scrollIntervalBase: number  // 140  — base for minInterval calc
  scrollRingScale:    number  // 3.2  — ring final scale
  scrollRingDuration: number  // 0.65 — ring animation seconds
  scrollNarrowW:      number  // 20   — cursor narrow dimension during scroll
  // Pill + scroll: axis elongation pulse on wheel events
  scrollKickAmp:      number  // 26   — how much each wheel event bumps the kick
  scrollKickDecay:    number  // 0.08 — per-frame decay factor toward 0
  pillScrollElong:    number  // 0.14 — max pill elongation from scrollKick (0..1)
}

export const DEFAULT_CURSOR_CONFIG: CursorConfig = {
  followK:    0.28,
  blobSpeed:  18,
  blobMax:    0.42,
  shapeK:     0.22,
  invertK:    0.10,
  metaballAmp: 0.10,
  backdropScale:     0,
  backdropScaleCard: 82,
  scrollIntervalBase: 140,
  scrollRingScale:    4.5,
  scrollRingDuration: 0.65,
  scrollNarrowW:      24,
  scrollKickAmp:      26,
  scrollKickDecay:    0.08,
  pillScrollElong:    0.1,
}

const DEFAULT_W = 48
const DEFAULT_H = 48

// ── State ──────────────────────────────────────────────────────────────────────
export type CursorState =
  | 'default' | 'card' | 'card-close' | 'case-close'
  | 'link' | 'scroll-down' | 'scroll-up' | 'scroll-left' | 'scroll-right' | 'scroll-hint'
  | 'drag-h'

function getStateTarget(state: CursorState, label?: string) {
  switch (state) {
    case 'card': {
      const w = label ? Math.min(Math.round((label.length * 9 + 52) * 1.5), 210) : 156
      return { w, h: 72, label }
    }
    case 'link': {
      const w = label ? Math.min(Math.round((label.length * 9 + 52) * 1.5), 210) : 156
      return { w, h: 72, label }
    }
    case 'card-close': {
      return { w: 72, h: 72, label: '×' }
    }
    case 'case-close': {
      return { w: DEFAULT_W, h: DEFAULT_H, label: '×' }
    }
    case 'scroll-down':
    case 'scroll-up':   return { w: DEFAULT_W, h: 96,  label: undefined }
    case 'drag-h':
    case 'scroll-left':
    case 'scroll-right': return { w: 96, h: DEFAULT_H, label: undefined }
    case 'scroll-hint': return { w: 36,        h: 48,        label: undefined }
    default:            return { w: DEFAULT_W, h: DEFAULT_H, label: undefined }
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
interface CursorProps {
  tiltRef?:   MutableRefObject<{ rx: number; ry: number }>
  configRef?: MutableRefObject<CursorConfig>
}

export default function CustomCursor({ tiltRef, configRef }: CursorProps) {
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const bodyRef     = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const borderRef   = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper  = wrapperRef.current
    const body     = bodyRef.current
    const backdrop = backdropRef.current
    const border   = borderRef.current
    const content  = contentRef.current
    if (!wrapper || !body || !backdrop || !border || !content) return

    document.body.style.cursor = 'none'

    // ── SVG backdrop-filter: liquid displacement ───────────────────────────────
    const svgNS = 'http://www.w3.org/2000/svg'
    const svgEl = document.createElementNS(svgNS, 'svg')
    svgEl.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
    svgEl.setAttribute('aria-hidden', 'true')
    svgEl.innerHTML = `<defs>
      <filter id="cursor-liquid" color-interpolation-filters="sRGB"
              x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence id="clt" type="turbulence"
                      baseFrequency="0.018 0.024" numOctaves="2"
                      seed="0" result="noise" stitchTiles="stitch"/>
        <feDisplacementMap id="cld" in="SourceGraphic" in2="noise"
                           scale="6" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>`
    document.body.appendChild(svgEl)
    const clt = svgEl.querySelector('#clt') as SVGFETurbulenceElement     | null
    const cld = svgEl.querySelector('#cld') as SVGFEDisplacementMapElement | null
    backdrop.style.backdropFilter         = "url('#cursor-liquid')"
    ;(backdrop.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = "url('#cursor-liquid')"


    // ── Physics state ──
    let mouseX  = window.innerWidth  / 2
    let mouseY  = window.innerHeight / 2
    let renderX = mouseX, renderY = mouseY
    let prevRX  = mouseX, prevRY  = mouseY
    let velX    = 0,      velY    = 0
    let curW    = DEFAULT_W, curH  = DEFAULT_H
    let targW   = DEFAULT_W, targH = DEFAULT_H
    let blobAngle  = 0, blobElong = 0
    let invertCur  = 0, invertTarg = 0
    let curBDScale = 0   // springs toward backdropScale or backdropScaleCard
    // Pill+scroll: transient wheel impulse decaying each frame.
    // Drives pill-axis elongation when hovering a button.
    let scrollKick = 0
    let scrollAxisX = 0, scrollAxisY = 1  // unit vector of last wheel direction

    // Current state
    let cursorState: CursorState = 'default'
    let scrollTimer: ReturnType<typeof setTimeout> | null = null
    let lastRingTime = 0

    let cursorLabel: string | undefined
    let baseW = DEFAULT_W, baseH = DEFAULT_H  // unscaled target from current state
    let hoveredCursorEl: HTMLElement | null = null
    // Snapshot of data-cursor-scale captured on hover-in. Carousel cards rewrite
    // their cursor-scale every frame as scroll physics runs; reading it live
    // would shrink/grow the cursor mid-scroll. Locking at hover-in keeps the
    // cursor sized to the card's role at the moment the user pointed at it.
    let lockedCursorScale = 1
    const applyState = (state: CursorState, label?: string) => {
      if (cursorState === state && cursorLabel === label) return
      cursorState = state
      cursorLabel = label
      const t = getStateTarget(state, label)
      baseW = t.w
      baseH = t.h
      // targW/targH are set live each rAF frame from baseW/baseH × hoveredCursorEl scale

      const cfg = configRef?.current ?? DEFAULT_CURSOR_CONFIG

      // Narrow cursor during scroll — override baseW/baseH directly
      if (state === 'scroll-down' || state === 'scroll-up') {
        baseW = cfg.scrollNarrowW   // narrow width → tall vertical pill
      } else if (state === 'scroll-left' || state === 'scroll-right') {
        baseH = cfg.scrollNarrowW   // narrow height → wide horizontal pill
      }
      // drag-h: only width expands, height stays at DEFAULT_H


      const isPillState = state === 'card' || state === 'card-close' || state === 'case-close' || state === 'link'
      content.style.fontSize = state === 'card-close' ? '40px' : state === 'case-close' ? '24px' : isPillState ? '32px' : '13px'

      if (t.label) {
        content.textContent   = t.label
        content.style.display = ''
      } else {
        content.textContent   = ''
        content.style.display = 'none'
      }
    }

    const spawnScrollRing = () => {
      const cfg = configRef?.current ?? DEFAULT_CURSOR_CONFIG
      const isPill = cursorState === 'card' || cursorState === 'card-close' || cursorState === 'case-close' || cursorState === 'link'
      // Pill rings start at the pill's minor axis and grow to ≈ the major axis,
      // sweeping across the button. Default state uses the configured narrow size.
      const startSize = isPill
        ? Math.max(12, Math.min(Math.round(curW), Math.round(curH)))
        : cfg.scrollNarrowW
      const endSize = isPill
        ? Math.max(startSize * 1.2, Math.max(Math.round(curW), Math.round(curH)))
        : startSize * cfg.scrollRingScale

      const r = document.createElement('div')
      r.className = styles.scrollRing
      if (isPill) r.classList.add(styles.scrollRingInverted)
      r.style.width  = `${startSize}px`
      r.style.height = `${startSize}px`
      r.style.left   = '50%'
      r.style.top    = '50%'
      body.appendChild(r)

      // Rings pick up blur as they expand from center toward the edge,
      // so the stroke softens into the outer boundary.
      const anim = r.animate(
        [
          { width: `${startSize}px`, height: `${startSize}px`, opacity: 0.6,  filter: 'blur(0px)' },
          { width: `${endSize}px`,   height: `${endSize}px`,   opacity: 0.45, filter: 'blur(1.2px)', offset: 0.65 },
          { width: `${endSize}px`,   height: `${endSize}px`,   opacity: 0,    filter: 'blur(3px)' },
        ],
        { duration: cfg.scrollRingDuration * 1000, easing: 'cubic-bezier(0.1, 0, 0.35, 1)', fill: 'forwards' }
      )
      anim.onfinish = () => r.remove()
    }

    // ── rAF loop ───────────────────────────────────────────────────────────────
    let rafId    = 0
    let lastTime = 0

    const frame = (now: number) => {
      const cfg = configRef?.current ?? DEFAULT_CURSOR_CONFIG
      const dt = lastTime ? Math.min((now - lastTime) / 16.667, 4) : 1
      lastTime = now

      // 1. Position spring
      renderX += (mouseX - renderX) * cfg.followK * dt
      renderY += (mouseY - renderY) * cfg.followK * dt
      const rawVX = (renderX - prevRX) / dt
      const rawVY = (renderY - prevRY) / dt
      velX = velX + (rawVX - velX) * 0.18
      velY = velY + (rawVY - velY) * 0.18
      prevRX = renderX; prevRY = renderY

      // 2. Live scale + shape spring
      const liveScale = lockedCursorScale
      targW = Math.round(baseW * liveScale)
      targH = Math.round(baseH * liveScale)
      curW += (targW - curW) * cfg.shapeK * dt
      curH += (targH - curH) * cfg.shapeK * dt
      const rW = Math.max(1, Math.round(curW))
      const rH = Math.max(1, Math.round(curH))
      const isPillLive = cursorState === 'card' || cursorState === 'link' || cursorState === 'card-close' || cursorState === 'case-close'
      if (isPillLive) content.style.fontSize = `${Math.round((cursorState === 'card-close' ? 40 : cursorState === 'case-close' ? 24 : 32) * liveScale)}px`

      // 3. Trailing blob matrix
      const speed     = Math.hypot(velX, velY)
      const targElong = Math.min(speed / cfg.blobSpeed, 1) * cfg.blobMax
      blobElong += (targElong - blobElong) * 0.20 * dt
      if (speed > 0.5) blobAngle = Math.atan2(velY, velX)
      const cos = Math.cos(blobAngle), sin = Math.sin(blobAngle)
      const sx  = 1 + blobElong,       sy  = Math.max(1 - blobElong * 0.35, 0.65)
      const m00 = cos*cos*sx + sin*sin*sy,  m01 = cos*sin*sx - sin*cos*sy
      const m10 = sin*cos*sx - cos*sin*sy,  m11 = sin*sin*sx + cos*cos*sy
      const blob = `matrix(${m00.toFixed(4)},${m10.toFixed(4)},${m01.toFixed(4)},${m11.toFixed(4)},0,0)`

      // 3b. Scroll-kick decay (pill+scroll wave impulse)
      scrollKick = Math.max(0, scrollKick - scrollKick * cfg.scrollKickDecay * dt)

      // 4. Wrapper position
      wrapper.style.transform = `translate(${renderX.toFixed(1)}px,${renderY.toFixed(1)}px)`

      // 5. Body: center + optional blob
      body.style.width  = `${rW}px`
      body.style.height = `${rH}px`
      // Metaball organic border-radius: per-corner sine oscillation + velocity deformation.
      // Pill states use a simple half-min so they stay cleanly rounded.
      const baseR = Math.min(rW, rH) / 2
      const isPill = cursorState === 'card' || cursorState === 'link' || cursorState === 'card-close' || cursorState === 'case-close'
      if (isPill || cfg.metaballAmp <= 0) {
        body.style.borderRadius = `${baseR}px`
      } else {
        const t    = now * 0.001
        const amp  = cfg.metaballAmp
        const cosA = Math.cos(blobAngle), sinA = Math.sin(blobAngle)
        const cDirs  = [[-1,-1],[1,-1],[1,1],[-1,1]] as const
        const phases = [0, 1.1, 2.2, 3.3]
        const freqs  = [0.72, 0.83, 0.67, 0.78]
        const corners = cDirs.map(([cx, cy], i) => {
          const organic  = 1 + amp * Math.sin(t * freqs[i] + phases[i])
          const dot      = (cx * cosA + cy * sinA) * 0.707
          const velocity = 1 + dot * blobElong * 0.6
          return Math.max(baseR * 0.15, baseR * organic * velocity).toFixed(1)
        })
        body.style.borderRadius = corners.join('px ') + 'px'
      }

      const onCard = cursorState === 'card' || cursorState === 'card-close' || cursorState === 'case-close' || cursorState === 'link'
      // Card state: clean static pill, with a small scroll-axis elongation
      // driven by the transient scrollKick (subtle "prolonging" during scroll).
      // Content gets the inverse matrix so typography stays undistorted while
      // the pill shell stretches.
      if (onCard) {
        if (scrollKick > 0.001) {
          const axCos = scrollAxisX, axSin = scrollAxisY
          const pillSx = 1 + scrollKick * cfg.pillScrollElong
          const pillSy = 1 - scrollKick * cfg.pillScrollElong * 0.4
          const pm00 = axCos*axCos*pillSx + axSin*axSin*pillSy
          const pm01 = axCos*axSin*pillSx - axSin*axCos*pillSy
          const pm10 = axSin*axCos*pillSx - axCos*axSin*pillSy
          const pm11 = axSin*axSin*pillSx + axCos*axCos*pillSy
          body.style.transform = `translate(-50%,-50%) matrix(${pm00.toFixed(4)},${pm10.toFixed(4)},${pm01.toFixed(4)},${pm11.toFixed(4)},0,0)`
          const invSx = 1 / pillSx, invSy = 1 / pillSy
          const im00 = axCos*axCos*invSx + axSin*axSin*invSy
          const im01 = axCos*axSin*invSx - axSin*axCos*invSy
          const im10 = axSin*axCos*invSx - axCos*axSin*invSy
          const im11 = axSin*axSin*invSx + axCos*axCos*invSy
          content.style.transform = `matrix(${im00.toFixed(4)},${im10.toFixed(4)},${im01.toFixed(4)},${im11.toFixed(4)},0,0)`
        } else {
          body.style.transform = 'translate(-50%,-50%)'
          content.style.transform = ''
        }
      } else {
        body.style.transform = `translate(-50%,-50%) ${blob}`
        content.style.transform = ''
      }

      // 6. Invert spring + pill background for readability
      invertCur += (invertTarg - invertCur) * cfg.invertK * dt
      const inv = invertCur > 0.5
      border.classList.toggle(styles.borderInverted, inv)
      content.classList.toggle(styles.contentInverted, inv)
      if (isPill) {
        const v       = Math.round(invertCur * 255)
        // Opacity scales down on dark backgrounds — light bg needs more coverage,
        // dark bg already has contrast so a lighter overlay suffices
        const opacity = (0.65 - invertCur * 0.30).toFixed(2)
        backdrop.style.background = `rgba(${255 - v},${255 - v},${255 - v},${opacity})`
      } else {
        backdrop.style.background = ''
      }

      // 7. SVG backdrop displacement — springs toward state-appropriate scale
      const targetBDS = onCard ? cfg.backdropScaleCard : cfg.backdropScale
      curBDScale += (targetBDS - curBDScale) * 0.08 * dt
      if (clt && cld) {
        const flowX = 0.018 + Math.sin(now * 0.00024) * 0.006
        const flowY = 0.023 + Math.cos(now * 0.00031) * 0.005
        clt.setAttribute('baseFrequency', `${flowX.toFixed(4)} ${flowY.toFixed(4)}`)
        cld.setAttribute('scale', (curBDScale + blobElong * curBDScale * 3).toFixed(1))
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    // ── Events ────────────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      // Cursor state from data-cursor hierarchy
      const cursorEl = (e.target as HTMLElement | null)?.closest('[data-cursor]') as HTMLElement | null
      if (cursorEl !== hoveredCursorEl) {
        hoveredCursorEl = cursorEl
        lockedCursorScale = cursorEl?.dataset.cursorScale
          ? parseFloat(cursorEl.dataset.cursorScale)
          : 1
      }
      if (cursorEl) {
        const state = cursorEl.dataset.cursor as CursorState
        const label = cursorEl.dataset.cursorLabel
        applyState(state, label)
      } else if (
        cursorState !== 'default' &&
        cursorState !== 'scroll-down' &&
        cursorState !== 'scroll-up' &&
        cursorState !== 'scroll-left' &&
        cursorState !== 'scroll-right' &&
        cursorState !== 'drag-h'
      ) {
        applyState('default')
      }

      // Dark bg detection
      const darkEl = (e.target as HTMLElement | null)?.closest('[data-dark]')
      invertTarg = darkEl ? 1 : 0
    }

    const onWheel = (e: WheelEvent) => {
      const adx = Math.abs(e.deltaX), ady = Math.abs(e.deltaY)
      const total = Math.hypot(e.deltaX, e.deltaY)
      if (total < 1) return

      const delta = Math.max(adx, ady)
      const forceH = !!document.elementFromPoint(mouseX, mouseY)?.closest('[data-cursor-scroll-h]')
      const isHorizontal = forceH || adx > ady

      const cfg = configRef?.current ?? DEFAULT_CURSOR_CONFIG
      const isPillLive = cursorState === 'card' || cursorState === 'card-close' || cursorState === 'case-close' || cursorState === 'link'

      const minInterval = Math.max(45, cfg.scrollIntervalBase - delta * 0.9)
      const nowMs = performance.now()
      if (nowMs - lastRingTime > minInterval) {
        lastRingTime = nowMs
        spawnScrollRing()
      }

      if (isPillLive) {
        // Pill+scroll: keep the pill visible, bump the elongation impulse along
        // the scroll axis. Rings are spawned above, sized to the pill by spawnScrollRing.
        const cap = 60
        scrollKick = Math.min(1.2, scrollKick + Math.min(delta, cap) * cfg.scrollKickAmp / 1000)
        if (isHorizontal) {
          scrollAxisX = e.deltaX > 0 ? 1 : -1
          scrollAxisY = 0
        } else {
          scrollAxisX = 0
          scrollAxisY = e.deltaY > 0 ? 1 : -1
        }
        return
      }

      if (scrollTimer) clearTimeout(scrollTimer)
      cursorState = 'default'
      applyState(isHorizontal
        ? (e.deltaX > 0 ? 'scroll-right' : 'scroll-left')
        : (e.deltaY > 0 ? 'scroll-down'  : 'scroll-up'))
      scrollTimer = setTimeout(() => applyState('default'), 800)
    }

    // Relay from iframes (case study panel) — translate iframe-local coords to parent viewport
    const onIframeCursorMove = (e: MessageEvent) => {
      if (e.data?.type === 'cursor-wheel') {
        onWheel(e.data as unknown as WheelEvent)
        return
      }
      if (e.data?.type !== 'cursor-move') return
      const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe')
      let rect: DOMRect | null = null
      for (const iframe of iframes) {
        if (iframe.contentWindow === e.source) { rect = iframe.getBoundingClientRect(); break }
      }
      if (!rect) return
      mouseX = rect.left + (e.data.x as number)
      mouseY = rect.top  + (e.data.y as number)
      const state = e.data.cursorState as CursorState | null
      const label = e.data.cursorLabel as string | undefined
      if (state) applyState(state, label)
      else if (cursorState !== 'default') applyState('default')
      invertTarg = e.data.dark ? 1 : 0
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('message', onIframeCursorMove)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('message', onIframeCursorMove)
      if (scrollTimer) clearTimeout(scrollTimer)
      svgEl.remove()
      document.body.style.cursor = ''
    }
  }, [tiltRef])

  return (
    <div ref={wrapperRef} className={styles.wrapper} aria-hidden>
      <div ref={bodyRef} className={styles.body}>
        <div ref={backdropRef} className={styles.backdrop} />
        <div ref={borderRef} className={styles.border} />
        <div ref={contentRef} className={styles.content} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
