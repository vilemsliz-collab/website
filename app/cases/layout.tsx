'use client'

import { useEffect } from 'react'
import MobileCaseShell from '@/components/case-study/MobileCaseShell'

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
      <style>{`
        html, body { background: var(--white) !important; }
        /* Parent .casePanel extends 80px below the viewport for visual bleed.
           Lift the iframe's Agentation toolbar above that overflow zone so it
           stays visible inside the case study viewport. */
        html[data-shell-mode="iframe"] [data-agentation-toolbar] {
          bottom: 100px !important;
        }
      `}</style>
      <OverscrollRelay />
      <MobileCaseShell>{children}</MobileCaseShell>
    </>
  )
}
