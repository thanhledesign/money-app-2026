import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface UVPBadgeProps {
  label: string
  description: string
}

export function UVPBadge({ label, description }: UVPBadgeProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber/10 text-amber border border-amber/20 cursor-pointer hover:bg-amber/20 transition-colors"
      >
        <Sparkles size={10} />
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-lg p-3 shadow-2xl z-50">
            <p className="text-xs text-text-secondary">{description}</p>
          </div>
        </>
      )}
    </div>
  )
}
