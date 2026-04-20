'use client'

import { useEffect } from 'react'

// Shared `#cursor-liquid` SVG filter. Always mounted so both the desktop
// CustomCursor and the mobile carousel pill can reference `url('#cursor-liquid')`.
// The turbulence `baseFrequency` drifts here each frame. On desktop, CustomCursor
// overrides frequency + displacement scale each frame for its state-dependent
// spring; on mobile it holds at the card-state scale (82).
export default function CursorLiquidFilter() {
  useEffect(() => {
    const clt = document.getElementById('clt') as unknown as SVGFETurbulenceElement | null
    const cld = document.getElementById('cld') as unknown as SVGFEDisplacementMapElement | null
    if (!clt || !cld) return

    cld.setAttribute('scale', '82')

    let rafId = 0
    const frame = (now: number) => {
      const flowX = 0.018 + Math.sin(now * 0.00024) * 0.006
      const flowY = 0.023 + Math.cos(now * 0.00031) * 0.005
      clt.setAttribute('baseFrequency', `${flowX.toFixed(4)} ${flowY.toFixed(4)}`)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <svg
      aria-hidden
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          id="cursor-liquid"
          colorInterpolationFilters="sRGB"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feTurbulence
            id="clt"
            type="turbulence"
            baseFrequency="0.018 0.024"
            numOctaves={2}
            seed={0}
            result="noise"
            stitchTiles="stitch"
          />
          <feDisplacementMap
            id="cld"
            in="SourceGraphic"
            in2="noise"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
