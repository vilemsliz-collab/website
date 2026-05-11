'use client'
import { useState, useEffect } from 'react'
import s from './Loader.module.css'

const COLORS = [
  'rgba(210,215,235,0.80)',
  'rgba(195,205,228,0.75)',
  'rgba(225,225,238,0.70)',
  'rgba(180,195,225,0.78)',
  'rgba(215,220,240,0.72)',
]

interface OrbState { color: string; top: string; left: string; delay: string }

export default function Loader({ visible }: { visible: boolean }) {
  const [orbs, setOrbs] = useState<OrbState[]>([])

  useEffect(() => {
    setOrbs(COLORS.map(color => ({
      color,
      top:   `${Math.round(5  + Math.random() * 85)}%`,
      left:  `${Math.round(5  + Math.random() * 85)}%`,
      delay: `${(Math.random() * 0.3).toFixed(2)}s`,
    })))
  }, [])

  return (
    <div className={`${s.loader} ${visible ? '' : s.hidden}`} aria-hidden={!visible}>
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={s.orb}
          style={{ top: orb.top, left: orb.left, animationDelay: orb.delay, background: orb.color }}
        />
      ))}
      <p className={s.name}>Vilem</p>
    </div>
  )
}
