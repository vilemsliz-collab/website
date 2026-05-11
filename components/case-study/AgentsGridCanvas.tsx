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
type TileSprings = {
  opacity: Spring  // 0→1 on enter (k=300, d=40)
  hsx: Spring      // hover push x
  hsy: Spring      // hover push y
  hscale: Spring   // hover scale
}
type RenderLayout = { tileSize: number; gap: number; offsetX: number; offsetY: number }

// ── Constants ────────────────────────────────────────────────────────────────

const BLOB_COLORS = ['#aaff00','#00e05c','#00e05c','#00ff2b','#00ff2b','#aaff00','#00e05c','#00ff2b','#00e05c'] as const
const ICONS: AgentIcon[] = ['triaging', 'intake', 'risk', 'custom']
const GRAD_SCALE   = 4
const BLOB_R       = 13
const INITIAL_COUNT = 9
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]] as const

// Perfect 3×3 seed — center tile first, then cross, then corners
const INIT_ORDER = [
  {col:1,row:1},
  {col:0,row:1},{col:2,row:1},{col:1,row:0},{col:1,row:2},
  {col:0,row:0},{col:2,row:0},{col:0,row:2},{col:2,row:2},
] as const

// ── Pure helpers ─────────────────────────────────────────────────────────────

function clamp(min: number, max: number, v: number) { return Math.max(min, Math.min(max, v)) }

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function computeGridLayout(tiles: TileEntry[], availW: number, availH: number): RenderLayout {
  const GAP = 9
  if (!tiles.length || availW <= 0 || availH <= 0) {
    return { tileSize: 118, gap: GAP, offsetX: 0, offsetY: 0 }
  }
  const minC = Math.min(...tiles.map(t => t.col))
  const maxC = Math.max(...tiles.map(t => t.col))
  const minR = Math.min(...tiles.map(t => t.row))
  const maxR = Math.max(...tiles.map(t => t.row))
  const spanC = maxC - minC + 1, spanR = maxR - minR + 1
  const tsW = Math.floor((availW - GAP * (spanC - 1)) / spanC)
  const tsH = Math.floor((availH - GAP * (spanR - 1)) / spanR)
  const tileSize = clamp(8, 118, Math.min(tsW, tsH))
  const clW = spanC * (tileSize + GAP) - GAP
  const clH = spanR * (tileSize + GAP) - GAP
  return {
    tileSize, gap: GAP,
    offsetX: (availW - clW) / 2 - minC * (tileSize + GAP),
    offsetY: (availH - clH) / 2 - minR * (tileSize + GAP),
  }
}

function cellPos(layout: RenderLayout, col: number, row: number) {
  return {
    x: layout.offsetX + col * (layout.tileSize + layout.gap),
    y: layout.offsetY + row * (layout.tileSize + layout.gap),
  }
}

// ratio: lerp 0.33→0.17 as n goes 1→90 (absolute count grows, ratio shrinks)
function computeAgentCount(n: number): number {
  const t = clamp(0, 1, (n - 1) / 89)
  return Math.max(0, Math.round(n * (0.33 - 0.16 * t)))
}

function occupiedSet(tiles: TileEntry[]): Set<string> {
  return new Set(tiles.map(t => `${t.col},${t.row}`))
}

function getFrontier(tiles: TileEntry[]): {col: number; row: number}[] {
  const occ = occupiedSet(tiles)
  const result = new Map<string, {col: number; row: number}>()
  tiles.forEach(t => {
    DIRS.forEach(([dc, dr]) => {
      const key = `${t.col + dc},${t.row + dr}`
      if (!occ.has(key)) result.set(key, {col: t.col + dc, row: t.row + dr})
    })
  })
  return [...result.values()]
}

function getEdge(tiles: TileEntry[]): TileEntry[] {
  const occ = occupiedSet(tiles)
  return tiles.filter(t =>
    DIRS.some(([dc, dr]) => !occ.has(`${t.col + dc},${t.row + dr}`))
  )
}

let _nextId = 1

function makeArrangement(count: number, prevTiles?: TileEntry[], mode?: 'randomize'): TileEntry[] {
  if (!prevTiles || mode === 'randomize') {
    // Fresh arrangement — grow from INIT_ORDER seed
    const nAgents = computeAgentCount(count)
    const pool: {type: 'person'|'agent'; icon?: AgentIcon}[] = []
    for (let i = 0; i < count - nAgents; i++) pool.push({type: 'person'})
    for (let i = 0; i < nAgents; i++) pool.push({type: 'agent', icon: ICONS[i % 4]})
    shuffle(pool)

    const positions: {col: number; row: number}[] = []
    const occ = new Set<string>()

    // Seed with INIT_ORDER
    const seedCount = Math.min(count, 9)
    for (let i = 0; i < seedCount; i++) {
      positions.push(INIT_ORDER[i])
      occ.add(`${INIT_ORDER[i].col},${INIT_ORDER[i].row}`)
    }

    // Expand frontier for count > 9
    for (let i = seedCount; i < count; i++) {
      const frontier = [...new Map(
        positions.flatMap(p =>
          DIRS.map(([dc, dr]) => {
            const key = `${p.col+dc},${p.row+dr}`
            return occ.has(key) ? null : [key, {col: p.col+dc, row: p.row+dr}] as [string, {col:number;row:number}]
          }).filter(Boolean) as [string, {col:number;row:number}][]
        )
      ).values()]
      if (!frontier.length) break
      const cell = frontier[Math.floor(Math.random() * frontier.length)]
      positions.push(cell)
      occ.add(`${cell.col},${cell.row}`)
    }

    return positions.slice(0, count).map((pos, i) => ({
      id: _nextId++, type: pool[i].type, icon: pool[i].icon, col: pos.col, row: pos.row,
    }))
  }

  if (count > prevTiles.length) {
    // Grow: add frontier cells, assign types to maintain target ratio
    const currentAgents = prevTiles.filter(t => t.type === 'agent').length
    const targetAgents  = computeAgentCount(count)
    const toAdd    = count - prevTiles.length
    const addAgents = clamp(0, toAdd, targetAgents - currentAgents)
    const newPool: {type: 'person'|'agent'; icon?: AgentIcon}[] = []
    for (let i = 0; i < toAdd - addAgents; i++) newPool.push({type: 'person'})
    for (let i = 0; i < addAgents; i++) newPool.push({type: 'agent', icon: ICONS[(currentAgents + i) % 4]})
    shuffle(newPool)

    let tiles = prevTiles
    for (let i = 0; i < toAdd; i++) {
      const frontier = getFrontier(tiles)
      if (!frontier.length) break
      const cell = frontier[Math.floor(Math.random() * frontier.length)]
      tiles = [...tiles, {id: _nextId++, ...newPool[i], col: cell.col, row: cell.row}]
    }
    return tiles
  }

  if (count < prevTiles.length) {
    // Shrink: remove edge tiles
    let tiles = [...prevTiles]
    while (tiles.length > count) {
      const edge = getEdge(tiles)
      if (!edge.length) break
      const victim = edge[Math.floor(Math.random() * edge.length)]
      tiles = tiles.filter(t => t !== victim)
    }
    return tiles
  }

  return prevTiles
}

function makeSprings(): TileSprings {
  return {
    opacity: new Spring(300, 40),
    hsx:     new Spring(160, 40),
    hsy:     new Spring(160, 40),
    hscale:  new Spring(100, 40),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentsGridCanvas() {
  const wrapperRef   = useRef<HTMLDivElement>(null)
  const gridAreaRef  = useRef<HTMLDivElement>(null)
  const gradRef      = useRef<HTMLDivElement>(null)
  const blobRefs     = useRef<HTMLDivElement[]>([])
  const tileRefs     = useRef<Map<number, HTMLDivElement>>(new Map())
  const springsMap   = useRef<Map<number, TileSprings>>(new Map())
  const layoutRef    = useRef<RenderLayout>({ tileSize: 118, gap: 9, offsetX: 0, offsetY: 0 })
  const tilesRef     = useRef<TileEntry[]>([])
  const countRef     = useRef(INITIAL_COUNT)
  const containerRef = useRef({ w: 0, h: 0 })
  const isHovering   = useRef(false)
  const hoverTarget  = useRef<{ x: number; y: number } | null>(null)
  const rafRef       = useRef(0)
  const lastTime     = useRef(0)
  const isVisible    = useRef(true)

  const [tiles,     setTiles]     = useState<TileEntry[]>(() => makeArrangement(INITIAL_COUNT))
  const [tileCount, setTileCount] = useState(INITIAL_COUNT)

  // ── Sync tiles ref + create/prune springs synchronously before paint ──────
  useLayoutEffect(() => {
    tilesRef.current = tiles
    countRef.current = tileCount

    tiles.forEach(tile => {
      if (!springsMap.current.has(tile.id)) {
        const sp = makeSprings()
        sp.opacity.value  = 0
        sp.opacity.target = 1
        sp.hscale.value   = sp.hscale.target = 1
        springsMap.current.set(tile.id, sp)
      }
    })
    const live = new Set(tiles.map(t => t.id))
    springsMap.current.forEach((_, id) => { if (!live.has(id)) springsMap.current.delete(id) })
  }, [tiles, tileCount])

  // ── RAF loop (mounted once) ───────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
      const { w: availW, h: availH } = containerRef.current
      const currentTiles = tilesRef.current

      // Recompute layout each frame from current tiles + container
      const layout = computeGridLayout(currentTiles, availW, availH)
      layoutRef.current = layout

      // Push tile size to CSS for width/height/border-radius
      const ga = gridAreaRef.current
      if (ga) ga.style.setProperty('--tile-size', `${layout.tileSize}px`)

      // ── Tiles ──
      currentTiles.forEach(tile => {
        const el = tileRefs.current.get(tile.id)
        const sp = springsMap.current.get(tile.id)
        if (!el || !sp) return
        sp.opacity.tick(dt); sp.hsx.tick(dt); sp.hsy.tick(dt); sp.hscale.tick(dt)

        const pos = cellPos(layout, tile.col, tile.row)
        const tx  = pos.x + sp.hsx.value
        const ty  = pos.y + sp.hsy.value
        el.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${sp.hscale.value.toFixed(4)})`
        el.style.opacity   = sp.opacity.value.toFixed(3)
      })

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
    })
    ro.observe(gridArea)
    return () => ro.disconnect()
  }, [])

  // ── Hover interactions — re-bound whenever tiles change ──────────────────
  useEffect(() => {
    const gridArea = gridAreaRef.current
    if (!gridArea) return
    if (window.matchMedia('(hover: none)').matches) return  // no hover on touch

    const off: (() => void)[] = []
    let staggerIds: ReturnType<typeof setTimeout>[] = []
    let resetId:    ReturnType<typeof setTimeout> | null = null
    const snap = tilesRef.current

    snap.forEach(tile => {
      const el = tileRefs.current.get(tile.id)
      if (!el) return

      const onEnter = () => {
        staggerIds.forEach(clearTimeout); staggerIds = []
        if (resetId) { clearTimeout(resetId); resetId = null }
        isHovering.current = true

        const lay = layoutRef.current
        const pos = cellPos(lay, tile.col, tile.row)
        hoverTarget.current = { x: pos.x + lay.tileSize / 2, y: pos.y + lay.tileSize / 2 }

        const st = clamp(0, 1, (countRef.current - 9) / 81)
        const staggerMs  = 30 - 25 * st   // 30ms at n=9 → 5ms at n=90
        const pushPx     = 16 - 12 * st   // 16px at n=9 → 4px at n=90

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
              sp.hsx.setTarget((dc / mag) * pushPx)
              sp.hsy.setTarget((dr / mag) * pushPx)
            }, dist * staggerMs))
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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCountChange = useCallback((n: number) => {
    setTileCount(n)
    setTiles(prev => makeArrangement(n, prev))
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
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
        <div ref={gridAreaRef} className={s.gridArea}>
          <div ref={gradRef} className={s.gradientMap} aria-hidden="true">
            {BLOB_COLORS.map((color, i) => (
              <div key={i} ref={el => { if (el) blobRefs.current[i] = el }} className={s.blob} style={{ background: color }} />
            ))}
          </div>

          {tiles.map(tile => (
            <div
              key={tile.id}
              ref={el => { if (el) tileRefs.current.set(tile.id, el); else tileRefs.current.delete(tile.id) }}
              className={tile.type === 'person' ? `${s.tile} ${s.tilePerson}` : `${s.tile} ${s.tileAgent}`}
            >
              {tile.type === 'agent' && tile.icon && (
                <svg width="64%" height="64%" viewBox="0 0 76 76" className={s.tileAgentSvg} aria-hidden="true">
                  <use href={`#ag-${tile.icon}`} />
                </svg>
              )}
            </div>
          ))}
        </div>

        <div className={s.controls}>
          <span className={s.count}>{tileCount}</span>
          <input
            className={s.slider}
            type="range"
            min={1}
            max={90}
            value={tileCount}
            style={{ '--pct': `${((tileCount - 1) / 89) * 100}%` } as React.CSSProperties}
            onChange={e => handleCountChange(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  )
}
