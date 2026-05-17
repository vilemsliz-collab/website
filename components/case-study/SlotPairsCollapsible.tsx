'use client'

import { useRef, useState } from 'react'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import SlotPairs from './SlotPairs'
import s from './SlotPairsCollapsible.module.css'

export default function SlotPairsCollapsible({ pairs }: { pairs: string[][] }) {
  const [open, setOpen] = useState(false)
  const collapseRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (!next) return
    // On open: kick off the smooth scroll alongside the expand animation so the
    // reposition feels like part of opening (not a delayed afterthought).
    // Closing leaves the user where they are.
    requestAnimationFrame(() => {
      collapseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div className={s.wrap}>
      <div className={s.collapse} data-open={open}>
        <div className={s.inner}>
          <SlotPairs pairs={pairs} />
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
        <span className={s.pillIcon} data-open={open} aria-hidden>
          <ChevronDownIcon width={16} height={16} />
        </span>
      </button>
    </div>
  )
}
