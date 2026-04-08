import { useState } from 'react'
import { X } from 'lucide-react'
import type { Dashboard } from '@/data/types'

interface Props {
  dashboards: Dashboard[]
  onClose: () => void
  onCreate: (dashboard: Dashboard) => void
}

const EMOJIS = ['📊', '🚀', '🎯', '💰', '📈', '🏠', '🎓', '💎', '⚡', '🌟', '🔮', '🏦']

export function CreateDashboardModal({ dashboards, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📊')
  const [mode, setMode] = useState<'scenario' | 'view' | 'combined'>('scenario')
  const [sourceId, setSourceId] = useState('default')
  const [mergeIds, setMergeIds] = useState<string[]>([])

  const scenarioDashboards = dashboards.filter(d => d.mode === 'scenario')

  const handleCreate = () => {
    if (!name.trim()) return
    const id = `dash-${Date.now()}`
    const dashboard: Dashboard = {
      id,
      name: name.trim(),
      emoji,
      mode,
      createdAt: new Date().toISOString(),
      ...(mode === 'view' ? { sourceId } : {}),
      ...(mode === 'combined' ? { mergeIds } : {}),
    }
    onCreate(dashboard)
    onClose()
  }

  const toggleMergeId = (id: string) => {
    setMergeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">New Dashboard</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
        </div>

        {/* Name + Emoji */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Name</label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-12 h-10 bg-background border border-border rounded-lg text-center text-lg appearance-none cursor-pointer"
              >
                {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Aggressive Savings Plan"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <label className="text-xs text-text-muted mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('scenario')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                mode === 'scenario' ? 'border-blue bg-blue/10 text-blue' : 'border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className="text-lg mb-1">🌎</div>
              <div className="text-xs font-medium">Scenario</div>
              <div className="text-[10px] mt-0.5 text-text-muted">Own data</div>
            </button>
            <button
              onClick={() => setMode('view')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                mode === 'view' ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className="text-lg mb-1">👁</div>
              <div className="text-xs font-medium">View</div>
              <div className="text-[10px] mt-0.5 text-text-muted">Shared data</div>
            </button>
            <button
              onClick={() => setMode('combined')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                mode === 'combined' ? 'border-purple bg-purple/10 text-purple' : 'border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className="text-lg mb-1">🔗</div>
              <div className="text-xs font-medium">Combined</div>
              <div className="text-[10px] mt-0.5 text-text-muted">Merged totals</div>
            </button>
          </div>
        </div>

        {/* Mode-specific options */}
        {mode === 'scenario' && (
          <p className="text-xs text-text-muted bg-blue/5 border border-blue/20 rounded-lg p-3">
            This dashboard gets its own accounts, snapshots, budget, and goals. Use it for "what-if" scenarios.
          </p>
        )}

        {mode === 'view' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">Data Source</label>
            <select
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary"
            >
              {scenarioDashboards.map(d => (
                <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">Shares the selected dashboard's data with a different layout.</p>
          </div>
        )}

        {mode === 'combined' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">Merge Data From</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {scenarioDashboards.map(d => (
                <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={mergeIds.includes(d.id)}
                    onChange={() => toggleMergeId(d.id)}
                    className="accent-purple"
                  />
                  <span>{d.emoji}</span> {d.name}
                </label>
              ))}
            </div>
            {mergeIds.length === 0 && (
              <p className="text-xs text-amber mt-1">Select at least 2 dashboards to merge.</p>
            )}
            <p className="text-xs text-text-muted mt-1">Combined dashboards are read-only — they show merged totals.</p>
          </div>
        )}

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || (mode === 'combined' && mergeIds.length < 2)}
          className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Create Dashboard
        </button>
      </div>
    </div>
  )
}
