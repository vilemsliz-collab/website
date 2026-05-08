import s from './SlotTimeline.module.css'

type Group = 'discover' | 'define' | 'design'
type Phase = { label: string; start: number; end: number; group: Group }

const TOTAL_COLS = 15

const PHASES: Phase[] = [
  { label: 'Business Research & Competitor Analysis', start: 1,  end: 3,  group: 'discover' },
  { label: 'User Interviews',                         start: 2,  end: 3,  group: 'discover' },
  { label: 'User Modeling and CJM',                   start: 3,  end: 4,  group: 'discover' },
  { label: 'Jobs To Be Done',                         start: 4,  end: 5,  group: 'define'   },
  { label: 'Product Architecture',                    start: 5,  end: 7,  group: 'define'   },
  { label: 'User Flows',                              start: 6,  end: 7,  group: 'define'   },
  { label: 'Low-Fidelity Sketching',                  start: 6,  end: 9,  group: 'define'   },
  { label: 'Designing High-Fidelity Screens',         start: 9,  end: 13, group: 'design'   },
  { label: 'Creating Design System',                  start: 9,  end: 13, group: 'design'   },
  { label: 'Usability Testing',                       start: 12, end: 13, group: 'discover' },
  { label: 'Outcome Analysis and Design Update',      start: 13, end: 15, group: 'discover' },
]

export default function SlotTimeline() {
  return (
    <div className={s.wrap}>
      <div id="case-timeline" data-element="Process timeline" className={s.chart}>
        <div className={s.gridLines} aria-hidden="true">
          {Array.from({ length: TOTAL_COLS - 1 }).map((_, i) => (
            <span key={i} className={s.gridLine} style={{ left: `calc(${(i + 1) * (100 / TOTAL_COLS)}%)` }} />
          ))}
        </div>
        <ol className={s.rows}>
          {PHASES.map((p, i) => (
            <li
              key={i}
              id={`case-timeline-${i}`}
              data-element={`Phase ${i + 1}`}
              className={s.row}
            >
              <span
                className={`${s.bar} ${s[p.group]}`}
                style={{ gridColumnStart: p.start, gridColumnEnd: p.end + 1 }}
              >
                <span className={s.label}>{p.label}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
