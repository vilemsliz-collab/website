'use client'

import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { CASES } from '@/data/cases'
import { useIsMobile } from '@/hooks/useIsMobile'
import CaseStudyMobileBar from './CaseStudyMobileBar'
import CaseSlideShell from './CaseSlideShell'
import s from './MobileCaseShell.module.css'

type Ctx = {
  closeToPortfolio: () => void
  goToNext: () => void
}

export const MobileCaseShellContext = createContext<Ctx | null>(null)

const TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }
const SWIPE_THRESHOLD_X = 60
const SWIPE_THRESHOLD_Y = 60

export default function MobileCaseShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const params = useParams() as { slug?: string }
  const [isClosing, setIsClosing] = useState(false)

  const closeToPortfolio = useCallback(() => {
    setIsClosing(true)
  }, [])

  const goToNext = useCallback(() => {
    const slug = params.slug
    if (!slug) return
    const idx = CASES.findIndex(c => c.slug === slug)
    if (idx === -1 || idx === CASES.length - 1) {
      setIsClosing(true)
      return
    }
    const next = CASES[idx + 1]
    router.push(`/cases/${next.slug}`)
  }, [params.slug, router])

  const ctxValue = useMemo<Ctx>(() => ({ closeToPortfolio, goToNext }), [closeToPortfolio, goToNext])

  // Touch handling for edge swipe zones
  const topTouch = useRef<{ x: number; y: number } | null>(null)
  const rightTouch = useRef<{ x: number; y: number } | null>(null)

  const onTopStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    topTouch.current = { x: t.clientX, y: t.clientY }
  }
  const onTopEnd = (e: React.TouchEvent) => {
    const start = topTouch.current
    topTouch.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dy = t.clientY - start.y
    const dx = t.clientX - start.x
    if (dy > SWIPE_THRESHOLD_Y && Math.abs(dy) > Math.abs(dx)) closeToPortfolio()
  }
  const onRightStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    rightTouch.current = { x: t.clientX, y: t.clientY }
  }
  const onRightEnd = (e: React.TouchEvent) => {
    const start = rightTouch.current
    rightTouch.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (dx < -SWIPE_THRESHOLD_X && Math.abs(dx) > Math.abs(dy)) goToNext()
  }

  if (!isMobile) return <>{children}</>

  return (
    <MobileCaseShellContext.Provider value={ctxValue}>
      <LazyMotion features={domAnimation} strict>
        <m.div
          className={s.shell}
          initial={{ y: '100%' }}
          animate={isClosing ? { y: '100%' } : { y: 0 }}
          transition={TRANSITION}
          onAnimationComplete={() => {
            if (isClosing) router.replace('/portfolio')
          }}
        >
          <CaseStudyMobileBar />
          <div
            className={s.topSwipeZone}
            onTouchStart={onTopStart}
            onTouchEnd={onTopEnd}
            aria-hidden
          />
          <div
            className={s.rightSwipeZone}
            onTouchStart={onRightStart}
            onTouchEnd={onRightEnd}
            aria-hidden
          />
          <CaseSlideShell>{children}</CaseSlideShell>
        </m.div>
      </LazyMotion>
    </MobileCaseShellContext.Provider>
  )
}
