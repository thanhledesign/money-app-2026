import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Columns2, Square, RotateCcw } from 'lucide-react'
import type { SectionWidth } from '@/data/chartPrefs'

const ACCENT_PRESETS = [
  '#a855f7', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b',
  '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6',
]

interface Props {
  sectionKey: string
  currentWidth: SectionWidth
  currentColor?: string
  onWidthChange: (width: SectionWidth) => void
  onColorChange: (color: string) => void
  onReset: () => void
}

export function SectionMenu({ sectionKey, currentWidth, currentColor, onWidthChange, onColorChange, onReset }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 rounded hover:bg-white/10 text-text-muted hover:text-text-secondary transition-colors"
        title="Section settings"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-52 bg-surface border border-border rounded-xl p-3 shadow-xl space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Width toggle */}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Width</p>
            <div className="flex gap-1">
              <button
                onClick={() => onWidthChange('full')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  currentWidth === 'full' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Square size={12} /> Full
              </button>
              <button
                onClick={() => onWidthChange('half')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  currentWidth === 'half' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Columns2 size={12} /> Half
              </button>
            </div>
          </div>

          {/* Accent color picker */}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Accent Color</p>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    currentColor === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => { onReset(); setOpen(false) }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors w-full"
          >
            <RotateCcw size={12} /> Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
