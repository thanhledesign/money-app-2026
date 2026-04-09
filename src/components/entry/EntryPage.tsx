import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AppData, Snapshot } from '@/data/types'
import type { Account } from '@/data/types'
import {
  getLatestSnapshot,
  getActiveAccounts,
  getSnapshotDiff,
  formatCurrency,
  formatDate,
} from '@/lib/calculations'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { UVPBadge } from '@/components/ui/UVPBadge'
import { AccountManager } from '@/components/ui/AccountManager'
import { PageTheme } from '@/components/ui/PageTheme'
import { NumberInput } from '@/components/ui/NumberInput'

interface Props {
  data: AppData
  addSnapshot: (s: Snapshot) => void
  deleteSnapshot: (id: string) => void
  addAccount: (a: Account) => void
  updateAccounts: (a: Account[]) => void
}

type FormValues = {
  paycheckAmount: string
  creditScore: string
  balances: Record<string, string>
}

function buildInitialValues(latest: Snapshot | null, activeAccountIds: string[]): FormValues {
  const balances: Record<string, string> = {}
  for (const id of activeAccountIds) {
    const prev = latest?.balances[id]
    balances[id] = prev !== undefined ? String(prev) : ''
  }
  return {
    paycheckAmount: latest?.paycheckAmount !== null && latest?.paycheckAmount !== undefined
      ? String(latest.paycheckAmount)
      : '',
    creditScore: latest?.creditScore !== null && latest?.creditScore !== undefined
      ? String(latest.creditScore)
      : '',
    balances,
  }
}

const CATEGORY_CONFIG: { key: 'cash' | 'investment' | 'debt'; label: string; emoji: string }[] = [
  { key: 'cash', label: 'Cash Accounts', emoji: '💰' },
  { key: 'investment', label: 'Investment Accounts', emoji: '📈' },
  { key: 'debt', label: 'Debt', emoji: '💀' },
]

export default function EntryPage({ data, addSnapshot, deleteSnapshot, addAccount, updateAccounts }: Props) {
  const latest = getLatestSnapshot(data)
  const activeAccounts = getActiveAccounts(data)
  const activeAccountIds = activeAccounts.map(a => a.id)

  const [values, setValues] = useState<FormValues>(() =>
    buildInitialValues(latest, activeAccountIds)
  )
  const [submittedSnapshot, setSubmittedSnapshot] = useState<Snapshot | null>(null)

  function setBalance(id: string, raw: string) {
    setValues(v => ({ ...v, balances: { ...v.balances, [id]: raw } }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const balances: Record<string, number> = {}
    for (const id of activeAccountIds) {
      const parsed = parseFloat(values.balances[id])
      balances[id] = isNaN(parsed) ? 0 : parsed
    }

    const newSnapshot: Snapshot = {
      id: `s-${Date.now()}`,
      timestamp: new Date().toISOString(),
      paycheckAmount: values.paycheckAmount !== '' ? parseFloat(values.paycheckAmount) : null,
      creditScore: values.creditScore !== '' ? parseFloat(values.creditScore) : null,
      balances,
    }

    addSnapshot(newSnapshot)
    setSubmittedSnapshot(newSnapshot)

    // First snapshot after wizard? Redirect to dashboard with success message
    if (localStorage.getItem('money-app-first-snapshot-pending') === 'true') {
      localStorage.removeItem('money-app-first-snapshot-pending')
      localStorage.setItem('money-app-first-snapshot-done', 'true')
      navigate('/')
      return
    }
  }

  const navigate = useNavigate()
  const isFirstSnapshot = localStorage.getItem('money-app-first-snapshot-pending') === 'true'

  const diff = submittedSnapshot && latest ? getSnapshotDiff(submittedSnapshot, latest, data) : null

  return (
    <PageTheme page="enter">
    <div>
      <PageHeader
        icon="📸"
        title="Add Snapshot"
        subtitle="Record a new financial snapshot"
      />

      <div className="mb-4">
        <UVPBadge label="Manual-First" description="Snapshot-based entry means you see your complete picture every time. No laggy bank syncs, no miscategorized transactions." />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 2-col grid on desktop: form left, history right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-10">
          <div className="space-y-6">
            {/* Paycheck & Credit Score */}
            <Card>
              <CardTitle className="mb-4">📊 General</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <FieldRow
                  label="Paycheck Amount"
                  value={values.paycheckAmount}
                  onChange={v => setValues(prev => ({ ...prev, paycheckAmount: v }))}
                  prevValue={latest?.paycheckAmount ?? null}
                  isCurrency
                />
                <FieldRow
                  label="Credit Score"
                  value={values.creditScore}
                  onChange={v => setValues(prev => ({ ...prev, creditScore: v }))}
                  prevValue={latest?.creditScore ?? null}
                  isCurrency={false}
                  placeholder="e.g. 780"
                />
              </div>
            </Card>

            {/* Account groups */}
            {CATEGORY_CONFIG.map(({ key, label, emoji }) => {
              const accounts = activeAccounts.filter(a => a.category === key)
              return (
                <Card key={key}>
                  <CardTitle className="mb-4">{emoji} {label}</CardTitle>
                  {accounts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mb-4">
                      {accounts.map(acc => (
                        <FieldRow
                          key={acc.id}
                          label={acc.name}
                          sublabel={acc.institution}
                          value={values.balances[acc.id] ?? ''}
                          onChange={v => setBalance(acc.id, v)}
                          prevValue={latest?.balances[acc.id] ?? null}
                          isCurrency
                        />
                      ))}
                    </div>
                  )}
                  <AccountManager
                    accounts={data.accounts}
                    category={key}
                    onAdd={addAccount}
                    onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
                    onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
                  />
                </Card>
              )
            })}

            <div className="h-16 sm:hidden" />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors hidden sm:block"
            >
              Submit Snapshot
            </button>
            <button
              type="submit"
              className="sm:hidden fixed bottom-0 left-0 right-0 py-4 bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors z-40"
            >
              Submit Snapshot
            </button>
          </div>

          {/* Right sidebar: diff + history (on desktop) */}
          <div className="space-y-5">
            {/* Snapshot Diff */}
            {submittedSnapshot && (
              <Card>
                <div className="mb-4">
                  <CardTitle>Snapshot Diff</CardTitle>
                  <p className="text-xs text-text-muted mt-1">
                    Compared to previous snapshot
                    {latest ? ` from ${formatDate(latest.timestamp)}` : ''}
                  </p>
                </div>

                {diff && diff.length > 0 ? (
                  <div className="space-y-2">
                    {diff.map(change => {
                      const isUp = change.diff > 0
                      const colorClass = isUp ? 'text-green' : 'text-red'
                      const sign = isUp ? '+' : ''
                      return (
                        <div
                          key={change.accountId}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-text-primary truncate">{change.name}</span>
                          <span className={`font-medium text-sm tabular-nums ${colorClass} shrink-0`}>
                            {sign}{formatCurrency(change.diff)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    {latest ? 'No changes detected from previous snapshot.' : 'This is your first snapshot.'}
                  </p>
                )}
              </Card>
            )}
            {/* Snapshot History */}
            {data.snapshots.length > 0 && (
              <Card>
                <CardTitle className="mb-3">Snapshot History</CardTitle>
                <p className="text-xs text-text-muted mb-3">{data.snapshots.length} snapshots recorded</p>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {[...data.snapshots].reverse().map(s => (
                    <SwipeToDelete key={s.id} onDelete={() => deleteSnapshot(s.id)}>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-hover group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary">{formatDate(s.timestamp)}</p>
                          <p className="text-[10px] text-text-muted">
                            {s.paycheckAmount ? `Paycheck: ${formatCurrency(s.paycheckAmount)}` : 'No paycheck'}
                            {s.creditScore ? ` | Score: ${s.creditScore}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete snapshot from ${formatDate(s.timestamp)}?`)) {
                              deleteSnapshot(s.id)
                            }
                          }}
                          className="text-text-muted hover:text-red opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-1"
                          title="Delete snapshot"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </SwipeToDelete>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
    </PageTheme>
  )
}

/* ------------------------------------------------------------------ */
/* Field row sub-component                                             */
/* ------------------------------------------------------------------ */

interface FieldRowProps {
  label: string
  sublabel?: string
  value: string
  onChange: (v: string) => void
  prevValue: number | null
  isCurrency: boolean
  placeholder?: string
}

function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    swiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx > 0) return // Only swipe left
    currentX.current = dx
    if (Math.abs(dx) > 10) swiping.current = true
    if (ref.current) {
      ref.current.style.transform = `translateX(${Math.max(dx, -100)}px)`
    }
  }

  const handleTouchEnd = () => {
    if (ref.current) {
      if (currentX.current < -80) {
        ref.current.style.transform = 'translateX(-100px)'
        // Show delete zone
        setTimeout(() => {
          if (window.confirm('Delete this snapshot?')) {
            onDelete()
          } else if (ref.current) {
            ref.current.style.transition = 'transform 0.2s'
            ref.current.style.transform = 'translateX(0)'
            setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 200)
          }
        }, 50)
      } else {
        ref.current.style.transition = 'transform 0.2s'
        ref.current.style.transform = 'translateX(0)'
        setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 200)
      }
    }
    currentX.current = 0
  }

  return (
    <div className="relative overflow-hidden rounded">
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-red flex items-center justify-center text-white text-xs font-medium">
        Delete
      </div>
      <div
        ref={ref}
        className="relative bg-surface z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

function FieldRow({ label, sublabel, value, onChange, prevValue, isCurrency, placeholder }: FieldRowProps) {
  const prevDisplay =
    prevValue !== null
      ? isCurrency
        ? formatCurrency(prevValue)
        : String(prevValue)
      : null

  const liveDiff = (() => {
    const curr = parseFloat(value)
    if (isNaN(curr) || prevValue === null) return null
    const d = curr - prevValue
    if (Math.abs(d) < 0.01) return null
    const sign = d > 0 ? '+' : ''
    const color = d > 0 ? 'text-green' : 'text-red'
    return (
      <span className={`text-[10px] tabular-nums font-medium ${color}`}>
        {sign}{isCurrency ? formatCurrency(d) : d.toFixed(0)}
      </span>
    )
  })()

  return (
    <div className="space-y-1">
      {/* Label row */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-text-primary truncate">{label}</p>
          {sublabel && <p className="text-xs text-text-muted truncate">{sublabel}</p>}
        </div>
        {prevDisplay !== null && (
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-xs text-text-muted tabular-nums">{prevDisplay}</span>
            {liveDiff}
          </div>
        )}
      </div>
      {/* Input row */}
      <NumberInput
        value={value === '' ? 0 : parseFloat(value) || 0}
        onChange={v => onChange(String(v))}
        isCurrency={isCurrency}
        isPercent={false}
        label={label}
        className="w-full"
      />
    </div>
  )
}
