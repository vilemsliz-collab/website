import type { CSSProperties } from 'react'
import s from './SlotTimeline.module.css'

type Phase = { label: string; start: number; end: number }

const TOTAL_COLS = 15

const PHASES: Phase[] = [
  { label: 'Business Research & Competitor Analysis', start: 1,  end: 3  },
  { label: 'User Interviews',                         start: 2,  end: 3  },
  { label: 'User Modeling and CJM',                   start: 3,  end: 4  },
  { label: 'Jobs To Be Done',                         start: 4,  end: 5  },
  { label: 'Product Architecture',                    start: 5,  end: 7  },
  { label: 'User Flows',                              start: 6,  end: 7  },
  { label: 'Low-Fidelity Sketching',                  start: 6,  end: 9  },
  { label: 'Designing High-Fidelity Screens',         start: 9,  end: 13 },
  { label: 'Creating Design System',                  start: 9,  end: 13 },
  { label: 'Usability Testing',                       start: 12, end: 13 },
  { label: 'Outcome Analysis and Design Update',      start: 13, end: 15 },
]

export default function SlotTimeline() {
  const last = PHASES.length - 1
  return (
    <div className={s.wrap}>
      <div id="case-timeline" data-element="Process timeline" className={s.chart}>
        <span data-element="Process heading" className={s.heading}>Process</span>
        <div className={s.plot}>
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
                  className={s.bar}
                  style={{
                    gridColumnStart: p.start,
                    gridColumnEnd: p.end + 1,
                    '--shade': i / last,
                  } as CSSProperties}
                >
                  <span className={s.label}>{p.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
