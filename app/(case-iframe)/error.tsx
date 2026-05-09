'use client'

export default function CaseError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
      <p className="type-headline-small">This case study failed to load</p>
      <button
        onClick={reset}
        className="type-label-large"
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
