import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'

interface Props {
  email: string | undefined
  avatarUrl: string | undefined
  displayName: string | undefined
  onSignOut: () => void
  isLocal: boolean
}

export function UserMenu({ email, avatarUrl, displayName, onSignOut, isLocal }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
            <User size={14} className="text-accent" />
          </div>
        )}
        <span className="text-xs text-text-secondary truncate max-w-[120px]">
          {isLocal ? 'Local Mode' : (displayName || email || 'User')}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-surface border border-border rounded-lg shadow-2xl z-50 py-1">
          {!isLocal && (
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-text-primary truncate">{displayName || 'User'}</p>
              <p className="text-[10px] text-text-muted truncate">{email}</p>
            </div>
          )}
          <div className="px-3 py-2">
            <p className="text-[10px] text-text-muted">
              {isLocal
                ? 'Data stored locally in your browser. Sign in to sync across devices.'
                : 'Data synced securely via Supabase.'}
            </p>
          </div>
          {!isLocal && (
            <button
              onClick={() => { onSignOut(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-red hover:bg-surface-hover transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      )}
    </div>
  )
}
