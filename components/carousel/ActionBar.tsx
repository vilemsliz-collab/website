'use client'

import s from './ActionBar.module.css'

// CSS.gg file-document — filled, sharp geometric.
function FileDocumentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 18H17V16H7V18Z" fill="currentColor" />
      <path d="M17 14H7V12H17V14Z" fill="currentColor" />
      <path d="M7 10H11V8H7V10Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
        <FileDocumentIcon />
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
