'use client'

import Image from 'next/image'
import { useRef, useEffect } from 'react'
import s from './SlotMedia.module.css'

export default function SlotMedia({
  img,
  video,
  children,
}: {
  img?: string
  video?: string
  children?: React.ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 1.5
  }, [])

  return (
    <div className={s.wrap}>
      <div id="case-media" data-element="Media block" className={s.mediaBlock}>
        <div id="case-media-frame" data-element="Media frame" className={s.mediaFrame}>
          {video ? (
            <video
              ref={videoRef}
              data-element="Media video"
              src={video}
              autoPlay
              muted
              loop
              playsInline
              style={{ objectFit: 'cover' }}
            />
          ) : img ? (
            <Image data-element="Media image" src={img} alt="" fill sizes="100vw" priority style={{ objectFit: 'cover' }} />
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
