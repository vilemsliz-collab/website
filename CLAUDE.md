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

### Aspect ratio rules

Content boxes must use `aspect-ratio` derived from the actual images, not fixed heights or `--card-height` (which is the portfolio carousel card's own ratio and unrelated to content).

**Current canonical ratios (measured from real images):**
- Pair slots: `aspect-ratio: 530 / 675` (portrait, 530×675 px)
- Media frame: `aspect-ratio: 1072 / 675` (landscape, 1072×675 px)
- Hero image: `aspect-ratio: 16 / 9` (placeholder — update when real hero images are defined)
- Strip slides: driven by `min-height: calc(var(--card-height) / 2)` — intentionally tied to card size

When adding new slots or new image content: measure the actual image dimensions (e.g. via the Python snippet below) and set `aspect-ratio: W / H` in the slot's own CSS module. Never use a fixed `height` or `height: var(--card-height)` on image containers.

```bash
python3 -c "
import urllib.request, struct
def dims(url):
    req = urllib.request.Request(url, headers={'User-Agent':'x'})
    d = urllib.request.urlopen(req).read(32)
    return struct.unpack('>II', d[16:24])
print(dims('YOUR_CLOUDINARY_URL'))
"
```

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
