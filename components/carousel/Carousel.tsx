'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PRESETS, CARDS, REVEAL, INPUT, TILT, GHOST, LIGHT,
  type CarouselCFG, type CarouselPreset,
} from '@/lib/carouselConfig'
import {
  buildRollBase,
} from '@/lib/carouselPhysics'
import { useCardDimensions } from '@/hooks/useCardDimensions'
import styles from './Carousel.module.css'
import CustomCursor from '@/components/cursor/CustomCursor'
import DevPanel, { type GlassConfig } from './DevPanel'
import CarouselDOMScene from './CarouselDOMScene'
import ScrollHint from './ScrollHint'

const N = CARDS.length

function makeCFG(): CarouselCFG {
  const p = PRESETS.mobile
  return {
    R_MULT:       p.R_MULT,
    R_MAX:        p.R_MAX,
    PERSPECTIVE:  p.PERSPECTIVE,
    LAT:          [...(p.LAT ?? [-30, 18, -42, 35, -12])],
    LON_SPREAD:   p.LON_SPREAD ?? 1.0,
    ROT_MULT:     p.ROT_MULT,
    ROLL_MAX:     p.ROLL_MAX,
    SCALE_ACTIVE: p.SCALE_ACTIVE,
    SCALE_SPHERE: p.SCALE_SPHERE,
    OPACITY_MULT: p.OPACITY_MULT,
    OPACITY_BASE: p.OPACITY_BASE,
    FRICTION:     p.FRICTION,
    SPRING:       p.SPRING,
    Y_OFFSET:     p.Y_OFFSET,
  }
}

export default function Carousel() {
  const router = useRouter()

  // ── DOM refs ──
  const frameARef    = useRef<HTMLIFrameElement>(null)
  const frameBRef    = useRef<HTMLIFrameElement>(null)
  const casePanelRef = useRef<HTMLDivElement>(null)

  // Unified carousel sizing — single source of truth, writes CSS vars and
  // returns a ref physics loops can read without re-rendering.
  const dims = useCardDimensions()

  // ── Mutable state refs (no re-renders in physics loops) ──
  const caseOpen = useRef(false)
  const cfg      = useRef<CarouselCFG>(makeCFG())
  const rollBase = useRef(buildRollBase(N))
  const posY     = useRef(0)
  const velY     = useRef(0)
  const rafId    = useRef<number | null>(null)
  const activeIdx = useRef(-1)

  const tiltRx    = useRef(0)
  const tiltRy    = useRef(0)
  const tiltVx    = useRef(0)
  const tiltVy    = useRef(0)
  const tiltTx    = useRef(0)
  const tiltTy    = useRef(0)
  const baseTiltY = useRef(0)

  const carouselWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1440)

  const frontFrame  = useRef<HTMLIFrameElement | null>(null)
  const backFrame   = useRef<HTMLIFrameElement | null>(null)
  const lastKickMs  = useRef(0)
  const shakeVel    = useRef(0)
  const stageTouch  = useRef<number | null>(null)
  const stageMouse  = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const swipeStartX = useRef<number | null>(null)
  const splitRafId  = useRef<number | null>(null)
  const gyroHandler = useRef<((e: Event) => void) | null>(null)
  const permBtn     = useRef<HTMLButtonElement | null>(null)

  // Mutable config refs (updated live by DevPanel)
  const revealRef = useRef({ ...REVEAL })
  const inputRef  = useRef({ ...INPUT })
  const tiltCfg   = useRef({ ...TILT })
  const ghostCfg  = useRef({ ...GHOST })
  const lightCfg  = useRef({ ...LIGHT })
  const glassCfg  = useRef<GlassConfig>({ blur: 40, opacity: 0.60, color: 255 })

  const applyGlass = useCallback(() => {
    const el = casePanelRef.current
    if (!el) return
    const { blur, opacity, color } = glassCfg.current
    el.style.backdropFilter = `blur(${blur}px)`;
    (el.style as unknown as Record<string, string>).webkitBackdropFilter = `blur(${blur}px)`
    el.style.background = `rgba(${color},${color},${color},${opacity})`
  }, [])

  // Apply glass values on mount so inline styles match config from the start
  useEffect(() => { applyGlass() }, [applyGlass])

  // Lock document scroll + touch while the carousel is mounted; restore on
  // unmount so the case study route can scroll natively on mobile.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlTouch:    html.style.touchAction,
      bodyOverflow: body.style.overflow,
      bodyTouch:    body.style.touchAction,
      bodySelect:   body.style.userSelect,
    }
    html.style.overflow   = 'hidden'
    html.style.touchAction = 'none'
    body.style.overflow   = 'hidden'
    body.style.touchAction = 'none'
    body.style.userSelect = 'none'
    return () => {
      html.style.overflow    = prev.htmlOverflow
      html.style.touchAction = prev.htmlTouch
      body.style.overflow    = prev.bodyOverflow
      body.style.touchAction = prev.bodyTouch
      body.style.userSelect  = prev.bodySelect
    }
  }, [])

  // ── Scroll hint idle timer ──
  const scrollHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scrollHintVisible, setScrollHintVisible] = useState(false)

  const startScrollHintTimer = useCallback(() => {
    if (scrollHintTimer.current) clearTimeout(scrollHintTimer.current)
    setScrollHintVisible(false)
    scrollHintTimer.current = setTimeout(() => setScrollHintVisible(true), 5000)
  }, [])

  const dismissScrollHint = useCallback(() => {
    setScrollHintVisible(false)
    if (scrollHintTimer.current) {
      clearTimeout(scrollHintTimer.current)
      scrollHintTimer.current = null
    }
  }, [])

  // Start timer on mount
  useEffect(() => {
    startScrollHintTimer()
    return () => { if (scrollHintTimer.current) clearTimeout(scrollHintTimer.current) }
  }, [startScrollHintTimer])

  // ── React state (only for things that need re-render) ──
  const [caseOpenState, setCaseOpenState] = useState(false)
  const [ctrlOpen, setCtrlOpen] = useState(false)

  const isMobile = () => navigator.maxTouchPoints > 0

  // ── Case panel content switch ──
  const switchCaseContent = useCallback((url: string) => {
    const back  = backFrame.current
    const front = frontFrame.current
    if (!back || !front) return

    // Position back frame off-screen left, invisible — no transition
    back.style.transition = 'none'
    back.style.transform  = 'translateX(-40px)'
    back.style.opacity    = '0'
    back.src = url

    // Fade out front
    front.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    front.style.opacity    = '0'

    back.addEventListener('load', () => {
      // Send position to back frame before it slides in so content renders at the
      // correct offset and doesn't shift after the slide-in completes.
      const cardH = dims.current.cardH
      const topY = dims.current.viewportH / 2 + cfg.current.Y_OFFSET - (cardH * cfg.current.SCALE_ACTIVE / 2) - 20
      back.contentWindow?.postMessage({ type: 'card-top-y', value: topY }, '*')
      document.documentElement.style.setProperty('--card-top-y', `${topY}px`)
      requestAnimationFrame(() => {
        back.style.transition = 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease'
        back.style.transform  = 'translateX(0)'
        back.style.opacity    = '1'
        setTimeout(() => {
          front.style.transition = 'none'
          front.style.opacity    = '1'
          front.style.transform  = 'translateX(100%)'
          front.src = ''
          frontFrame.current = back
          backFrame.current  = front
        }, 560)
      })
    }, { once: true })
  }, [])

  const loadPreset = useCallback((name: string) => {
    const p = PRESETS[name]
    Object.keys(p).forEach(k => {
      const key = k as keyof typeof p
      if (key === 'LAT' && Array.isArray(p[key])) {
        cfg.current.LAT = [...(p[key] as number[])]
      } else if (key === 'LON_SPREAD') {
        cfg.current.LON_SPREAD = (p[key] as number) ?? 1.0
      } else {
        (cfg.current as unknown as Record<string, unknown>)[k] = p[key]
      }
    })
  }, [])

  // ── Split transition (interpolates ALL numeric preset values so nothing snaps) ──
  const runSplitTransition = useCallback((targetPresetName: string, onEnd: () => void) => {
    if (splitRafId.current) cancelAnimationFrame(splitRafId.current)
    const dur      = 570
    const t0       = performance.now()
    const toPreset = PRESETS[targetPresetName]
    const ease     = (t: number) => t * t * (3 - 2 * t)

    const keys = (Object.keys(toPreset) as (keyof CarouselPreset)[])
      .filter(k => typeof toPreset[k] === 'number')
    const fromVals: Partial<Record<keyof CarouselPreset, number>> = {}
    const toVals:   Partial<Record<keyof CarouselPreset, number>> = {}
    keys.forEach(k => {
      fromVals[k] = cfg.current[k] as number
      toVals[k]   = toPreset[k]   as number
    })

    function frame(now: number) {
      const p = Math.min((now - t0) / dur, 1)
      const e = ease(p)
      keys.forEach(k => {
        ;(cfg.current as unknown as Record<string, number>)[k] =
          fromVals[k]! + (toVals[k]! - fromVals[k]!) * e
      })
      if (p < 1) { splitRafId.current = requestAnimationFrame(frame) }
      else        { splitRafId.current = null; onEnd() }
    }
    splitRafId.current = requestAnimationFrame(frame)
  }, [])

  const openCasePanel = useCallback((cardIdx: number) => {
    if (isMobile()) return
    const front = frontFrame.current
    if (!front) return
    // Write target top-Y to a CSS var on the parent doc BEFORE setting src so the
    // iframe can read it synchronously via useLayoutEffect on mount (no layout shift).
    const splitCardH = dims.current.cardH
    const targetTopY = dims.current.viewportH / 2
      + (PRESETS.split.Y_OFFSET as number)
      - (splitCardH * (PRESETS.split.SCALE_ACTIVE as number) / 2)
      - 20  // panel sits 20px from viewport top; iframe y=0 starts there
    document.documentElement.style.setProperty('--card-top-y', `${targetTopY}px`)
    front.style.transition = 'none'
    front.style.transform  = 'translateX(0)'
    requestAnimationFrame(() => { front.style.transition = '' })
    front.src = CARDS[cardIdx].href
    caseOpen.current = true
    setCaseOpenState(true)
    baseTiltY.current = 0
    tiltTx.current    = 0
    tiltTy.current    = 0
    runSplitTransition('split', () => { loadPreset('split') })
  }, [runSplitTransition, loadPreset])

  const closeCasePanel = useCallback(() => {
    caseOpen.current = false
    setCaseOpenState(false)
    baseTiltY.current = 0
    tiltTy.current    = 0
    const targetPreset = dims.current.isMobile ? 'mobile' : 'desktop'
    runSplitTransition(targetPreset, () => {
      const front = frontFrame.current
      const back  = backFrame.current
      if (front) { front.src = '' }
      if (back) {
        back.style.transition = 'none'
        back.style.transform  = 'translateX(100%)'
        requestAnimationFrame(() => { if (back) back.style.transition = '' })
        back.src = ''
      }
      loadPreset(targetPreset)
    })
  }, [runSplitTransition, loadPreset])

  // ── Physics loop (posY/velY spring — R3F useFrame reads posY.current each frame) ──
  const kick = useCallback(() => {
    if (!rafId.current) rafId.current = requestAnimationFrame(loop)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  let lastLoopTime = 0
  function loop(now: number) {
    const dt = lastLoopTime ? Math.min((now - lastLoopTime) / 16.667, 4) : 1
    lastLoopTime = now

    velY.current *= Math.pow(cfg.current.FRICTION, dt)
    posY.current += velY.current * dt

    const target = Math.round(posY.current)
    if (Math.abs(velY.current) < 0.02) {
      const spring = (target - posY.current) * cfg.current.SPRING
      posY.current += spring * dt
      if (Math.abs(velY.current) < 0.003 && Math.abs(posY.current - target) < 0.002) {
        posY.current = ((target % N) + N) % N
        velY.current = 0
        lastLoopTime = 0
        rafId.current = null
        return
      }
    }
    rafId.current = requestAnimationFrame(loop)
  }

  // ── Tilt loop (spring physics only — R3F useFrame reads tiltRx/tiltRy each frame) ──
  useEffect(() => {
    let tiltRafId: number
    let lastTiltTime = 0
    function tiltLoop(now: number) {
      const dt = lastTiltTime ? Math.min((now - lastTiltTime) / 16.667, 4) : 1
      lastTiltTime = now
      tiltVx.current += (tiltTx.current - tiltRx.current) * tiltCfg.current.stiffness * dt
      tiltVy.current += (tiltTy.current - tiltRy.current) * tiltCfg.current.stiffness * dt
      tiltVx.current *= Math.pow(tiltCfg.current.damping, dt)
      tiltVy.current *= Math.pow(tiltCfg.current.damping, dt)
      tiltRx.current += tiltVx.current * dt
      tiltRy.current += tiltVy.current * dt
      tiltRafId = requestAnimationFrame(tiltLoop)
    }
    tiltRafId = requestAnimationFrame(tiltLoop)
    return () => cancelAnimationFrame(tiltRafId)
  }, [])

  // Gyroscope disabled — tilt is desktop-only for unified feel

  // ── All input event listeners ──
  useEffect(() => {
    frontFrame.current = frameARef.current
    backFrame.current  = frameBRef.current
    if (frameBRef.current) {
      frameBRef.current.style.transform = 'translateX(100%)'
    }

    function checkBreakpoint() { loadPreset(dims.current.isMobile ? 'mobile' : 'desktop') }

    // Combined mouse handler: tilt + drag
    function onMouseMove(e: MouseEvent) {
      // Tilt
      if (!isMobile() && !caseOpen.current) {
        tiltTy.current = (e.clientX / dims.current.viewportW - 0.5) * 2 * tiltCfg.current.max
        tiltTx.current = -(e.clientY / dims.current.viewportH - 0.5) * 2 * tiltCfg.current.max
      }
      // Drag
      if (stageMouse.current !== null && !rafId.current) {
        const dragK = 1 / (dims.current.viewportW * inputRef.current.touchSens)
        const dPos  = -(e.clientX - stageMouse.current) * dragK
        if (Math.abs(e.clientX - stageMouse.current) > 4) hasDraggedRef.current = true
        velY.current   = velY.current * 0.5 + dPos * 0.5
        posY.current  += dPos
        stageMouse.current = e.clientX
      }
    }
    function onMouseLeave() { if (!isMobile()) { tiltTx.current = 0; tiltTy.current = baseTiltY.current } }
    function onMouseDown(e: MouseEvent) { stageMouse.current = e.clientX; hasDraggedRef.current = false; dismissScrollHint() }
    function onMouseUp() { if (stageMouse.current !== null) kick(); stageMouse.current = null }

    // Touch
    function onTouchStart(e: TouchEvent) {
      dismissScrollHint()
      swipeStartX.current  = e.touches[0].clientX
      stageTouch.current   = e.touches[0].clientX
      if (!dims.current.isMobile) velY.current = 0
    }
    function onTouchMove(e: TouchEvent) {
      if (stageTouch.current === null) return

      if (!dims.current.isMobile) {
        const dragK = 1 / (dims.current.viewportW * inputRef.current.touchSens)
        const dPos  = -(e.touches[0].clientX - stageTouch.current) * dragK
        velY.current   = velY.current * 0.5 + dPos * 0.5
        posY.current  += dPos
        stageTouch.current = e.touches[0].clientX
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (dims.current.isMobile && swipeStartX.current !== null) {
        const deltaX = (e.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current

        // Horizontal swipe → navigate carousel
        if (Math.abs(deltaX) > 20) {
          const now = Date.now()
          if (now - lastKickMs.current >= 200) {
            velY.current       = Math.sign(-deltaX) * inputRef.current.mouseKick
            lastKickMs.current = now
            kick()
          }
        } else {
          // Tap — snap only
          kick()
        }
      } else {
        kick()
      }
      stageTouch.current  = null
      swipeStartX.current = null
    }

    // Wheel
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      dismissScrollHint()
      const d   = e.deltaX + e.deltaY
      const mag = Math.abs(d)
      if (mag < 40) return
      const now = Date.now()
      if (now - lastKickMs.current >= 200) {
        velY.current   = Math.sign(d) * inputRef.current.mouseKick
        lastKickMs.current = now
        kick()
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && !rafId.current) { velY.current += inputRef.current.mouseKick; kick() }
      if (e.key === 'ArrowLeft'  && !rafId.current) { velY.current -= inputRef.current.mouseKick; kick() }
    }

    function onResize() { checkBreakpoint() }

    // Overscroll from case study iframe → gentle shake of active card
    function onIframeScroll(e: MessageEvent) {
      if (!caseOpen.current) return
      if (e.data?.type === 'case-close') { closeCasePanel(); return }
      if (e.data?.type !== 'carousel-overscroll') return
      const d = e.data.delta as number
      if (!d) return
      const now = Date.now()
      if (now - lastKickMs.current >= 500) {
        shakeVel.current = Math.sign(d) * 0.036
        lastKickMs.current = now
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    window.addEventListener('message', onIframeScroll)

    checkBreakpoint()
    requestAnimationFrame(() => {
      activeIdx.current = 0
    })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('message', onIframeScroll)
      if (rafId.current)      cancelAnimationFrame(rafId.current)
      if (splitRafId.current) cancelAnimationFrame(splitRafId.current)
      if (gyroHandler.current) {
        window.removeEventListener('deviceorientation', gyroHandler.current)
        gyroHandler.current = null
      }
      if (permBtn.current) { permBtn.current.remove(); permBtn.current = null }
    }
  }, [loadPreset, kick, switchCaseContent, dismissScrollHint, closeCasePanel])

  // ── Stage background click → close case panel ──
  const handleStageClick = useCallback(() => {
    if (!hasDraggedRef.current && caseOpen.current && !isMobile()) closeCasePanel()
  }, [closeCasePanel])

  // ── Active card change ──
  const handleActiveChange = useCallback((i: number) => {
    startScrollHintTimer()
    // Desktop: switch case panel content when panel is open
    if (!isMobile() && caseOpen.current) {
      switchCaseContent(CARDS[i].href)
    }
  }, [switchCaseContent, startScrollHintTimer])

  // ── Card click ──
  const handleCardClick = useCallback((i: number) => {
    if (isMobile()) {
      router.push(CARDS[i].href)
      return
    }
    if (i !== activeIdx.current) {
      const currentMod = (((Math.round(posY.current) % N) + N) % N)
      let delta = i - currentMod
      if (delta >  N / 2) delta -= N
      if (delta < -N / 2) delta += N
      velY.current = delta * inputRef.current.mouseKick
      kick()
      if (!caseOpen.current) setTimeout(() => openCasePanel(i), 100)
    } else {
      if (caseOpen.current) closeCasePanel()
      else openCasePanel(i)
    }
  }, [kick, openCasePanel, closeCasePanel, router])

  return (
    <div className={`${styles.root} ${caseOpenState ? styles.caseOpen : ''} ${ctrlOpen ? styles.ctrlOpen : ''}`}>
      <CustomCursor />

      {/* ── DOM Carousel ── */}
      <div className={styles.carouselStage} onClick={handleStageClick}>
        <ScrollHint visible={scrollHintVisible} />
        <CarouselDOMScene
          posY={posY}
          cfg={cfg}
          rollBase={rollBase}
          tiltRx={tiltRx}
          tiltRy={tiltRy}
          activeIdx={activeIdx}
          ghostCfg={ghostCfg}
          tiltCfg={tiltCfg}
          lightCfg={lightCfg}
          caseOpen={caseOpen}
          shakeVel={shakeVel}
          carouselWidthRef={carouselWidthRef}
          dimsRef={dims}
          onActiveChange={handleActiveChange}
          onCardClick={handleCardClick}
        />
      </div>

      {/* ── Case panel cursor blocker — prevents card-close cursor leaking into panel zone ── */}
      {caseOpenState && <div className={styles.casePanelBlocker} aria-hidden />}

      {/* ── Case panel ── */}
      <div ref={casePanelRef} className={styles.casePanel}>
        <iframe
          ref={frameARef}
          id="case-frame-a"
          className={styles.caseFrame}
          title="Case study"
        />
        <iframe
          ref={frameBRef}
          id="case-frame-b"
          className={styles.caseFrame}
          title="Case study next"
        />
      </div>

      {/* ── Site nav ── */}
      <nav className={styles.siteNav}>
        <a href="/portfolio" className={styles.navActive} data-cursor="link" data-cursor-label="Portfolio">Portfolio</a>
        <a href="/card" data-cursor="link" data-cursor-label="Card + Cursor">Card + Cursor</a>
        <a href="/design-system" data-cursor="link" data-cursor-label="Design System">Design System</a>
      </nav>

      {/* ── Dev panel ── */}
      <DevPanel
        open={ctrlOpen}
        onToggle={() => setCtrlOpen(v => !v)}
        cfg={cfg}
        revealRef={revealRef}
        inputRef={inputRef}
        tiltCfg={tiltCfg}
        ghostCfg={ghostCfg}
        lightCfg={lightCfg}
        glassCfg={glassCfg}
        onCfgChange={() => {}}
        onGhostRebuild={() => {}}
        onGlassChange={applyGlass}
      />
    </div>
  )
}
