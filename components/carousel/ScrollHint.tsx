import styles from './ScrollHint.module.css'

export default function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`} aria-hidden>
      <p className={styles.label}>Spin</p>
    </div>
  )
}
