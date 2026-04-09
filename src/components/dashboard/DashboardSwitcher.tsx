import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Settings, Pencil, Trash2, Download, Upload, Copy } from 'lucide-react'
import type { Dashboard } from '@/data/types'
import { MAX_FREE_DASHBOARDS } from '@/data/types'
import { setDashboardId, exportData, importData } from '@/lib/store'

interface Props {
  dashboards: Dashboard[]
  activeId: string
  canCreate: boolean
  onSwitch: (id: string) => void
  onCreateClick: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string, emoji: string) => void
  onDuplicate: (id: string) => void
}

const MODE_BADGE: Record<string, { label: string; color: string }> = {
  scenario: { label: 'Scenario', color: 'text-blue bg-blue/10 border-blue/30' },
  view: { label: 'View', color: 'text-cyan bg-cyan/10 border-cyan/30' },
  combined: { label: 'Combined', color: 'text-purple bg-purple/10 border-purple/30' },
}

export function DashboardSwitcher({ dashboards, activeId, canCreate, onSwitch, onCreateClick, onDelete, onRename, onDuplicate }: Props) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [cogMenuId, setCogMenuId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const active = dashboards.find(d => d.id === activeId) ?? dashboards[0]

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setEditingId(null)
        setConfirmDeleteId(null)
        setCogMenuId(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const startEdit = (d: Dashboard) => {
    setCogMenuId(null)
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

  const handleExportDashboard = (d: Dashboard) => {
    setCogMenuId(null)
    setDashboardId(d.mode === 'view' ? (d.sourceId ?? 'default') : d.id)
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${d.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDashboardId(activeId)
  }

  const handleImportToDashboard = (d: Dashboard) => {
    setCogMenuId(null)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          setDashboardId(d.id)
          importData(reader.result as string)
          setDashboardId(activeId)
          window.location.reload()
        } catch { /* ignore */ }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleDuplicate = (d: Dashboard) => {
    setCogMenuId(null)
    onDuplicate(d.id)
  }

  const handleDeleteClick = (d: Dashboard) => {
    setCogMenuId(null)
    setConfirmDeleteId(d.id)
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
        <div className="absolute left-0 top-full mt-1 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 py-1.5 max-h-96 overflow-y-auto min-w-[300px]" style={{ right: '-20px' }}>
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
              ) : confirmDeleteId === d.id ? (
                <div className="px-3 py-2 bg-red/5 border-y border-red/20">
                  <p className="text-xs text-red mb-2">Delete "{d.name}"? This cannot be undone.</p>
                  <div className="flex gap-1">
                    <button onClick={() => { onDelete(d.id); setConfirmDeleteId(null) }}
                      className="px-2 py-1 bg-red/10 text-red border border-red/30 rounded text-xs">
                      Yes, Delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-text-muted rounded text-xs">
                      Cancel
                    </button>
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

                  {/* Cog wheel — reveals action menu on click */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCogMenuId(cogMenuId === d.id ? null : d.id) }}
                      className="p-1 text-text-muted hover:text-text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      title="Actions"
                    >
                      <Settings size={13} />
                    </button>

                    {cogMenuId === d.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-2xl z-[60] py-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => startEdit(d)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                        >
                          <Pencil size={12} /> Rename
                        </button>
                        {d.mode === 'scenario' && (
                          <button
                            onClick={() => handleDuplicate(d)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                          >
                            <Copy size={12} /> Duplicate
                          </button>
                        )}
                        {d.mode === 'scenario' && (
                          <>
                            <button
                              onClick={() => handleExportDashboard(d)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                            >
                              <Download size={12} /> Export
                            </button>
                            <button
                              onClick={() => handleImportToDashboard(d)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                            >
                              <Upload size={12} /> Import
                            </button>
                          </>
                        )}
                        {d.id !== 'default' && (
                          <>
                            <div className="border-t border-border my-1" />
                            <button
                              onClick={() => handleDeleteClick(d)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red hover:bg-red/5 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
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
