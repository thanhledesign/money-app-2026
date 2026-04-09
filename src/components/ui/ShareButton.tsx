import { useState } from 'react'
import { Share2, Copy, Check, Link2, Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AppData } from '@/data/types'

interface Props {
  data: AppData
  userId: string | undefined
  dashboardName: string
}

export function ShareButton({ data, userId, dashboardName }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  if (!isSupabaseConfigured() || !userId) return null

  async function handleShare() {
    if (!supabase || !userId) return
    setLoading(true)
    try {
      // Generate a share ID
      const shareId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      // Upsert share data
      const { error } = await supabase
        .from('shared_dashboards')
        .upsert({
          id: shareId,
          user_id: userId,
          name: dashboardName,
          data: data,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.warn('[share] failed:', error.message)
        // Fallback: use user_data table with a share key
        const fallbackId = btoa(`${userId}:${Date.now()}`).replace(/[+/=]/g, '').slice(0, 16)
        await supabase.from('user_data').upsert(
          { user_id: userId, key: `share-${fallbackId}`, data: { name: dashboardName, dashboard: data }, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' }
        )
        const url = `${window.location.origin}/share/${userId}/${fallbackId}`
        setShareUrl(url)
      } else {
        const url = `${window.location.origin}/share/${shareId}`
        setShareUrl(url)
      }
    } catch (e) {
      console.warn('[share] error:', e)
    }
    setLoading(false)
  }

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-text-muted hover:text-text-secondary hover:border-accent/40 transition-colors"
        title="Share dashboard"
      >
        <Share2 size={13} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl p-4 shadow-2xl z-50">
            <h4 className="text-sm font-semibold text-text-primary mb-1">Share Dashboard</h4>
            <p className="text-xs text-text-muted mb-3">
              Generate a read-only link anyone can view without logging in.
            </p>

            {!shareUrl ? (
              <button
                onClick={handleShare}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 w-full justify-center"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-xs text-text-primary bg-transparent outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded text-text-muted hover:text-accent transition-colors shrink-0"
                    title="Copy link"
                  >
                    {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-text-muted">
                  Anyone with this link can view your dashboard. No login required.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
