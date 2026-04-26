export interface CarouselPreset {
  R_MULT: number
  R_MAX: number
  PERSPECTIVE: number
  LAT?: number[]
  LON_SPREAD?: number
  ROT_MULT: number
  ROLL_MAX: number
  SCALE_ACTIVE: number
  SCALE_SPHERE: number
  OPACITY_MULT: number
  OPACITY_BASE: number
  FRICTION: number
  SPRING: number
  Y_OFFSET: number
}

export interface CarouselCFG extends CarouselPreset {
  LAT: number[]
  LON_SPREAD: number
}

export interface RevealConfig {
  stagger: number
  dur: number
  blur: number
  y: number
}

export interface InputConfig {
  mouseKick: number
  touchSens: number
}

export interface TiltConfig {
  max: number
  stiffness: number
  damping: number
}

export interface GhostConfig {
  layers: number
  opacity: number
  blur: number
  blend: string
  variant: 'front' | 'behind'
}

export interface LightConfig {
  intensity: number
  size: number
  travel: number
  diffuse: number
  shadow: number
  blur: number
}

export interface CardData {
  id: string
  lines: [string, string]
  role: string
  href: string
  bg: string
  ac: string
  video?: string
  img?: string
  isAbout?: boolean
  isWebsite?: boolean
  name?: string
}

export const PRESETS: Record<string, CarouselPreset> = {
  split: {
    R_MULT: 1.50, R_MAX: 1010, PERSPECTIVE: 590,
    LAT: [-25, 15, -38, 30, -10, 22], LON_SPREAD: 1.00,
    ROT_MULT: 0, ROLL_MAX: 0,
    SCALE_ACTIVE: 1.06, SCALE_SPHERE: 0.86,
    OPACITY_MULT: 0.46, OPACITY_BASE: 1.00,
    FRICTION: 0.93, SPRING: 0.01,
    Y_OFFSET: -65,
  },
  mobile: {
    R_MULT: 1.50, R_MAX: 1010, PERSPECTIVE: 200,
    LAT: [-30, 18, -42, 35, -12, 25], LON_SPREAD: 1.00,
    ROT_MULT: 0, ROLL_MAX: 0,
    SCALE_ACTIVE: 1.25, SCALE_SPHERE: 0.83,
    OPACITY_MULT: 0.46, OPACITY_BASE: 1.00,
    FRICTION: 0.93, SPRING: 0.01,
    Y_OFFSET: -10,
  },
  desktop: {
    R_MULT: 0.60, R_MAX: 1010, PERSPECTIVE: 550,
    LAT: [-25, 15, -38, 30, -10, 22], LON_SPREAD: 0.80,
    ROT_MULT: 0, ROLL_MAX: 0,
    SCALE_ACTIVE: 1.20, SCALE_SPHERE: 0.75,
    OPACITY_MULT: 0.46, OPACITY_BASE: 1,
    FRICTION: 0.93, SPRING: 0.01,
    Y_OFFSET: -30,
  },
}

export const REVEAL: RevealConfig = { stagger: 58, dur: 682, blur: 8, y: 8 }
export const INPUT: InputConfig   = { mouseKick: 0.07, touchSens: 0.02 }
export const TILT: TiltConfig     = { max: 16, stiffness: 0.1, damping: 0.75 }
export const GHOST: GhostConfig   = { layers: 0, opacity: 0.16, blur: 0, blend: 'normal', variant: 'behind' }
export const LIGHT: LightConfig   = { intensity: 0.6, size: 85, travel: 68, diffuse: 0.10, shadow: 0.18, blur: 24 }

export const CARDS: CardData[] = [
  { id: 'about', name: 'Vilém', lines: ['Brand XP', 'Expressive UI'], role: '', href: '/about', bg: '#ffffff', ac: '#000000', isAbout: true },
  { id: '002', lines: ['Generative systems,', 'designed in code.'],    role: 'Creative Technologist', href: '/cases/002', bg: '#0d1a0d', ac: '#4dd0e1', img: 'https://res.cloudinary.com/duee5dfom/image/upload/f_auto,q_auto/carousel-card-pictures/case-002-new' },
  { id: '003', lines: ['Audio reactive,', 'visual frequency.'],        role: 'Interaction Designer',  href: '/cases/003', bg: '#0d1a0d', ac: '#4dd0e1', img: 'https://res.cloudinary.com/duee5dfom/image/upload/f_auto,q_auto/carousel-card-pictures/case-003-new' },

  { id: '001', lines: ['Typographic motion,', 'ink meets screen.'],    role: 'Motion Designer',       href: '/cases/001', bg: '#12131a', ac: '#c8ff00', video: 'https://res.cloudinary.com/duee5dfom/video/upload/f_auto,q_auto/carousel-card-pictures/portfolio-reel' },
  { id: 'website', name: 'How I', lines: ['built this', 'website'], role: '', href: '/cases/website', bg: '#12131a', ac: '#ffffff', isWebsite: true },
]
