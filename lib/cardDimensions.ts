export const CARD_ASPECT_W = 364
export const CARD_ASPECT_H = 555
export const CARD_ASPECT   = CARD_ASPECT_H / CARD_ASPECT_W
export const BREAKPOINT_MOBILE = 768

export interface CardDimensions {
  cardW: number
  cardH: number
  isMobile: boolean
  viewportW: number
  viewportH: number
}

export function computeCardDimensions(viewportW: number, viewportH: number): CardDimensions {
  const cardW    = Math.min(viewportW * 0.92, viewportH * 0.40)
  const cardH    = cardW * CARD_ASPECT
  const isMobile = viewportW < BREAKPOINT_MOBILE
  return { cardW, cardH, isMobile, viewportW, viewportH }
}

// Live stage width — caseOpen can flip between resizes, so compute on demand.
// Desktop + case open: carousel shrinks to 30vw. Mobile is always full viewport.
export function computeStageWidth(d: CardDimensions, caseOpen: boolean): number {
  return (caseOpen && !d.isMobile) ? d.viewportW * 0.30 : d.viewportW
}
