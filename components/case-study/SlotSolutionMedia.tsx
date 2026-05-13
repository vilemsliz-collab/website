import Image from 'next/image'
import s from './SlotSolutionMedia.module.css'

export default function SlotSolutionMedia({ src }: { src: string }) {
  return (
    <div className={s.wrap}>
      <div id="case-solution-media" data-element="Solution media" className={s.media}>
        <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
      </div>
    </div>
  )
}
