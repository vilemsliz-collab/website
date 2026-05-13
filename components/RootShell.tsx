'use client'

import { useState, useEffect } from 'react'
import LenisProvider from './LenisProvider'
import CursorLiquidFilter from './cursor/CursorLiquidFilter'
import { Agentation } from 'agentation'

// Detects iframe context once on mount and only mounts smooth-scroll +
// dev tools at the top window. Inside an iframe the parent already runs
// Lenis, and a second instance fights the parent. The cursor filter SVG
// is kept in both contexts because the parent's cursor backdrop-filter
// references it by id and expects it to exist on every document.
export default function RootShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'unknown' | 'top' | 'iframe'>('unknown')
  const [caseOpen, setCaseOpen] = useState(false)

  useEffect(() => {
    const m = window.self === window.top ? 'top' : 'iframe'
    setMode(m)
    document.documentElement.dataset.shellMode = m
  }, [])

  // Watch body[data-case-open] (set by Carousel) so the top-window Agentation
  // can step aside when a case study is open — otherwise its toolbar overlaps
  // the iframe's own Agentation toolbar and the user can't reach it.
  useEffect(() => {
    const read = () => setCaseOpen(document.body.dataset.caseOpen === 'true')
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-case-open'] })
    return () => obs.disconnect()
  }, [])

  const showAgentation = mode === 'iframe' || (mode === 'top' && !caseOpen)

  return (
    <>
      <CursorLiquidFilter />
      {mode === 'top' ? <LenisProvider>{children}</LenisProvider> : <>{children}</>}
      {showAgentation && <Agentation />}
    </>
  )
}
