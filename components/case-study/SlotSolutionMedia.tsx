import Image from 'next/image'
import s from './SlotSolutionMedia.module.css'

interface Props {
  src?: string
  video?: string
  id?: string
  dataElement?: string
}

export default function SlotSolutionMedia({
  src,
  video,
  id = 'case-solution-media',
  dataElement = 'Solution media',
}: Props) {
  return (
    <div className={s.wrap}>
      <div id={id} data-element={dataElement} className={s.media}>
        {video ? (
          <video src={video} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : src ? (
          <Image src={src} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
        ) : null}
      </div>
    </div>
  )
}
