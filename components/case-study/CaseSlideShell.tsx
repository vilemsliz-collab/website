'use client'

import { useParams } from 'next/navigation'
import { AnimatePresence, m } from 'framer-motion'
import s from './CaseSlideShell.module.css'

const TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }

export default function CaseSlideShell({ children }: { children: React.ReactNode }) {
  const { slug } = useParams() as { slug: string }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.div
        key={slug}
        className={s.slide}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={TRANSITION}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
