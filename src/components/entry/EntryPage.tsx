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

export default function EntryPage({ data, addSnapshot, addAccount, updateAccounts }: Props) {
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
        icon="+"
        title="Enter Data"
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
              <AccountManager
                accounts={data.accounts}
                category={key}
                onAdd={addAccount}
                onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
                onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
              />
              {accounts.length > 0 && (
                <div className="space-y-3">
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

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{label}</p>
        {sublabel && <p className="text-xs text-text-muted truncate">{sublabel}</p>}
      </div>

      {/* Input */}
      <NumberInput
        value={value === '' ? 0 : parseFloat(value) || 0}
        onChange={v => onChange(String(v))}
        isCurrency={isCurrency}
        isPercent={false}
        label={label}
        className="w-36"
      />

      {/* Previous value */}
      <div className="w-28 text-right">
        {prevDisplay !== null ? (
          <span className="text-xs text-text-muted tabular-nums">{prevDisplay}</span>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
      </div>
    </div>
  )
}
