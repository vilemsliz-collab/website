'use client'

import { useEffect, useRef } from 'react'
import s from './AgentsGridCanvas.module.css'

// ── Spring ──────────────────────────────────────────────────────────────────

class Spring {
  value = 0; target = 0; velocity = 0
  constructor(public k: number, public d: number) {}
  setTarget(t: number) { this.target = t }
  tick(dt: number) {
    const f = -this.k * (this.value - this.target) - this.d * this.velocity
    this.velocity += f * dt
    this.value    += this.velocity * dt
  }
  get settled() {
    return Math.abs(this.value - this.target) < 0.001 && Math.abs(this.velocity) < 0.001
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const GRID_W     = 372
const GRID_H     = 372
const TILE_PITCH = 127   // 118px tile + 9px gap
const TILE_HALF  = 59    // 118 / 2
const WANDER_AMP = GRID_W * 0.38

const CFG = { hoverScale: 1.05, pushPx: 16, stagger: 30, hoverK: 100, hoverD: 40, moveK: 160, moveD: 40 }

type AgentIcon = 'triaging' | 'intake' | 'risk' | 'custom'
type TileData  = { kind: 'person' } | { kind: 'agent'; icon: AgentIcon }

const TILES: TileData[] = [
  { kind: 'person'                  }, { kind: 'agent', icon: 'triaging' }, { kind: 'person'                },
  { kind: 'agent', icon: 'intake'   }, { kind: 'person'                  }, { kind: 'agent', icon: 'risk'   },
  { kind: 'person'                  }, { kind: 'agent', icon: 'custom'   }, { kind: 'person'                },
]

function manhattan(ar: number, ac: number, br: number, bc: number) {
  return Math.abs(ar - br) + Math.abs(ac - bc)
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AgentsGridCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const gradRef    = useRef<HTMLDivElement>(null)
  const tileRefs   = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const wrapper = wrapperRef.current!
    const grid    = gridRef.current!
    const grad    = gradRef.current!
    const tileEls = tileRefs.current

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Gradient springs ──────────────────────────────────────────────────
    const mapX = new Spring(28, 9)
    const mapY = new Spring(28, 9)
    mapX.value = mapX.target = GRID_W / 2
    mapY.value = mapY.target = GRID_H / 2

    const spots = Array.from({ length: 9 }, (_, i) => {
      const sprX = new Spring(12, 5)
      const sprY = new Spring(12, 5)
      const a = (i / 9) * Math.PI * 2
      const r = 25 + Math.random() * 15
      sprX.value = sprX.target = Math.cos(a) * r
      sprY.value = sprY.target = Math.sin(a) * r
      return { sprX, sprY, nextRetarget: 0 }
    })

    // ── Tile springs ──────────────────────────────────────────────────────
    const tileSprings = TILES.map(() => {
      const hover = new Spring(CFG.hoverK, CFG.hoverD)
      hover.value = 1; hover.target = 1
      return { hover, sx: new Spring(CFG.moveK, CFG.moveD), sy: new Spring(CFG.moveK, CFG.moveD) }
    })

    let isHovering = false
    let isVisible  = true
    let rafId      = 0

    // ── RAF loop ──────────────────────────────────────────────────────────
    function loop() {
      const dt  = 1 / 60
      const tw  = performance.now() / 1000
      const TAU = Math.PI * 2

      tileSprings.forEach(({ hover, sx, sy }, i) => {
        hover.tick(dt); sx.tick(dt); sy.tick(dt)
        const el = tileEls[i]
        if (el) el.style.transform = `translate(${sx.value.toFixed(2)}px,${sy.value.toFixed(2)}px) scale(${hover.value.toFixed(4)})`
      })

      if (!isHovering) {
        mapX.setTarget(GRID_W / 2 + Math.sin(tw * 0.13 * TAU) * WANDER_AMP)
        mapY.setTarget(GRID_H / 2 + Math.sin(tw * 0.097 * TAU + 1.3) * WANDER_AMP)
      }
      mapX.tick(dt); mapY.tick(dt)
      grad.style.setProperty('--map-x', `${mapX.value.toFixed(1)}px`)
      grad.style.setProperty('--map-y', `${mapY.value.toFixed(1)}px`)

      const ampPulse = 90 + Math.sin(tw * 0.11 * TAU + 0.7) * 15
      spots.forEach((sp, i) => {
        if (tw > sp.nextRetarget) {
          sp.sprX.setTarget((Math.random() - 0.5) * 2 * ampPulse)
          sp.sprY.setTarget((Math.random() - 0.5) * 2 * ampPulse)
          sp.nextRetarget = tw + 3 + Math.random() * 5
        }
        sp.sprX.tick(dt); sp.sprY.tick(dt)
        grad.style.setProperty(`--c${i}-dx`, `${sp.sprX.value.toFixed(1)}px`)
        grad.style.setProperty(`--c${i}-dy`, `${sp.sprY.value.toFixed(1)}px`)
      })

      rafId = requestAnimationFrame(loop)
    }

    // ── Hover interactions ─────────────────────────────────────────────────
    const off: (() => void)[] = []
    let staggerIds: ReturnType<typeof setTimeout>[] = []
    let resetId:    ReturnType<typeof setTimeout> | null = null

    TILES.forEach((_, i) => {
      const row = Math.floor(i / 3)
      const col = i % 3
      const el  = tileEls[i]
      if (!el) return

      const onEnter = () => {
        staggerIds.forEach(clearTimeout); staggerIds = []
        if (resetId) { clearTimeout(resetId); resetId = null }
        isHovering = true
        mapX.setTarget(col * TILE_PITCH + TILE_HALF)
        mapY.setTarget(row * TILE_PITCH + TILE_HALF)

        tileSprings.forEach((sp, j) => {
          sp.hover.velocity = 0; sp.sx.velocity = 0; sp.sy.velocity = 0
          const d = manhattan(row, col, Math.floor(j / 3), j % 3)
          if (d === 0) {
            sp.hover.setTarget(CFG.hoverScale)
            sp.sx.setTarget(0); sp.sy.setTarget(0)
          } else {
            sp.hover.setTarget(1)
            const dx = (j % 3) - col
            const dy = Math.floor(j / 3) - row
            const mag = Math.sqrt(dx * dx + dy * dy)
            staggerIds.push(setTimeout(() => {
              sp.sx.setTarget((dx / mag) * CFG.pushPx)
              sp.sy.setTarget((dy / mag) * CFG.pushPx)
            }, d * CFG.stagger))
          }
        })
      }
      el.addEventListener('mouseenter', onEnter)
      off.push(() => el.removeEventListener('mouseenter', onEnter))
    })

    const onLeave = () => {
      staggerIds.forEach(clearTimeout); staggerIds = []
      tileSprings.forEach(sp => { sp.hover.setTarget(1); sp.sx.setTarget(0); sp.sy.setTarget(0) })
      isHovering = false
      resetId = setTimeout(() => {
        tileSprings.forEach(sp => {
          sp.hover.value = 1; sp.hover.target = 1; sp.hover.velocity = 0
          sp.sx.value = 0;    sp.sx.target = 0;    sp.sx.velocity = 0
          sp.sy.value = 0;    sp.sy.target = 0;    sp.sy.velocity = 0
        })
        tileEls.forEach(el => { if (el) el.style.transform = '' })
        resetId = null
      }, 500)
    }
    grid.addEventListener('mouseleave', onLeave)
    off.push(() => grid.removeEventListener('mouseleave', onLeave))

    // ── ResizeObserver — scale down only on narrow containers ─────────────
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w < GRID_W) {
        const scale = w / GRID_W
        wrapper.style.height = `${(GRID_H * scale).toFixed(1)}px`
        grid.style.transform = `scale(${scale.toFixed(4)})`
      } else {
        wrapper.style.height = ''
        grid.style.transform = ''
      }
    })
    ro.observe(wrapper)

    // ── IntersectionObserver ───────────────────────────────────────────────
    const io = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting
      if (visible === isVisible) return
      isVisible = visible
      if (visible) rafId = requestAnimationFrame(loop)
      else { cancelAnimationFrame(rafId); rafId = 0 }
    }, { threshold: 0 })
    io.observe(wrapper)

    if (!reducedMotion) rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      staggerIds.forEach(clearTimeout)
      if (resetId) clearTimeout(resetId)
      ro.disconnect()
      io.disconnect()
      off.forEach(fn => fn())
    }
  }, [])

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="ag-sparkle" viewBox="0 0 76 76">
            <path fill="currentColor" d="M62.197 3.235c.35-.91 1.571-.91 1.885 0l2.34 6.22a1 1 0 0 0 .558.583l5.97 2.437c.873.364.873 1.637 0 1.965l-5.97 2.437c-.28.11-.454.328-.559.582l-2.339 6.221c-.349.91-1.57.91-1.885 0l-2.339-6.22a1 1 0 0 0-.559-.583l-5.97-2.437c-.872-.364-.872-1.637 0-1.965l5.97-2.437c.28-.11.454-.327.559-.582z"/>
          </symbol>
          <symbol id="ag-triaging" viewBox="0 0 76 76">
            <path fill="currentColor" d="M49.876 22.707c1.126 0 2.148.743 2.585 1.886s.192 2.447-.612 3.314L35.904 45.305v10.923c0 .81-.297 1.581-.82 2.153l-5.59 6.094c-.803.877-1.999 1.134-3.047.657s-1.72-1.58-1.72-2.809V45.305L8.782 27.916c-.804-.876-1.04-2.18-.603-3.323s1.45-1.886 2.576-1.886z"/>
            <use href="#ag-sparkle"/>
          </symbol>
          <symbol id="ag-intake" viewBox="0 0 76 76">
            <path fill="currentColor" d="M26.775 18.508c0-3.603 2.803-6.524 6.26-6.524 3.459 0 6.262 2.921 6.262 6.524v3.915H41.8c3.5 0 5.251 0 6.632.596 1.84.794 3.303 2.318 4.066 4.237.572 1.438.572 3.262.572 6.91h3.757c3.457 0 6.26 2.92 6.26 6.524s-2.803 6.524-6.26 6.524H53.07v4.436c0 4.385 0 6.577-.819 8.252a7.68 7.68 0 0 1-3.283 3.421c-1.608.853-3.711.853-7.92.853H25.023c-4.208 0-6.312 0-7.919-.853a7.68 7.68 0 0 1-3.283-3.421C13 58.227 13 56.035 13 51.65v-4.436h3.757c3.457 0 6.26-2.921 6.26-6.524s-2.803-6.524-6.26-6.524H13c0-3.648 0-5.472.572-6.91.762-1.919 2.225-3.443 4.066-4.237 1.38-.596 3.131-.596 6.632-.596h2.504z"/>
            <use href="#ag-sparkle"/>
          </symbol>
          <symbol id="ag-risk" viewBox="0 0 76 76">
            <path fill="currentColor" d="M30.206 17.773c.43 0 .86.1 1.253.287l17.63 7.91c2.059.92 3.593 3.068 3.584 5.661-.047 9.82-3.865 27.786-19.988 35.952a5.44 5.44 0 0 1-4.94 0C11.612 59.417 7.804 41.451 7.757 31.631c-.01-2.593 1.525-4.741 3.584-5.662l17.62-7.909a2.9 2.9 0 0 1 1.245-.287"/>
            <use href="#ag-sparkle"/>
          </symbol>
          <symbol id="ag-custom" viewBox="0 0 76 76">
            <path fill="currentColor" d="M38.338 12.244c1.27 0 2.302 1.074 2.302 2.398s-1.031 2.398-2.303 2.398h-2.28v4.752h6.86c6.932 0 12.665 5.344 13.613 12.294 2.741.945 4.72 3.634 4.72 6.807v4.773c0 3.172-1.979 5.86-4.72 6.806-.947 6.95-6.68 12.296-13.612 12.296h-18.32c-6.932 0-12.665-5.346-13.613-12.296-2.74-.945-4.718-3.634-4.718-6.806v-4.773c0-3.173 1.977-5.862 4.718-6.807.948-6.95 6.681-12.294 13.613-12.294h6.856V17.04h-2.276c-1.271 0-2.301-1.073-2.301-2.398 0-1.324 1.03-2.398 2.3-2.398zM24.922 32.37c-2.169 0-3.926 1.831-3.926 4.09s1.757 4.091 3.926 4.091c2.168 0 3.925-1.831 3.925-4.09s-1.757-4.091-3.925-4.091m17.665 0c-2.168 0-3.926 1.831-3.926 4.09s1.758 4.091 3.926 4.091 3.926-1.831 3.926-4.09-1.758-4.091-3.926-4.091"/>
            <use href="#ag-sparkle"/>
          </symbol>
        </defs>
      </svg>

      <div
        id="case-agents-grid"
        data-element="Agents Grid"
        ref={wrapperRef}
        className={s.wrapper}
      >
        <div ref={gridRef} className={s.grid}>
          <div ref={gradRef} className={s.gradientMap} aria-hidden="true" />
          <div className={s.agentGrid}>
            {TILES.map((tile, i) => (
              <div
                key={i}
                ref={el => { if (el) tileRefs.current[i] = el }}
                data-row={Math.floor(i / 3)}
                data-col={i % 3}
                className={tile.kind === 'person' ? `${s.tile} ${s.tilePerson}` : `${s.tile} ${s.tileAgent}`}
              >
                {tile.kind === 'agent' && (
                  <svg width="76" height="76" viewBox="0 0 76 76" className={s.tileAgentSvg} aria-hidden="true">
                    <use href={`#ag-${tile.icon}`} />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
