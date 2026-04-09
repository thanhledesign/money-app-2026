import { useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'money-app-theme-mode'

function getSystemPreference(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyMode(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemPreference() : mode
  document.documentElement.classList.toggle('light', resolved === 'light')
}

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return stored ?? 'dark'
  })

  useEffect(() => {
    applyMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  // Listen for system preference changes when mode is 'system'
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => applyMode('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return [mode, setMode] as const
}
