'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface AnimationParams {
  rotation: number    // degrees per second around center (0–180)
  stiffness: number   // spring k — how fast blobs chase their target (0.5–10)
  damping: number     // spring d — how much they oscillate (0.3–4)
}

export const DEFAULT_PARAMS: AnimationParams = {
  rotation: 30,
  stiffness: 2.5,
  damping: 1.4,
}

interface CtxValue {
  params: AnimationParams
  setParam: <K extends keyof AnimationParams>(k: K, v: AnimationParams[K]) => void
}

const Ctx = createContext<CtxValue>({
  params: DEFAULT_PARAMS,
  setParam: () => {},
})

export function AnimationControlsProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<AnimationParams>(DEFAULT_PARAMS)
  const setParam = <K extends keyof AnimationParams>(k: K, v: AnimationParams[K]) => {
    setParams(p => ({ ...p, [k]: v }))
  }
  return <Ctx.Provider value={{ params, setParam }}>{children}</Ctx.Provider>
}

export const useAnimationControls = () => useContext(Ctx)
