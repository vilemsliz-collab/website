'use client'
import s from './Loader.module.css'
import OrbBackground from '@/components/carousel/OrbBackground'

export default function Loader({ visible }: { visible: boolean }) {
  return (
    <div className={`${s.loader} ${visible ? '' : s.hidden}`} aria-hidden={!visible}>
      <div className={s.orbWrap}>
        <OrbBackground numOrbs={5} orbScale={4} />
      </div>
      <p className={s.name}>Vilem</p>
    </div>
  )
}
