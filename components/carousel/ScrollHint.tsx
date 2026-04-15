import styles from './ScrollHint.module.css'

export default function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`} aria-hidden>
      <div className={styles.mouse}>
        <div className={styles.dot} />
      </div>
      <div className={styles.chevrons}>
        <svg className={styles.chevron1} width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1L7 7L13 1" stroke="var(--color-on-surface-variant, #65666B)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg className={styles.chevron2} width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1L7 7L13 1" stroke="var(--color-on-surface-variant, #65666B)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}
