'use client'

import { useAnimationControls } from './AnimationControls'
import StarAnimationCanvas from './StarAnimationCanvas'
import s from './AnimationSlidersCanvas.module.css'

interface SliderConfig {
  key: 'rotation' | 'stiffness' | 'damping'
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const SLIDERS: SliderConfig[] = [
  { key: 'rotation',  label: 'Rotation',  min: 0,   max: 180, step: 1,    format: v => `${Math.round(v)}°/s` },
  { key: 'stiffness', label: 'Stiffness', min: 0.5, max: 10,  step: 0.1,  format: v => v.toFixed(1) },
  { key: 'damping',   label: 'Damping',   min: 0.3, max: 4,   step: 0.05, format: v => v.toFixed(2) },
]

export default function AnimationSlidersCanvas() {
  const { params, setParam } = useAnimationControls()

  return (
    <div className={s.panel}>
      <div className={s.stage}>
        <StarAnimationCanvas />
      </div>
      <div className={s.controls}>
        <div className={s.heading}>Tweak the animation</div>
        {SLIDERS.map(c => (
          <div key={c.key} className={s.row}>
            <span className={s.label}>{c.label}</span>
            <input
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={params[c.key]}
              onChange={e => setParam(c.key, +e.target.value)}
              className={s.slider}
              aria-label={c.label}
            />
            <span className={s.value}>{c.format(params[c.key])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
