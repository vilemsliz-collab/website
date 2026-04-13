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
    <div className={styles.csClaims}>
      <p key={cur} className={styles.csClaim}>
        {words.map((item, i) => (
          <span key={i} className={styles.csClaimWord} style={{ '--i': i } as React.CSSProperties}>
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
  // Read the CSS var the carousel parent wrote before setting iframe src — runs
  // synchronously before first paint so there is no layout shift on open.
  useLayoutEffect(() => {
    if (window.self === window.top) return
    try {
      const v = window.parent.document.documentElement.style.getPropertyValue('--card-top-y')
      if (v) setCardTop(parseFloat(v))
    } catch {}
  }, [])
  // postMessage listener for subsequent content switches (back-frame swaps)
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
        <a className={styles.back} href="/portfolio">← portfolio</a>
      )}

      <div className={styles.csPage} style={isOverlay ? { paddingTop: 'var(--space-4)' } : (isIframe && cardTop !== null ? { paddingTop: `${cardTop}px` } : undefined)}>

        {/* ── 1. Challenge / Solution labels ── */}
        <div className={`${styles.csCs} ${styles.csTextInset}`}>
          <div className={styles.csCsCol}>
            <span className={styles.csCsLabel}>Challenge</span>
          </div>
          <div className={styles.csCsCol}>
            <span className={styles.csCsLabel}>Solution</span>
          </div>
        </div>

        {/* ── 2. Stat + Role ── */}
        <div className={styles.csMeta}>
          <div className={styles.csStatCard}>
            <RotatingClaims claims={cs.claims} />
          </div>
          <div className={styles.csRoleCard}>
            <span className={styles.csRoleLabel}>My role</span>
            <p className={styles.csBody}>{cs.roleBody}</p>
          </div>
        </div>

        {/* ── 4. Full-width media ── */}
        <div className={styles.csMediaBlock}>
          <div className={styles.csMediaFrame}>
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
          <p className={`${styles.csBody} ${styles.csMediaCaption} ${styles.csTextInset}`}>
            {cs.mediaCaption}
          </p>
        </div>

        {/* ── 5. Strip (chunked into rows by stripCols) ── */}
        {(() => {
          const cols = cs.stripCols ?? 4
          const rows = Array.from({ length: Math.ceil(cs.strip.length / cols) }, (_, gi) =>
            cs.strip.slice(gi * cols, gi * cols + cols)
          )
          return (
            <div className={styles.csStripGroup}>
              {rows.map((row, gi) => (
                <div key={gi} className={styles.csStrip}>
                  {row.map((item, i) => (
                    <div key={i} className={styles.csStripCard}>
                      <div className={styles.csStripImg}>
                        {item.img && (
                          <Image
                            src={item.img}
                            alt=""
                            fill
                            sizes="(max-width: 768px) calc(50vw - 3px), 25vw"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <p className={`${styles.csBody} ${styles.csStripCaption}`}>{item.caption}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        })()}

        {/* ── 6. Portrait pairs ── */}
        <div className={styles.csPairsGroup}>
          {cs.pairs.map((pair, pi) => (
            <div key={pi} className={styles.csPair}>
              {pair.map((img, ii) => (
                <div key={ii} className={styles.csPairImg}>
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
                  <div className={styles.csPairImg} />
                  <div className={styles.csPairImg} />
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
