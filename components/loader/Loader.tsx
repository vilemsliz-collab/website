'use client'
import { useState, useEffect } from 'react'
import s from './Loader.module.css'

const COLORS = [
  'rgba(235,235,240,0.72)',
  'rgba(220,220,230,0.65)',
  'rgba(230,230,237,0.60)',
  'rgba(212,212,226,0.68)',
  'rgba(225,225,235,0.70)',
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
