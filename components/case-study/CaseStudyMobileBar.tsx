'use client'

import { useContext } from 'react'
import { MobileCaseShellContext } from './MobileCaseShell'
import s from './CaseStudyMobileBar.module.css'

export default function CaseStudyMobileBar() {
  const ctx = useContext(MobileCaseShellContext)
  if (!ctx) return null

  return (
    <div
      id="case-mobile-bar"
      data-element="Case mobile bar"
      className={s.bar}
    >
      <button
        type="button"
        className={s.pill}
        onClick={ctx.closeToPortfolio}
        aria-label="Back to portfolio"
      >
        back
      </button>
      <button
        type="button"
        className={s.pill}
        onClick={ctx.goToNext}
        aria-label="Next case"
      >
        next
      </button>
    </div>
  )
}
