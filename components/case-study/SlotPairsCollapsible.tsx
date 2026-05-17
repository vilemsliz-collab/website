'use client'

import { useRef, useState } from 'react'
import SlotPairs from './SlotPairs'
import s from './SlotPairsCollapsible.module.css'

export default function SlotPairsCollapsible({ pairs }: { pairs: string[][] }) {
  const [open, setOpen] = useState(false)
  const pillRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    setOpen(prev => !prev)
    // After the collapse animation, bring the pill (always at the end of the
    // section it controls) into view — opens scroll down, closes scroll back.
    window.setTimeout(() => {
      pillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 480)
  }

  return (
    <div className={s.wrap}>
      <div className={s.collapse} data-open={open}>
        <div className={s.inner}>
          <div className={s.section}>
            <div className={s.content}>
              <SlotPairs pairs={pairs} />
            </div>
          </div>
        </div>
      </div>
      <button
        ref={pillRef}
        type="button"
        className={s.pill}
        onClick={toggle}
        aria-expanded={open}
      >
        <span>{open ? 'Hide interactive demos' : 'Show interactive demos'}</span>
        <span className={s.pillIcon} data-open={open} aria-hidden>+</span>
      </button>
    </div>
  )
}
