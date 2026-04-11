import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Design System — Lab' }

export default function DesignSystemPage() {
  return (
    <div style={{ padding: '64px', fontFamily: 'var(--font-brand)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 300 }}>Design System</h1>
      <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>Coming soon — Phase 3</p>
    </div>
  )
}
