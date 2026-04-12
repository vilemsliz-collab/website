'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  PRESETS, CARDS, REVEAL, INPUT, TILT, GHOST,
  type CarouselCFG, type CarouselPreset,
} from '@/lib/carouselConfig'
import {
  clamp, buildRollBase,
} from '@/lib/carouselPhysics'
import { CASES } from '@/data/cases'
import styles from './Carousel.module.css'
import DevPanel, { type GlassConfig } from './DevPanel'
import MobileCaseStudy, { type MobileCaseStudyHandle, PEEK_PCT } from '@/components/mobile-case/MobileCaseStudy'

const CarouselCanvas = dynamic(() => import('./CarouselCanvas'), { ssr: false })

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
  // ── DOM refs ──
  const frameARef    = useRef<HTMLIFrameElement>(null)
  const frameBRef    = useRef<HTMLIFrameElement>(null)
  const casePanelRef = useRef<HTMLDivElement>(null)

  // ── Mutable state refs (no re-renders in physics loops) ──
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

  const caseOpen    = useRef(false)
  const frontFrame  = useRef<HTMLIFrameElement | null>(null)
  const backFrame   = useRef<HTMLIFrameElement | null>(null)
  const lastKickMs  = useRef(0)
  const shakeVel    = useRef(0)
  const stageTouch  = useRef<number | null>(null)
  const stageMouse  = useRef<number | null>(null)
  const swipeStartX = useRef<number | null>(null)
  const splitRafId  = useRef<number | null>(null)
  const gyroHandler = useRef<((e: Event) => void) | null>(null)
  const permBtn     = useRef<HTMLButtonElement | null>(null)

  // Mutable config refs (updated live by DevPanel)
  const revealRef = useRef({ ...REVEAL })
  const inputRef  = useRef({ ...INPUT })
  const tiltCfg   = useRef({ ...TILT })
  const ghostCfg  = useRef({ ...GHOST })
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

  // ── Mobile case study refs/state ──
  const mobileCaseRef    = useRef<MobileCaseStudyHandle>(null)
  const mobileCaseIdxRef = useRef<number | null>(null)
  const pendingCaseIdx   = useRef<number | null>(null)
  const verticalDragRef  = useRef(false)
  const caseModeRef      = useRef(false)
  const touchStartY      = useRef<number | null>(null)
  const dragStartPctRef  = useRef(PEEK_PCT)

  // ── React state (only for things that need re-render) ──
  const [caseOpenState, setCaseOpenState] = useState(false)
  const [ctrlOpen, setCtrlOpen] = useState(false)
  const [mobileCaseState, setMobileCaseState] = useState<{ idx: number } | null>(null)

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
      const topY = window.innerHeight / 2 + cfg.current.Y_OFFSET - (555 * cfg.current.SCALE_ACTIVE / 2) - 20
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

  const enterMobileCase = useCallback((idx: number) => {
    mobileCaseIdxRef.current = idx
    caseModeRef.current = true
    setMobileCaseState({ idx })
    requestAnimationFrame(() => mobileCaseRef.current?.snapOpen())
  }, [])

  const exitMobileCase = useCallback(() => {
    caseModeRef.current = false
    const nextIdx = (mobileCaseIdxRef.current! + 1) % N
    posY.current = nextIdx
    velY.current = 0
    activeIdx.current = nextIdx
    mobileCaseIdxRef.current = nextIdx
    pendingCaseIdx.current = null
    setMobileCaseState({ idx: nextIdx })
    setTimeout(() => mobileCaseRef.current?.snapPeek(), 50)
  }, [])

  const openCasePanel = useCallback((cardIdx: number) => {
    if (isMobile()) return
    const front = frontFrame.current
    if (!front) return
    // Write target top-Y to a CSS var on the parent doc BEFORE setting src so the
    // iframe can read it synchronously via useLayoutEffect on mount (no layout shift).
    const targetTopY = window.innerHeight / 2
      + (PRESETS.split.Y_OFFSET as number)
      - (555 * (PRESETS.split.SCALE_ACTIVE as number) / 2)
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

  // Stable ref so onTouchEnd (stale closure) can always call the latest openCasePanel
  const openCasePanelRef = useRef(openCasePanel)
  useEffect(() => { openCasePanelRef.current = openCasePanel }, [openCasePanel])

  const closeCasePanel = useCallback(() => {
    caseOpen.current = false
    setCaseOpenState(false)
    baseTiltY.current = 0
    tiltTy.current    = 0
    const targetPreset = window.innerWidth >= 768 ? 'desktop' : 'mobile'
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

  function loop() {
    velY.current *= cfg.current.FRICTION
    posY.current += velY.current

    const target = Math.round(posY.current)
    if (Math.abs(velY.current) < 0.02) {
      const spring = (target - posY.current) * cfg.current.SPRING
      posY.current += spring
      if (Math.abs(velY.current) < 0.003 && Math.abs(posY.current - target) < 0.002) {
        posY.current = ((target % N) + N) % N
        velY.current = 0
        rafId.current = null
        return
      }
    }
    rafId.current = requestAnimationFrame(loop)
  }

  // ── Tilt loop (spring physics only — R3F useFrame reads tiltRx/tiltRy each frame) ──
  useEffect(() => {
    let tiltRafId: number
    function tiltLoop() {
      tiltVx.current += (tiltTx.current - tiltRx.current) * tiltCfg.current.stiffness
      tiltVy.current += (tiltTy.current - tiltRy.current) * tiltCfg.current.stiffness
      tiltVx.current *= tiltCfg.current.damping
      tiltVy.current *= tiltCfg.current.damping
      tiltRx.current += tiltVx.current
      tiltRy.current += tiltVy.current
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

    function checkBreakpoint() { loadPreset(window.innerWidth >= 768 ? 'desktop' : 'mobile') }

    // Combined mouse handler: tilt + drag
    function onMouseMove(e: MouseEvent) {
      // Tilt
      if (!isMobile() && !caseOpen.current) {
        tiltTy.current = (e.clientX / window.innerWidth - 0.5) * 2 * tiltCfg.current.max
        tiltTx.current = -(e.clientY / window.innerHeight - 0.5) * 2 * tiltCfg.current.max
      }
      // Drag
      if (stageMouse.current !== null && !rafId.current) {
        const dragK = 1 / (window.innerWidth * inputRef.current.touchSens)
        const dPos  = -(e.clientX - stageMouse.current) * dragK
        velY.current   = velY.current * 0.5 + dPos * 0.5
        posY.current  += dPos
        stageMouse.current = e.clientX
      }
    }
    function onMouseLeave() { if (!isMobile()) { tiltTx.current = 0; tiltTy.current = baseTiltY.current } }
    function onMouseDown(e: MouseEvent) { stageMouse.current = e.clientX }
    function onMouseUp() { if (stageMouse.current !== null) kick(); stageMouse.current = null }

    // Touch
    function onTouchStart(e: TouchEvent) {
      // Don't capture carousel touch state while case study is fully open
      if (window.innerWidth < 768 && caseModeRef.current) return
      swipeStartX.current  = e.touches[0].clientX
      touchStartY.current  = e.touches[0].clientY
      stageTouch.current   = e.touches[0].clientX
      verticalDragRef.current  = false
      pendingCaseIdx.current   = null
      if (window.innerWidth >= 768) velY.current = 0
    }
    function onTouchMove(e: TouchEvent) {
      if (stageTouch.current === null) return

      if (window.innerWidth >= 768) {
        const dragK = 1 / (window.innerWidth * inputRef.current.touchSens)
        const dPos  = -(e.touches[0].clientX - stageTouch.current) * dragK
        velY.current   = velY.current * 0.5 + dPos * 0.5
        posY.current  += dPos
        stageTouch.current = e.touches[0].clientX
        return
      }

      // Mobile: detect vertical drag to open case study
      if (!caseModeRef.current) {
        const deltaY = (touchStartY.current ?? 0) - e.touches[0].clientY   // positive = finger moved up
        const deltaX = Math.abs(e.touches[0].clientX - (swipeStartX.current ?? 0))

        if (!verticalDragRef.current && deltaY > 8 && deltaY > deltaX * 1.5) {
          verticalDragRef.current = true
          dragStartPctRef.current = PEEK_PCT  // always starting from peek
          pendingCaseIdx.current  = mobileCaseIdxRef.current
        }

        if (verticalDragRef.current && deltaY > 0) {
          e.preventDefault()
          const pct = Math.max(0, dragStartPctRef.current - (deltaY / window.innerHeight) * 100)
          mobileCaseRef.current?.setDragOffset(pct)
        }
      }
    }
    function onTouchEnd(e: TouchEvent) {
      // Mobile vertical drag — snap open or back to peek
      if (window.innerWidth < 768 && verticalDragRef.current) {
        verticalDragRef.current = false
        const endY   = e.changedTouches[0]?.clientY ?? (touchStartY.current ?? 0)
        const deltaY = (touchStartY.current ?? 0) - endY
        if (deltaY > window.innerHeight * 0.15) {
          caseModeRef.current = true
          requestAnimationFrame(() => mobileCaseRef.current?.snapOpen())
        } else {
          mobileCaseRef.current?.snapPeek()
        }
        stageTouch.current  = null
        swipeStartX.current = null
        touchStartY.current = null
        return
      }

      // Don't drive carousel while case study is fully open
      if (window.innerWidth < 768 && caseModeRef.current) {
        stageTouch.current  = null
        swipeStartX.current = null
        touchStartY.current = null
        return
      }

      if (window.innerWidth < 768 && swipeStartX.current !== null) {
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
      touchStartY.current = null
    }

    // Wheel
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      // Scroll down → open case study (desktop DevTools testing + mobile wheel)
      if (e.deltaY > 40 && !caseModeRef.current) {
        caseModeRef.current = true
        requestAnimationFrame(() => mobileCaseRef.current?.snapOpen())
        return
      }
      const d   = e.deltaX + e.deltaY
      const mag = Math.abs(d)
      if (mag < 40) return
      if (caseModeRef.current) return  // in case mode, wheel handled by overlay scroll
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

    // Mobile: mount overlay in peek state immediately
    if (navigator.maxTouchPoints > 0) {
      mobileCaseIdxRef.current = 0
      setMobileCaseState({ idx: 0 })
      setTimeout(() => mobileCaseRef.current?.snapPeek(), 50)
    }

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
  }, [loadPreset, kick, switchCaseContent])

  // ── Card click ──
  const handleCardClick = useCallback((i: number) => {
    if (isMobile()) return  // mobile: case study via swipe up only
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
  }, [kick, openCasePanel, closeCasePanel])

  return (
    <div className={`${styles.root} ${caseOpenState ? styles.caseOpen : ''} ${ctrlOpen ? styles.ctrlOpen : ''}`}>

      {/* ── WebGL Carousel ── */}
      <div className={styles.carouselStage}>
        <CarouselCanvas
          posY={posY}
          cfg={cfg}
          rollBase={rollBase}
          tiltRx={tiltRx}
          tiltRy={tiltRy}
          activeIdx={activeIdx}
          ghostCfg={ghostCfg}
          tiltCfg={tiltCfg}
          caseOpen={caseOpen}
          shakeVel={shakeVel}
          carouselWidthRef={carouselWidthRef}
          onActiveChange={() => {}}
          onCaseSwitch={switchCaseContent}
          onCardClick={handleCardClick}
          onEmptyClick={() => { if (caseOpen.current) closeCasePanel() }}
        />
      </div>

      {/* ── Case panel ── */}
      <div ref={casePanelRef} className={styles.casePanel}>
        <button
          className={styles.casePanelClose}
          aria-label="Close case study"
          onClick={closeCasePanel}
        >✕</button>
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
        <a href="/portfolio" className={styles.navActive}>Portfolio</a>
        <a href="/card">Card</a>
        <a href="/design-system">Design System</a>
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
        glassCfg={glassCfg}
        onCfgChange={() => {}}
        onGhostRebuild={() => {}}
        onGlassChange={applyGlass}
      />

      {/* ── Mobile case study overlay ── */}
      {mobileCaseState !== null && (() => {
        const cs = CASES.find(c => c.slug === CARDS[mobileCaseState.idx].id)
        return cs ? (
          <MobileCaseStudy
            ref={mobileCaseRef}
            cs={cs}
            onScrollEnd={exitMobileCase}
          />
        ) : null
      })()}
    </div>
  )
}
