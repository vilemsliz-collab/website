import styles from './ScrollHint.module.css'

export default function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`} aria-hidden>
      <div className={styles.pill}>
        {[0, 220, 440].map(delay => (
          <div key={delay} className={styles.ring} style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
      <p className={styles.label}>Scroll to spin</p>
    </div>
  )
}
