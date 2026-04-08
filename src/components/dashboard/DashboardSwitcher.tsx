import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Trash2, Pencil } from 'lucide-react'
import type { Dashboard } from '@/data/types'
import { MAX_FREE_DASHBOARDS } from '@/data/types'

interface Props {
  dashboards: Dashboard[]
  activeId: string
  canCreate: boolean
  onSwitch: (id: string) => void
  onCreateClick: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string, emoji: string) => void
}

const MODE_BADGE: Record<string, { label: string; color: string }> = {
  scenario: { label: 'Scenario', color: 'text-blue bg-blue/10 border-blue/30' },
  view: { label: 'View', color: 'text-cyan bg-cyan/10 border-cyan/30' },
  combined: { label: 'Combined', color: 'text-purple bg-purple/10 border-purple/30' },
}

export function DashboardSwitcher({ dashboards, activeId, canCreate, onSwitch, onCreateClick, onDelete, onRename }: Props) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const active = dashboards.find(d => d.id === activeId) ?? dashboards[0]

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const startEdit = (d: Dashboard) => {
    setEditingId(d.id)
    setEditName(d.name)
    setEditEmoji(d.emoji)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim(), editEmoji || '📊')
      setEditingId(null)
    }
  }

  return (
    <div ref={ref} className="relative px-3 py-2 border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
      >
        <span className="text-base">{active?.emoji ?? '📊'}</span>
        <span className="text-sm font-medium text-text-primary truncate flex-1">{active?.name ?? 'Dashboard'}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-surface border border-border rounded-lg shadow-2xl z-50 py-1 max-h-80 overflow-y-auto">
          {dashboards.map(d => (
            <div key={d.id}>
              {editingId === d.id ? (
                <div className="px-3 py-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={e => setEditEmoji(e.target.value)}
                      className="w-10 px-1 py-1 bg-background border border-border rounded text-center text-sm"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm text-text-primary"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-text-muted rounded text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
                    d.id === activeId ? 'bg-accent/10' : 'hover:bg-surface-hover'
                  }`}
                >
                  <button
                    onClick={() => { onSwitch(d.id); setOpen(false) }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <span className="text-base flex-shrink-0">{d.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${d.id === activeId ? 'text-accent font-medium' : 'text-text-primary'}`}>
                        {d.name}
                      </p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${MODE_BADGE[d.mode]?.color ?? ''}`}>
                      {MODE_BADGE[d.mode]?.label ?? d.mode}
                    </span>
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => startEdit(d)} className="p-1 text-text-muted hover:text-text-primary">
                      <Pencil size={12} />
                    </button>
                    {d.id !== 'default' && (
                      <button onClick={() => { onDelete(d.id); }} className="p-1 text-text-muted hover:text-red">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Create new button */}
          <div className="border-t border-border mt-1 pt-1">
            {canCreate ? (
              <button
                onClick={() => { onCreateClick(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-surface-hover transition-colors"
              >
                <Plus size={14} /> New Dashboard
              </button>
            ) : (
              <div className="px-3 py-2">
                <p className="text-xs text-text-muted">{dashboards.length}/{MAX_FREE_DASHBOARDS} dashboards used</p>
                <p className="text-xs text-amber mt-0.5">Upgrade for unlimited dashboards</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
