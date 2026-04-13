export interface MobileSection {
  type: 'hero' | 'text' | 'media' | 'claims'
  img?: string
  headline?: string
  body?: string
  items?: string[]
}

export interface CaseClaim {
  text: string
  bold: string
}

export interface CaseStripItem {
  img?: string
  caption: string
}

export interface CaseStudy {
  slug: string
  title: string
  headlineDark: string
  headlineMuted: string
  claims: CaseClaim[]
  roleBody: string
  challenge: string
  solution: string
  heroImg?: string
  mediaImg?: string
  mediaCaption: string
  strip: CaseStripItem[]
  stripCols?: number
  pairs: string[][]
  mobileSections?: MobileSection[]
}

export const CASES: CaseStudy[] = [
  {
    slug: '001',
    title: 'I made Wrike AI glow',
    headlineDark: 'I made Wrike AI glow',
    headlineMuted: '',
    claims: [
      { bold: '2M users',    text: 'Shipped to {bold} in product' },
      { bold: '34%',         text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'Placeholder role body 001 — describe your contribution here.',
    challenge: 'Placeholder challenge 001 — what problem needed solving.',
    solution:  'Placeholder solution 001 — how you solved it.',
    mediaCaption: 'Placeholder media caption 001.',
    strip: [
      { caption: 'Placeholder strip 001-1' },
      { caption: 'Placeholder strip 001-2' },
    ],
    pairs: [[], []],
  },
  {
    slug: '002',
    title: 'Generative systems, designed in code.',
    headlineDark: 'Generative systems,',
    headlineMuted: ' designed in code.',
    claims: [
      { bold: '2M users',    text: 'Shipped to {bold} in product' },
      { bold: '34%',         text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'Placeholder role body 002 — describe your contribution here.',
    challenge: 'Placeholder challenge 002 — what problem needed solving.',
    solution:  'Placeholder solution 002 — how you solved it.',
    mediaCaption: 'Placeholder media caption 002.',
    strip: [
      { caption: 'Placeholder strip 002-1' },
      { caption: 'Placeholder strip 002-2' },
      { caption: 'Placeholder strip 002-3' },
      { caption: 'Placeholder strip 002-4' },
    ],
    pairs: [[], []],
  },
  {
    slug: '003',
    title: 'Audio reactive, visual frequency.',
    headlineDark: 'Audio reactive,',
    headlineMuted: ' visual frequency.',
    claims: [
      { bold: '2M users',    text: 'Shipped to {bold} in product' },
      { bold: '34%',         text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'Placeholder role body 003 — describe your contribution here.',
    challenge: 'Placeholder challenge 003 — what problem needed solving.',
    solution:  'Placeholder solution 003 — how you solved it.',
    mediaCaption: 'Placeholder media caption 003.',
    strip: [
      { caption: 'Placeholder strip 003-1' },
      { caption: 'Placeholder strip 003-2' },
      { caption: 'Placeholder strip 003-3' },
      { caption: 'Placeholder strip 003-4' },
    ],
    pairs: [[], []],
  },
  {
    slug: '004',
    title: 'Procedural terrain, rendered at runtime.',
    headlineDark: 'Procedural terrain,',
    headlineMuted: ' rendered at runtime.',
    claims: [
      { bold: '2M users',    text: 'Shipped to {bold} in product' },
      { bold: '34%',         text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'Placeholder role body 004 — describe your contribution here.',
    challenge: 'Placeholder challenge 004 — what problem needed solving.',
    solution:  'Placeholder solution 004 — how you solved it.',
    mediaCaption: 'Placeholder media caption 004.',
    strip: [
      { caption: 'Placeholder strip 004-1' },
      { caption: 'Placeholder strip 004-2' },
    ],
    stripCols: 2,
    pairs: [[], []],
  },
  {
    slug: '005',
    title: 'Fluid simulation, physics made visual.',
    headlineDark: 'Fluid simulation,',
    headlineMuted: ' physics made visual.',
    claims: [
      { bold: '2M users',    text: 'Shipped to {bold} in product' },
      { bold: '34%',         text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'Placeholder role body 005 — describe your contribution here.',
    challenge: 'Placeholder challenge 005 — what problem needed solving.',
    solution:  'Placeholder solution 005 — how you solved it.',
    mediaCaption: 'Placeholder media caption 005.',
    strip: [
      { caption: 'Placeholder strip 005-1' },
      { caption: 'Placeholder strip 005-2' },
      { caption: 'Placeholder strip 005-3' },
      { caption: 'Placeholder strip 005-4' },
    ],
    pairs: [[], []],
  },
]

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASES.find(c => c.slug === slug)
}
