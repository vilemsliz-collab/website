import Image from 'next/image'
import s from './SlotMedia.module.css'

export default function SlotMedia({ img, children }: { img?: string; children?: React.ReactNode }) {
  return (
    <div className={s.wrap}>
      <div id="case-media" data-element="Media block" className={s.mediaBlock}>
        <div data-element="Media frame" className={s.mediaFrame}>
          {img && (
            <Image src={img} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
