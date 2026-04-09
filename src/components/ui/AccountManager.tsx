import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { Account } from '@/data/types'

interface Props {
  accounts: Account[]
  category: Account['category']
  onAdd: (account: Account) => void
  onRemove: (id: string) => void
  onToggleActive: (id: string) => void
}

const TYPE_OPTIONS: Record<Account['category'], Account['type'][]> = {
  cash: ['checking', 'savings', 'other'],
  investment: ['investment', 'retirement', 'brokerage', 'other'],
  debt: ['credit', 'other'],
}

export function AccountManager({ accounts, category, onAdd, onRemove, onToggleActive }: Props) {
  const filtered = accounts.filter(a => a.category === category)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [type, setType] = useState<Account['type']>(TYPE_OPTIONS[category][0])
  const [creditLimit, setCreditLimit] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    const id = `${category}-${Date.now()}`
    const acc: Account = {
      id,
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      type,
      category,
      isActive: true,
      ...(category === 'debt' && creditLimit ? { creditLimit: parseFloat(creditLimit) } : {}),
    }
    onAdd(acc)
    setName('')
    setInstitution('')
    setCreditLimit('')
    setShowForm(false)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            showForm
              ? 'border-accent bg-accent/10 text-accent'
              : filtered.length === 0
              ? 'border-accent/40 text-accent hover:bg-accent/10'
              : 'border-border text-text-muted hover:text-text-secondary hover:border-accent/30'
          }`}
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Close' : filtered.length === 0 ? 'Add Your First Account' : 'Manage Accounts'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-3 mb-3 space-y-3">
          {/* Existing accounts list */}
          <div className="space-y-1">
            {filtered.map(acc => (
              <div key={acc.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-surface-hover">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={acc.isActive}
                    onChange={() => onToggleActive(acc.id)}
                    className="rounded"
                  />
                  <span className={acc.isActive ? 'text-text-primary' : 'text-text-muted line-through'}>
                    {acc.name}
                  </span>
                  <span className="text-text-muted">({acc.institution})</span>
                </label>
                <button
                  onClick={() => onRemove(acc.id)}
                  className="text-text-muted hover:text-red transition-colors p-1"
                  title="Remove account"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new account form */}
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Add New Account</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Account name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-2 py-1.5 bg-background border border-border rounded text-xs text-text-primary placeholder:text-text-muted/50 placeholder:italic"
              />
              <input
                type="text"
                placeholder="Institution"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="px-2 py-1.5 bg-background border border-border rounded text-xs text-text-primary"
              />
              <select
                value={type}
                onChange={e => setType(e.target.value as Account['type'])}
                className="px-2 py-1.5 bg-background border border-border rounded text-xs text-text-primary"
              >
                {TYPE_OPTIONS[category].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              {category === 'debt' && (
                <input
                  type="number"
                  placeholder="Credit limit"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  className="px-2 py-1.5 bg-background border border-border rounded text-xs text-text-primary"
                />
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-[var(--page-accent,#6366f1)]/20 text-[var(--page-accent,#6366f1)] border border-[var(--page-accent,#6366f1)]/30 hover:bg-[var(--page-accent,#6366f1)]/30 disabled:opacity-30 transition-colors"
            >
              <Plus size={12} /> Add Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
