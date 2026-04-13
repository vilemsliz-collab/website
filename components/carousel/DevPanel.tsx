'use client'

import { useRef, type MutableRefObject } from 'react'
import { PRESETS, type CarouselCFG, type RevealConfig, type InputConfig, type TiltConfig, type GhostConfig, type LightConfig } from '@/lib/carouselConfig'
import styles from './DevPanel.module.css'

interface DevRowProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  fmt: (v: number) => string
  onChange: (v: number) => void
}

function DevRow({ label, min, max, step, value, fmt, onChange }: DevRowProps) {
  const rangeRef = useRef<HTMLInputElement>(null)
  const valRef   = useRef<HTMLSpanElement>(null)

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    if (valRef.current) valRef.current.textContent = fmt(v)
    onChange(v)
  }

  return (
    <div className={styles.devRow}>
      <span className={styles.devLabel}>{label}</span>
      <input
        ref={rangeRef}
        type="range"
        min={min} max={max} step={step}
        defaultValue={value}
        onChange={handle}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      />
      <span ref={valRef} className={styles.devVal}>{fmt(value)}</span>
    </div>
  )
}

export interface GlassConfig { blur: number; opacity: number; color: number }

interface DevPanelProps {
  open: boolean
  onToggle: () => void
  cfg: MutableRefObject<CarouselCFG>
  revealRef: MutableRefObject<RevealConfig>
  inputRef: MutableRefObject<InputConfig>
  tiltCfg: MutableRefObject<TiltConfig>
  ghostCfg: MutableRefObject<GhostConfig>
  lightCfg: MutableRefObject<LightConfig>
  glassCfg: MutableRefObject<GlassConfig>
  onCfgChange: () => void
  onGhostRebuild: () => void
  onGlassChange: () => void
}

export default function DevPanel({
  open, onToggle, cfg, revealRef, inputRef, tiltCfg, ghostCfg, lightCfg, glassCfg, onCfgChange, onGhostRebuild, onGlassChange,
}: DevPanelProps) {
  function copyToClipboard(text: string, btn: HTMLButtonElement) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'copied!'
      btn.classList.add(styles.copied)
      setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove(styles.copied) }, 1500)
    })
  }

  return (
    <>
      <button className={`${styles.ctrlToggle} ${open ? styles.ctrlToggleOpen : ''}`} onClick={onToggle}>
        ctrl
      </button>

      <div className={`${styles.ctrlPanel} ${open ? styles.ctrlPanelOpen : ''}`}>
        <div className={styles.ctrlPanelInner}>

          {/* ── Carousel settings ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Carousel settings</div>
            <DevRow label="R mult"       min={0.3}  max={1.5}  step={0.01} value={cfg.current.R_MULT}       fmt={v => v.toFixed(2)}         onChange={v => { cfg.current.R_MULT = v; onCfgChange() }} />
            <DevRow label="Perspective"  min={100}  max={2000} step={10}   value={cfg.current.PERSPECTIVE}  fmt={v => Math.round(v) + 'px'} onChange={v => { cfg.current.PERSPECTIVE = v; onCfgChange() }} />
            {[0,1,2,3,4].map(i => (
              <DevRow key={i} label={`Lat ${i}`} min={-90} max={90} step={1} value={cfg.current.LAT[i]} fmt={v => Math.round(v) + '°'} onChange={v => { cfg.current.LAT[i] = v; onCfgChange() }} />
            ))}
            <DevRow label="Lon spread"   min={0.2}  max={1.0}  step={0.01} value={cfg.current.LON_SPREAD}  fmt={v => v.toFixed(2)}         onChange={v => { cfg.current.LON_SPREAD = v; onCfgChange() }} />
            <DevRow label="Y offset"     min={-300} max={300}  step={5}    value={cfg.current.Y_OFFSET}    fmt={v => Math.round(v) + 'px'} onChange={v => { cfg.current.Y_OFFSET = v; onCfgChange() }} />
            <DevRow label="Scale active" min={0.5}  max={1.8}  step={0.01} value={cfg.current.SCALE_ACTIVE} fmt={v => v.toFixed(2)}        onChange={v => { cfg.current.SCALE_ACTIVE = v; onCfgChange() }} />
            <DevRow label="Scale sphere" min={0.3}  max={1.2}  step={0.01} value={cfg.current.SCALE_SPHERE} fmt={v => v.toFixed(2)}        onChange={v => { cfg.current.SCALE_SPHERE = v; onCfgChange() }} />
            <DevRow label="Opacity ×"    min={0}    max={2.0}  step={0.01} value={cfg.current.OPACITY_MULT} fmt={v => v.toFixed(2)}        onChange={v => { cfg.current.OPACITY_MULT = v; onCfgChange() }} />
            <DevRow label="Opacity base" min={0}    max={1.0}  step={0.01} value={cfg.current.OPACITY_BASE} fmt={v => v.toFixed(2)}        onChange={v => { cfg.current.OPACITY_BASE = v; onCfgChange() }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`R_MULT: ${cfg.current.R_MULT.toFixed(2)}, PERSPECTIVE: ${Math.round(cfg.current.PERSPECTIVE)}, LAT: [${cfg.current.LAT.map(v => Math.round(v)).join(', ')}], LON_SPREAD: ${cfg.current.LON_SPREAD.toFixed(2)}, Y_OFFSET: ${Math.round(cfg.current.Y_OFFSET)}, SCALE_ACTIVE: ${cfg.current.SCALE_ACTIVE.toFixed(2)}, SCALE_SPHERE: ${cfg.current.SCALE_SPHERE.toFixed(2)}, OPACITY_MULT: ${cfg.current.OPACITY_MULT.toFixed(2)}, OPACITY_BASE: ${cfg.current.OPACITY_BASE.toFixed(2)}`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Scroll ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Scroll</div>
            <DevRow label="decel"       min={0.70} max={0.99} step={0.01} value={cfg.current.FRICTION}       fmt={v => v.toFixed(2)} onChange={v => { cfg.current.FRICTION = v }} />
            <DevRow label="spring"      min={0.01} max={0.40} step={0.01} value={cfg.current.SPRING}         fmt={v => v.toFixed(2)} onChange={v => { cfg.current.SPRING = v }} />
            <DevRow label="mouse kick"  min={0}    max={2.0}  step={0.05} value={inputRef.current.mouseKick} fmt={v => v.toFixed(2)} onChange={v => { inputRef.current.mouseKick = v }} />
            <DevRow label="touch sens"  min={0}    max={3.0}  step={0.02} value={inputRef.current.touchSens} fmt={v => v.toFixed(2)} onChange={v => { inputRef.current.touchSens = v }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`FRICTION: ${cfg.current.FRICTION.toFixed(2)}, SPRING: ${cfg.current.SPRING.toFixed(2)}, mouseKick: ${inputRef.current.mouseKick.toFixed(2)}, touchSens: ${inputRef.current.touchSens.toFixed(2)}`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Ghost ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Ghost</div>
            <div className={styles.devBtnRow}>
              <button className={`${styles.devBtn} ${ghostCfg.current.variant === 'front' ? styles.devBtnActive : ''}`} onClick={() => { ghostCfg.current.variant = 'front'; onGhostRebuild() }}>on top</button>
              <button className={`${styles.devBtn} ${ghostCfg.current.variant === 'behind' ? styles.devBtnActive : ''}`} onClick={() => { ghostCfg.current.variant = 'behind'; onGhostRebuild() }}>behind</button>
            </div>
            <DevRow label="layers"  min={1}    max={16}  step={1}    value={ghostCfg.current.layers}  fmt={v => String(Math.round(v))} onChange={v => { ghostCfg.current.layers = Math.round(v); onGhostRebuild() }} />
            <DevRow label="opacity" min={0.01} max={1}   step={0.01} value={ghostCfg.current.opacity} fmt={v => v.toFixed(2)} onChange={v => { ghostCfg.current.opacity = v }} />
            <DevRow label="blur"    min={0}    max={40}  step={0.5}  value={ghostCfg.current.blur}    fmt={v => v.toFixed(1) + 'px'} onChange={v => { ghostCfg.current.blur = v }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`layers: ${ghostCfg.current.layers}, opacity: ${ghostCfg.current.opacity.toFixed(2)}, blur: ${ghostCfg.current.blur.toFixed(1)}, variant: '${ghostCfg.current.variant}'`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Tilt ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Tilt</div>
            <DevRow label="max"       min={0}    max={40}   step={1}    value={tiltCfg.current.max}       fmt={v => Math.round(v) + '°'} onChange={v => { tiltCfg.current.max = v }} />
            <DevRow label="stiffness" min={0.01} max={0.5}  step={0.01} value={tiltCfg.current.stiffness} fmt={v => v.toFixed(2)} onChange={v => { tiltCfg.current.stiffness = v }} />
            <DevRow label="damping"   min={0.5}  max={0.99} step={0.01} value={tiltCfg.current.damping}   fmt={v => v.toFixed(2)} onChange={v => { tiltCfg.current.damping = v }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`max: ${tiltCfg.current.max}, stiffness: ${tiltCfg.current.stiffness.toFixed(2)}, damping: ${tiltCfg.current.damping.toFixed(2)}`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Highlight ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Highlight</div>
            <DevRow label="intensity" min={0}   max={1}   step={0.01} value={lightCfg.current.intensity} fmt={v => v.toFixed(2)}         onChange={v => { lightCfg.current.intensity = v }} />
            <DevRow label="size"      min={10}  max={200} step={1}    value={lightCfg.current.size}      fmt={v => Math.round(v) + '%'}  onChange={v => { lightCfg.current.size = v }} />
            <DevRow label="blur"      min={0}   max={80}  step={1}    value={lightCfg.current.blur}      fmt={v => Math.round(v) + 'px'} onChange={v => { lightCfg.current.blur = v }} />
            <DevRow label="travel"    min={0}   max={120} step={1}    value={lightCfg.current.travel}    fmt={v => Math.round(v) + ''}   onChange={v => { lightCfg.current.travel = v }} />
            <DevRow label="diffuse"   min={0}   max={0.5} step={0.01} value={lightCfg.current.diffuse}   fmt={v => v.toFixed(2)}         onChange={v => { lightCfg.current.diffuse = v }} />
            <DevRow label="shadow"    min={0}   max={0.5} step={0.01} value={lightCfg.current.shadow}    fmt={v => v.toFixed(2)}         onChange={v => { lightCfg.current.shadow = v }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`intensity: ${lightCfg.current.intensity.toFixed(2)}, size: ${Math.round(lightCfg.current.size)}, blur: ${Math.round(lightCfg.current.blur)}px, travel: ${Math.round(lightCfg.current.travel)}, diffuse: ${lightCfg.current.diffuse.toFixed(2)}, shadow: ${lightCfg.current.shadow.toFixed(2)}`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Glass ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Glass</div>
            <DevRow label="blur"    min={0}   max={40}  step={0.5}  value={glassCfg.current.blur}    fmt={v => v.toFixed(1)+'px'} onChange={v => { glassCfg.current.blur = v; onGlassChange() }} />
            <DevRow label="opacity" min={0}   max={1}   step={0.01} value={glassCfg.current.opacity} fmt={v => v.toFixed(2)}      onChange={v => { glassCfg.current.opacity = v; onGlassChange() }} />
            <DevRow label="tint"    min={0}   max={255} step={1}    value={glassCfg.current.color}   fmt={v => Math.round(v).toString()} onChange={v => { glassCfg.current.color = Math.round(v); onGlassChange() }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`backdrop-filter: blur(${glassCfg.current.blur.toFixed(1)}px); background: rgba(${glassCfg.current.color}, ${glassCfg.current.color}, ${glassCfg.current.color}, ${glassCfg.current.opacity.toFixed(2)});`, e.currentTarget)}>copy</button>
          </div>

          {/* ── Reveal ── */}
          <div className={styles.devSection}>
            <div className={styles.devSectionTitle}>Reveal</div>
            <DevRow label="stagger"  min={20}  max={300}  step={1}   value={revealRef.current.stagger} fmt={v => Math.round(v) + 'ms'} onChange={v => { revealRef.current.stagger = v }} />
            <DevRow label="duration" min={100} max={1200} step={1}   value={revealRef.current.dur}     fmt={v => Math.round(v) + 'ms'} onChange={v => { revealRef.current.dur = v }} />
            <DevRow label="blur"     min={0}   max={24}   step={0.5} value={revealRef.current.blur}    fmt={v => v.toFixed(1) + 'px'} onChange={v => { revealRef.current.blur = v }} />
            <DevRow label="y offset" min={0}   max={40}   step={1}   value={revealRef.current.y}       fmt={v => Math.round(v) + 'px'} onChange={v => { revealRef.current.y = v }} />
            <button className={styles.devCopy} onClick={e => copyToClipboard(`stagger: ${Math.round(revealRef.current.stagger)}, dur: ${Math.round(revealRef.current.dur)}, blur: ${revealRef.current.blur.toFixed(1)}, y: ${Math.round(revealRef.current.y)}`, e.currentTarget)}>copy</button>
          </div>

        </div>
      </div>
    </>
  )
}
