'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { CaseStripItem } from '@/data/cases'
import s from './SlotStrip.module.css'

function SlotStripItem({ item, index, clone }: { item: CaseStripItem; index: number; clone?: boolean }) {
  return (
    <div
      {...(!clone && { id: `case-strip-${index}`, 'data-element': `Strip ${index + 1}`, 'data-slot': `strip-${index}` })}
      className={s.slide}
      aria-hidden={clone || undefined}
    >
      <div className={s.slideImage}>
        {item.img && (
          <Image src={item.img} alt="" fill sizes="(max-width: 768px) 70vw, 42vw" style={{ objectFit: 'cover' }} />
        )}
      </div>
      <p className={`${s.body} ${s.slideCaption}`}>{item.caption}</p>
    </div>
  )
}

export default function SlotStrip({ items }: { items: CaseStripItem[] }) {
  const reelRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  useEffect(() => {
    const el = reelRef.current
    if (!el) return

    const GAP = 6

    function slideWidth() {
      const slide = el!.querySelector(`.${s.slide}`) as HTMLElement | null
      return slide ? slide.offsetWidth + GAP : 0
    }

    function loopCheck() {
      const half = el!.scrollWidth / 2
      if (el!.scrollLeft >= half) el!.scrollLeft -= half
      else if (el!.scrollLeft < 0) el!.scrollLeft += half
    }

    // Auto-advance every 5s
    const timer = setInterval(() => {
      if (drag.current.active) return
      loopCheck()
      el.scrollBy({ left: slideWidth(), behavior: 'smooth' })
      setTimeout(loopCheck, 500)
    }, 5000)

    // Drag scroll
    function onDown(e: MouseEvent) {
      drag.current = { active: true, startX: e.pageX - el!.offsetLeft, scrollLeft: el!.scrollLeft }
    }
    function onUp() { drag.current.active = false; loopCheck() }
    function onMove(e: MouseEvent) {
      if (!drag.current.active) return
      e.preventDefault()
      el!.scrollLeft = drag.current.scrollLeft - (e.pageX - el!.offsetLeft - drag.current.startX)
    }

    // Touch scroll
    const touch = { startX: 0, scrollLeft: 0 }
    function onTouchStart(e: TouchEvent) {
      touch.startX = e.touches[0].clientX
      touch.scrollLeft = el!.scrollLeft
    }
    function onTouchMove(e: TouchEvent) {
      el!.scrollLeft = touch.scrollLeft - (e.touches[0].clientX - touch.startX)
    }
    function onTouchEnd() { loopCheck() }

    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      clearInterval(timer)
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div className={s.wrap}>
      <div ref={reelRef} id="case-strip" data-element="Strip" className={s.reel} data-cursor="drag-h">
        {items.map((item, i) => <SlotStripItem key={i} item={item} index={i} />)}
        {items.map((item, i) => <SlotStripItem key={`c${i}`} item={item} index={i} clone />)}
      </div>
    </div>
  )
}
