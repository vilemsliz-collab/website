'use client'

import { useState, useEffect, type ReactNode } from 'react'
import s from './PasswordGate.module.css'

interface Props {
  slug: string
  password: string
  children: ReactNode
}

export default function PasswordGate({ slug, password, children }: Props) {
  const key = `unlocked-${slug}`
  const [unlocked, setUnlocked] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(key) === '1') setUnlocked(true)
  }, [key])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value === password) {
      sessionStorage.setItem(key, '1')
      setUnlocked(true)
    } else {
      setError(true)
      setValue('')
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className={s.gate}>
      <form className={s.form} onSubmit={submit}>
        <p className={s.label}>Password required</p>
        <input
          className={`${s.input} ${error ? s.inputError : ''}`}
          type="password"
          placeholder="Enter password"
          value={value}
          autoFocus
          onChange={e => { setValue(e.target.value); setError(false) }}
        />
        {error && <p className={s.error}>Incorrect password</p>}
        <button className={s.button} type="submit">Unlock</button>
      </form>
    </div>
  )
}
