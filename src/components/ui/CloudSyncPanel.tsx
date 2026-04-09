import { useState } from 'react'
import { Cloud, CloudOff, Upload, Download, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { syncToCloud, loadFromCloud } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as store from '@/lib/store'
import type { AppData, Dashboard } from '@/data/types'
import { Card, CardTitle } from './Card'

interface Props {
  userId: string | undefined
  dashboardId: string
  dashboards: Dashboard[]
  data: AppData
  onDataLoaded: (data: AppData) => void
}

type SyncStatus = 'idle' | 'uploading' | 'downloading' | 'success' | 'error'

// All syncable items with their localStorage keys and cloud key prefixes
const SYNC_ITEMS = [
  { id: 'dashboards', label: 'Dashboard Index', desc: 'Dashboard list, names, modes', icon: '📊', lsKey: null, cloudKey: 'settings/dashboards' },
  { id: 'dashboard-data', label: 'Dashboard Data', desc: 'All snapshots, accounts, balances', icon: '💾', lsKey: null, cloudKey: null },
  { id: 'chart-prefs', label: 'Chart Preferences', desc: 'Colors, curve style, layout order', icon: '🎨', lsKey: 'money-app-chart-prefs', cloudKey: 'settings/chart-prefs' },
  { id: 'themes', label: 'Themes & CSS', desc: 'Custom themes, active theme, custom CSS', icon: '🖌️', lsKey: null, cloudKey: 'settings/themes' },
  { id: 'page-titles', label: 'Page Titles', desc: 'Custom page names', icon: '📝', lsKey: 'money-app-page-titles', cloudKey: 'settings/page-titles' },
  { id: 'background', label: 'Background Image', desc: 'Background config, focal point, scrim', icon: '🖼️', lsKey: 'money-app-background', cloudKey: 'settings/background' },
  { id: 'theme-mode', label: 'Theme Mode', desc: 'Dark / Light / System preference', icon: '🌓', lsKey: 'money-app-theme-mode', cloudKey: 'settings/theme-mode' },
  { id: 'tool-drafts', label: 'Tool Drafts', desc: 'Saved calculator inputs', icon: '🔧', lsKey: null, cloudKey: 'settings/tool-drafts' },
] as const

type SyncItemId = (typeof SYNC_ITEMS)[number]['id']

function getThemeBundle(): Record<string, unknown> {
  return {
    themes: JSON.parse(localStorage.getItem('money-app-themes') || '[]'),
    activeTheme: localStorage.getItem('money-app-active-theme') || '',
    customCSS: localStorage.getItem('money-app-custom-css') || '',
  }
}

function setThemeBundle(data: Record<string, unknown>) {
  if (data.themes) localStorage.setItem('money-app-themes', JSON.stringify(data.themes))
  if (data.activeTheme) localStorage.setItem('money-app-active-theme', data.activeTheme as string)
  if (data.customCSS !== undefined) localStorage.setItem('money-app-custom-css', data.customCSS as string)
}

function getToolDrafts(): Record<string, unknown> {
  const drafts: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('money-app-tool-draft-')) {
      drafts[key] = JSON.parse(localStorage.getItem(key) || '{}')
    }
  }
  return drafts
}

function setToolDrafts(data: Record<string, unknown>) {
  for (const [key, val] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(val))
  }
}

export function CloudSyncPanel({ userId, dashboardId, dashboards, data, onDataLoaded }: Props) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<SyncItemId>>(new Set(SYNC_ITEMS.map(i => i.id)))
  const [showItems, setShowItems] = useState(false)
  const configured = isSupabaseConfigured()

  function toggleItem(id: SyncItemId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function uploadItem(id: SyncItemId): Promise<boolean> {
    if (!userId) return false
    const item = SYNC_ITEMS.find(i => i.id === id)
    if (!item) return false

    if (id === 'dashboards') {
      const idx = store.loadDashboardIndex()
      return (await syncToCloud(userId, 'settings/dashboards', idx)).ok
    }
    if (id === 'dashboard-data') {
      let ok = true
      for (const dash of dashboards) {
        if (dash.mode === 'combined' || dash.mode === 'view') continue
        store.setDashboardId(dash.id)
        const d = store.loadData()
        if (d.snapshots.length === 0 && d.accounts.length === 0) continue
        const r = await syncToCloud(userId, `dashboards/${dash.id}/data`, d)
        if (!r.ok) ok = false
      }
      store.setDashboardId(dashboardId)
      return ok
    }
    if (id === 'themes') {
      return (await syncToCloud(userId, 'settings/themes', getThemeBundle())).ok
    }
    if (id === 'tool-drafts') {
      return (await syncToCloud(userId, 'settings/tool-drafts', getToolDrafts())).ok
    }
    // Simple localStorage key items
    if (item.lsKey && item.cloudKey) {
      const raw = localStorage.getItem(item.lsKey)
      if (!raw) return true // nothing to upload
      try {
        return (await syncToCloud(userId, item.cloudKey, JSON.parse(raw))).ok
      } catch {
        return (await syncToCloud(userId, item.cloudKey, raw)).ok
      }
    }
    return true
  }

  async function downloadItem(id: SyncItemId): Promise<boolean> {
    if (!userId) return false
    const item = SYNC_ITEMS.find(i => i.id === id)
    if (!item) return false

    if (id === 'dashboards') {
      const cloud = await loadFromCloud(userId, 'settings/dashboards')
      if (cloud && typeof cloud === 'object') {
        store.saveDashboardIndex(cloud as ReturnType<typeof store.loadDashboardIndex>)
        return true
      }
      return false
    }
    if (id === 'dashboard-data') {
      const idx = store.loadDashboardIndex()
      let pulled = 0
      for (const dash of idx.dashboards) {
        if (dash.mode === 'combined' || dash.mode === 'view') continue
        const cloud = await loadFromCloud(userId, `dashboards/${dash.id}/data`)
        if (cloud && typeof cloud === 'object') {
          store.setDashboardId(dash.id)
          store.saveData(cloud as AppData)
          pulled++
        }
      }
      store.setDashboardId(dashboardId)
      if (pulled > 0) onDataLoaded(store.loadData())
      return pulled > 0
    }
    if (id === 'themes') {
      const cloud = await loadFromCloud(userId, 'settings/themes')
      if (cloud && typeof cloud === 'object') { setThemeBundle(cloud as Record<string, unknown>); return true }
      return false
    }
    if (id === 'tool-drafts') {
      const cloud = await loadFromCloud(userId, 'settings/tool-drafts')
      if (cloud && typeof cloud === 'object') { setToolDrafts(cloud as Record<string, unknown>); return true }
      return false
    }
    if (item.lsKey && item.cloudKey) {
      const cloud = await loadFromCloud(userId, item.cloudKey)
      if (cloud !== null) {
        localStorage.setItem(item.lsKey, typeof cloud === 'string' ? cloud : JSON.stringify(cloud))
        return true
      }
      return false
    }
    return true
  }

  async function handleUpload() {
    if (!userId) return
    setStatus('uploading')
    let ok = 0, fail = 0
    for (const item of SYNC_ITEMS) {
      if (!selected.has(item.id)) continue
      setMessage(`Uploading ${item.label}...`)
      const success = await uploadItem(item.id)
      if (success) ok++; else fail++
    }
    setStatus(fail === 0 ? 'success' : 'error')
    setMessage(fail === 0 ? `Uploaded ${ok} items to cloud` : `${ok} uploaded, ${fail} failed`)
    setTimeout(() => setStatus('idle'), 4000)
  }

  async function handleDownload() {
    if (!userId) return
    setStatus('downloading')
    let ok = 0, fail = 0
    // Download index first, then data
    const ordered = [...SYNC_ITEMS].sort((a, b) => (a.id === 'dashboards' ? -1 : b.id === 'dashboards' ? 1 : 0))
    for (const item of ordered) {
      if (!selected.has(item.id)) continue
      setMessage(`Downloading ${item.label}...`)
      const success = await downloadItem(item.id)
      if (success) ok++; else fail++
    }
    setStatus(fail === 0 ? 'success' : 'error')
    setMessage(fail === 0 ? `Downloaded ${ok} items. Reload to apply all changes.` : `${ok} downloaded, ${fail} failed`)
    setTimeout(() => setStatus('idle'), 5000)
  }

  async function handleSync() {
    if (!userId) return
    setStatus('uploading')
    setMessage('Syncing everything...')
    let ok = 0
    for (const item of SYNC_ITEMS) {
      if (!selected.has(item.id)) continue
      await uploadItem(item.id)
      ok++
    }
    setStatus('success')
    setMessage(`Synced ${ok} items to cloud`)
    setTimeout(() => setStatus('idle'), 3000)
  }

  if (!configured) {
    return (
      <Card className="mb-6">
        <CardTitle>Cloud Sync</CardTitle>
        <div className="mt-3 flex items-center gap-2 text-text-muted">
          <CloudOff size={16} />
          <p className="text-xs">Supabase not configured. Cloud sync is unavailable.</p>
        </div>
      </Card>
    )
  }

  if (!userId) {
    return (
      <Card className="mb-6">
        <CardTitle>Cloud Sync</CardTitle>
        <div className="mt-3 flex items-center gap-2 text-text-muted">
          <Cloud size={16} />
          <p className="text-xs">Sign in with Google to sync your data across devices.</p>
        </div>
      </Card>
    )
  }

  const statusIcon = {
    idle: <Cloud size={16} className="text-accent" />,
    uploading: <Upload size={16} className="text-amber animate-pulse" />,
    downloading: <Download size={16} className="text-blue animate-pulse" />,
    success: <Check size={16} className="text-green" />,
    error: <AlertCircle size={16} className="text-red" />,
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <CardTitle>Cloud Sync</CardTitle>
        {statusIcon[status]}
      </div>
      <p className="text-xs text-text-muted mt-1 mb-3">
        Sync dashboards, settings, and preferences across devices.
        Data is stored with organized keys for easy lookup.
      </p>

      {/* Sync item checkboxes */}
      <button
        onClick={() => setShowItems(!showItems)}
        className="text-[11px] text-accent hover:text-accent-hover transition-colors mb-2"
      >
        {showItems ? 'Hide' : 'Show'} sync items ({selected.size}/{SYNC_ITEMS.length} selected)
      </button>

      {showItems && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4 p-3 bg-background rounded-lg border border-border">
          {SYNC_ITEMS.map(item => (
            <label key={item.id} className="flex items-start gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="accent-accent mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-text-primary">{item.icon} {item.label}</p>
                <p className="text-[10px] text-text-muted">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSync}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={status === 'uploading' ? 'animate-spin' : ''} />
          Sync All
        </button>
        <button
          onClick={handleUpload}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary rounded-lg text-xs hover:text-text-primary hover:border-accent/40 transition-colors disabled:opacity-50"
        >
          <Upload size={13} />
          Upload
        </button>
        <button
          onClick={handleDownload}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary rounded-lg text-xs hover:text-text-primary hover:border-accent/40 transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          Download
        </button>
      </div>

      {message && (
        <p className={`text-xs mt-3 ${status === 'error' ? 'text-red' : status === 'success' ? 'text-green' : 'text-text-muted'}`}>
          {message}
        </p>
      )}

      {/* Cloud key structure info */}
      <details className="mt-4">
        <summary className="text-[10px] text-text-muted cursor-pointer hover:text-text-secondary">
          Cloud storage structure
        </summary>
        <div className="mt-2 p-2 bg-background rounded border border-border text-[10px] text-text-muted font-mono space-y-0.5">
          <p>settings/dashboards — Dashboard index</p>
          <p>settings/chart-prefs — Colors, layout, curves</p>
          <p>settings/themes — Theme data + custom CSS</p>
          <p>settings/page-titles — Custom page names</p>
          <p>settings/background — Background image config</p>
          <p>settings/theme-mode — Dark/Light/System</p>
          <p>settings/tool-drafts — Calculator saved inputs</p>
          {dashboards.filter(d => d.mode !== 'combined' && d.mode !== 'view').map(d => (
            <p key={d.id}>dashboards/{d.id}/data — {d.emoji} {d.name}</p>
          ))}
        </div>
      </details>
    </Card>
  )
}
