import { useState, type ReactNode } from 'react'
import { Pencil, X } from 'lucide-react'

interface PageEditModeProps {
  children: (editMode: boolean) => ReactNode
  rightExtra?: ReactNode
}

export function PageEditMode({ children, rightExtra }: PageEditModeProps) {
  const [editMode, setEditMode] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {rightExtra}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            editMode
              ? 'border-[var(--page-accent,#6366f1)] bg-[var(--page-accent,#6366f1)]/10 text-[var(--page-accent,#6366f1)]'
              : 'border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          {editMode ? <X size={14} /> : <Pencil size={14} />}
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
      {children(editMode)}
    </div>
  )
}

interface ResizableCardProps {
  children: ReactNode
  editMode: boolean
  className?: string
}

export function ResizableCard({ children, editMode, className = '' }: ResizableCardProps) {
  if (!editMode) return <div className={className}>{children}</div>

  return (
    <div className={`relative group ${className}`}>
      <div className="ring-1 ring-dashed ring-[var(--page-accent,#6366f1)]/30 rounded-xl overflow-hidden resize hover:ring-[var(--page-accent,#6366f1)]/60 transition-all" style={{ overflow: 'auto', minHeight: '200px' }}>
        {children}
      </div>
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[var(--page-accent,#6366f1)]/40 opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
  )
}
