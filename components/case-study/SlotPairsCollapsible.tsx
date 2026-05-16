'use client'

import { useState } from 'react'
import SlotPairs from './SlotPairs'
import s from './SlotPairsCollapsible.module.css'

export default function SlotPairsCollapsible({ pairs }: { pairs: string[][] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.toggle}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        data-cursor="link"
      >
        {open ? 'Hide interactive demos' : 'Show interactive demos'}
      </button>
      <div className={s.collapse} data-open={open}>
        <div className={s.inner}>
          <SlotPairs pairs={pairs} />
        </div>
      </div>
    </div>
  )
}
