'use client'

import { useEffect, useRef } from 'react'
import s from './HpAnimationCanvas.module.css'

// ── Spring physics ─────────────────────────────────────────────────────────

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

// ── Constants ──────────────────────────────────────────────────────────────

const CANVAS_W     = 600
const CANVAS_H     = 460
const CARD_W       = 264
const CARD_H       = 152
const GRAD_SCALE   = 4
const BLOB_R       = 27
const SPOT_COUNT   = 9
const MIN_DT       = 1 / 240
const MAX_DT       = 1 / 30
const DWELL_MS     = 4000
const TRANSITION_MS = 800
const SCALE_UP     = 1.10
const SCALE_MID    = 0.93
const SCALE_DOWN   = 0.80
const PUSH_PX      = 14
const ARC          = 0.65

interface CardConfig { title: string; icon: 'planning' | 'shield'; avatars: string[]; agents: string[] }
interface Slot { left: number; top: number }

const CARDS: CardConfig[] = [
  { title: 'Project planning', icon: 'planning', avatars: ['avatar-female-02', 'avatar-male-01'],  agents: ['custom']           },
  { title: 'Risk mitigation',  icon: 'shield',   avatars: ['avatar-female-03', 'avatar-male-02'],  agents: ['risk', 'intake']   },
  { title: 'Backlog review',   icon: 'shield',   avatars: ['avatar-female-04'],                    agents: ['triaging']         },
]

const SLOTS: Slot[] = [
  { left: 39,  top: 26  },
  { left: 310, top: 176 },
  { left: 23,  top: 258 },
]

const BLOB_BG = [
  /* 0 */ 'radial-gradient(circle 27px at center, #aaff00, transparent)',
  /* 1 */ 'radial-gradient(circle 27px at center, #00e05c, transparent)',
  /* 2 */ 'radial-gradient(circle 27px at center, #00e05c, transparent)',
  /* 3 */ 'radial-gradient(circle 27px at center, #00ff2b, transparent)',
  /* 4 */ 'radial-gradient(circle 27px at center, #00ff2b, transparent)',
  /* 5 */ 'radial-gradient(circle 27px at center, #aaff00, transparent)',
  /* 6 */ 'radial-gradient(circle 27px at center, #00e05c, transparent)',
  /* 7 */ 'radial-gradient(circle 27px at center, #00ff2b, transparent)',
  /* 8 */ 'radial-gradient(circle 27px at center, #00e05c, transparent)',
]

const AVATAR_CLS: Record<string, string> = {
  'avatar-female-02': s.avatarFemale02,
  'avatar-male-01':   s.avatarMale01,
  'avatar-female-03': s.avatarFemale03,
  'avatar-male-02':   s.avatarMale02,
  'avatar-female-04': s.avatarFemale04,
}

// ── Component ──────────────────────────────────────────────────────────────

export default function HpAnimationCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLDivElement>(null)
  const cardRefs   = useRef<HTMLDivElement[]>([])
  const blobRefs   = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const wrapper  = wrapperRef.current!
    const canvas   = canvasRef.current!
    const cardEls  = cardRefs.current
    const blobEls  = blobRefs.current
    const linesActiveClass = s.linesActive

    const home = SLOTS.map(sl => ({ ...sl }))
    const centroid = {
      x: SLOTS.reduce((a, p) => a + p.left, 0) / SLOTS.length,
      y: SLOTS.reduce((a, p) => a + p.top,  0) / SLOTS.length,
    }

    const cardState = CARDS.map(() => ({ tx: 0, ty: 0, scale: 1 }))
    let slotToCard  = [0, 1, 2]
    const cardAnimIds = new Map<number, number>()
    let hoverTarget: { x: number; y: number } | null = null
    let isVisible   = true
    let rafId       = 0
    let cycleTimer  = 0
    let lastTime    = 0

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Cache tile elements per card once
    const tilesByCard = new Map<number, HTMLElement[]>()
    cardEls.forEach((card, i) => {
      tilesByCard.set(i, Array.from(card.querySelectorAll<HTMLElement>('[data-tile]')))
    })

    // ── Gradient blob springs ─────────────────────────────────────────────

    const mapX = new Spring(8, 2.5)
    const mapY = new Spring(8, 2.5)
    mapX.value = mapX.target = CANVAS_W / 2 / GRAD_SCALE
    mapY.value = mapY.target = CANVAS_H / 2 / GRAD_SCALE

    const spots = Array.from({ length: SPOT_COUNT }, (_, i) => {
      const sprX = new Spring(5, 1.4)
      const sprY = new Spring(5, 1.4)
      const a = (i / SPOT_COUNT) * Math.PI * 2
      const r = (35 + Math.random() * 20) / GRAD_SCALE
      sprX.value = sprX.target = Math.cos(a) * r
      sprY.value = sprY.target = Math.sin(a) * r
      return {
        sprX, sprY,
        freqX:  0.028 + i * 0.008,
        freqY:  0.024 + i * 0.009,
        phaseX: (i / SPOT_COUNT) * Math.PI * 2,
        phaseY: (i / SPOT_COUNT) * Math.PI * 2 + 1.1 + i * 0.35,
        ampX:   0.55 + (i % 5) * 0.14,
        ampY:   0.60 + ((i + 2) % 5) * 0.10,
      }
    })

    // ── Helpers ───────────────────────────────────────────────────────────

    function slotCenter(si: number) {
      return { x: SLOTS[si].left + CARD_W / 2, y: SLOTS[si].top + CARD_H / 2 }
    }

    function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5) }

    // ── Card animation (Bézier arc between positions) ─────────────────────

    function animateCard(ci: number, targetTx: number, targetTy: number, targetScale: number, shadow: string) {
      const prev = cardAnimIds.get(ci)
      if (prev !== undefined) cancelAnimationFrame(prev)

      const el = cardEls[ci]
      if (!el) return

      el.style.boxShadow = shadow
      el.style.zIndex    = targetScale > 1 ? '10' : targetScale < 1 ? '0' : '1'

      const { tx: sTx, ty: sTy, scale: sScale } = cardState[ci]
      const dx   = targetTx - sTx
      const dy   = targetTy - sTy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1

      const midTx  = (sTx + targetTx) / 2
      const midTy  = (sTy + targetTy) / 2
      const outX   = home[ci].left + midTx - centroid.x
      const outY   = home[ci].top  + midTy - centroid.y
      const outD   = Math.sqrt(outX * outX + outY * outY) || 1
      const ctrlTx = midTx + (outX / outD) * ARC * dist * 0.7
      const ctrlTy = midTy + (outY / outD) * ARC * dist * 0.7

      if (reducedMotion) {
        el.style.transform = `translate(${targetTx.toFixed(2)}px, ${targetTy.toFixed(2)}px) scale(${targetScale.toFixed(4)})`
        cardState[ci] = { tx: targetTx, ty: targetTy, scale: targetScale }
        return
      }

      const t0   = performance.now()
      const tick = (now: number) => {
        const raw = Math.min((now - t0) / TRANSITION_MS, 1)
        const te  = easeOutQuint(raw)
        const u   = 1 - te
        const tx  = u * u * sTx + 2 * u * te * ctrlTx + te * te * targetTx
        const ty  = u * u * sTy + 2 * u * te * ctrlTy + te * te * targetTy
        const sc  = sScale + (targetScale - sScale) * te

        el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`
        cardState[ci] = { tx, ty, scale: sc }

        if (raw < 1) { cardAnimIds.set(ci, requestAnimationFrame(tick)) }
        else         { cardAnimIds.delete(ci) }
      }
      cardAnimIds.set(ci, requestAnimationFrame(tick))
    }

    function setCard(ci: number, si: number, extraTx: number, extraTy: number, scale: number, shadow: string) {
      animateCard(ci, SLOTS[si].left - home[ci].left + extraTx, SLOTS[si].top - home[ci].top + extraTy, scale, shadow)
    }

    function setTiles(ci: number, active: boolean) {
      const card = cardEls[ci]
      if (!card) return
      card.dataset.tilesActive = active ? '1' : ''
      const tiles  = tilesByCard.get(ci) ?? []
      const center = (tiles.length - 1) / 2
      tiles.forEach((tile, i) => {
        tile.style.transitionDelay = active ? `${i * 45}ms` : `${(tiles.length - 1 - i) * 20}ms`
        tile.style.transform = active ? `translateX(${((i - center) * 4).toFixed(1)}px) scale(1.06)` : ''
      })
    }

    function applyTileHover(tile: HTMLElement, entering: boolean) {
      const card = tile.closest<HTMLDivElement>('[data-card]')
      if (!card) return
      const ci     = cardEls.indexOf(card)
      const tiles  = tilesByCard.get(ci) ?? []
      const active = !!card.dataset.tilesActive
      const center = (tiles.length - 1) / 2
      const i      = tiles.indexOf(tile)
      tile.style.transitionDelay = '0ms'
      if (active) {
        const spread = ((i - center) * 4).toFixed(1)
        tile.style.transform = entering ? `translateX(${spread}px) scale(1.14)` : `translateX(${spread}px) scale(1.06)`
      } else {
        tile.style.transform = entering ? 'scale(1.08)' : ''
      }
    }

    // ── Render states ─────────────────────────────────────────────────────

    function renderCycle() {
      const active = slotToCard[0]
      hoverTarget  = slotCenter(0)
      cardEls.forEach((_, i) => {
        const si     = slotToCard.indexOf(i)
        const scale  = [SCALE_UP, SCALE_DOWN, SCALE_MID][si]
        setCard(i, si, 0, 0, scale, i === active ? 'var(--shadow-hover)' : 'var(--shadow-card)')
      })
      cardEls.forEach((_, i) => setTiles(i, false))
      cardEls.forEach((card, i) => card.classList.toggle(linesActiveClass, i === active))
    }

    function renderHover(hoveredIdx: number) {
      const si = slotToCard.indexOf(hoveredIdx)
      const hc = slotCenter(si)
      hoverTarget  = hc
      const remaining = [0, 2, 1].filter(x => x !== si)
      const scaleMap  = new Map([[si, SCALE_UP + 0.03], [remaining[0], SCALE_MID], [remaining[1], SCALE_DOWN]])
      cardEls.forEach((_, i) => {
        const sl    = slotToCard.indexOf(i)
        const scale = scaleMap.get(sl)!
        if (i === hoveredIdx) {
          setCard(i, sl, 0, 0, scale, 'var(--shadow-hover)')
        } else {
          const oc  = slotCenter(sl)
          const dx  = oc.x - hc.x
          const dy  = oc.y - hc.y
          const mag = Math.sqrt(dx * dx + dy * dy) || 1
          setCard(i, sl, (dx / mag) * PUSH_PX, (dy / mag) * PUSH_PX, scale, 'var(--shadow-card)')
        }
      })
      cardEls.forEach((_, i) => setTiles(i, i === hoveredIdx))
      cardEls.forEach((card, i) => card.classList.toggle(linesActiveClass, i === hoveredIdx))
    }

    // ── RAF loop ──────────────────────────────────────────────────────────

    const loop = (now: number) => {
      const dt   = Math.max(MIN_DT, Math.min(MAX_DT, (now - lastTime) / 1000))
      lastTime   = now
      const tNow = now / 1000
      const TAU  = Math.PI * 2
      const cx   = CANVAS_W / 2 / GRAD_SCALE
      const cy   = CANVAS_H / 2 / GRAD_SCALE
      const wx   = cx + Math.sin(tNow * 0.13  * TAU) * (70 / GRAD_SCALE)
      const wy   = cy - Math.sin(tNow * 0.097 * TAU + 1.3) * (55 / GRAD_SCALE)

      if (hoverTarget) {
        mapX.setTarget(wx * 0.4 + (hoverTarget.x / GRAD_SCALE) * 0.6)
        mapY.setTarget(wy * 0.4 + (hoverTarget.y / GRAD_SCALE) * 0.6)
      } else {
        mapX.setTarget(wx)
        mapY.setTarget(wy)
      }
      mapX.tick(dt); mapY.tick(dt)

      const mx  = mapX.value
      const my  = mapY.value
      const amp = (140 + Math.sin(tNow * 0.09 * TAU + 0.7) * 30) / GRAD_SCALE

      for (let i = 0; i < spots.length; i++) {
        const sp = spots[i]
        const tx = Math.sin(tNow * sp.freqX * TAU + sp.phaseX)              * amp * sp.ampX
                 + Math.sin(tNow * sp.freqX * 2.618 * TAU + sp.phaseX + 0.9) * amp * 0.28 * sp.ampX
        const ty = Math.cos(tNow * sp.freqY * TAU + sp.phaseY)              * amp * sp.ampY
                 + Math.cos(tNow * sp.freqY * 1.732 * TAU + sp.phaseY + 1.3) * amp * 0.28 * sp.ampY
        sp.sprX.setTarget(tx); sp.sprY.setTarget(ty)
        sp.sprX.tick(dt);      sp.sprY.tick(dt)
        const blob = blobEls[i]
        if (blob) blob.style.transform = `translate3d(${(mx + sp.sprX.value - BLOB_R).toFixed(1)}px, ${(my + sp.sprY.value - BLOB_R).toFixed(1)}px, 0)`
      }

      rafId = requestAnimationFrame(loop)
    }

    // ── Cycle ─────────────────────────────────────────────────────────────

    function stopCycle() { clearTimeout(cycleTimer); cycleTimer = 0 }
    function startCycle() {
      if (reducedMotion || !isVisible) return
      clearTimeout(cycleTimer)
      cycleTimer = window.setTimeout(() => {
        slotToCard = [slotToCard[1], slotToCard[2], slotToCard[0]]
        renderCycle()
        startCycle()
      }, DWELL_MS)
    }

    // ── Listeners ─────────────────────────────────────────────────────────

    const off: (() => void)[] = []
    cardEls.forEach((card, i) => {
      const fn = () => { stopCycle(); renderHover(i) }
      card.addEventListener('mouseenter', fn)
      off.push(() => card.removeEventListener('mouseenter', fn))
    })
    const onLeave = () => { renderCycle(); startCycle() }
    canvas.addEventListener('mouseleave', onLeave)
    off.push(() => canvas.removeEventListener('mouseleave', onLeave))
    tilesByCard.forEach(tiles => tiles.forEach(tile => {
      const enter = () => applyTileHover(tile, true)
      const leave = () => applyTileHover(tile, false)
      tile.addEventListener('mouseenter', enter)
      tile.addEventListener('mouseleave', leave)
      off.push(() => { tile.removeEventListener('mouseenter', enter); tile.removeEventListener('mouseleave', leave) })
    }))

    // ── Observers ─────────────────────────────────────────────────────────

    const ro = new ResizeObserver(entries => {
      const w     = entries[0].contentRect.width
      const scale = Math.min(1.08, w / CANVAS_W)
      wrapper.style.height   = `${(CANVAS_H * scale).toFixed(1)}px`
      canvas.style.transform = `scale(${scale.toFixed(4)})`
    })
    ro.observe(wrapper)

    const io = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting
      if (visible === isVisible) return
      isVisible = visible
      if (reducedMotion) return
      if (visible) {
        lastTime = performance.now()
        rafId = requestAnimationFrame(loop)
        startCycle()
      } else {
        cancelAnimationFrame(rafId); rafId = 0; stopCycle()
      }
    }, { threshold: 0 })
    io.observe(wrapper)

    // ── Boot ──────────────────────────────────────────────────────────────

    renderCycle()
    if (!reducedMotion) {
      startCycle()
      lastTime = performance.now()
      rafId    = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(cycleTimer)
      cardAnimIds.forEach(id => cancelAnimationFrame(id))
      cardAnimIds.clear()
      ro.disconnect()
      io.disconnect()
      off.forEach(fn => fn())
    }
  }, [])

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="agent-sparkle" viewBox="0 0 76 76">
            <path fill="currentColor" d="M62.197 3.235c.35-.91 1.571-.91 1.885 0l2.34 6.22a1 1 0 0 0 .558.583l5.97 2.437c.873.364.873 1.637 0 1.965l-5.97 2.437c-.28.11-.454.328-.559.582l-2.339 6.221c-.349.91-1.57.91-1.885 0l-2.339-6.22a1 1 0 0 0-.559-.583l-5.97-2.437c-.872-.364-.872-1.637 0-1.965l5.97-2.437c.28-.11.454-.327.559-.582z"/>
          </symbol>
          <symbol id="agent-custom" viewBox="0 0 76 76">
            <path fill="currentColor" d="M38.338 12.244c1.27 0 2.302 1.074 2.302 2.398s-1.031 2.398-2.303 2.398h-2.28v4.752h6.86c6.932 0 12.665 5.344 13.613 12.294 2.741.945 4.72 3.634 4.72 6.807v4.773c0 3.172-1.979 5.86-4.72 6.806-.947 6.95-6.68 12.296-13.612 12.296h-18.32c-6.932 0-12.665-5.346-13.613-12.296-2.74-.945-4.718-3.634-4.718-6.806v-4.773c0-3.173 1.977-5.862 4.718-6.807.948-6.95 6.681-12.294 13.613-12.294h6.856V17.04h-2.276c-1.271 0-2.301-1.073-2.301-2.398 0-1.324 1.03-2.398 2.3-2.398zM24.922 32.37c-2.169 0-3.926 1.831-3.926 4.09s1.757 4.091 3.926 4.091c2.168 0 3.925-1.831 3.925-4.09s-1.757-4.091-3.925-4.091m17.665 0c-2.168 0-3.926 1.831-3.926 4.09s1.758 4.091 3.926 4.091 3.926-1.831 3.926-4.09-1.758-4.091-3.926-4.091"/>
            <use href="#agent-sparkle"/>
          </symbol>
          <symbol id="agent-risk" viewBox="0 0 76 76">
            <path fill="currentColor" d="M30.206 17.773c.43 0 .86.1 1.253.287l17.63 7.91c2.059.92 3.593 3.068 3.584 5.661-.047 9.82-3.865 27.786-19.988 35.952a5.44 5.44 0 0 1-4.94 0C11.612 59.417 7.804 41.451 7.757 31.631c-.01-2.593 1.525-4.741 3.584-5.662l17.62-7.909a2.9 2.9 0 0 1 1.245-.287"/>
            <use href="#agent-sparkle"/>
          </symbol>
          <symbol id="agent-intake" viewBox="0 0 76 76">
            <path fill="currentColor" d="M26.775 18.508c0-3.603 2.803-6.524 6.26-6.524 3.459 0 6.262 2.921 6.262 6.524v3.915H41.8c3.5 0 5.251 0 6.632.596 1.84.794 3.303 2.318 4.066 4.237.572 1.438.572 3.262.572 6.91h3.757c3.457 0 6.26 2.92 6.26 6.524s-2.803 6.524-6.26 6.524H53.07v4.436c0 4.385 0 6.577-.819 8.252a7.68 7.68 0 0 1-3.283 3.421c-1.608.853-3.711.853-7.92.853H25.023c-4.208 0-6.312 0-7.919-.853a7.68 7.68 0 0 1-3.283-3.421C13 58.227 13 56.035 13 51.65v-4.436h3.757c3.457 0 6.26-2.921 6.26-6.524s-2.803-6.524-6.26-6.524H13c0-3.648 0-5.472.572-6.91.762-1.919 2.225-3.443 4.066-4.237 1.38-.596 3.131-.596 6.632-.596h2.504z"/>
            <use href="#agent-sparkle"/>
          </symbol>
          <symbol id="agent-triaging" viewBox="0 0 76 76">
            <path fill="currentColor" d="M49.876 22.707c1.126 0 2.148.743 2.585 1.886s.192 2.447-.612 3.314L35.904 45.305v10.923c0 .81-.297 1.581-.82 2.153l-5.59 6.094c-.803.877-1.999 1.134-3.047.657s-1.72-1.58-1.72-2.809V45.305L8.782 27.916c-.804-.876-1.04-2.18-.603-3.323s1.45-1.886 2.576-1.886z"/>
            <use href="#agent-sparkle"/>
          </symbol>
        </defs>
      </svg>

      <div
        id="case-hp-animation"
        data-element="HP Animation Canvas"
        ref={wrapperRef}
        className={s.canvasWrapper}
      >
        <div ref={canvasRef} className={s.canvas}>

          <div className={s.gradientMap} aria-hidden="true">
            {BLOB_BG.map((bg, i) => (
              <div
                key={i}
                ref={el => { if (el) blobRefs.current[i] = el }}
                className={s.blob}
                style={{ background: bg }}
              />
            ))}
          </div>

          {CARDS.map((card, i) => (
            <div
              key={card.title}
              ref={el => { if (el) cardRefs.current[i] = el }}
              data-card=""
              className={s.card}
              style={{ left: SLOTS[i].left, top: SLOTS[i].top }}
            >
              <div className={s.cardHeader}>
                <div className={s.cardTitleRow}>
                  <div className={s.cardIcon} aria-hidden="true">
                    {card.icon === 'planning' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4.5C4 3.67 4.67 3 5.5 3H11C11.55 3 12 3.45 12 4V19C12 18.17 11.33 17.5 10.5 17.5H4V4.5Z" stroke="#162136" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M20 4.5C20 3.67 19.33 3 18.5 3H13C12.45 3 12 3.45 12 4V19C12 18.17 12.67 17.5 13.5 17.5H20V4.5Z" stroke="#162136" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M6.5 7.5H9.5M6.5 10.5H9.5M14.5 7.5H17.5M14.5 10.5H16.5" stroke="#162136" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 5.5V11.5C4 16.1 7.4 20.4 12 21.5C16.6 20.4 20 16.1 20 11.5V5.5L12 2Z" stroke="#162136" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="#162136" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={s.cardTitle}>{card.title}</span>
                </div>

                <div className={s.cardLines} aria-hidden="true">
                  <div className={s.line} />
                  <div className={`${s.line} ${s.lineShort}`} />
                </div>
              </div>

              <div className={s.cardFooter}>
                {card.avatars.map(avatar => (
                  <div
                    key={avatar}
                    data-tile=""
                    className={`${s.avatar} ${AVATAR_CLS[avatar] ?? ''}`}
                    role="img"
                    aria-label={avatar}
                  />
                ))}
                {card.agents.map(agent => (
                  <div
                    key={agent}
                    data-tile=""
                    className={s.agentBadge}
                    role="img"
                    aria-label={`${agent} agent`}
                  >
                    <svg width="28" height="28" viewBox="0 0 76 76" aria-hidden="true">
                      <use href={`#agent-${agent}`} />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </>
  )
}
