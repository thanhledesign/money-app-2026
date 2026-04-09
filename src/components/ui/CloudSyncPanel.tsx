import { useState } from 'react'
import { Cloud, CloudOff, Upload, Download, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { syncToCloud, loadFromCloud } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as store from '@/lib/store'
import type { AppData } from '@/data/types'
import { Card, CardTitle } from './Card'

interface Props {
  userId: string | undefined
  dashboardId: string
  data: AppData
  onDataLoaded: (data: AppData) => void
}

type SyncStatus = 'idle' | 'uploading' | 'downloading' | 'success' | 'error'

export function CloudSyncPanel({ userId, dashboardId, data, onDataLoaded }: Props) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')
  const configured = isSupabaseConfigured()

  const key = `d-${dashboardId}-data`

  async function handleUpload() {
    if (!userId) return
    setStatus('uploading')
    setMessage('')
    const ok = await syncToCloud(userId, key, data)
    if (ok) {
      setStatus('success')
      setMessage(`Uploaded ${data.snapshots.length} snapshots to cloud`)
    } else {
      setStatus('error')
      setMessage('Upload failed — check console for details')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  async function handleDownload() {
    if (!userId) return
    setStatus('downloading')
    setMessage('')
    const cloudData = await loadFromCloud(userId, key)
    if (cloudData && typeof cloudData === 'object') {
      const cd = cloudData as AppData
      if (cd.snapshots?.length > 0) {
        store.saveData(cd)
        onDataLoaded(cd)
        setStatus('success')
        setMessage(`Downloaded ${cd.snapshots.length} snapshots from cloud`)
      } else {
        setStatus('error')
        setMessage('No data found in cloud for this dashboard')
      }
    } else {
      setStatus('error')
      setMessage('No cloud data found — upload first')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  async function handleSync() {
    if (!userId) return
    setStatus('uploading')
    setMessage('Syncing...')
    // Upload current data
    const ok = await syncToCloud(userId, key, data)
    if (!ok) {
      setStatus('error')
      setMessage('Sync failed during upload')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }
    setStatus('success')
    setMessage(`Synced! ${data.snapshots.length} snapshots saved to cloud`)
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
      <p className="text-xs text-text-muted mt-1 mb-4">
        Sync your dashboard data across devices. Currently tracking {data.snapshots.length} snapshots.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSync}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={status === 'uploading' ? 'animate-spin' : ''} />
          Sync Now
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
    </Card>
  )
}
