import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Card — Lab' }

export default function CardPage() {
  return (
    <div style={{ padding: '64px', fontFamily: 'var(--font-brand)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 300 }}>Card Playground</h1>
      <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>Coming soon — Phase 3</p>
    </div>
  )
}
