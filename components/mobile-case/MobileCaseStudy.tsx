'use client'

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { CaseStudy } from '@/data/cases'
import CaseStudyPage from '@/components/case-study/CaseStudyPage'
import styles from './MobileCaseStudy.module.css'

export const PEEK_PCT = 68

export interface MobileCaseStudyHandle {
  setDragOffset(percent: number): void
  snapOpen(): void
  snapPeek(): void
}

interface Props {
  cs: CaseStudy
  onScrollEnd: () => void
}

const MobileCaseStudy = forwardRef<MobileCaseStudyHandle, Props>(
  function MobileCaseStudy({ cs, onScrollEnd }, ref) {
    const scrollRef  = useRef<HTMLDivElement>(null)
    const readyRef   = useRef(false)
    const firedRef   = useRef(false)

    useImperativeHandle(ref, () => ({
      setDragOffset(percent: number) {
        const el = scrollRef.current
        if (!el) return
        el.style.transition = 'none'
        el.style.transform  = `translateY(${percent}%)`
      },
      snapOpen() {
        const el = scrollRef.current
        if (!el) return
        el.scrollTop = 0
        firedRef.current = false
        el.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform  = 'translateY(0)'
        setTimeout(() => { readyRef.current = true }, 350)
      },
      snapPeek() {
        readyRef.current = false
        firedRef.current = false
        const el = scrollRef.current
        if (!el) return
        el.scrollTop = 0
        el.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform  = `translateY(${PEEK_PCT}%)`
      },
    }))

    const onScroll = useCallback(() => {
      if (!readyRef.current || firedRef.current) return
      const el = scrollRef.current
      if (!el) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        firedRef.current = true
        onScrollEnd()
      }
    }, [onScrollEnd])

    return (
      <div
        ref={scrollRef}
        className={styles.overlay}
        onScroll={onScroll}
      >
        <div className={styles.handle} />
        <CaseStudyPage cs={cs} isOverlay />
        <div className={styles.scrollSpacer} />
      </div>
    )
  }
)

export default MobileCaseStudy
