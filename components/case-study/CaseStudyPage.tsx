'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import type { CaseStudy } from '@/data/cases'
import styles from './CaseStudy.module.css'
import SlotHero from './SlotHero'
import SlotMedia from './SlotMedia'
import SlotStrip from './SlotStrip'
import SlotPairs from './SlotPairs'

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
    <div data-element="Meta row" className={styles.caseStudyMetaRow}>
      <div data-element="Stat block" className={styles.caseStudyStatBlock}>
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
      <div data-element="Role block" className={styles.caseStudyRoleBlock}>
        <span className={styles.caseStudyRoleLabel}>My role</span>
        <p className={styles.caseStudyBody}>{roleBody}</p>
      </div>
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
  useEffect(() => {
    const inIframe = window.self !== window.top
    setIsIframe(inIframe)
    if (inIframe) document.documentElement.style.scrollbarWidth = 'none'
  }, [])

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

  // Relay cursor events to parent so the custom cursor works across the iframe boundary
  useEffect(() => {
    if (window.self === window.top) return
    const relayMove = (e: MouseEvent) => {
      const cursorEl = (e.target as HTMLElement | null)?.closest('[data-cursor]') as HTMLElement | null
      const darkEl   = (e.target as HTMLElement | null)?.closest('[data-dark]')
      window.parent.postMessage({
        type:        'cursor-move',
        x:           e.clientX,
        y:           e.clientY,
        cursorState: cursorEl?.dataset.cursor ?? null,
        cursorLabel: cursorEl?.dataset.cursorLabel ?? null,
        dark:        !!darkEl,
      }, '*')
    }
    const relayWheel = (e: WheelEvent) => {
      window.parent.postMessage({ type: 'cursor-wheel', deltaX: e.deltaX, deltaY: e.deltaY }, '*')
    }
    window.addEventListener('mousemove', relayMove)
    window.addEventListener('wheel', relayWheel, { passive: true })
    return () => {
      window.removeEventListener('mousemove', relayMove)
      window.removeEventListener('wheel', relayWheel)
    }
  }, [])

  return (
    <>
      {!isIframe && !isOverlay && (
        <a className={styles.caseStudyBackLink} href="/portfolio" data-cursor="link" data-cursor-label="Portfolio">← portfolio</a>
      )}

      <div
        className={styles.caseStudyPage}
        style={undefined}
      >
        {isIframe && (
          <div
            className={styles.caseStudyCloseZone}
            data-cursor="case-close"
            onClick={() => window.parent.postMessage({ type: 'case-close' }, '*')}
          />
        )}
        {cs.heroImg && <SlotHero src={cs.heroImg} />}
        <SlotMedia img={cs.mediaImg}>
          <CaseStudyMetaRow claims={cs.claims} roleBody={cs.roleBody} />
        </SlotMedia>
        <SlotStrip items={cs.strip} />
        <SlotPairs pairs={cs.pairs} />
      </div>
    </>
  )
}
