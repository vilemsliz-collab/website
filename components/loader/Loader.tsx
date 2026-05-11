'use client'
import { useState, useEffect } from 'react'
import s from './Loader.module.css'

// Matches PALETTES_LIGHT from OrbBackground — light center, darker edge
const PALETTES = [
  { l: [235, 235, 240], d: [140, 140, 152] },
  { l: [222, 222, 230], d: [117, 117, 130] },
  { l: [230, 230, 235], d: [133, 133, 145] },
  { l: [214, 214, 224], d: [107, 107, 122] },
  { l: [228, 228, 237], d: [125, 125, 138] },
]

function makeGradient(p: typeof PALETTES[0]) {
  const [lr, lg, lb] = p.l
  const [dr, dg, db] = p.d
  return `radial-gradient(circle at 38% 32%, rgba(${lr},${lg},${lb},0.95) 0%, rgba(${dr},${dg},${db},0.55) 68%, transparent 100%)`
}

interface OrbState { gradient: string; top: string; left: string; delay: string }

export default function Loader({ visible }: { visible: boolean }) {
  const [orbs, setOrbs] = useState<OrbState[]>([])

  useEffect(() => {
    const shuffled = [...PALETTES].sort(() => Math.random() - 0.5)
    setOrbs(shuffled.map(p => ({
      gradient: makeGradient(p),
      top:   `${Math.round(15 + Math.random() * 65)}%`,
      left:  `${Math.round(12 + Math.random() * 70)}%`,
      delay: `${(Math.random() * 0.25).toFixed(2)}s`,
    })))
  }, [])

  return (
    <div className={`${s.loader} ${visible ? '' : s.hidden}`} aria-hidden={!visible}>
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={s.orb}
          style={{ top: orb.top, left: orb.left, animationDelay: orb.delay, background: orb.gradient }}
        />
      ))}
      <p className={s.name}>Vilem</p>
    </div>
  )
}
