'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import Image from 'next/image'
import type { CaseStudy } from '@/data/cases'
import styles from './CaseStudy.module.css'

function RotatingClaims({ claims }: { claims: CaseStudy['claims'] }) {
  const [cur, setCur] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCur(c => (c + 1) % claims.length), 3500)
    return () => clearInterval(id)
  }, [claims.length])

  const claim = claims[cur]
  const [before, after] = claim.text.split('{bold}')
  const words = [
    ...(before || '').split(' ').filter(Boolean).map(w => ({ w, bold: false })),
    ...claim.bold.split(' ').filter(Boolean).map(w => ({ w, bold: true })),
    ...(after  || '').split(' ').filter(Boolean).map(w => ({ w, bold: false })),
  ]

  return (
    <div className={styles.claims}>
      <p key={cur} className={styles.claim}>
        {words.map((item, i) => (
          <span key={i} className={styles.claimWord} style={{ '--i': i } as React.CSSProperties}>
            {item.bold ? <strong>{item.w}</strong> : item.w}&nbsp;
          </span>
        ))}
      </p>
    </div>
  )
}

interface Props {
  cs: CaseStudy
  isOverlay?: boolean
}

export default function CaseStudyPage({ cs, isOverlay }: Props) {
  const [isIframe, setIsIframe] = useState(false)
  useEffect(() => { setIsIframe(window.self !== window.top) }, [])

  const [cardTop, setCardTop] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (window.self === window.top) return
    try {
      const v = window.parent.document.documentElement.style.getPropertyValue('--card-top-y')
      if (v) setCardTop(parseFloat(v))
    } catch {}
  }, [])
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.data?.type === 'card-top-y') setCardTop(e.data.value as number)
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  return (
    <>
      {!isIframe && !isOverlay && (
        <a className={styles.backLink} href="/portfolio">← portfolio</a>
      )}

      <div className={styles.page} style={isOverlay ? { paddingTop: 'var(--space-4)' } : (isIframe && cardTop !== null ? { paddingTop: `${cardTop}px` } : undefined)}>

        {/* ── 1. Hero image ── */}
        {cs.heroImg && (
          <div className={styles.heroImage}>
            <Image
              src={cs.heroImg}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {/* ── 2. Stat + Role ── */}
        <div className={styles.metaRow}>
          <div className={styles.statBlock}>
            <RotatingClaims claims={cs.claims} />
          </div>
          <div className={styles.roleBlock}>
            <span className={styles.roleLabel}>My role</span>
            <p className={styles.body}>{cs.roleBody}</p>
          </div>
        </div>

        {/* ── 3. Full-width media ── */}
        <div className={styles.mediaBlock}>
          <div className={styles.mediaFrame}>
            {cs.mediaImg && (
              <Image
                src={cs.mediaImg}
                alt=""
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>
          <p className={`${styles.body} ${styles.mediaCaption} ${styles.textInset}`}>
            {cs.mediaCaption}
          </p>
        </div>

        {/* ── 4. Strip carousel ── */}
        <div className={styles.stripReel}>
          {cs.strip.map((item, i) => (
            <div key={i} className={styles.stripSlide}>
              <div className={styles.stripSlideImage}>
                {item.img && (
                  <Image
                    src={item.img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 70vw, 42vw"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>
              <p className={`${styles.body} ${styles.stripSlideCaption}`}>{item.caption}</p>
            </div>
          ))}
        </div>

        {/* ── 5. Portrait pairs ── */}
        <div className={styles.pairsSection}>
          {cs.pairs.map((pair, pi) => (
            <div key={pi} className={styles.pairRow}>
              {pair.map((img, ii) => (
                <div key={ii} className={styles.pairSlot}>
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
              {pair.length === 0 && (
                <>
                  <div className={styles.pairSlot} />
                  <div className={styles.pairSlot} />
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
