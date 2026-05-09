import s from './BioPairCard.module.css'

export default function BioPairCard() {
  return (
    <div className={s.card}>
      <h1 className={s.name}>Vilém Slíž</h1>
      <p className={s.bio}>
        I'm a generalist visual designer focused on brand systems. I build seamless brand experiences from top of the funnel to product in the B2B SaaS space at Wrike. I care about turning brand strategy into systems people actually enjoy using.
      </p>
    </div>
  )
}
