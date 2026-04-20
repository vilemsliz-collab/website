'use client'

import { useLayoutEffect, useRef, type MutableRefObject } from 'react'
import {
  computeCardDimensions,
  CARD_ASPECT_W, CARD_ASPECT_H,
  type CardDimensions,
} from '@/lib/cardDimensions'

function writeCSSVars(d: CardDimensions) {
  const root = document.documentElement.style
  root.setProperty('--card-width',  `${d.cardW}px`)
  root.setProperty('--card-height', `${d.cardH}px`)
}

const SSR_FALLBACK: CardDimensions = {
  cardW: 364, cardH: 555,
  isMobile: false,
  viewportW: 1440, viewportH: 900,
}

export function useCardDimensions(): MutableRefObject<CardDimensions> {
  const ref = useRef<CardDimensions>(SSR_FALLBACK)

  useLayoutEffect(() => {
    function read() {
      const next = computeCardDimensions(window.innerWidth, window.innerHeight)
      ref.current = next
      writeCSSVars(next)
    }
    read()
    window.addEventListener('resize', read)
    window.addEventListener('orientationchange', read)
    return () => {
      window.removeEventListener('resize', read)
      window.removeEventListener('orientationchange', read)
    }
  }, [])

  return ref
}

export { CARD_ASPECT_W, CARD_ASPECT_H }
