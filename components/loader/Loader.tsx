'use client'
import s from './Loader.module.css'

export default function Loader({ visible }: { visible: boolean }) {
  return (
    <div className={`${s.loader} ${visible ? '' : s.hidden}`} aria-hidden={!visible}>
      <p className={s.name}>Vilem</p>
    </div>
  )
}
