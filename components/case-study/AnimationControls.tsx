'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface AnimationParams {
  spread: number   // amp multiplier — how far blobs scatter (0.1–0.6)
  speed: number    // time multiplier (0.2–2.5)
  hue: number      // CSS hue-rotate degrees (0–360)
}

export const DEFAULT_PARAMS: AnimationParams = {
  spread: 0.31,
  speed: 1.0,
  hue: 0,
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
