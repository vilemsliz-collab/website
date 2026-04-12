'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { CaseStudy } from '@/data/cases'
import { CARDS } from '@/lib/carouselConfig'
import styles from './MobileCaseStudy.module.css'

interface Props {
  cs: CaseStudy
  cardIdx: number
  show: boolean
  onScrollEnd: () => void
}

function renderClaim(text: string, bold: string): React.ReactNode {
  const [before, after] = text.split('{bold}')
  return (
    <>
      {before}<strong>{bold}</strong>{after}
    </>
  )
}

export default function MobileCaseStudy({ cs, cardIdx, show, onScrollEnd }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollEndFiredRef = useRef(false)
  const readyRef = useRef(false)
  const card = CARDS[cardIdx]

  // Reset fired flag and enable scroll detection when shown
  useEffect(() => {
    if (show) {
      scrollEndFiredRef.current = false
      // Brief delay to avoid triggering on mount before user scrolls
      const t = setTimeout(() => { readyRef.current = true }, 600)
      // Scroll overlay back to top on each open
      if (scrollRef.current) scrollRef.current.scrollTop = 0
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
      <div className={styles.content}>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <p className={styles.headline}>{card.lines.join('\n')}</p>
          <span className={styles.role}>{card.role}</span>
        </div>

        {/* ── Claims ── */}
        {cs.claims.length > 0 && (
          <div className={styles.claims}>
            {cs.claims.map((claim, i) => (
              <p key={i} className={styles.claim}>
                {renderClaim(claim.text, claim.bold)}
              </p>
            ))}
          </div>
        )}

        {/* ── Challenge ── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Challenge</span>
          <p className={styles.sectionBody}>{cs.challenge}</p>
        </div>

        {/* ── Solution ── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Solution</span>
          <p className={styles.sectionBody}>{cs.solution}</p>
        </div>

        {/* ── Media image ── */}
        {cs.mediaImg && (
          <div className={styles.media}>
            <Image
              src={cs.mediaImg}
              alt=""
              width={400}
              height={300}
              className={styles.mediaImg}
              sizes="100vw"
            />
            {cs.mediaCaption && (
              <p className={styles.mediaCaption}>{cs.mediaCaption}</p>
            )}
          </div>
        )}

        {/* ── Scroll hint + trigger spacer ── */}
        <p className={styles.scrollHint}>scroll to continue</p>
        <div className={styles.scrollSpacer} />

      </div>
    </div>
  )
}
