import { useState, useRef, useEffect } from 'react'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#16a34a',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#14b8a6', '#6b7280', '#a3a3a3', '#e4e4eb',
]

interface ColorPickerProps {
  currentColor: string
  onColorChange: (color: string) => void
  label: string
}

export function ColorPicker({ currentColor, onColorChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onContextMenu={(e) => { e.preventDefault(); setOpen(!open) }}
        className="flex items-center gap-1.5 group"
        title={`Right-click or click to change color for ${label}`}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20 inline-block flex-shrink-0"
          style={{ backgroundColor: currentColor }}
        />
        <span className="group-hover:underline decoration-dotted underline-offset-2" style={{ color: currentColor }}>
          {label}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-lg p-2 shadow-2xl z-50 w-44">
          <p className="text-[10px] text-text-muted mb-1.5 px-1">Choose color</p>
          <div className="grid grid-cols-6 gap-1">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => { onColorChange(color); setOpen(false) }}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${
                  color === currentColor ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-border flex items-center gap-1.5 px-1">
            <label className="text-[10px] text-text-muted">Custom:</label>
            <input
              type="color"
              value={currentColor}
              onChange={e => { onColorChange(e.target.value); setOpen(false) }}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface InlineColorLabelProps {
  color: string
  label: string
  onColorChange: (color: string) => void
}

export function InlineColorLabel({ color, label, onColorChange }: InlineColorLabelProps) {
  return (
    <ColorPicker currentColor={color} onColorChange={onColorChange} label={label} />
  )
}
