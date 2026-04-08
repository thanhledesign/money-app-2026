import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface UVPBadgeProps {
  label: string
  description: string
}

export function UVPBadge({ label, description }: UVPBadgeProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber/10 text-amber border border-amber/20 cursor-help">
        <Sparkles size={10} />
        {label}
      </span>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg p-3 shadow-2xl z-50">
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      )}
    </div>
  )
}
