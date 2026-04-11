'use client'

import { Canvas } from '@react-three/fiber'
import CarouselScene, { type CarouselSceneProps } from './CarouselScene'

export default function CarouselCanvas(props: CarouselSceneProps) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      flat
    >
      <CarouselScene {...props} />
    </Canvas>
  )
}
