'use client'
import s from './Loader.module.css'

export default function Loader({ visible }: { visible: boolean }) {
  return (
    <div className={`${s.loader} ${visible ? '' : s.hidden}`} aria-hidden={!visible}>
      <div className={`${s.orb} ${s.orb1}`} />
      <div className={`${s.orb} ${s.orb2}`} />
      <div className={`${s.orb} ${s.orb3}`} />
      <div className={`${s.orb} ${s.orb4}`} />
      <div className={`${s.orb} ${s.orb5}`} />
      <div className={`${s.orb} ${s.orb6}`} />
      <p className={s.name}>Vilem</p>
    </div>
  )
}
