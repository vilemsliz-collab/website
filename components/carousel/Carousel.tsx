'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  PRESETS, CARDS, REVEAL, INPUT, TILT, GHOST,
  type CarouselCFG,
} from '@/lib/carouselConfig'
import Image from 'next/image'
import {
  lerp, smoothstep, clamp,
  computeCardTransforms, perspAngle, buildRollBase,
} from '@/lib/carouselPhysics'
import styles from './Carousel.module.css'
import DevPanel from './DevPanel'

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
    BLUR_MAX:     p.BLUR_MAX,
    FRICTION:     p.FRICTION,
    SPRING:       p.SPRING,
  }
}

export default function Carousel() {
  // ── DOM refs ──
  const stageRef     = useRef<HTMLDivElement>(null)
  const wrapRefs     = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs     = useRef<(HTMLDivElement | null)[]>([])
  const frameARef    = useRef<HTMLIFrameElement>(null)
  const frameBRef    = useRef<HTMLIFrameElement>(null)
  const casePanelRef = useRef<HTMLDivElement>(null)

  // ── Mutable state refs (no re-renders in physics loops) ──
  const cfg         = useRef<CarouselCFG>(makeCFG())
  const rollBase    = useRef(buildRollBase(N))
  const posY        = useRef(0)
  const velY        = useRef(0)
  const rafId       = useRef<number | null>(null)
  const activeIdx   = useRef(-1)
  const activeCardEl = useRef<HTMLDivElement | null>(null)
  const ghostClones = useRef<HTMLDivElement[]>([])

  const tiltRx   = useRef(0)
  const tiltRy   = useRef(0)
  const tiltVx   = useRef(0)
  const tiltVy   = useRef(0)
  const tiltTx   = useRef(0)
  const tiltTy   = useRef(0)
  const baseTiltY = useRef(0)

  const caseOpen   = useRef(false)
  const frontFrame = useRef<HTMLIFrameElement | null>(null)
  const backFrame  = useRef<HTMLIFrameElement | null>(null)
  const lastKickMs = useRef(0)
  const stageTouch = useRef<number | null>(null)
  const stageMouse = useRef<number | null>(null)
  const swipeStartX = useRef<number | null>(null)
  const splitRafId = useRef<number | null>(null)
  const gyroHandler = useRef<((e: Event) => void) | null>(null)
  const permBtn = useRef<HTMLButtonElement | null>(null)

  // Mutable config refs (updated live by DevPanel)
  const revealRef = useRef({ ...REVEAL })
  const inputRef  = useRef({ ...INPUT })
  const tiltCfg   = useRef({ ...TILT })
  const ghostCfg  = useRef({ ...GHOST })

  // ── React state (only for things that need re-render) ──
  const [caseOpenState, setCaseOpenState] = useState(false)
  const [ctrlOpen, setCtrlOpen] = useState(false)
  const [activeIdxState, setActiveIdxState] = useState(-1)

  // ── Helpers ──
  const isMobile = () => navigator.maxTouchPoints > 0

  const syncPerspective = useCallback(() => {
    if (stageRef.current) {
      stageRef.current.style.perspective = cfg.current.PERSPECTIVE + 'px'
    }
  }, [])

  const applyTransforms = useCallback((pos: number) => {
    const stage = stageRef.current
    if (!stage) return
    const stageWidth = stage.offsetWidth || window.innerWidth
    const transforms = computeCardTransforms(pos, N, cfg.current, stageWidth, rollBase.current)

    transforms.forEach((t, i) => {
      const wrap = wrapRefs.current[i]
      if (!wrap) return
      wrap.style.transform = [
        `translateX(${t.tx.toFixed(1)}px)`,
        `translateY(${t.ty.toFixed(1)}px)`,
        `translateZ(${t.tz.toFixed(1)}px)`,
        `rotateX(${t.rx.toFixed(1)}deg)`,
        `rotateY(${t.ry.toFixed(1)}deg)`,
        `rotateZ(${t.rollDeg.toFixed(1)}deg)`,
        `scale(${t.scale.toFixed(3)})`,
      ].join(' ')
      wrap.style.opacity  = t.opacity.toFixed(3)
      wrap.style.zIndex   = String(t.zIndex)
      wrap.classList.toggle('is-active', t.isActive)

      if (t.isActive) {
        const card = cardRefs.current[i]
        if (card && card !== activeCardEl.current) {
          if (activeCardEl.current) activeCardEl.current.style.transform = ''
          activeCardEl.current = card
          tiltRx.current = tiltRy.current = tiltVx.current = tiltVy.current = 0
          buildActiveClones()
        }
      }
    })
  }, [])

  // ── Ghost clones ──
  const buildActiveClones = useCallback(() => {
    ghostClones.current.forEach(c => c.remove())
    ghostClones.current = []
    const cardEl = activeCardEl.current
    if (!cardEl) return
    const wrap = cardEl.parentElement as HTMLDivElement
    const zVal = ghostCfg.current.variant === 'front' ? '3' : '1'
    for (let i = 0; i < ghostCfg.current.layers; i++) {
      const clone = cardEl.cloneNode(true) as HTMLDivElement
      clone.classList.add(styles.ghostClone)
      clone.style.zIndex = zVal
      // hide text content in clones
      const content = clone.querySelector(`.${styles.cardContent}`) as HTMLElement | null
      if (content) content.style.visibility = 'hidden'
      wrap.insertBefore(clone, cardEl)
      ghostClones.current.push(clone)
    }
  }, [])

  const drawGhosts = useCallback(() => {
    const cardEl = activeCardEl.current
    if (!cardEl || ghostClones.current.length === 0) return
    if (!cardEl.parentElement?.classList.contains('is-active')) {
      ghostClones.current.forEach(c => { c.style.opacity = '0' })
      return
    }
    const mag = Math.abs(tiltRx.current) + Math.abs(tiltRy.current)
    if (mag < 0.3) { ghostClones.current.forEach(c => { c.style.opacity = '0' }); return }
    const P     = 800
    const halfW = cardEl.offsetWidth  / 2
    const halfH = cardEl.offsetHeight / 2
    const gc    = ghostCfg.current
    ghostClones.current.forEach((clone, i) => {
      const scalar = (i + 1) / (gc.layers + 1)
      const rx = perspAngle(tiltRx.current, scalar, halfH, P)
      const ry = perspAngle(tiltRy.current, scalar, halfW, P)
      clone.style.transform    = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      clone.style.opacity      = String(gc.opacity * scalar)
      clone.style.filter       = gc.blur > 0 ? `blur(${(gc.blur * (1 - scalar)).toFixed(2)}px)` : ''
      clone.style.mixBlendMode = gc.blend
    })
  }, [])

  // ── Split transition (scale + perspective interpolation) ──
  const runSplitTransition = useCallback((targetPresetName: string, onEnd: () => void) => {
    if (splitRafId.current) cancelAnimationFrame(splitRafId.current)
    const dur       = 570
    const t0        = performance.now()
    const fromScale = cfg.current.SCALE_ACTIVE
    const fromPersp = cfg.current.PERSPECTIVE
    const toPreset  = PRESETS[targetPresetName]
    const toScale   = toPreset.SCALE_ACTIVE
    const toPersp   = toPreset.PERSPECTIVE
    const ease = (t: number) => t * t * (3 - 2 * t)
    function frame(now: number) {
      const p = Math.min((now - t0) / dur, 1)
      const e = ease(p)
      cfg.current.SCALE_ACTIVE = fromScale + (toScale - fromScale) * e
      cfg.current.PERSPECTIVE  = fromPersp + (toPersp  - fromPersp) * e
      syncPerspective()
      applyTransforms(posY.current)
      if (p < 1) { splitRafId.current = requestAnimationFrame(frame) }
      else { splitRafId.current = null; onEnd() }
    }
    splitRafId.current = requestAnimationFrame(frame)
  }, [syncPerspective, applyTransforms])

  // ── Case panel content switch ──
  const switchCaseContent = useCallback((url: string) => {
    const back = backFrame.current
    const front = frontFrame.current
    if (!back || !front) return
    back.style.opacity = '0'
    const onLoad = () => {
      back.style.opacity = '1'
      back.style.transform = 'translateX(0)'
      setTimeout(() => {
        front.src = ''
        front.style.transition = 'none'
        front.style.transform = 'translateX(100%)'
        requestAnimationFrame(() => { front.style.transition = '' })
        frontFrame.current = back
        backFrame.current  = front
      }, 560)
    }
    back.addEventListener('load', onLoad, { once: true })
    back.src = url
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
    syncPerspective()
  }, [syncPerspective])

  const openCasePanel = useCallback((cardIdx: number) => {
    const front = frontFrame.current
    if (!front) return
    front.style.opacity = '0'
    front.style.transition = 'none'
    front.style.transform = 'translateX(0)'
    requestAnimationFrame(() => { front.style.transition = '' })
    front.addEventListener('load', () => { front.style.opacity = '1' }, { once: true })
    front.src = CARDS[cardIdx].href
    caseOpen.current = true
    setCaseOpenState(true)
    baseTiltY.current = tiltCfg.current.max * 0.5
    tiltTy.current = baseTiltY.current
    runSplitTransition('split', () => { loadPreset('split'); applyTransforms(posY.current) })
  }, [runSplitTransition, loadPreset, applyTransforms])

  const closeCasePanel = useCallback(() => {
    caseOpen.current = false
    setCaseOpenState(false)
    baseTiltY.current = 0
    tiltTy.current = 0
    const targetPreset = window.innerWidth >= 768 ? 'desktop' : 'mobile'
    runSplitTransition(targetPreset, () => {
      const front = frontFrame.current
      const back  = backFrame.current
      if (front) { front.src = '' }
      if (back) {
        back.style.transition = 'none'
        back.style.transform = 'translateX(100%)'
        requestAnimationFrame(() => { if (back) back.style.transition = '' })
        back.src = ''
      }
      loadPreset(targetPreset)
      applyTransforms(posY.current)
    })
  }, [runSplitTransition, loadPreset, applyTransforms])

  // ── Physics loop ──
  const kick = useCallback(() => {
    if (!rafId.current) rafId.current = requestAnimationFrame(loop)
  }, [])

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
        applyTransforms(posY.current)
        const newIdx = (((Math.round(posY.current) % N) + N) % N)
        if (newIdx !== activeIdx.current) {
          activeIdx.current = newIdx
          setActiveIdxState(newIdx)
          if (caseOpen.current) {
            switchCaseContent(CARDS[newIdx].href)
          }
        }
        rafId.current = null
        return
      }
    }
    applyTransforms(posY.current)
    rafId.current = requestAnimationFrame(loop)
  }

  // ── Tilt loop ──
  useEffect(() => {
    let tiltRafId: number
    function tiltLoop() {
      tiltVx.current += (tiltTx.current - tiltRx.current) * tiltCfg.current.stiffness
      tiltVy.current += (tiltTy.current - tiltRy.current) * tiltCfg.current.stiffness
      tiltVx.current *= tiltCfg.current.damping
      tiltVy.current *= tiltCfg.current.damping
      tiltRx.current += tiltVx.current
      tiltRy.current += tiltVy.current
      const cardEl = activeCardEl.current
      if (cardEl) {
        const isActive = cardEl.parentElement?.classList.contains('is-active')
        if (!isActive) { tiltTx.current = 0; tiltTy.current = 0 }
        cardEl.style.transform = `rotateX(${tiltRx.current.toFixed(3)}deg) rotateY(${tiltRy.current.toFixed(3)}deg)`
        if (!isActive && Math.abs(tiltRx.current) < 0.05 && Math.abs(tiltRy.current) < 0.05) {
          cardEl.style.transform = ''
        }
      }
      drawGhosts()
      tiltRafId = requestAnimationFrame(tiltLoop)
    }
    tiltRafId = requestAnimationFrame(tiltLoop)
    return () => cancelAnimationFrame(tiltRafId)
  }, [drawGhosts])

  // ── Gyroscope ──
  const attachGyro = useCallback(() => {
    if (gyroHandler.current) window.removeEventListener('deviceorientation', gyroHandler.current)
    const handler = (e: Event) => {
      const gamma = (e as DeviceOrientationEvent).gamma ?? 0
      const beta  = (e as DeviceOrientationEvent).beta  ?? 0
      tiltTy.current = clamp( (gamma / 30) * tiltCfg.current.max, -tiltCfg.current.max, tiltCfg.current.max)
      tiltTx.current = clamp(((beta - 45) / 30) * tiltCfg.current.max, -tiltCfg.current.max, tiltCfg.current.max)
    }
    gyroHandler.current = handler
    window.addEventListener('deviceorientation', handler)
  }, [])

  // ── All input event listeners ──
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    // Init frames
    frontFrame.current = frameARef.current
    backFrame.current  = frameBRef.current
    if (frameBRef.current) {
      frameBRef.current.style.transform = 'translateX(100%)'
    }

    // Breakpoint
    function checkBreakpoint() { loadPreset((stage?.offsetWidth ?? window.innerWidth) >= 768 ? 'desktop' : 'mobile') }

    // Mouse tilt
    function onMouseMove(e: MouseEvent) {
      if (isMobile()) return
      if (caseOpen.current) {
        const stW = stageRef.current?.offsetWidth ?? window.innerWidth
        if (e.clientX <= stW) {
          const rel = (e.clientX / stW - 0.5) * 2
          tiltTy.current = clamp(baseTiltY.current + rel * tiltCfg.current.max * 0.6, -tiltCfg.current.max, tiltCfg.current.max)
        }
      } else {
        tiltTy.current = (e.clientX / window.innerWidth - 0.5) * 2 * tiltCfg.current.max
      }
      tiltTx.current = -(e.clientY / window.innerHeight - 0.5) * 2 * tiltCfg.current.max
    }
    function onMouseLeave() { if (!isMobile()) tiltTy.current = baseTiltY.current }

    // Touch
    function onTouchStart(e: TouchEvent) {
      swipeStartX.current = e.touches[0].clientX
      stageTouch.current  = e.touches[0].clientX
      if (window.innerWidth >= 768) velY.current = 0
    }
    function onTouchMove(e: TouchEvent) {
      if (stageTouch.current === null) return
      if (window.innerWidth >= 768) {
        const dragK = 1 / (window.innerWidth * inputRef.current.touchSens)
        const dPos = -(e.touches[0].clientX - stageTouch.current) * dragK
        velY.current = velY.current * 0.5 + dPos * 0.5
        posY.current += dPos
        stageTouch.current = e.touches[0].clientX
        applyTransforms(posY.current)
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (window.innerWidth < 768 && swipeStartX.current !== null) {
        const delta = (e.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current
        if (Math.abs(delta) > 20) {
          const now = Date.now()
          if (now - lastKickMs.current >= 200) {
            velY.current = Math.sign(-delta) * inputRef.current.mouseKick
            lastKickMs.current = now
            kick()
          }
        } else {
          kick()
        }
      } else {
        kick()
      }
      stageTouch.current = null
      swipeStartX.current = null
    }

    // Mouse drag
    function onMouseDown(e: MouseEvent) { stageMouse.current = e.clientX }
    function onWindowMouseMove(e: MouseEvent) {
      if (stageMouse.current !== null && !rafId.current) {
        const dragK = 1 / (window.innerWidth * inputRef.current.touchSens)
        const dPos = -(e.clientX - stageMouse.current) * dragK
        velY.current = velY.current * 0.5 + dPos * 0.5
        posY.current += dPos
        stageMouse.current = e.clientX
        applyTransforms(posY.current)
      }
    }
    function onMouseUp() {
      if (stageMouse.current !== null) kick()
      stageMouse.current = null
    }

    // Wheel
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const d   = e.deltaX + e.deltaY
      const mag = Math.abs(d)
      if (mag < 40) return
      const now = Date.now()
      if (now - lastKickMs.current >= 200) {
        velY.current = Math.sign(d) * inputRef.current.mouseKick
        lastKickMs.current = now
        kick()
      }
    }

    // Keyboard
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && !rafId.current) { velY.current += inputRef.current.mouseKick; kick() }
      if (e.key === 'ArrowLeft'  && !rafId.current) { velY.current -= inputRef.current.mouseKick; kick() }
    }

    // Resize
    function onResize() { checkBreakpoint(); applyTransforms(posY.current) }

    stage.addEventListener('mousemove', onMouseMove)
    stage.addEventListener('mouseleave', onMouseLeave)
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: true })
    stage.addEventListener('touchend', onTouchEnd, { passive: true })
    stage.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    // Gyroscope setup
    if (isMobile()) {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        const btn = document.createElement('button')
        btn.textContent = 'enable tilt'
        btn.style.cssText = 'position:fixed;bottom:120px;right:20px;padding:10px 16px;border-radius:8px;border:1px solid rgba(0,0,0,0.15);background:#1c1b1f;color:#fff;font-family:var(--font-mono),monospace;font-size:12px;cursor:pointer;z-index:999;touch-action:auto'
        document.body.appendChild(btn)
        permBtn.current = btn
        btn.addEventListener('click', () => {
          ;(DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
            .requestPermission()
            .then(state => { if (state === 'granted') attachGyro(); btn.remove(); permBtn.current = null })
            .catch(() => { btn.remove(); permBtn.current = null })
        })
      } else {
        attachGyro()
      }
    }

    // Init
    checkBreakpoint()
    applyTransforms(0)
    requestAnimationFrame(() => {
      activeIdx.current = 0
      setActiveIdxState(0)
    })

    return () => {
      stage.removeEventListener('mousemove', onMouseMove)
      stage.removeEventListener('mouseleave', onMouseLeave)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onWindowMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      if (rafId.current) cancelAnimationFrame(rafId.current)
      if (splitRafId.current) cancelAnimationFrame(splitRafId.current)
      if (gyroHandler.current) { window.removeEventListener('deviceorientation', gyroHandler.current); gyroHandler.current = null }
      if (permBtn.current) { permBtn.current.remove(); permBtn.current = null }
    }
  }, [applyTransforms, loadPreset, kick, attachGyro, switchCaseContent])

  // ── Card click ──
  const handleCardClick = useCallback((i: number) => {
    if (i !== activeIdx.current) {
      const currentMod = (((Math.round(posY.current) % N) + N) % N)
      let delta = i - currentMod
      if (delta >  N / 2) delta -= N
      if (delta < -N / 2) delta += N
      velY.current = delta * inputRef.current.mouseKick
      kick()
      if (!caseOpen.current) setTimeout(() => openCasePanel(i), 100)
    } else {
      if (!caseOpen.current) openCasePanel(i)
    }
  }, [kick, openCasePanel])

  const handleCaseToggle = useCallback(() => {
    if (caseOpen.current) closeCasePanel()
    else openCasePanel(activeIdx.current)
  }, [closeCasePanel, openCasePanel])

  return (
    <div className={`${styles.root} ${caseOpenState ? styles.caseOpen : ''} ${ctrlOpen ? styles.ctrlOpen : ''}`}>
      {/* ── Stage ── */}
      <div id="stage" ref={stageRef} className={styles.stage}>
        <button
          className={styles.caseToggleBtn}
          aria-label="Toggle case study"
          onClick={handleCaseToggle}
        >
          {caseOpenState ? '✕' : '⤢'}
        </button>

        {CARDS.map((card, i) => (
          <div
            key={card.id}
            ref={el => { wrapRefs.current[i] = el }}
            className={styles.cardWrap}
            data-index={i}
            onClick={() => handleCardClick(i)}
          >
            <div
              ref={el => { cardRefs.current[i] = el }}
              className={styles.card}
              data-index={i}
              style={{ background: card.bg }}
            >
              {card.video ? (
                <video
                  className={styles.cardBg}
                  src={card.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : card.img ? (
                <Image
                  className={styles.cardBg}
                  src={card.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 364px"
                  style={{ objectFit: 'cover' }}
                  priority={i === 0}
                />
              ) : null}
              <div className={styles.cardOverlay} />
              <div className={styles.cardContent}>
                <p className={`type-label-large ${styles.cardLine}`}>{card.role}</p>
                <p className={`type-headline-large ${styles.cardLine}`}>{card.lines[0]}</p>
                <p className={`type-headline-large ${styles.cardLine}`}>{card.lines[1]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Case panel ── */}
      <div ref={casePanelRef} className={styles.casePanel}>
        <iframe
          ref={frameARef}
          id="case-frame-a"
          className={styles.caseFrame}
          src=""
          title="Case study"
        />
        <iframe
          ref={frameBRef}
          id="case-frame-b"
          className={styles.caseFrame}
          src=""
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
        onCfgChange={() => { syncPerspective(); applyTransforms(posY.current) }}
        onGhostRebuild={buildActiveClones}
      />
    </div>
  )
}
