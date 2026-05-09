import Link from 'next/link'

export default function NotFound() {
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
      <p className="type-display-small">Not found</p>
      <Link
        href="/portfolio"
        className="type-label-large"
        data-cursor="link"
        data-cursor-label="Portfolio"
      >
        Back to portfolio →
      </Link>
    </main>
  )
}
