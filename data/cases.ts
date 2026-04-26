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
  mediaVideo?: string
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
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaVideo: 'https://res.cloudinary.com/duee5dfom/video/upload/q_auto/f_auto/v1777234237/stretched_1fsfsfsf_1_djmmca.mp4',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
    ],
    pairs: [
      [
        'https://res.cloudinary.com/duee5dfom/video/upload/q_auto/f_auto/v1777234237/stretched_1fsfsfsf_1_djmmca.mp4',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233939/Frame_1000005663_tyzw5d.png',
      ],
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233940/Frame_1000005656_lvzzdk.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233941/Frame_1000005659_aw4jmv.png',
      ],
      [],
      [],
    ],
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
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
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
    mediaImg: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776899106/Frame_1000005676_avin8a.png',
    mediaVideo: 'https://res.cloudinary.com/duee5dfom/video/upload/q_auto/f_auto/v1777116988/Final_Wrike_Copilot_Promo_Compressed_HB_1__2_gyxj2u.mp4',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { img: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898866/Frame_1000005674_cryrlh.png', caption: 'Three teams, one design system.' },
      { img: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005638_daacf6.png', caption: 'Three teams, one design system.' },
      { img: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005657_sw5nt5.png', caption: 'Three teams, one design system.' },
      { img: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005675_sl94mi.png', caption: 'Three teams, one design system.' },
    ],
    pairs: [
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898866/Frame_1000005674_cryrlh.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005675_sl94mi.png',
      ],
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005657_sw5nt5.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005638_daacf6.png',
      ],
    ],
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
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
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
      { bold: '2M users', text: 'Shipped to {bold} in product' },
      { bold: '34%', text: 'Increased sign-ups by {bold} in Q2' },
      { bold: '3 platforms', text: 'Launched across {bold} in one quarter' },
    ],
    roleBody: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    challenge: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    solution: 'We audited every existing pattern, distilled a minimal token architecture, and rebuilt the component library from the ground up — optimised for composability.',
    mediaCaption: 'Three separate product teams were shipping UI at different speeds with no shared vocabulary.',
    strip: [
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
      { caption: 'Three teams, one design system.' },
    ],
    pairs: [[], []],
  },
]

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASES.find(c => c.slug === slug)
}
