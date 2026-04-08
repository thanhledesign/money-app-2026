import { useState } from 'react'
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
  }

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
        {/* Paycheck & Credit Score */}
        <Card>
          <CardTitle className="mb-4">📊 General</CardTitle>
          <div className="space-y-3">
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
                <div className="space-y-3 mb-4">
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

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors"
        >
          Submit Snapshot
        </button>
      </form>

      {/* Snapshot Diff */}
      {submittedSnapshot && (
        <div className="mt-6">
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
                      <span className="text-sm text-text-primary">{change.name}</span>
                      <div className="flex items-center gap-4 text-sm tabular-nums">
                        <span className="text-text-muted">{formatCurrency(change.prev)}</span>
                        <span className="text-text-secondary">→</span>
                        <span className="text-text-primary">{formatCurrency(change.curr)}</span>
                        <span className={`font-medium ${colorClass} min-w-[80px] text-right`}>
                          {sign}{formatCurrency(change.diff)}
                        </span>
                      </div>
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
        </div>
      )}
      {/* Snapshot History */}
      {data.snapshots.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardTitle className="mb-3">Snapshot History</CardTitle>
            <p className="text-xs text-text-muted mb-3">{data.snapshots.length} snapshots recorded</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {[...data.snapshots].reverse().map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-hover group">
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
              ))}
            </div>
          </Card>
        </div>
      )}
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
        className="w-full md:max-w-xs"
      />
    </div>
  )
}
