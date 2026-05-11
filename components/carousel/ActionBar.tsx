'use client'

import { FileTextIcon, LinkedInLogoIcon } from '@radix-ui/react-icons'
import s from './ActionBar.module.css'

export default function ActionBar() {
  return (
    <div className={s.bar}>
      <a href="mailto:vilem.sliz@gmail.com" className={s.cta}>
        Contact me
      </a>
      <a href="/cv.pdf" className={s.iconBtn} aria-label="Download CV">
        <FileTextIcon width={22} height={22} aria-hidden />
      </a>
      <a
        href="https://linkedin.com/in/vilemsliz"
        target="_blank"
        rel="noopener noreferrer"
        className={s.iconBtn}
        aria-label="LinkedIn"
      >
        <LinkedInLogoIcon width={22} height={22} aria-hidden />
      </a>
    </div>
  )
}
