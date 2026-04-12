import { type CardData } from './carouselConfig'

// 2× retina resolution matching the max card size (364×555)
const W = 728
const H = 1110

export function makeTextCanvas(card: CardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  drawCardText(canvas, card)
  return canvas
}

export function drawCardText(canvas: HTMLCanvasElement, card: CardData): void {
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  // Mirroring CSS layout (all values at 2× for retina)
  const padH   = 48   // --card-padding (24px) × 2
  const padB   = 80   // --space-10    (40px) × 2
  const lineFs = 64   // 32px × 2
  const roleFs = 28   // 14px × 2
  const gap    = 8    //  4px × 2
  const lh     = Math.ceil(lineFs * 1.17)  // 75px  (line-height 1.17)

  ctx.textBaseline = 'bottom'

  // Positions from bottom of canvas
  const line2Y = H - padB
  const line1Y = line2Y - lh - gap
  const roleY  = line1Y - lh - gap   // generous gap above lines

  // Role label
  ctx.font          = `400 ${roleFs}px "Google Sans Flex", system-ui, sans-serif`
  ctx.letterSpacing = '2.8px'   // 0.1em × 28px
  ctx.fillStyle     = 'rgba(255,255,255,0.8)'
  ctx.fillText(card.role, padH, roleY)

  // Two headline lines
  ctx.font          = `400 ${lineFs}px "Google Sans Flex", system-ui, sans-serif`
  ctx.letterSpacing = '0px'
  ctx.fillStyle     = '#ffffff'
  ctx.fillText(card.lines[0], padH, line1Y)
  ctx.fillText(card.lines[1], padH, line2Y)
}
