'use client'

import { useEffect, useRef, useState } from 'react'
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
      {claims.map((claim, i) => (
        <p key={i} className={`${styles.csClaim} ${i === cur ? styles.csClaimActive : ''}`}>
          {renderClaim(claim)}
        </p>
      ))}
    </div>
  )
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { el.classList.add(styles.inView); io.unobserve(el) }
        })
      },
      { threshold: 0.08 }
    )
    el.style.transitionDelay = delay + 'ms'
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={styles.reveal}>
      {children}
    </div>
  )
}

interface Props {
  cs: CaseStudy
}

export default function CaseStudyPage({ cs }: Props) {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top

  return (
    <>
      {!isIframe && (
        <a className={styles.back} href="/portfolio">← portfolio</a>
      )}

      <div className={styles.csPage}>

        {/* ── 1. Hero ── */}
        <RevealSection delay={0}>
          <section className={`${styles.csHero} ${styles.csTextInset}`}>
            <h1 className={styles.csHeadline}>
              <span className={styles.csHeadlineDark}>{cs.headlineDark}</span>
              <span className={styles.csHeadlineMuted}>{cs.headlineMuted}</span>
            </h1>
          </section>
        </RevealSection>

        {/* ── 2. Stat + Role ── */}
        <RevealSection delay={60}>
          <div className={styles.csMeta}>
            <div className={styles.csStatCard}>
              <RotatingClaims claims={cs.claims} />
            </div>
            <div className={styles.csRoleCard}>
              <span className={styles.csRoleLabel}>My role</span>
              <p className={styles.csBody}>{cs.roleBody}</p>
            </div>
          </div>
        </RevealSection>

        {/* ── 3. Challenge / Solution ── */}
        <RevealSection delay={120}>
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
        </RevealSection>

        {/* ── 4. Full-width media ── */}
        <RevealSection delay={180}>
          <div className={styles.csMediaBlock}>
            <div className={styles.csMediaFrame}>
              {cs.mediaImg && <img src={cs.mediaImg} alt="" />}
            </div>
            <p className={`${styles.csBody} ${styles.csMediaCaption} ${styles.csTextInset}`}>
              {cs.mediaCaption}
            </p>
          </div>
        </RevealSection>

        {/* ── 5. 4-column strip ── */}
        <RevealSection delay={240}>
          <div className={styles.csStrip}>
            {cs.strip.map((item, i) => (
              <div key={i} className={styles.csStripCard}>
                <div className={styles.csStripImg}>
                  {item.img && <img src={item.img} alt="" />}
                </div>
                <p className={`${styles.csBody} ${styles.csStripCaption}`}>{item.caption}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* ── 6. Portrait pairs ── */}
        {cs.pairs.map((pair, pi) => (
          <RevealSection key={pi} delay={300 + pi * 60}>
            <div className={styles.csPair}>
              {pair.map((img, ii) => (
                <div key={ii} className={styles.csPairImg}>
                  <img src={img} alt="" />
                </div>
              ))}
              {pair.length === 0 && (
                <>
                  <div className={styles.csPairImg} />
                  <div className={styles.csPairImg} />
                </>
              )}
            </div>
          </RevealSection>
        ))}

      </div>
    </>
  )
}
