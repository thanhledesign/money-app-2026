import { useState, useCallback, useEffect, useRef } from 'react'
import type { AppData } from '@/data/types'
import * as store from '@/lib/store'

const MAX_HISTORY = 30
const HIDE_DELAY = 5000 // auto-hide after 5s of no edits

export function useUndoRedo(data: AppData, setData: (d: AppData) => void) {
  const historyRef = useRef<AppData[]>([])
  const futureRef = useRef<AppData[]>([])
  const skipRef = useRef(false)
  const initialRef = useRef(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [showBar, setShowBar] = useState(false)

  // Push current state to history when data changes (unless we're undoing/redoing)
  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false
      return
    }
    // Don't show bar on initial load
    if (initialRef.current) {
      initialRef.current = false
      historyRef.current = [data]
      return
    }
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), data]
    futureRef.current = [] // clear redo on new action
    setCanUndo(historyRef.current.length > 1)
    setCanRedo(false)
    // Show bar on edit, auto-hide after delay
    setShowBar(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowBar(false), HIDE_DELAY)
  }, [data])

  const undo = useCallback(() => {
    if (historyRef.current.length <= 1) return
    const current = historyRef.current.pop()!
    futureRef.current.push(current)
    const prev = historyRef.current[historyRef.current.length - 1]
    if (prev) {
      skipRef.current = true
      store.saveData(prev)
      setData(prev)
    }
    setCanUndo(historyRef.current.length > 1)
    setCanRedo(futureRef.current.length > 0)
    setShowBar(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowBar(false), HIDE_DELAY)
  }, [setData])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.pop()!
    historyRef.current.push(next)
    skipRef.current = true
    store.saveData(next)
    setData(next)
    setCanUndo(historyRef.current.length > 1)
    setCanRedo(futureRef.current.length > 0)
    setShowBar(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowBar(false), HIDE_DELAY)
  }, [setData])

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return { undo, redo, canUndo, canRedo, showBar }
}
