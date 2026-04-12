'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { CaseStudy } from '@/data/cases'
import CaseStudyPage from '@/components/case-study/CaseStudyPage'
import styles from './MobileCaseStudy.module.css'

interface Props {
  cs: CaseStudy
  show: boolean
  onScrollEnd: () => void
}

export default function MobileCaseStudy({ cs, show, onScrollEnd }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollEndFiredRef = useRef(false)
  const readyRef = useRef(false)

  useEffect(() => {
    if (show) {
      scrollEndFiredRef.current = false
      if (scrollRef.current) scrollRef.current.scrollTop = 0
      const t = setTimeout(() => { readyRef.current = true }, 600)
      return () => clearTimeout(t)
    } else {
      readyRef.current = false
    }
  }, [show])

  const onScroll = useCallback(() => {
    if (!readyRef.current || scrollEndFiredRef.current) return
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      scrollEndFiredRef.current = true
      onScrollEnd()
    }
  }, [onScrollEnd])

  return (
    <div
      ref={scrollRef}
      className={`${styles.overlay} ${show ? styles.overlayVisible : ''}`}
      onScroll={onScroll}
      aria-hidden={!show}
    >
      <CaseStudyPage cs={cs} isOverlay />
      <div className={styles.scrollSpacer} />
    </div>
  )
}
