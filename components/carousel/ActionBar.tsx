'use client'

import { FileText, LinkedinLogo } from '@phosphor-icons/react'
import s from './ActionBar.module.css'

export default function ActionBar() {
  return (
    <div className={s.bar}>
      <a href="mailto:vilem.sliz@gmail.com" className={s.cta}>
        Contact me
      </a>
      <a href="/cv.pdf" className={s.iconBtn} aria-label="Download CV">
        <FileText size={22} weight="bold" aria-hidden />
      </a>
      <a
        href="https://linkedin.com/in/vilemsliz"
        target="_blank"
        rel="noopener noreferrer"
        className={s.iconBtn}
        aria-label="LinkedIn"
      >
        <LinkedinLogo size={22} weight="bold" aria-hidden />
      </a>
    </div>
  )
}
