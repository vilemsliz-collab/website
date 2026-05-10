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
  useEffect(() => {
    setMode(window.self === window.top ? 'top' : 'iframe')
  }, [])

  return (
    <>
      <CursorLiquidFilter />
      {mode === 'top' ? <LenisProvider>{children}</LenisProvider> : <>{children}</>}
      {mode === 'top' && process.env.NODE_ENV === 'development' && <Agentation />}
    </>
  )
}
