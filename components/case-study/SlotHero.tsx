import Image from 'next/image'
import s from './SlotHero.module.css'

export default function SlotHero({ src }: { src: string }) {
  return (
    <div className={s.wrap}>
      <div className={s.heroImage}>
        <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
      </div>
    </div>
  )
}
