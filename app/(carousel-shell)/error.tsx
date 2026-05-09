'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        gap: 'var(--stack-md)',
        padding: 'var(--inset-xl)',
        textAlign: 'center',
      }}
    >
      <p className="type-display-small">Something went wrong</p>
      <button
        onClick={reset}
        className="type-label-large"
        data-cursor="link"
        data-cursor-label="Retry"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 'var(--inset-sm) var(--inset-md)',
          color: 'var(--color-on-background)',
        }}
      >
        Try again →
      </button>
    </main>
  )
}
