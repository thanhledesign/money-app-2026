import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '@/lib/calculations'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  prefix?: string
  className?: string
  isCurrency?: boolean
  isPercent?: boolean
  min?: number
  max?: number
}

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['±', '0', '.'],
  ['⌫'],
]

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export function NumberInput({
  value, onChange, label, prefix = '$', className = '',
  isCurrency = true, isPercent = false, min, max,
}: NumberInputProps) {
  const [open, setOpen] = useState(false)
  const [buffer, setBuffer] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        commitAndClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, buffer])

  const openPad = useCallback(() => {
    setBuffer(value === 0 ? '' : String(value))
    setOpen(true)
  }, [value])

  const commitAndClose = useCallback(() => {
    let num = parseFloat(buffer) || 0
    if (min !== undefined && num < min) num = min
    if (max !== undefined && num > max) num = max
    onChange(num)
    setOpen(false)
  }, [buffer, onChange, min, max])

  const handleKey = useCallback((key: string) => {
    if (key === '⌫') {
      setBuffer(prev => prev.slice(0, -1))
    } else if (key === '±') {
      setBuffer(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev)
    } else if (key === '.') {
      setBuffer(prev => prev.includes('.') ? prev : prev + '.')
    } else {
      setBuffer(prev => {
        const raw = prev.startsWith('-') ? prev.slice(1) : prev
        const next = raw + key
        const parts = next.split('.')
        if (parts[1] && parts[1].length > (isPercent ? 4 : 2)) return prev
        return (prev.startsWith('-') ? '-' : '') + next
      })
    }
  }, [isPercent])

  const handleKeyboard = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
      commitAndClose()
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      setBuffer(prev => prev.slice(0, -1))
    } else if (e.key === '-') {
      handleKey('±')
    } else if (/^[0-9.]$/.test(e.key)) {
      handleKey(e.key)
    }
  }, [commitAndClose, handleKey])

  const displayValue = isPercent
    ? `${value.toFixed(1)}%`
    : isCurrency
    ? formatCurrency(value)
    : String(value)

  const bufferDisplay = isPercent
    ? `${buffer || '0'}%`
    : isCurrency
    ? `${prefix}${buffer || '0'}`
    : buffer || '0'

  const padRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && padRef.current) padRef.current.focus()
  }, [open])

  const inputRef2 = useRef<HTMLInputElement>(null)

  const padContent = (
    <div ref={padRef} className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden" onKeyDown={handleKeyboard} tabIndex={0}>
      <div className="px-4 py-3 border-b border-border bg-background">
        {label && <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{label}</p>}
        {isMobile ? (
          <p className="text-2xl font-semibold text-text-primary tabular-nums text-right">{bufferDisplay}</p>
        ) : (
          <div className="flex items-center gap-1">
            {isPercent ? null : isCurrency ? <span className="text-lg text-text-muted">{prefix}</span> : null}
            <input
              ref={inputRef2}
              type="text"
              inputMode="decimal"
              value={buffer}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.\-]/g, '')
                setBuffer(v)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitAndClose() }
                if (e.key === 'Escape') { e.preventDefault(); commitAndClose() }
              }}
              className="flex-1 text-right text-2xl font-semibold text-text-primary tabular-nums bg-transparent outline-none w-full"
              autoFocus
            />
            {isPercent && <span className="text-lg text-text-muted">%</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-px bg-border">
        {KEYS.slice(0, 4).flat().map(key => (
          <button
            type="button"
            key={key}
            onClick={() => handleKey(key)}
            className={`py-3.5 text-lg font-medium transition-colors ${
              key === '±'
                ? 'bg-surface-hover text-blue font-semibold hover:bg-blue/10'
                : 'bg-surface text-text-primary hover:bg-surface-hover active:bg-accent/10'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="gap-px bg-border">
        <button
          type="button"
          onClick={() => handleKey('⌫')}
          className="w-full py-3 text-base font-medium bg-surface text-red hover:bg-red/10 transition-colors border-t border-border"
        >
          ⌫ Delete
        </button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <button
          type="button"
          onClick={() => { setBuffer('') }}
          className="py-3 text-sm font-medium bg-surface text-text-muted hover:bg-surface-hover"
        >Clear</button>
        <button
          type="button"
          onClick={commitAndClose}
          className="py-3 text-sm font-medium bg-accent/20 text-accent hover:bg-accent/30"
        >Done</button>
      </div>
    </div>
  )

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={openPad}
        className="w-full text-right px-3 py-1.5 bg-background border border-border rounded-lg text-sm tabular-nums text-text-primary hover:border-accent/50 transition-colors focus:outline-none focus:border-accent"
      >
        {displayValue}
      </button>

      {open && !isMobile && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={commitAndClose}>
          <div
            className="absolute w-56"
            style={{
              top: (wrapRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
              left: Math.min(
                wrapRef.current?.getBoundingClientRect().right ?? 0,
                window.innerWidth - 230
              ) - 224,
            }}
            onClick={e => e.stopPropagation()}
          >
            {padContent}
          </div>
        </div>,
        document.body
      )}

      {open && isMobile && createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={commitAndClose} />
          <div className="relative w-full max-w-md mx-auto">
            {padContent}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
