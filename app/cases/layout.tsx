'use client'

import { useEffect } from 'react'
import MobileCaseShell from '@/components/case-study/MobileCaseShell'

// Force-restore document scroll on case study routes. globals.css has
// `body { overflow: hidden }` for the carousel page; that rule (and any
// inline carryover from Carousel's unmount) blocks vertical scroll here.
function ScrollUnlock() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlTouch:    html.style.touchAction,
      bodyOverflow: body.style.overflow,
      bodyTouch:    body.style.touchAction,
    }
    html.style.overflow    = 'auto'
    html.style.touchAction = 'auto'
    body.style.overflow    = 'auto'
    body.style.touchAction = 'auto'
    return () => {
      html.style.overflow    = prev.htmlOverflow
      html.style.touchAction = prev.htmlTouch
      body.style.overflow    = prev.bodyOverflow
      body.style.touchAction = prev.bodyTouch
    }
  }, [])
  return null
}

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
      <style>{`html, body { background: var(--white) !important; overflow: auto !important; touch-action: auto !important; }`}</style>
      <ScrollUnlock />
      <OverscrollRelay />
      <MobileCaseShell>{children}</MobileCaseShell>
    </>
  )
}
