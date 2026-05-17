'use client'

import { useRef, useState } from 'react'
import SlotPairs from './SlotPairs'
import s from './SlotPairsCollapsible.module.css'

export default function SlotPairsCollapsible({ pairs }: { pairs: string[][] }) {
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      // Wait for the expand animation to make the close button reachable,
      // then bring the bottom of the section (close button) into view.
      window.setTimeout(() => {
        closeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 480)
    }
  }

  return (
    <div className={s.wrap} data-open={open}>
      <button
        type="button"
        className={s.openBtn}
        onClick={toggle}
        aria-expanded={open}
      >
        <span className={s.openLabel}>
          {open ? 'Hide interactive demos' : 'Show interactive demos'}
        </span>
        <span className={s.openIcon} data-open={open} aria-hidden>+</span>
      </button>
      <div className={s.collapse} data-open={open}>
        <div className={s.inner}>
          <div className={s.section}>
            <div className={s.content}>
              <SlotPairs pairs={pairs} />
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className={s.closeBtn}
            onClick={toggle}
            aria-label="Hide interactive demos"
            tabIndex={open ? 0 : -1}
          >
            <span>Hide demos</span>
            <span className={s.closeIcon} aria-hidden>−</span>
          </button>
        </div>
      </div>
    </div>
  )
}
