'use client'

import { useAnimationControls } from './AnimationControls'
import s from './AnimationSlidersCanvas.module.css'

interface SliderConfig {
  key: 'spread' | 'speed' | 'hue'
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const SLIDERS: SliderConfig[] = [
  { key: 'spread', label: 'Spread', min: 0.1,  max: 0.6,  step: 0.01, format: v => v.toFixed(2) },
  { key: 'speed',  label: 'Speed',  min: 0.2,  max: 2.5,  step: 0.05, format: v => `${v.toFixed(2)}×` },
  { key: 'hue',    label: 'Hue',    min: 0,    max: 360,  step: 1,    format: v => `${Math.round(v)}°` },
]

export default function AnimationSlidersCanvas() {
  const { params, setParam } = useAnimationControls()

  return (
    <div className={s.panel}>
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
  )
}
