import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { Eye, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AppData } from '@/data/types'
import { Card, CardTitle, KPICard } from '@/components/ui/Card'
import { CHART_TOOLTIP, AXIS_TICK, VIVID } from '@/components/ui/chartConstants'
import * as calc from '@/lib/calculations'

interface SharedRecord {
  name: string
  data: AppData
  created_at: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function SharedDashboardPage() {
  const { shareId } = useParams<{ shareId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<SharedRecord | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!shareId) {
        setError('Invalid share link.')
        setLoading(false)
        return
      }
      if (!isSupabaseConfigured() || !supabase) {
        setError('Cloud storage is not configured for this app.')
        setLoading(false)
        return
      }
      try {
        const { data, error: dbError } = await supabase
          .from('shared_snapshots')
          .select('name, data, created_at')
          .eq('id', shareId)
          .maybeSingle()

        if (cancelled) return
        if (dbError) {
          setError('Could not load shared dashboard.')
          setLoading(false)
          return
        }
        if (!data) {
          setError('This shared dashboard no longer exists or the link is invalid.')
          setLoading(false)
          return
        }
        setRecord(data as SharedRecord)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError('Something went wrong loading this dashboard.')
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading shared dashboard…
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <AlertCircle size={32} className="mx-auto text-amber mb-3" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Dashboard not available</h2>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors"
          >
            Go to Money App <ExternalLink size={13} />
          </Link>
        </Card>
      </div>
    )
  }

  const data = record.data
  const latest = calc.getLatestSnapshot(data)
  const prev = calc.getPreviousSnapshot(data)

  const netWorth = latest ? calc.getNetWorth(latest, data) : 0
  const cash = latest ? calc.getTotalCash(latest, data) : 0
  const investments = latest ? calc.getTotalInvestments(latest, data) : 0
  const debt = latest ? calc.getTotalDebt(latest, data) : 0

  const prevNetWorth = prev ? calc.getNetWorth(prev, data) : 0
  const netWorthDelta = netWorth - prevNetWorth
  const netWorthDeltaPct = prevNetWorth !== 0 ? (netWorthDelta / Math.abs(prevNetWorth)) * 100 : 0

  // Build net worth chart series
  const series = data.snapshots.map(s => ({
    month: formatMonth(s.timestamp),
    netWorth: calc.getNetWorth(s, data),
    cash: calc.getTotalCash(s, data),
    investments: calc.getTotalInvestments(s, data),
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Background layers — match main app */}
      <div className="fixed inset-0 z-0 bg-background" />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-6 lg:px-6 lg:py-8">
        {/* Read-only banner */}
        <div className="mb-5 px-4 py-2.5 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-accent">
            <Eye size={14} />
            <span className="font-medium">Read-only shared view</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              Shared {new Date(record.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Open Money App <ExternalLink size={11} />
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary tracking-tight">
            {record.name}
          </h1>
          {latest && (
            <p className="text-xs text-text-muted mt-1">
              As of {new Date(latest.timestamp).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}
        </div>

        {!latest ? (
          <Card>
            <p className="text-sm text-text-muted text-center py-8">
              This shared dashboard has no snapshots yet.
            </p>
          </Card>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <KPICard
                label="Net Worth"
                value={formatCurrency(netWorth)}
                trend={prev ? (netWorthDelta >= 0 ? 'up' : 'down') : undefined}
                trendValue={prev ? `${netWorthDeltaPct.toFixed(1)}%` : undefined}
              />
              <KPICard label="Cash" value={formatCurrency(cash)} />
              <KPICard label="Investments" value={formatCurrency(investments)} />
              <KPICard label="Debt" value={formatCurrency(Math.abs(debt))} />
            </div>

            {/* Net Worth Chart */}
            {series.length > 1 && (
              <Card className="mb-4">
                <CardTitle>Net Worth Over Time</CardTitle>
                <div className="h-[260px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={VIVID.netWorth} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={VIVID.netWorth} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                      <Area type="monotone" dataKey="netWorth" stroke={VIVID.netWorth} strokeWidth={2} fill="url(#nwFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Cash vs Investments */}
            {series.length > 1 && (
              <Card className="mb-4">
                <CardTitle>Cash vs. Investments</CardTitle>
                <div className="h-[240px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                      <Line type="monotone" dataKey="cash" stroke={VIVID.cash} strokeWidth={2} dot={false} name="Cash" />
                      <Line type="monotone" dataKey="investments" stroke={VIVID.investments} strokeWidth={2} dot={false} name="Investments" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-[11px] text-text-muted">
            Made with <Link to="/" className="text-accent hover:text-accent-hover">Money App 2026</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
