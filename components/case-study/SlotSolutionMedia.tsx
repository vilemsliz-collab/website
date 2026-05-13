import Image from 'next/image'
import s from './SlotSolutionMedia.module.css'

interface Props {
  src: string
  id?: string
  dataElement?: string
}

export default function SlotSolutionMedia({
  src,
  id = 'case-solution-media',
  dataElement = 'Solution media',
}: Props) {
  return (
    <div className={s.wrap}>
      <div id={id} data-element={dataElement} className={s.media}>
        <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
      </div>
    </div>
  )
}
