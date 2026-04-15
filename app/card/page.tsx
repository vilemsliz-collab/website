'use client'

import React, { useRef, useState } from 'react'
import TiltCard from '@/components/card-playground/TiltCard'
import type { TiltConfig, GhostConfig, LightConfig, RevealConfig } from '@/components/card-playground/TiltCard'
import { TILT, GHOST, LIGHT, REVEAL } from '@/lib/carouselConfig'
import styles from '@/components/card-playground/CardPlayground.module.css'
import CustomCursor, { DEFAULT_CURSOR_CONFIG, type CursorConfig } from '@/components/cursor/CustomCursor'

const BLEND_MODES = ['normal','multiply','screen','overlay','soft-light','hard-light','color-dodge','color-burn','lighten','darken']

function CtrlRow({ label, min, max, step, defaultValue, unit, onChange }: {
  label: string; min: number; max: number; step: number; defaultValue: number; unit: string
  onChange: (v: number) => void
}) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className={styles.ctrlRow}>
      <span className={styles.ctrlLabel}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} defaultValue={defaultValue}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onInput={e => { const v = parseFloat((e.target as HTMLInputElement).value); setVal(v); onChange(v) }}
      />
      <span className={styles.ctrlVal}>{val}{unit}</span>
    </div>
  )
}

function StateBox({ title, cursorAttr, cursorLabel, dark, zoneLabel, onCopy, children }: {
  title: string
  cursorAttr?: string
  cursorLabel?: string
  dark?: boolean
  zoneLabel?: string
  onCopy?: () => Record<string, number>
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const zoneProps: Record<string, string> = {}
  if (cursorAttr)   zoneProps['data-cursor']       = cursorAttr
  if (cursorLabel)  zoneProps['data-cursor-label'] = cursorLabel
  if (dark)         zoneProps['data-dark']          = ''

  const handleCopy = () => {
    if (!onCopy) return
    navigator.clipboard.writeText(JSON.stringify(onCopy(), null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className={styles.stateBox}>
      <div className={styles.stateBoxTitle}>
        <span>{title}</span>
        {onCopy && (
          <button
            className={`${styles.stateBoxCopyBtn} ${copied ? styles.stateBoxCopyBtnDone : ''}`}
            onMouseDown={e => e.stopPropagation()}
            onClick={handleCopy}
          >{copied ? 'copied' : 'copy'}</button>
        )}
      </div>
      <div className={styles.stateBoxZone} {...zoneProps}>
        <span className={styles.stateBoxZoneLabel}>{zoneLabel ?? 'hover here'}</span>
      </div>
      {children && <div className={styles.stateBoxControls}>{children}</div>}
    </div>
  )
}

export default function CardPage() {
  const tilt    = useRef<TiltConfig>({ max: TILT.max, stiffness: TILT.stiffness, damping: TILT.damping })
  const ghost   = useRef<GhostConfig>({ layers: GHOST.layers, opacity: GHOST.opacity, blur: GHOST.blur, blend: GHOST.blend, variant: GHOST.variant as 'front' | 'behind' })
  const light   = useRef<LightConfig>({ intensity: LIGHT.intensity, size: LIGHT.size, travel: LIGHT.travel, diffuse: LIGHT.diffuse, shadow: LIGHT.shadow })
  const reveal  = useRef<RevealConfig>({ stagger: REVEAL.stagger, dur: REVEAL.dur, blur: REVEAL.blur, y: REVEAL.y })
  const vignette = useRef({ blur: 14, start: 72 })
  const triggerRevealFn = useRef<() => void>(() => {})
  const [, forceUpdate] = useState(0)
  const rerender = () => forceUpdate(v => v + 1)
  const [ctrlOpen, setCtrlOpen] = useState(false)
  const cardTiltRef = useRef<{ rx: number; ry: number }>({ rx: 0, ry: 0 })
  const cursorConfigRef = useRef<CursorConfig>({ ...DEFAULT_CURSOR_CONFIG })

  return (
    <div className={styles.page}>
      <CustomCursor tiltRef={cardTiltRef} configRef={cursorConfigRef} />
      <nav className={styles.siteNav}>
        <a href="/portfolio" data-cursor="link" data-cursor-label="Portfolio">Portfolio</a>
        <a href="/card" className={styles.navActive} data-cursor="link" data-cursor-label="Card + Cursor">Card + Cursor</a>
        <a href="/design-system" data-cursor="link" data-cursor-label="Design System">Design System</a>
      </nav>

      {/* Hero section: vertically centered in the viewport */}
      <div className={styles.pageHero}>
        {/* Card zone: dark bg + card cursor state + tilt wired */}
        <div data-cursor="card" data-cursor-label="open" data-dark>
          <TiltCard
            imgSrc="/cases/case-005.png"
            line1="Lead Brand Designer"
            line2="Brand for showmore new 360 agency on the market"
            tilt={tilt.current}
            ghost={ghost.current}
            light={light.current}
            reveal={reveal.current}
            vignette={vignette.current}
            onRevealTrigger={fn => { triggerRevealFn.current = fn }}
            tiltRef={cardTiltRef}
          />
        </div>

        {/* Scroll hint zone */}
        <div className={styles.sandboxScrollHint} data-cursor="scroll-hint">
          <span>scroll</span>
        </div>
      </div>

      {/* ── Cursor state debug grid ── */}
      <div className={styles.stateGrid}>

        {/* 1. FOLLOW + BLOB */}
        <StateBox title="follow + blob" zoneLabel="move fast here"
          onCopy={() => { const c = cursorConfigRef.current; return { followK: c.followK, blobSpeed: c.blobSpeed, blobMax: c.blobMax, shapeK: c.shapeK, metaballAmp: c.metaballAmp } }}>
          <CtrlRow label="follow K"   min={0.05} max={0.5}  step={0.01} defaultValue={DEFAULT_CURSOR_CONFIG.followK}     unit="" onChange={v => { cursorConfigRef.current.followK     = v }} />
          <CtrlRow label="blob speed" min={5}    max={40}   step={0.5}  defaultValue={DEFAULT_CURSOR_CONFIG.blobSpeed}   unit="" onChange={v => { cursorConfigRef.current.blobSpeed   = v }} />
          <CtrlRow label="blob max"   min={0.1}  max={0.9}  step={0.01} defaultValue={DEFAULT_CURSOR_CONFIG.blobMax}     unit="" onChange={v => { cursorConfigRef.current.blobMax     = v }} />
          <CtrlRow label="shape K"    min={0.05} max={0.5}  step={0.01} defaultValue={DEFAULT_CURSOR_CONFIG.shapeK}      unit="" onChange={v => { cursorConfigRef.current.shapeK      = v }} />
          <CtrlRow label="metaball"   min={0}    max={0.4}  step={0.01} defaultValue={DEFAULT_CURSOR_CONFIG.metaballAmp} unit="" onChange={v => { cursorConfigRef.current.metaballAmp = v }} />
        </StateBox>

        {/* 2. CARD STATE — pill + dark invert */}
        <StateBox title="card state" cursorAttr="card" cursorLabel="open" dark zoneLabel="hover →  pill"
          onCopy={() => { const c = cursorConfigRef.current; return { invertK: c.invertK } }}>
          <CtrlRow label="invert K" min={0.02} max={0.4} step={0.01} defaultValue={DEFAULT_CURSOR_CONFIG.invertK} unit="" onChange={v => { cursorConfigRef.current.invertK = v }} />
        </StateBox>

        {/* 3. SCROLL RINGS */}
        <StateBox title="scroll rings" zoneLabel="scroll here"
          onCopy={() => { const c = cursorConfigRef.current; return { scrollNarrowW: c.scrollNarrowW, scrollIntervalBase: c.scrollIntervalBase, scrollRingScale: c.scrollRingScale, scrollRingDuration: c.scrollRingDuration } }}>
          <CtrlRow label="narrow W"  min={2}   max={52}  step={1}    defaultValue={DEFAULT_CURSOR_CONFIG.scrollNarrowW}     unit="px" onChange={v => { cursorConfigRef.current.scrollNarrowW     = v }} />
          <CtrlRow label="interval"  min={30}  max={350} step={5}    defaultValue={DEFAULT_CURSOR_CONFIG.scrollIntervalBase} unit="ms" onChange={v => { cursorConfigRef.current.scrollIntervalBase = v }} />
          <CtrlRow label="scale"     min={1.5} max={10}  step={0.1}  defaultValue={DEFAULT_CURSOR_CONFIG.scrollRingScale}    unit="×"  onChange={v => { cursorConfigRef.current.scrollRingScale    = v }} />
          <CtrlRow label="duration"  min={0.2} max={1.5} step={0.05} defaultValue={DEFAULT_CURSOR_CONFIG.scrollRingDuration} unit="s"  onChange={v => { cursorConfigRef.current.scrollRingDuration = v }} />
        </StateBox>

        {/* 4. CARD DISTORTION */}
        <StateBox title="card distortion" cursorAttr="card" cursorLabel="open" dark zoneLabel="hover card →  distortion"
          onCopy={() => { const c = cursorConfigRef.current; return { backdropScaleCard: c.backdropScaleCard } }}>
          <CtrlRow label="card dist" min={0} max={200} step={1} defaultValue={DEFAULT_CURSOR_CONFIG.backdropScaleCard} unit="px" onChange={v => { cursorConfigRef.current.backdropScaleCard = v }} />
        </StateBox>

      </div>

      {/* ── Ctrl toggle ── */}
      <button
        className={`${styles.ctrlToggle} ${ctrlOpen ? styles.ctrlToggleOpen : ''}`}
        onClick={() => setCtrlOpen(v => !v)}
      >
        ctrl
      </button>

      {/* ── Ctrl panel ── */}
      <div className={`${styles.ctrlPanel} ${ctrlOpen ? styles.ctrlPanelOpen : ''}`}>
        <div className={styles.ctrlPanelInner}>

          <p className={styles.ctrlSection}>tilt</p>
          <CtrlRow label="max tilt"  min={1}    max={20}   step={0.5}  defaultValue={TILT.max}        unit="°" onChange={v => { tilt.current.max = v }} />
          <CtrlRow label="stiffness" min={0.01} max={0.4}  step={0.01} defaultValue={TILT.stiffness}  unit=""  onChange={v => { tilt.current.stiffness = v }} />
          <CtrlRow label="damping"   min={0.5}  max={0.98} step={0.01} defaultValue={TILT.damping}    unit=""  onChange={v => { tilt.current.damping = v }} />

          <p className={styles.ctrlSection}>highlight</p>
          <CtrlRow label="intensity" min={0}   max={1}   step={0.01} defaultValue={LIGHT.intensity} unit=""  onChange={v => { light.current.intensity = v }} />
          <CtrlRow label="size"      min={10}  max={200} step={1}    defaultValue={LIGHT.size}      unit="%" onChange={v => { light.current.size = v }} />
          <CtrlRow label="travel"    min={0}   max={120} step={1}    defaultValue={LIGHT.travel}    unit=""  onChange={v => { light.current.travel = v }} />
          <CtrlRow label="diffuse"   min={0}   max={0.5} step={0.01} defaultValue={LIGHT.diffuse}   unit=""  onChange={v => { light.current.diffuse = v }} />
          <CtrlRow label="shadow"    min={0}   max={0.5} step={0.01} defaultValue={LIGHT.shadow}    unit=""  onChange={v => { light.current.shadow = v }} />

          <p className={styles.ctrlSection}>ghost effect</p>
          <div className={styles.ctrlBtnRow}>
            <button className={`${styles.variantBtn} ${ghost.current.variant === 'front'  ? styles.variantBtnActive : ''}`} onClick={() => { ghost.current.variant = 'front';  rerender() }}>on top</button>
            <button className={`${styles.variantBtn} ${ghost.current.variant === 'behind' ? styles.variantBtnActive : ''}`} onClick={() => { ghost.current.variant = 'behind'; rerender() }}>behind</button>
          </div>
          <CtrlRow label="layers"  min={3}    max={16} step={1}    defaultValue={GHOST.layers}  unit=""   onChange={v => { ghost.current.layers = Math.round(v); rerender() }} />
          <CtrlRow label="opacity" min={0.01} max={1}  step={0.01} defaultValue={GHOST.opacity} unit=""   onChange={v => { ghost.current.opacity = v }} />
          <CtrlRow label="blur"    min={0}    max={40} step={0.5}  defaultValue={GHOST.blur}    unit="px" onChange={v => { ghost.current.blur = v }} />
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>blend</span>
            <select className={styles.ctrlSelect} defaultValue={GHOST.blend} onChange={e => { ghost.current.blend = e.target.value }}>
              {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <p className={styles.ctrlSection}>vignette blur</p>
          <CtrlRow label="blur"  min={0}  max={40}  step={0.5} defaultValue={14} unit="px" onChange={v => { vignette.current.blur = v; rerender() }} />
          <CtrlRow label="start" min={0}  max={100} step={1}   defaultValue={72} unit="%"  onChange={v => { vignette.current.start = v; rerender() }} />

          <p className={styles.ctrlSection}>reveal</p>
          <CtrlRow label="stagger"  min={20}  max={200}  step={1} defaultValue={REVEAL.stagger} unit="ms" onChange={v => { reveal.current.stagger = v }} />
          <CtrlRow label="duration" min={100} max={1200} step={1} defaultValue={REVEAL.dur}     unit="ms" onChange={v => { reveal.current.dur = v }} />
          <CtrlRow label="blur"     min={0}   max={24}   step={1} defaultValue={REVEAL.blur}    unit="px" onChange={v => { reveal.current.blur = v }} />
          <CtrlRow label="y offset" min={0}   max={40}   step={1} defaultValue={REVEAL.y}       unit="px" onChange={v => { reveal.current.y = v }} />

          <div className={styles.btnRow}>
            <button className={styles.replayBtn} onClick={() => triggerRevealFn.current()}>replay reveal</button>
            <button className={`${styles.replayBtn} ${styles.copyBtn}`} onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                reveal: { stagger: reveal.current.stagger, dur: reveal.current.dur, blur: reveal.current.blur, y: reveal.current.y },
                tilt:   { max: tilt.current.max, stiffness: tilt.current.stiffness, damping: tilt.current.damping },
              }, null, 2))
            }}>copy card</button>
          </div>
          <div className={styles.btnRow}>
            <button className={`${styles.replayBtn} ${styles.copyBtn}`} onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(cursorConfigRef.current, null, 2))
            }}>copy cursor</button>
          </div>

        </div>
      </div>
    </div>
  )
}
