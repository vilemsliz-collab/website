'use client'

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import type { CaseStudy } from '@/data/cases'
import type { CardData } from '@/lib/carouselConfig'
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
  card: CardData
  onScrollEnd: () => void
}

const MobileCaseStudy = forwardRef<MobileCaseStudyHandle, Props>(
  function MobileCaseStudy({ cs, card, onScrollEnd }, ref) {
    const outerRef      = useRef<HTMLDivElement>(null)  // visual layer
    const scrollRef     = useRef<HTMLDivElement>(null)  // scroll layer
    const heroRef       = useRef<HTMLDivElement>(null)  // card hero element
    const readyRef      = useRef(false)
    const firedRef      = useRef(false)
    const peekPctRef    = useRef(90)
    const cardBottomRef = useRef<number | null>(null)   // carousel card bottom screen Y

    const EASE = '0.45s cubic-bezier(0.4, 0, 0.2, 1)'
    const SIDE_TRANSITION = `width ${EASE}, left ${EASE}, border-radius ${EASE}`

    useImperativeHandle(ref, () => ({
      getScrollTop() {
        return scrollRef.current?.scrollTop ?? 0
      },
      setDragOffset(percent: number) {
        const el   = outerRef.current
        const hero = heroRef.current
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

        // Pin hero below the carousel card — tracks at card bottom during drag
        if (hero && cardBottomRef.current !== null) {
          const overlayTopPx   = window.innerHeight * percent / 100
          const heroNaturalTop = hero.offsetTop   // stable layout position from overlay top
          const targetY        = cardBottomRef.current - overlayTopPx - heroNaturalTop
          const heroTranslateY = Math.max(0, targetY)
          const hr             = Math.round(32 - 16 * progress)  // 32px → 16px
          hero.style.opacity      = String(Math.min(1, progress * 4))  // quick fade-in
          hero.style.transform    = `translateY(${heroTranslateY}px)`
          hero.style.borderRadius = `${hr}px`
        }
      },
      snapOpen() {
        const el   = outerRef.current
        const hero = heroRef.current
        if (!el) return
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        firedRef.current = false
        el.style.transition   = `transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), ${SIDE_TRANSITION}`
        el.style.transform    = 'translateY(0)'
        el.style.width        = '100vw'
        el.style.left         = '0px'
        el.style.borderRadius = '24px 24px 0 0'
        if (hero) {
          hero.style.transition   = 'opacity 0.35s ease, transform 0.55s cubic-bezier(0.4,0,0.2,1), border-radius 0.35s ease'
          hero.style.opacity      = '1'
          hero.style.transform    = 'translateY(0)'
          hero.style.borderRadius = '16px'
        }
        setTimeout(() => { readyRef.current = true }, 350)
      },
      snapPeek(pct: number) {
        peekPctRef.current = pct
        // No hero pinning when fully hidden (pct = 100)
        cardBottomRef.current = pct >= 100 ? null : (pct / 100) * window.innerHeight - 16
        readyRef.current = false
        firedRef.current = false
        const el   = outerRef.current
        const hero = heroRef.current
        if (!el) return
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        const cardW = Math.min(window.innerWidth * 0.92, 364)
        const l = Math.max(0, (window.innerWidth - cardW) / 2)
        el.style.transition   = `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), ${SIDE_TRANSITION}`
        el.style.transform    = `translateY(${pct}%)`
        el.style.width        = `${cardW}px`
        el.style.left         = `${l}px`
        el.style.setProperty('border-radius', 'var(--shape-card)')
        if (hero) {
          hero.style.transition   = 'none'
          hero.style.opacity      = '0'
          hero.style.transform    = 'translateY(0)'
          hero.style.borderRadius = '32px'
        }
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
          <div ref={heroRef} className={styles.cardHero} style={{ background: card.bg }}>
            {card.img && (
              <Image src={card.img} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
            )}
            <div className={styles.cardHeroGrad} />
            <div className={styles.cardHeroText}>
              <p className={styles.cardHeroLine}>{card.lines[0]}</p>
              <p className={styles.cardHeroLine}>{card.lines[1]}</p>
            </div>
          </div>
          <CaseStudyPage cs={cs} isOverlay />
          <div className={styles.scrollSpacer} />
        </div>
      </div>
    )
  }
)

export default MobileCaseStudy
