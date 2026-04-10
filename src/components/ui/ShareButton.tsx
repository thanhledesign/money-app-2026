import { useState } from 'react'
import { Share2, Copy, Check, Link2, Loader2, AlertCircle } from 'lucide-react'
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isSupabaseConfigured() || !userId) return null

  async function handleShare() {
    if (!supabase || !userId) return
    setLoading(true)
    setErrorMsg(null)
    try {
      // Compact, URL-safe share ID
      const shareId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

      const { error } = await supabase
        .from('shared_snapshots')
        .upsert({
          id: shareId,
          user_id: userId,
          name: dashboardName,
          data,
          created_at: new Date().toISOString(),
        })

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setErrorMsg('Share table missing. Run supabase-share-migration.sql in your Supabase SQL Editor first.')
        } else {
          setErrorMsg(error.message || 'Could not create share link.')
        }
        setLoading(false)
        return
      }

      setShareUrl(`${window.location.origin}/share/${shareId}`)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Unknown error creating share link.')
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
        aria-label="Share dashboard"
      >
        <Share2 size={13} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl z-50">
            <h4 className="text-sm font-semibold text-text-primary mb-1">Share Dashboard</h4>
            <p className="text-xs text-text-muted mb-3">
              Generate a read-only link anyone can view without logging in.
            </p>

            {errorMsg && (
              <div className="flex items-start gap-2 mb-3 p-2 bg-red/10 border border-red/30 rounded-lg text-[11px] text-red">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

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
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded text-text-muted hover:text-accent transition-colors shrink-0"
                    title="Copy link"
                    aria-label="Copy share link"
                  >
                    {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-text-muted">
                  Anyone with this link can view a read-only snapshot of this dashboard. No login required.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
