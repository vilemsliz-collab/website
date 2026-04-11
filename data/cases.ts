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
  mediaImg?: string
  mediaCaption: string
  strip: CaseStripItem[]
  pairs: string[][]
}

export const CASES: CaseStudy[] = [
  {
    slug: '001',
    title: 'I made Wrike AI glow',
    headlineDark: 'I made Wrike AI glow',
    headlineMuted: ' from Top of the Funnel to product',
    claims: [
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability. One source of truth, adopted across all three surfaces within the same quarter.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary. Each surface had its own component library, leading to inconsistent patterns, duplicated effort, and a fragmented user experience that was hard to maintain at scale.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability. One source of truth, adopted across all three surfaces within the same quarter.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary. Each surface had its own component library, leading to inconsistent patterns, duplicated effort, and a fragmented user experience that was hard to maintain at scale.',
    strip: [
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
    ],
    pairs: [[], []],
  },
  {
    slug: '002',
    title: 'Generative systems, designed in code.',
    headlineDark: 'Generative systems,',
    headlineMuted: ' designed in code.',
    claims: [
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
    ],
    pairs: [[], []],
  },
  {
    slug: '003',
    title: 'Audio reactive, visual frequency.',
    headlineDark: 'Audio reactive,',
    headlineMuted: ' visual frequency.',
    claims: [
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
    ],
    pairs: [[], []],
  },
  {
    slug: '004',
    title: 'Procedural terrain, rendered at runtime.',
    headlineDark: 'Procedural terrain,',
    headlineMuted: ' rendered at runtime.',
    claims: [
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
    ],
    pairs: [[], []],
  },
  {
    slug: '005',
    title: 'Fluid simulation, physics made visual.',
    headlineDark: 'Fluid simulation,',
    headlineMuted: ' physics made visual.',
    claims: [
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
      { caption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.' },
    ],
    pairs: [[], []],
  },
]

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASES.find(c => c.slug === slug)
}
