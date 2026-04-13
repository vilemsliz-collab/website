'use client'

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { CaseStudy } from '@/data/cases'
import CaseStudyPage from '@/components/case-study/CaseStudyPage'
import styles from './MobileCaseStudy.module.css'

export interface MobileCaseStudyHandle {
  getScrollTop(): number
  setDragOffset(percent: number): void
  snapOpen(): void
  snapPeek(pct: number): void
}

interface Props {
  cs: CaseStudy
  onScrollEnd: () => void
}

const MobileCaseStudy = forwardRef<MobileCaseStudyHandle, Props>(
  function MobileCaseStudy({ cs, onScrollEnd }, ref) {
    const outerRef    = useRef<HTMLDivElement>(null)  // visual layer: transform, blur, border-radius
    const scrollRef   = useRef<HTMLDivElement>(null)  // scroll layer: scrollTop reads/writes
    const readyRef    = useRef(false)
    const firedRef    = useRef(false)
    const peekPctRef  = useRef(90)  // updated on each snapPeek call, used by setDragOffset

    const EASE = '0.45s cubic-bezier(0.4, 0, 0.2, 1)'
    const SIDE_TRANSITION = `width ${EASE}, left ${EASE}, border-radius ${EASE}`

    useImperativeHandle(ref, () => ({
      getScrollTop() {
        return scrollRef.current?.scrollTop ?? 0
      },
      setDragOffset(percent: number) {
        const el = outerRef.current
        if (!el) return
        const progress = 1 - percent / peekPctRef.current
        const cardW = Math.min(window.innerWidth * 0.92, 364)
        const w = cardW + (window.innerWidth - cardW) * progress
        const l = Math.max(0, (window.innerWidth - w) / 2)
        const r = Math.round(24 * (1 - progress))
        el.style.transition   = 'none'
        el.style.transform    = `translateY(${percent}%)`
        el.style.width        = `${w}px`
        el.style.left         = `${l}px`
        el.style.borderRadius = `${r}px ${r}px 0 0`
      },
      snapOpen() {
        const el = outerRef.current
        if (!el) return
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        firedRef.current = false
        el.style.transition   = `transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), ${SIDE_TRANSITION}`
        el.style.transform    = 'translateY(0)'
        el.style.width        = '100vw'
        el.style.left         = '0px'
        el.style.borderRadius = '24px 24px 0 0'
        setTimeout(() => { readyRef.current = true }, 350)
      },
      snapPeek(pct: number) {
        peekPctRef.current = pct
        readyRef.current = false
        firedRef.current = false
        const el = outerRef.current
        if (!el) return
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        const cardW = Math.min(window.innerWidth * 0.92, 364)
        const l = Math.max(0, (window.innerWidth - cardW) / 2)
        el.style.transition   = `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), ${SIDE_TRANSITION}`
        el.style.transform    = `translateY(${pct}%)`
        el.style.width        = `${cardW}px`
        el.style.left         = `${l}px`
        el.style.setProperty('border-radius', 'var(--shape-card)')
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
      <div ref={outerRef} className={styles.overlay}>
        <div ref={scrollRef} className={styles.overlayScroll} onScroll={onScroll}>
          <div className={styles.handle} />
          <CaseStudyPage cs={cs} isOverlay />
          <div className={styles.scrollSpacer} />
        </div>
      </div>
    )
  }
)

export default MobileCaseStudy
