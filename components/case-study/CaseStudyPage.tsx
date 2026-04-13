'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import Image from 'next/image'
import type { CaseStudy, CaseStripItem } from '@/data/cases'
import styles from './CaseStudy.module.css'

// ── Sub-components — each has a unique name visible in the feedback tool ──────

function CaseStudyHeroImage({ src }: { src: string }) {
  return (
    <div className={styles.caseStudyHeroImage}>
      <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
    </div>
  )
}

function CaseStudyMetaRow({ claims, roleBody }: { claims: CaseStudy['claims']; roleBody: string }) {
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
    <div className={styles.caseStudyMetaRow}>
      <div className={styles.caseStudyStatBlock}>
        <div className={styles.caseStudyClaims}>
          <p key={cur} className={styles.caseStudyClaim}>
            {words.map((item, i) => (
              <span key={i} className={styles.caseStudyClaimWord} style={{ '--i': i } as React.CSSProperties}>
                {item.bold ? <strong>{item.w}</strong> : item.w}&nbsp;
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className={styles.caseStudyRoleBlock}>
        <span className={styles.caseStudyRoleLabel}>My role</span>
        <p className={styles.caseStudyBody}>{roleBody}</p>
      </div>
    </div>
  )
}

function CaseStudyMediaBlock({ img, caption }: { img?: string; caption: string }) {
  return (
    <div className={styles.caseStudyMediaBlock}>
      <div className={styles.caseStudyMediaFrame}>
        {img && (
          <Image src={img} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
        )}
      </div>
      <p className={`${styles.caseStudyBody} ${styles.caseStudyMediaCaption} ${styles.caseStudyTextInset}`}>
        {caption}
      </p>
    </div>
  )
}

function CaseStudyStripReel({ items }: { items: CaseStripItem[] }) {
  return (
    <div className={styles.caseStudyStripReel}>
      {items.map((item, i) => (
        <div key={i} className={styles.caseStudyStripSlide}>
          <div className={styles.caseStudyStripSlideImage}>
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
          <p className={`${styles.caseStudyBody} ${styles.caseStudyStripSlideCaption}`}>{item.caption}</p>
        </div>
      ))}
    </div>
  )
}

function CaseStudyPairsSection({ pairs }: { pairs: string[][] }) {
  return (
    <div className={styles.caseStudyPairsSection}>
      {pairs.map((pair, pi) => (
        <div key={pi} className={styles.caseStudyPairRow}>
          {pair.map((img, ii) => (
            <div key={ii} className={styles.caseStudyPairSlot}>
              <Image src={img} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            </div>
          ))}
          {pair.length === 0 && (
            <>
              <div className={styles.caseStudyPairSlot} />
              <div className={styles.caseStudyPairSlot} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        <a className={styles.caseStudyBackLink} href="/portfolio">← portfolio</a>
      )}

      <div
        className={styles.caseStudyPage}
        style={isOverlay
          ? { paddingTop: 'var(--space-4)' }
          : (isIframe && cardTop !== null ? { paddingTop: `${cardTop}px` } : undefined)
        }
      >
        {cs.heroImg && <CaseStudyHeroImage src={cs.heroImg} />}
        <CaseStudyMediaBlock img={cs.mediaImg} caption={cs.mediaCaption} />
        <CaseStudyMetaRow claims={cs.claims} roleBody={cs.roleBody} />
        <CaseStudyStripReel items={cs.strip} />
        <CaseStudyPairsSection pairs={cs.pairs} />
      </div>
    </>
  )
}
