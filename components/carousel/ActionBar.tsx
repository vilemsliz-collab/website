'use client'

import { FileText } from '@phosphor-icons/react'
import s from './ActionBar.module.css'

function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 9.5V16M6.5 6.5V7M10 16v-3.5c0-1.657 1.343-3 3-3s3 1.343 3 3V16M10 9.5V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function ActionBar() {
  return (
    <div className={s.bar}>
      <a href="mailto:vilem.sliz@gmail.com" className={s.cta}>
        Contact me
      </a>
      <a href="/cv.pdf" className={s.iconBtn} aria-label="Download CV">
        <FileText size={22} weight="regular" aria-hidden />
      </a>
      <a
        href="https://linkedin.com/in/vilemsliz"
        target="_blank"
        rel="noopener noreferrer"
        className={s.iconBtn}
        aria-label="LinkedIn"
      >
        <LinkedInIcon />
      </a>
    </div>
  )
}
