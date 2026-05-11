'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import s from './AgentsGridCanvas.module.css'

// ── Spring ───────────────────────────────────────────────────────────────────

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

// ── Types ────────────────────────────────────────────────────────────────────

type AgentIcon  = 'triaging' | 'intake' | 'risk' | 'custom'
type TileEntry  = { id: number; type: 'person' | 'agent'; icon?: AgentIcon; col: number; row: number }
type GridLayout = { cols: number; rows: number; tileSize: number; gap: number; totalCells: number }
type TileSprings = {
  sx: Spring; sy: Spring          // FLIP + idle offset (springs to 0)
  scale: Spring; opacity: Spring  // appear / disappear
  hsx: Spring; hsy: Spring        // hover push offset
  hscale: Spring                  // hover scale
}

// ── Constants ────────────────────────────────────────────────────────────────

const BLOB_COLORS   = ['#aaff00','#00e05c','#00e05c','#00ff2b','#00ff2b','#aaff00','#00e05c','#00ff2b','#00e05c'] as const
const ICONS: AgentIcon[] = ['triaging', 'intake', 'risk', 'custom']
const GRAD_SCALE    = 4
const BLOB_R        = 13
const INITIAL_COUNT = 9

// ── Pure helpers ─────────────────────────────────────────────────────────────

function clamp(min: number, max: number, v: number) { return Math.max(min, Math.min(max, v)) }

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function computeLayout(count: number, availW: number, availH: number): GridLayout {
  if (availW <= 0 || availH <= 0) return { cols: 3, rows: 3, tileSize: 50, gap: 5, totalCells: 9 }
  const targetCells = Math.ceil(count * 1.3)
  let cols = Math.max(1, Math.ceil(Math.sqrt(targetCells * (availW / availH))))

  for (let attempt = 0; attempt < 10; attempt++) {
    const rows    = Math.ceil(targetCells / cols)
    const gap     = clamp(3, 9, Math.floor(Math.min(availW, availH) * 0.015))
    const tsW     = Math.floor((availW - gap * (cols - 1)) / cols)
    const tsH     = rows > 0 ? Math.floor((availH - gap * (rows - 1)) / rows) : tsW
    const tileSize = Math.min(tsW, tsH)
    if (tileSize >= 8) return { cols, rows, tileSize, gap, totalCells: cols * rows }
    cols++
  }
  // fallback: single row
  const gap = 4
  const tileSize = Math.max(8, Math.floor((availW - gap * (count - 1)) / count))
  return { cols: count, rows: 1, tileSize, gap, totalCells: count }
}

function cellPos(layout: GridLayout, col: number, row: number) {
  return { x: col * (layout.tileSize + layout.gap), y: row * (layout.tileSize + layout.gap) }
}

function computeAgentCount(n: number): number {
  return Math.max(0, Math.round(n * 0.33 * (1 - n / 90)))
}

let _nextId = 1

function makeArrangement(count: number, layout: GridLayout, prevTiles?: TileEntry[]): TileEntry[] {
  const nAgents = computeAgentCount(count)
  const nPeople = count - nAgents

  const pool: { type: 'person' | 'agent'; icon?: AgentIcon }[] = []
  for (let i = 0; i < nPeople; i++) pool.push({ type: 'person' })
  for (let i = 0; i < nAgents; i++) pool.push({ type: 'agent', icon: ICONS[i % 4] })
  shuffle(pool)

  const allCells = Array.from({ length: layout.totalCells }, (_, i) => i)
  shuffle(allCells)
  const chosen = allCells.slice(0, count).sort((a, b) => a - b)

  const prevIds = prevTiles?.map(t => t.id) ?? []

  return chosen.map((cellIndex, i) => ({
    id:   prevIds[i] ?? _nextId++,
    type: pool[i].type,
    icon: pool[i].icon,
    col:  cellIndex % layout.cols,
    row:  Math.floor(cellIndex / layout.cols),
  }))
}

function makeSprings(): TileSprings {
  const sp: TileSprings = {
    sx:      new Spring(180, 28),
    sy:      new Spring(180, 28),
    scale:   new Spring(140, 22),
    opacity: new Spring(80,  18),
    hsx:     new Spring(160, 40),
    hsy:     new Spring(160, 40),
    hscale:  new Spring(100, 40),
  }
  sp.scale.value   = sp.scale.target   = 1
  sp.opacity.value = sp.opacity.target = 1
  sp.hscale.value  = sp.hscale.target  = 1
  return sp
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentsGridCanvas() {
  const wrapperRef   = useRef<HTMLDivElement>(null)
  const gridAreaRef  = useRef<HTMLDivElement>(null)
  const gradRef      = useRef<HTMLDivElement>(null)
  const blobRefs     = useRef<HTMLDivElement[]>([])
  const tileRefs     = useRef<Map<number, HTMLDivElement>>(new Map())
  const springsMap   = useRef<Map<number, TileSprings>>(new Map())
  const layoutRef    = useRef<GridLayout | null>(null)
  const tilesRef     = useRef<TileEntry[]>([])
  const countRef     = useRef(INITIAL_COUNT)
  const containerRef = useRef({ w: 0, h: 0 })
  const isHovering   = useRef(false)
  const hoverTarget  = useRef<{ x: number; y: number } | null>(null)
  const rafRef       = useRef(0)
  const lastTime     = useRef(0)
  const isVisible    = useRef(true)
  const pendingFlip  = useRef<Map<number, { x: number; y: number }> | null>(null)

  const initLayout = computeLayout(INITIAL_COUNT, 900, 500)
  const [layout,    setLayout]    = useState<GridLayout>(initLayout)
  const [tiles,     setTiles]     = useState<TileEntry[]>(() => makeArrangement(INITIAL_COUNT, initLayout))
  const [tileCount, setTileCount] = useState(INITIAL_COUNT)

  // Keep refs in sync with state
  useEffect(() => { layoutRef.current = layout }, [layout])
  useEffect(() => { tilesRef.current  = tiles  }, [tiles])
  useEffect(() => { countRef.current  = tileCount }, [tileCount])

  // ── Step 1: ensure springs exist for every tile after a render ────────────
  useLayoutEffect(() => {
    tiles.forEach(tile => {
      if (!springsMap.current.has(tile.id)) {
        springsMap.current.set(tile.id, makeSprings())
      }
    })
    // Prune stale springs
    const live = new Set(tiles.map(t => t.id))
    springsMap.current.forEach((_, id) => { if (!live.has(id)) springsMap.current.delete(id) })
  }, [tiles])

  // ── Step 2: apply FLIP offsets after DOM update ───────────────────────────
  useLayoutEffect(() => {
    const snapshot = pendingFlip.current
    if (!snapshot) return
    pendingFlip.current = null

    const gridArea = gridAreaRef.current
    const layout   = layoutRef.current
    if (!gridArea || !layout) return
    const gridRect = gridArea.getBoundingClientRect()

    tiles.forEach(tile => {
      const sp = springsMap.current.get(tile.id)
      if (!sp) return
      const pos   = cellPos(layout, tile.col, tile.row)
      const newX  = gridRect.left + pos.x
      const newY  = gridRect.top  + pos.y
      const oldPos = snapshot.get(tile.id)

      if (oldPos) {
        // FLIP: start at old screen position, spring to new
        sp.sx.value = oldPos.x - newX;  sp.sx.target = 0;  sp.sx.velocity = 0
        sp.sy.value = oldPos.y - newY;  sp.sy.target = 0;  sp.sy.velocity = 0
      } else {
        // New tile: pop in
        sp.scale.value = 0.6;  sp.scale.target  = 1;  sp.scale.velocity  = 0
        sp.opacity.value = 0;  sp.opacity.target = 1;  sp.opacity.velocity = 0
      }
    })
  }, [tiles])

  // ── RAF loop (mounted once) ───────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Gradient blob state — lives inside this closure
    const mapX = new Spring(28, 9)
    const mapY = new Spring(28, 9)
    mapX.value = mapX.target = 450
    mapY.value = mapY.target = 250

    const spots = Array.from({ length: 9 }, (_, i) => {
      const sprX = new Spring(12, 5)
      const sprY = new Spring(12, 5)
      const a = (i / 9) * Math.PI * 2
      const r = 25 + Math.random() * 15
      sprX.value = sprX.target = Math.cos(a) * r
      sprY.value = sprY.target = Math.sin(a) * r
      return { sprX, sprY, nextRetarget: 0 }
    })

    function loop(now: number) {
      const dt  = lastTime.current === 0 ? 1 / 60 : clamp(1 / 240, 1 / 30, (now - lastTime.current) / 1000)
      lastTime.current = now
      const tw  = now / 1000
      const TAU = Math.PI * 2
      const lay = layoutRef.current
      const { w: availW, h: availH } = containerRef.current

      // ── Tiles ──
      if (lay) {
        tilesRef.current.forEach(tile => {
          const el = tileRefs.current.get(tile.id)
          const sp = springsMap.current.get(tile.id)
          if (!el || !sp) return
          sp.sx.tick(dt); sp.sy.tick(dt)
          sp.scale.tick(dt); sp.opacity.tick(dt)
          sp.hsx.tick(dt); sp.hsy.tick(dt); sp.hscale.tick(dt)

          const pos = cellPos(lay, tile.col, tile.row)
          const tx  = pos.x + sp.sx.value + sp.hsx.value
          const ty  = pos.y + sp.sy.value + sp.hsy.value
          const sc  = sp.scale.value * sp.hscale.value
          el.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${sc.toFixed(4)})`
          el.style.opacity   = sp.opacity.value.toFixed(3)
        })
      }

      // ── Gradient blobs ──
      const wander = Math.min(availW, availH) * 0.45
      if (!isHovering.current) {
        mapX.setTarget(availW / 2 + Math.sin(tw * 0.13 * TAU) * wander)
        mapY.setTarget(availH / 2 + Math.sin(tw * 0.097 * TAU + 1.3) * wander)
      } else if (hoverTarget.current) {
        mapX.setTarget(hoverTarget.current.x)
        mapY.setTarget(hoverTarget.current.y)
      }
      mapX.tick(dt); mapY.tick(dt)

      const amp = wander * 0.35 * (1 + Math.sin(tw * 0.11 * TAU + 0.7) * 0.15)
      spots.forEach((sp, i) => {
        if (tw > sp.nextRetarget) {
          sp.sprX.setTarget((Math.random() - 0.5) * 2 * amp)
          sp.sprY.setTarget((Math.random() - 0.5) * 2 * amp)
          sp.nextRetarget = tw + 3 + Math.random() * 5
        }
        sp.sprX.tick(dt); sp.sprY.tick(dt)
        const bx = (mapX.value + sp.sprX.value - BLOB_R) / GRAD_SCALE
        const by = (mapY.value + sp.sprY.value - BLOB_R) / GRAD_SCALE
        const el = blobRefs.current[i]
        if (el) el.style.transform = `translate3d(${bx.toFixed(2)}px,${by.toFixed(2)}px,0)`
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(entries => {
      const v = entries[0].isIntersecting
      if (v === isVisible.current) return
      isVisible.current = v
      if (v) { lastTime.current = 0; rafRef.current = requestAnimationFrame(loop) }
      else { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    }, { threshold: 0 })
    io.observe(wrapper)

    if (!reduced) rafRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafRef.current); io.disconnect() }
  }, [])

  // ── ResizeObserver ────────────────────────────────────────────────────────
  useEffect(() => {
    const gridArea = gridAreaRef.current
    if (!gridArea) return
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect
      containerRef.current = { w, h }
      const newLayout = computeLayout(countRef.current, w, h)
      layoutRef.current = newLayout
      setLayout(newLayout)
      // Re-seat tiles if grid dimensions changed (out-of-bounds guard)
      setTiles(prev => {
        const oob = prev.some(t => t.col >= newLayout.cols || t.row >= newLayout.rows)
        return oob ? makeArrangement(countRef.current, newLayout, prev) : prev
      })
    })
    ro.observe(gridArea)
    return () => ro.disconnect()
  }, [])

  // ── Hover interactions — re-bound whenever tiles change ──────────────────
  useEffect(() => {
    const gridArea = gridAreaRef.current
    if (!gridArea) return

    const off: (() => void)[] = []
    let staggerIds: ReturnType<typeof setTimeout>[] = []
    let resetId:    ReturnType<typeof setTimeout> | null = null
    const snap = tilesRef.current  // stable snapshot of current tiles

    snap.forEach(tile => {
      const el = tileRefs.current.get(tile.id)
      if (!el) return

      const onEnter = () => {
        staggerIds.forEach(clearTimeout); staggerIds = []
        if (resetId) { clearTimeout(resetId); resetId = null }
        isHovering.current = true

        const lay = layoutRef.current
        if (lay) {
          const pos = cellPos(lay, tile.col, tile.row)
          hoverTarget.current = { x: pos.x + lay.tileSize / 2, y: pos.y + lay.tileSize / 2 }
        }

        snap.forEach(other => {
          const sp = springsMap.current.get(other.id)
          if (!sp) return
          const dr = other.row - tile.row
          const dc = other.col - tile.col
          const dist = Math.abs(dr) + Math.abs(dc)
          if (dist === 0) {
            sp.hscale.setTarget(1.05)
            sp.hsx.setTarget(0); sp.hsy.setTarget(0)
          } else {
            sp.hscale.setTarget(1)
            const mag = Math.sqrt(dc * dc + dr * dr)
            staggerIds.push(setTimeout(() => {
              sp.hsx.setTarget((dc / mag) * 16)
              sp.hsy.setTarget((dr / mag) * 16)
            }, dist * 30))
          }
        })
      }

      el.addEventListener('mouseenter', onEnter)
      off.push(() => el.removeEventListener('mouseenter', onEnter))
    })

    const onLeave = () => {
      staggerIds.forEach(clearTimeout); staggerIds = []
      snap.forEach(tile => {
        const sp = springsMap.current.get(tile.id)
        if (!sp) return
        sp.hscale.setTarget(1); sp.hsx.setTarget(0); sp.hsy.setTarget(0)
      })
      isHovering.current = false
      hoverTarget.current = null
      resetId = setTimeout(() => {
        snap.forEach(tile => {
          const sp = springsMap.current.get(tile.id)
          if (!sp) return
          sp.hscale.value = 1; sp.hscale.target = 1; sp.hscale.velocity = 0
          sp.hsx.value    = 0; sp.hsx.target    = 0; sp.hsx.velocity    = 0
          sp.hsy.value    = 0; sp.hsy.target    = 0; sp.hsy.velocity    = 0
        })
        resetId = null
      }, 500)
    }

    gridArea.addEventListener('mouseleave', onLeave)
    off.push(() => gridArea.removeEventListener('mouseleave', onLeave))

    return () => {
      staggerIds.forEach(clearTimeout)
      if (resetId) clearTimeout(resetId)
      off.forEach(fn => fn())
    }
  }, [tiles])

  // ── Helpers to capture positions and update state ─────────────────────────
  function snapPositions() {
    const lay = layoutRef.current
    const ga  = gridAreaRef.current
    if (!lay || !ga) return
    const rect = ga.getBoundingClientRect()
    const snap = new Map<number, { x: number; y: number }>()
    tilesRef.current.forEach(tile => {
      const pos = cellPos(lay, tile.col, tile.row)
      snap.set(tile.id, { x: rect.left + pos.x, y: rect.top + pos.y })
    })
    pendingFlip.current = snap
  }

  const handleCountChange = useCallback((n: number) => {
    snapPositions()
    const { w, h } = containerRef.current
    const newLayout = computeLayout(n, w, h)
    layoutRef.current = newLayout
    setTileCount(n)
    setLayout(newLayout)
    setTiles(makeArrangement(n, newLayout, tilesRef.current))
  }, [])

  const handleRandomize = useCallback(() => {
    snapPositions()
    const lay = layoutRef.current
    if (!lay) return
    setTiles(makeArrangement(countRef.current, lay, tilesRef.current))
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  const radius    = Math.round(layout.tileSize * 0.20)
  const radiusAgt = Math.round(layout.tileSize * 0.24)
  const iconSize  = Math.round(layout.tileSize * 0.64)

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
        {/* Grid area */}
        <div ref={gridAreaRef} className={s.gridArea}>
          <div ref={gradRef} className={s.gradientMap} aria-hidden="true">
            {BLOB_COLORS.map((color, i) => (
              <div
                key={i}
                ref={el => { if (el) blobRefs.current[i] = el }}
                className={s.blob}
                style={{ background: color }}
              />
            ))}
          </div>

          {tiles.map(tile => (
            <div
              key={tile.id}
              ref={el => { if (el) tileRefs.current.set(tile.id, el); else tileRefs.current.delete(tile.id) }}
              className={tile.type === 'person' ? `${s.tile} ${s.tilePerson}` : `${s.tile} ${s.tileAgent}`}
              style={{
                width:        layout.tileSize,
                height:       layout.tileSize,
                borderRadius: tile.type === 'agent' ? radiusAgt : radius,
              }}
            >
              {tile.type === 'agent' && tile.icon && (
                <svg width={iconSize} height={iconSize} viewBox="0 0 76 76" className={s.tileAgentSvg} aria-hidden="true">
                  <use href={`#ag-${tile.icon}`} />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className={s.controls}>
          <span className={s.count}>{tileCount}</span>
          <input
            className={s.slider}
            type="range"
            min={1}
            max={90}
            value={tileCount}
            onChange={e => handleCountChange(Number(e.target.value))}
          />
          <button className={s.randomizeBtn} onClick={handleRandomize}>
            Randomize
          </button>
        </div>
      </div>
    </>
  )
}
