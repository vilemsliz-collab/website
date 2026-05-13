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
  solutionImg?: string
  pairs: string[][]
  pairsBottom?: string[][]
  widget?: string
  mobileSections?: MobileSection[]
  layout?: 'about'
}

export const CASES: CaseStudy[] = [
  {
    slug: 'about',
    title: 'Vilém Slíž',
    headlineDark: 'Vilém Slíž',
    headlineMuted: '',
    claims: [
      { bold: 'brand systems', text: 'Generalist designer focused on {bold}' },
      { bold: 'top of funnel to product', text: 'Building brand experiences from {bold}' },
      { bold: 'B2B SaaS', text: 'Specialising in {bold} at Wrike' },
    ],
    roleBody: 'I build seamless brand experiences from top of the funnel to product in the B2B SaaS space at Wrike. I care about turning brand strategy into systems people actually enjoy using.',
    challenge: 'I build seamless brand experiences from top of the funnel to product in the B2B SaaS space at Wrike. I care about turning brand strategy into systems people actually enjoy using.',
    solution: '',
    mediaCaption: '',
    layout: 'about',
    pairs: [
      [
        '@bio-card',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1778365303/7826c895-4091-4159-9025-999e4f274797.png',
      ],
    ],
  },
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
    pairs: [
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233939/Frame_1000005661_zekl7h.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233939/Frame_1000005663_tyzw5d.png',
      ],
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233940/Frame_1000005656_lvzzdk.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233941/Frame_1000005659_aw4jmv.png',
      ],
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233941/Frame_1000005660_bckqnw.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1777233943/Frame_1000005665_mc18e6.png',
      ],
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
    pairs: [
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898866/Frame_1000005674_cryrlh.png',
        'https://res.cloudinary.com/duee5dfom/video/upload/q_auto/f_auto/v1778660810/Scene_2_grgyb1.mp4',
      ],
      [
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005657_sw5nt5.png',
        'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1776898865/Frame_1000005638_daacf6.png',
      ],
    ],
    pairsBottom: [['@hp-animation', '@star-animation']],
    widget: '@agents-grid',
    solutionImg: 'https://res.cloudinary.com/duee5dfom/image/upload/q_auto/f_auto/v1778663150/Slide_16_9_-_1_dtuhgg.png',
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
    pairs: [[], []],
  },
]

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASES.find(c => c.slug === slug)
}
