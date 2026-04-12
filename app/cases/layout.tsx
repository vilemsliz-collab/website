'use client'

import { useEffect } from 'react'

function OverscrollRelay() {
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      const el = document.documentElement
      const atBottom = el.scrollTop + window.innerHeight >= el.scrollHeight - 2
      const atTop    = el.scrollTop <= 0

      if ((atBottom && e.deltaY > 0) || (atTop && e.deltaY < 0)) {
        window.parent.postMessage(
          { type: 'carousel-overscroll', delta: e.deltaX + e.deltaY },
          '*'
        )
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  return null
}

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Transparent body so the parent glass panel shows through the iframe */}
      <style>{`html, body { background: transparent !important; }`}</style>
      <OverscrollRelay />
      {children}
    </>
  )
}
