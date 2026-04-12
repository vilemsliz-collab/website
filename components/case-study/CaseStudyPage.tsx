'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { CaseStudy } from '@/data/cases'
import styles from './CaseStudy.module.css'

function RotatingClaims({ claims }: { claims: CaseStudy['claims'] }) {
  const [cur, setCur] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCur(c => (c + 1) % claims.length)
    }, 3000)
    return () => clearInterval(id)
  }, [claims.length])

  function renderClaim(claim: CaseStudy['claims'][0]) {
    const [before, after] = claim.text.split('{bold}')
    return <>{before}<strong>{claim.bold}</strong>{after}</>
  }

  return (
    <div className={styles.csClaims}>
      <p className={styles.csClaim}>{renderClaim(claims[cur])}</p>
    </div>
  )
}

interface Props {
  cs: CaseStudy
}

export default function CaseStudyPage({ cs }: Props) {
  const [isIframe, setIsIframe] = useState(false)
  useEffect(() => { setIsIframe(window.self !== window.top) }, [])

  return (
    <>
      {!isIframe && (
        <a className={styles.back} href="/portfolio">← portfolio</a>
      )}

      <div className={styles.csPage}>

        {/* ── 1. Hero ── */}
        <section className={`${styles.csHero} ${styles.csTextInset}`}>
          <h1 className={styles.csHeadline}>
            <span className={styles.csHeadlineDark}>{cs.headlineDark}</span>
            <span className={styles.csHeadlineMuted}>{cs.headlineMuted}</span>
          </h1>
        </section>

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

        {/* ── 3. Challenge / Solution ── */}
        <div className={`${styles.csCs} ${styles.csTextInset}`}>
          <div className={styles.csCsCol}>
            <span className={styles.csCsLabel}>Challenge</span>
            <p className={styles.csBody}>{cs.challenge}</p>
          </div>
          <div className={styles.csCsCol}>
            <span className={styles.csCsLabel}>Solution</span>
            <p className={styles.csBody}>{cs.solution}</p>
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

        {/* ── 5. 4-column strip ── */}
        <div className={styles.csStrip}>
          {cs.strip.map((item, i) => (
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

        {/* ── 6. Portrait pairs ── */}
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
    </>
  )
}
