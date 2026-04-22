import Image from 'next/image'
import type { CaseStripItem } from '@/data/cases'
import s from './SlotStrip.module.css'

function SlotStripItem({ item, index }: { item: CaseStripItem; index: number }) {
  return (
    <div id={`case-strip-${index}`} data-element={`Strip ${index + 1}`} className={s.slide} data-slot={`strip-${index}`}>
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
  return (
    <div className={s.wrap}>
      <div id="case-strip" data-element="Strip" className={s.reel} data-cursor="drag-h">
        {items.map((item, i) => (
          <SlotStripItem key={i} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}
