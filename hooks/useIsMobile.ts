'use client'

import { useEffect, useState } from 'react'
import { BREAKPOINT_MOBILE } from '@/lib/cardDimensions'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const read = () => setIsMobile(window.innerWidth < BREAKPOINT_MOBILE)
    read()
    window.addEventListener('resize', read)
    window.addEventListener('orientationchange', read)
    return () => {
      window.removeEventListener('resize', read)
      window.removeEventListener('orientationchange', read)
    }
  }, [])

  return isMobile
}
