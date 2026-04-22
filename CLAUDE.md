@AGENTS.md

## Case study components (`components/case-study/`)

### Agentation feedback tool — naming rules

Every meaningful element must be uniquely identifiable by the Agentation tool. Follow these rules when adding or editing slot components:

**1. Own CSS module per slot** — never import styles from `CaseStudy.module.css` inside a slot component. Each slot file (`SlotFoo.tsx`) must have its own `SlotFoo.module.css` and use only `s.*` from it.

**2. `id` on every container and repeating item** — use the `case-` prefix:
- Static sections: `id="case-hero"`, `id="case-media"`, `id="case-strip"`, `id="case-pairs"`
- Indexed items: `id={`case-strip-${index}`}`, `id={`case-pairs-row-${rowIndex}`}`, `id={`case-pairs-${rowIndex}-${ii}`}`

**3. `data-element` with a human-readable label** — Agentation reads this first (highest priority) and uses it verbatim as the component name. Be specific and use title-case words:
- Static: `data-element="Hero image"`, `data-element="Media block"`, `data-element="Strip"`
- Indexed: `data-element={`Strip ${index + 1}`}`, `data-element={`Pair row ${rowIndex + 1}`}`, `data-element={`Pair ${rowIndex + 1}-${ii + 1}`}`

**Pattern for a new slot:**
```tsx
// SlotFoo.tsx
import s from './SlotFoo.module.css'   // ← own module only

export default function SlotFoo({ items }) {
  return (
    <div className={s.wrap}>
      <div id="case-foo" data-element="Foo" className={s.container}>
        {items.map((item, i) => (
          <div key={i} id={`case-foo-${i}`} data-element={`Foo ${i + 1}`} className={s.item}>
            …
          </div>
        ))}
      </div>
    </div>
  )
}
```
