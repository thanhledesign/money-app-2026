import { useState } from 'react'
import { Cloud, CloudOff, Upload, Download, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { syncToCloud, loadFromCloud, loadAllFromCloud } from '@/lib/sync'
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

export function CloudSyncPanel({ userId, dashboardId, dashboards, data, onDataLoaded }: Props) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')
  const configured = isSupabaseConfigured()

  async function handleUpload() {
    if (!userId) return
    setStatus('uploading')
    setMessage('Uploading all dashboards...')

    let uploaded = 0
    let failed = 0

    // 1. Upload dashboard index
    const idx = store.loadDashboardIndex()
    const idxResult = await syncToCloud(userId, 'dashboards', idx)
    if (!idxResult.ok) failed++

    // 2. Upload each dashboard's data
    for (const dash of dashboards) {
      if (dash.mode === 'combined' || dash.mode === 'view') continue // skip virtual dashboards
      store.setDashboardId(dash.id)
      const dashData = store.loadData()
      if (dashData.snapshots.length === 0 && dashData.accounts.length === 0) continue
      const result = await syncToCloud(userId, `d-${dash.id}-data`, dashData)
      if (result.ok) uploaded++
      else failed++
    }

    // Restore active dashboard
    store.setDashboardId(dashboardId)

    if (failed === 0) {
      setStatus('success')
      setMessage(`Uploaded ${uploaded} dashboard${uploaded !== 1 ? 's' : ''} + index to cloud`)
    } else {
      setStatus('error')
      setMessage(`Uploaded ${uploaded}, failed ${failed}. Check console.`)
    }
    setTimeout(() => setStatus('idle'), 4000)
  }

  async function handleDownload() {
    if (!userId) return
    setStatus('downloading')
    setMessage('Downloading all dashboards...')

    // 1. Download dashboard index
    const cloudIdx = await loadFromCloud(userId, 'dashboards')
    let dashCount = 0

    if (cloudIdx && typeof cloudIdx === 'object') {
      const idx = cloudIdx as ReturnType<typeof store.loadDashboardIndex>
      if (idx.dashboards?.length > 0) {
        store.saveDashboardIndex(idx)

        // 2. Download each dashboard's data
        for (const dash of idx.dashboards) {
          if (dash.mode === 'combined' || dash.mode === 'view') continue
          const cloudData = await loadFromCloud(userId, `d-${dash.id}-data`)
          if (cloudData && typeof cloudData === 'object') {
            const cd = cloudData as AppData
            if (cd.snapshots?.length > 0 || cd.accounts?.length > 0) {
              store.setDashboardId(dash.id)
              store.saveData(cd)
              dashCount++
            }
          }
        }

        // Restore active dashboard and reload
        store.setDashboardId(dashboardId)
        const activeData = store.loadData()
        onDataLoaded(activeData)

        setStatus('success')
        setMessage(`Downloaded ${dashCount} dashboard${dashCount !== 1 ? 's' : ''} from cloud. Reload to see changes.`)
      } else {
        setStatus('error')
        setMessage('No dashboards found in cloud')
      }
    } else {
      // Fallback: try just the active dashboard data
      const cloudData = await loadFromCloud(userId, `d-${dashboardId}-data`)
      if (cloudData && typeof cloudData === 'object') {
        const cd = cloudData as AppData
        if (cd.snapshots?.length > 0) {
          store.saveData(cd)
          onDataLoaded(cd)
          setStatus('success')
          setMessage(`Downloaded ${cd.snapshots.length} snapshots (no dashboard index in cloud)`)
        } else {
          setStatus('error')
          setMessage('No data found in cloud')
        }
      } else {
        setStatus('error')
        setMessage('No cloud data found — upload first')
      }
    }
    setTimeout(() => setStatus('idle'), 5000)
  }

  async function handleSync() {
    if (!userId) return
    setStatus('uploading')
    setMessage('Syncing all dashboards...')

    // Upload everything
    const idx = store.loadDashboardIndex()
    await syncToCloud(userId, 'dashboards', idx)

    let synced = 0
    for (const dash of dashboards) {
      if (dash.mode === 'combined' || dash.mode === 'view') continue
      store.setDashboardId(dash.id)
      const dashData = store.loadData()
      if (dashData.snapshots.length === 0 && dashData.accounts.length === 0) continue
      const result = await syncToCloud(userId, `d-${dash.id}-data`, dashData)
      if (result.ok) synced++
    }

    store.setDashboardId(dashboardId)

    setStatus('success')
    setMessage(`Synced ${synced} dashboard${synced !== 1 ? 's' : ''} to cloud`)
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

  const scenarioDashboards = dashboards.filter(d => d.mode !== 'combined' && d.mode !== 'view')
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
      <p className="text-xs text-text-muted mt-1 mb-2">
        Sync all dashboards across devices.
      </p>
      <div className="text-[10px] text-text-muted mb-4 space-y-0.5">
        {scenarioDashboards.map(d => (
          <div key={d.id} className="flex items-center gap-1.5">
            <span>{d.emoji || '📊'}</span>
            <span>{d.name}</span>
            <span className="text-text-muted/50">({d.id})</span>
          </div>
        ))}
      </div>

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
          Upload All
        </button>
        <button
          onClick={handleDownload}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary rounded-lg text-xs hover:text-text-primary hover:border-accent/40 transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          Download All
        </button>
      </div>

      {message && (
        <p className={`text-xs mt-3 ${status === 'error' ? 'text-red' : status === 'success' ? 'text-green' : 'text-text-muted'}`}>
          {message}
        </p>
      )}
    </Card>
  )
}
