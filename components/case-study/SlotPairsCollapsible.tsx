'use client'

import { useRef, useState } from 'react'
import SlotPairs from './SlotPairs'
import s from './SlotPairsCollapsible.module.css'

function ToggleButton({
  open,
  onClick,
  label,
  innerRef,
}: {
  open: boolean
  onClick: () => void
  label: string
  innerRef?: React.RefObject<HTMLButtonElement>
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      className={s.btn}
      onClick={onClick}
      aria-expanded={open}
    >
      <span className={s.btnLabel}>{label}</span>
      <span className={s.btnIcon} data-open={open} aria-hidden>+</span>
    </button>
  )
}

export default function SlotPairsCollapsible({ pairs }: { pairs: string[][] }) {
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      window.setTimeout(() => {
        closeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 480)
    }
  }

  const label = open ? 'Hide interactive demos' : 'Show interactive demos'

  return (
    <div className={s.wrap} data-open={open}>
      <ToggleButton open={open} onClick={toggle} label={label} />
      <div className={s.collapse} data-open={open}>
        <div className={s.inner}>
          <div className={s.section}>
            <div className={s.content}>
              <SlotPairs pairs={pairs} />
            </div>
          </div>
          <ToggleButton open={open} onClick={toggle} label={label} innerRef={closeBtnRef} />
        </div>
      </div>
    </div>
  )
}
