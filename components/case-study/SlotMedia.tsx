import Image from 'next/image'
import s from './SlotMedia.module.css'

export default function SlotMedia({ img, children }: { img?: string; children?: React.ReactNode }) {
  return (
    <div className={s.wrap}>
      <div className={s.mediaBlock}>
        <div className={s.mediaFrame}>
          {img && (
            <Image src={img} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
