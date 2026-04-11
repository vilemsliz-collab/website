'use client'

import { useRef, useState } from 'react'
import TiltCard from '@/components/card-playground/TiltCard'
import type { TiltConfig, GhostConfig, LightConfig, RevealConfig } from '@/components/card-playground/TiltCard'
import styles from '@/components/card-playground/CardPlayground.module.css'

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
        onInput={e => { const v = parseFloat((e.target as HTMLInputElement).value); setVal(v); onChange(v) }}
      />
      <span className={styles.ctrlVal}>{val}{unit}</span>
    </div>
  )
}

export default function CardPage() {
  const tilt    = useRef<TiltConfig>({ max: 16, stiffness: 0.1, damping: 0.75 })
  const ghost   = useRef<GhostConfig>({ layers: 6, opacity: 0.16, blur: 0, blend: 'normal', variant: 'behind' })
  const light   = useRef<LightConfig>({ intensity: 0.5, size: 52, travel: 68, diffuse: 0.10, shadow: 0.18 })
  const reveal  = useRef<RevealConfig>({ stagger: 58, dur: 682, blur: 8, y: 8 })
  const vignette = useRef({ blur: 14, start: 72 })
  const triggerRevealFn = useRef<() => void>(() => {})
  const [, forceUpdate] = useState(0)
  const rerender = () => forceUpdate(v => v + 1)

  return (
    <div className={styles.page}>
      <nav className={styles.siteNav}>
        <a href="/portfolio">Portfolio</a>
        <a href="/card" className={styles.navActive}>Card</a>
        <a href="/design-system">Design System</a>
      </nav>

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
      />

      <div className={styles.controls}>
        <p className={styles.ctrlSection}>tilt</p>
        <CtrlRow label="max tilt"  min={1}    max={20}   step={0.5}  defaultValue={16}   unit="°" onChange={v => { tilt.current.max = v }} />
        <CtrlRow label="stiffness" min={0.01} max={0.4}  step={0.01} defaultValue={0.1}  unit=""  onChange={v => { tilt.current.stiffness = v }} />
        <CtrlRow label="damping"   min={0.5}  max={0.98} step={0.01} defaultValue={0.75} unit=""  onChange={v => { tilt.current.damping = v }} />

        <p className={styles.ctrlSection}>highlight</p>
        <CtrlRow label="intensity" min={0}   max={1}   step={0.01} defaultValue={0.5}  unit=""  onChange={v => { light.current.intensity = v }} />
        <CtrlRow label="size"      min={10}  max={100} step={1}    defaultValue={52}   unit="%" onChange={v => { light.current.size = v }} />
        <CtrlRow label="travel"    min={0}   max={120} step={1}    defaultValue={68}   unit=""  onChange={v => { light.current.travel = v }} />
        <CtrlRow label="diffuse"   min={0}   max={0.5} step={0.01} defaultValue={0.1}  unit=""  onChange={v => { light.current.diffuse = v }} />
        <CtrlRow label="shadow"    min={0}   max={0.5} step={0.01} defaultValue={0.18} unit=""  onChange={v => { light.current.shadow = v }} />

        <p className={styles.ctrlSection}>ghost effect</p>
        <div className={styles.ctrlBtnRow}>
          <button className={`${styles.variantBtn} ${ghost.current.variant === 'front' ? styles.variantBtnActive : ''}`} onClick={() => { ghost.current.variant = 'front'; rerender() }}>on top</button>
          <button className={`${styles.variantBtn} ${ghost.current.variant === 'behind' ? styles.variantBtnActive : ''}`} onClick={() => { ghost.current.variant = 'behind'; rerender() }}>behind</button>
        </div>
        <CtrlRow label="layers"  min={3}    max={16} step={1}    defaultValue={6}    unit=""   onChange={v => { ghost.current.layers = Math.round(v); rerender() }} />
        <CtrlRow label="opacity" min={0.01} max={1}  step={0.01} defaultValue={0.16} unit=""   onChange={v => { ghost.current.opacity = v }} />
        <CtrlRow label="blur"    min={0}    max={40} step={0.5}  defaultValue={0}    unit="px" onChange={v => { ghost.current.blur = v }} />
        <div className={styles.ctrlRow}>
          <span className={styles.ctrlLabel}>blend</span>
          <select className={styles.ctrlSelect} defaultValue="normal" onChange={e => { ghost.current.blend = e.target.value }}>
            {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <p className={styles.ctrlSection}>vignette blur</p>
        <CtrlRow label="blur"  min={0}  max={40}  step={0.5} defaultValue={14} unit="px" onChange={v => { vignette.current.blur = v; rerender() }} />
        <CtrlRow label="start" min={0}  max={100} step={1}   defaultValue={72} unit="%"  onChange={v => { vignette.current.start = v; rerender() }} />

        <p className={styles.ctrlSection}>reveal</p>
        <CtrlRow label="stagger"  min={20}  max={200}  step={1} defaultValue={58}  unit="ms" onChange={v => { reveal.current.stagger = v }} />
        <CtrlRow label="duration" min={100} max={1200} step={1} defaultValue={682} unit="ms" onChange={v => { reveal.current.dur = v }} />
        <CtrlRow label="blur"     min={0}   max={24}   step={1} defaultValue={8}   unit="px" onChange={v => { reveal.current.blur = v }} />
        <CtrlRow label="y offset" min={0}   max={40}   step={1} defaultValue={8}   unit="px" onChange={v => { reveal.current.y = v }} />

        <div className={styles.btnRow}>
          <button className={styles.replayBtn} onClick={() => triggerRevealFn.current()}>replay reveal</button>
          <button className={`${styles.replayBtn} ${styles.copyBtn}`} onClick={() => {
            navigator.clipboard.writeText(JSON.stringify({
              reveal: { stagger: reveal.current.stagger, dur: reveal.current.dur, blur: reveal.current.blur, y: reveal.current.y },
              tilt: { max: tilt.current.max, stiffness: tilt.current.stiffness, damping: tilt.current.damping },
            }, null, 2))
          }}>copy values</button>
        </div>
      </div>
    </div>
  )
}
