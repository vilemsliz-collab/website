import type { Metadata } from 'next'
import styles from './DesignSystem.module.css'

export const metadata: Metadata = { title: 'Design System — Lab' }

const GRAYS = [
  { name: '--gray-900', hex: '#393A3F', hsl: 'hsl(230, 5%, 24%)' },
  { name: '--gray-800', hex: '#4F5055', hsl: 'hsl(230, 4%, 32%)' },
  { name: '--gray-700', hex: '#65666B', hsl: 'hsl(230, 3%, 41%)' },
  { name: '--gray-600', hex: '#7B7C81', hsl: 'hsl(230, 2%, 49%)' },
  { name: '--gray-500', hex: '#909196', hsl: 'hsl(230, 3%, 58%)' },
  { name: '--gray-400', hex: '#A6A7AC', hsl: 'hsl(230, 3%, 66%)' },
  { name: '--gray-300', hex: '#BCBDC2', hsl: 'hsl(230, 5%, 75%)' },
  { name: '--gray-200', hex: '#D2D3D8', hsl: 'hsl(230, 7%, 84%)' },
  { name: '--gray-100', hex: '#E8E9EE', hsl: 'hsl(230, 15%, 92%)' },
  { name: '--gray-50',  hex: '#F3F4F9', hsl: 'hsl(230, 33%, 96%)' },
  { name: '--white',    hex: '#ffffff', hsl: '' },
]

const TYPE_SCALE = [
  ['display-large',   '57 / 64 / −0.25 / 300'],
  ['display-medium',  '45 / 52 / 0 / 300'],
  ['display-small',   '36 / 44 / 0 / 300'],
  ['headline-large',  '32 / 40 / 0 / 300'],
  ['headline-medium', '28 / 36 / 0 / 300'],
  ['headline-small',  '24 / 32 / 0 / 300'],
  ['title-large',     '22 / 28 / 0 / 300'],
  ['title-medium',    '16 / 24 / 0.15 / 300'],
  ['title-small',     '14 / 20 / 0.1 / 300'],
  ['label-large',     '14 / 20 / 0.1 / 300'],
  ['label-medium',    '14 / 20 / 0.5 / 300'],
  ['label-small',     '11 / 16 / 0.5 / 300'],
  ['body-large',      '16 / 24 / 0.5 / 300'],
  ['body-medium',     '14 / 20 / 0.25 / 300'],
  ['body-small',      '12 / 16 / 0.4 / 300'],
]

const SPACE_SCALE = [
  ['--space-1',  '4px'],  ['--space-2',  '8px'],  ['--space-3',  '12px'],
  ['--space-4',  '16px'], ['--space-5',  '20px'], ['--space-6',  '24px'],
  ['--space-7',  '28px'], ['--space-8',  '32px'], ['--space-10', '40px'],
  ['--space-12', '48px'], ['--space-16', '64px'], ['--space-20', '80px'],
  ['--space-24', '96px'],
]

const INSET_SCALE   = [['--inset-xs','8px'],['--inset-sm','12px'],['--inset-md','16px'],['--inset-lg','24px'],['--inset-xl','32px']]
const STACK_SCALE   = [['--stack-xs','4px'],['--stack-sm','8px'],['--stack-md','16px'],['--stack-lg','24px'],['--stack-xl','48px']]
const INLINE_SCALE  = [['--inline-xs','4px'],['--inline-sm','8px'],['--inline-md','16px'],['--inline-lg','24px']]

const SHAPES = [
  { name: '--shape-sharp', val: '0px',    radius: '0px',    note: 'perfect rectangle' },
  { name: '--shape-card',  val: '32px',   radius: '32px',   note: 'card default' },
  { name: '--shape-sm',    val: '8px',    radius: '8px',    note: 'small elements' },
  { name: '--shape-md',    val: '12px',   radius: '12px',   note: 'gallery images' },
  { name: '--shape-lg',    val: '48px',   radius: '48px',   note: 'large' },
  { name: '--shape-pill',  val: '9999px', radius: '9999px', note: 'pill / circle' },
]

const COLOR_ROLES = [
  { name: '--color-background',         ref: '--white',    css: 'var(--color-background)' },
  { name: '--color-on-background',      ref: '--gray-900', css: 'var(--color-on-background)' },
  { name: '--color-surface',            ref: '--gray-50',  css: 'var(--color-surface)' },
  { name: '--color-on-surface',         ref: '--gray-900', css: 'var(--color-on-surface)' },
  { name: '--color-surface-variant',    ref: '--gray-100', css: 'var(--color-surface-variant)' },
  { name: '--color-on-surface-variant', ref: '--gray-700', css: 'var(--color-on-surface-variant)' },
  { name: '--color-outline',            ref: '--gray-500', css: 'var(--color-outline)' },
  { name: '--color-outline-variant',    ref: '--gray-200', css: 'var(--color-outline-variant)' },
]

function SpRow({ name, val }: { name: string; val: string }) {
  return (
    <div className={styles.spRow}>
      <span className={styles.spLabel}>{name}</span>
      <span className={styles.spVal}>{val}</span>
      <div className={styles.spBar} style={{ width: val }} />
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.siteNav}>
        <a href="/portfolio">Portfolio</a>
        <a href="/card">Card + Cursor</a>
        <a href="/design-system" className={styles.navActive}>Design System</a>
      </nav>

      {/* ── Color neutral ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Color — Neutral / gray scale</h2>
        <div className={styles.colorStrip}>
          {GRAYS.map(g => (
            <div key={g.name} className={styles.swatch} style={{ background: g.hex, border: g.hex === '#ffffff' ? '1px solid #eee' : undefined }} />
          ))}
        </div>
        <div className={styles.colorStripLabels}>
          {['900','800','700','600','500','400','300','200','100','50','white'].map(l => (
            <div key={l} className={styles.colorStripLabel}>{l}</div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          {GRAYS.map(g => (
            <div key={g.name} className={styles.swatchMeta}>
              <span className={styles.swatchName}>{g.name}</span>
              <span className={styles.swatchHex}>{g.hex}{g.hsl ? `  ${g.hsl}` : ''}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Color roles ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Color — Semantic roles / MD3 light scheme</h2>
        <div className={styles.spGroupLabel}>surface</div>
        {COLOR_ROLES.slice(0, 6).map(r => (
          <div key={r.name} className={styles.colorRoleRow}>
            <span className={styles.colorRoleName}>{r.name}</span>
            <span className={styles.colorRoleRef}>{r.ref}</span>
            <div className={styles.colorRoleDot} style={{ background: r.css }} />
          </div>
        ))}
        <div className={styles.spGroupLabel}>outline</div>
        {COLOR_ROLES.slice(6).map(r => (
          <div key={r.name} className={styles.colorRoleRow}>
            <span className={styles.colorRoleName}>{r.name}</span>
            <span className={styles.colorRoleRef}>{r.ref}</span>
            <div className={styles.colorRoleDot} style={{ background: r.css }} />
          </div>
        ))}
      </section>

      {/* ── Typography ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography — Google Sans Flex / MD3</h2>
        {TYPE_SCALE.map(([name, meta]) => (
          <div key={name} className={styles.row}>
            <span className={styles.rowLabel}>{name}</span>
            <span className={styles.rowMeta}>{meta}</span>
            <span className={`${styles.rowSample} type-${name}`}>{name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
          </div>
        ))}
      </section>

      {/* ── Spacing ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing — 4px base grid / MD3</h2>
        <div className={styles.spGroupLabel}>scale</div>
        {SPACE_SCALE.map(([n, v]) => <SpRow key={n} name={n} val={v} />)}
        <div className={styles.spGroupLabel}>inset — padding inside components</div>
        {INSET_SCALE.map(([n, v]) => <SpRow key={n} name={n} val={v} />)}
        <div className={styles.spGroupLabel}>stack — vertical rhythm</div>
        {STACK_SCALE.map(([n, v]) => <SpRow key={n} name={n} val={v} />)}
        <div className={styles.spGroupLabel}>inline — horizontal gaps</div>
        {INLINE_SCALE.map(([n, v]) => <SpRow key={n} name={n} val={v} />)}
      </section>

      {/* ── Shapes ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shape — border-radius</h2>
        <div className={styles.spGroupLabel}>border-radius scale</div>
        {SHAPES.map(s => (
          <div key={s.name} className={styles.shRow}>
            <span className={styles.shLabel}>{s.name}</span>
            <span className={styles.shVal}>{s.val}</span>
            <div className={styles.shBox} style={{ borderRadius: s.radius }} />
            <span className={styles.shNote}>{s.note}</span>
          </div>
        ))}
      </section>

      {/* ── Card layout ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Card layout</h2>
        <div className={styles.spGroupLabel}>dimensions</div>
        <div className={styles.shRow}>
          <span className={styles.shLabel}>--card-width</span>
          <span className={styles.shVal}>364px</span>
          <div style={{ width: 91, height: 138, background: 'var(--card-bg)', borderRadius: 8, flexShrink: 0 }} />
          <span className={styles.shNote}>max width (scales with 92vw)</span>
        </div>
        <div className={styles.shRow}>
          <span className={styles.shLabel}>--card-aspect</span>
          <span className={styles.shVal}>364/555</span>
          <span className={styles.shNote}>portrait — ~1.52 : 1</span>
        </div>
        <div className={styles.spGroupLabel} style={{ marginTop: 16 }}>background</div>
        <div className={styles.shRow}>
          <span className={styles.shLabel}>--card-bg</span>
          <span className={styles.shVal}>#d9d9d9</span>
          <div style={{ width: 60, height: 24, background: 'var(--card-bg)', flexShrink: 0 }} />
          <span className={styles.shNote}>placeholder while image loads</span>
        </div>
        <div className={styles.spGroupLabel} style={{ marginTop: 16 }}>button</div>
        <div className={styles.shRow}>
          <span className={styles.shLabel}>--card-btn-size</span>
          <span className={styles.shVal}>64px</span>
          <div style={{ width: 64, height: 64, background: 'var(--color-on-background)', borderRadius: '9999px', flexShrink: 0 }} />
          <span className={styles.shNote}>circle — --shape-pill</span>
        </div>
      </section>
    </div>
  )
}
