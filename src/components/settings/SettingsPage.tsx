import type { AppData } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ColorPicker } from '@/components/ui/ColorPicker'
import {
  exportData, importData,
  resetSnapshots, resetAccounts, resetBudget, resetGoals, resetIncome, nukeAllData,
} from '@/lib/store'
import { getStorageKey } from '@/lib/store'
import { ThemeEditor } from '@/components/ui/ThemeEditor'
import { useState } from 'react'
import { useThemeMode, type ThemeMode } from '@/hooks/useThemeMode'
import { Sun, Moon, Monitor } from 'lucide-react'
import { CloudSyncPanel } from '@/components/ui/CloudSyncPanel'
import { BackgroundEditor } from '@/components/ui/BackgroundEditor'

interface Props {
  data: AppData
  prefs: ChartPrefs
  setAccountColor: (id: string, color: string) => void
  setLabelColor: (label: string, color: string) => void
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
  resetPrefs: () => void
  userId?: string
  dashboardId?: string
  dashboards?: import('@/data/types').Dashboard[]
  onDataLoaded?: (data: AppData) => void
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function dateSuffix() {
  return new Date().toISOString().slice(0, 10)
}

function snapshotsToCsv(data: AppData): string {
  const accounts = data.accounts.filter(a => a.isActive)
  const header = ['Date', 'Paycheck', 'Credit Score', ...accounts.map(a => a.name)]
  const rows = data.snapshots.map(s => {
    const date = new Date(s.timestamp).toLocaleDateString('en-US')
    const paycheck = s.paycheckAmount?.toString() ?? ''
    const score = s.creditScore?.toString() ?? ''
    const balances = accounts.map(a => (s.balances[a.id] ?? 0).toString())
    return [date, paycheck, score, ...balances]
  })
  return [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}

function budgetToCsv(data: AppData): string {
  const header = ['Name', 'Amount', 'Tier', 'Category']
  const rows = data.budgetItems.map(b => [b.name, b.amount.toString(), b.tier, b.category])
  return [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}

function accountsToCsv(data: AppData): string {
  const header = ['Name', 'Institution', 'Type', 'Category', 'Active', 'Credit Limit']
  const rows = data.accounts.map(a => [
    a.name, a.institution, a.type, a.category,
    a.isActive ? 'Yes' : 'No', a.creditLimit?.toString() ?? '',
  ])
  return [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}

export default function SettingsPage({ data, prefs, setAccountColor, setLabelColor, onUpdatePrefs, resetPrefs, userId, dashboardId, dashboards, onDataLoaded }: Props) {
  const [themeMode, setThemeMode] = useThemeMode()
  const [statusMsg, setStatusMsg] = useState('')
  const [importPreview, setImportPreview] = useState<AppData | null>(null)
  const [nukeConfirm, setNukeConfirm] = useState('')
  const [categoryConfirm, setCategoryConfirm] = useState<string | null>(null)

  function showStatus(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(''), 3000)
  }

  // ── Export handlers ──
  const handleExportJSON = () => {
    downloadFile(exportData(), `money-app-backup-${dateSuffix()}.json`, 'application/json')
    showStatus('JSON exported!')
  }

  const handleExportSnapshotsCSV = () => {
    downloadFile(snapshotsToCsv(data), `money-app-snapshots-${dateSuffix()}.csv`, 'text/csv')
    showStatus('Snapshots CSV exported!')
  }

  const handleExportBudgetCSV = () => {
    downloadFile(budgetToCsv(data), `money-app-budget-${dateSuffix()}.csv`, 'text/csv')
    showStatus('Budget CSV exported!')
  }

  const handleExportAccountsCSV = () => {
    downloadFile(accountsToCsv(data), `money-app-accounts-${dateSuffix()}.csv`, 'text/csv')
    showStatus('Accounts CSV exported!')
  }

  // ── Import handler ──
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as AppData
          setImportPreview(parsed)
        } catch {
          showStatus('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleImportConfirm = () => {
    if (!importPreview) return
    importData(JSON.stringify(importPreview))
    setImportPreview(null)
    window.location.reload()
  }

  // ── Category reset handlers ──
  const categoryResets: Record<string, { label: string; description: string; fn: () => void }> = {
    snapshots: {
      label: 'Snapshots',
      description: `${data.snapshots.length} snapshots`,
      fn: () => { resetSnapshots(); window.location.reload() },
    },
    accounts: {
      label: 'Accounts',
      description: `${data.accounts.length} accounts`,
      fn: () => { resetAccounts(); window.location.reload() },
    },
    budget: {
      label: 'Budget',
      description: `${data.budgetItems.length} items`,
      fn: () => { resetBudget(); window.location.reload() },
    },
    goals: {
      label: 'Goals',
      description: `${data.goals.length} goals`,
      fn: () => { resetGoals(); window.location.reload() },
    },
    income: {
      label: 'Income & Comp',
      description: `salary, deductions, allocations`,
      fn: () => { resetIncome(); window.location.reload() },
    },
  }

  const handleNukeAll = () => {
    if (nukeConfirm !== 'DELETE') return
    nukeAllData()
    window.location.reload()
  }

  const activeAccounts = data.accounts.filter(a => a.isActive)
  const categories = [...new Set(data.budgetItems.map(b => b.category))]

  return (
    <div>
      <PageHeader icon="⚙️" title="Settings" titleKey="settings" subtitle="Customize your dashboard, colors, and preferences" />

      {/* Appearance */}
      <Card className="mb-6">
        <CardTitle>Appearance</CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Theme</p>
              <p className="text-xs text-text-muted">Switch between dark, light, or system preference</p>
            </div>
            <div className="flex gap-1 bg-background rounded-lg p-0.5 border border-border">
              {([
                { mode: 'dark' as ThemeMode, icon: <Moon size={14} />, label: 'Dark' },
                { mode: 'light' as ThemeMode, icon: <Sun size={14} />, label: 'Light' },
                { mode: 'system' as ThemeMode, icon: <Monitor size={14} />, label: 'System' },
              ]).map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    themeMode === mode
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                  title={label}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Background Image */}
      <BackgroundEditor />

      {/* Cloud Sync */}
      <CloudSyncPanel userId={userId} dashboardId={dashboardId ?? 'default'} dashboards={dashboards ?? []} data={data} onDataLoaded={onDataLoaded ?? (() => {})} />

      {/* Chart Preferences */}
      <Card className="mb-6">
        <CardTitle>Chart Preferences</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Line Style</p>
              <p className="text-xs text-text-muted">Smooth curves or sharp angles</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdatePrefs({ curveType: 'smooth' })}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  prefs.curveType === 'smooth' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted'
                }`}
              >Smooth</button>
              <button
                onClick={() => onUpdatePrefs({ curveType: 'sharp' })}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  prefs.curveType === 'sharp' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted'
                }`}
              >Sharp</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Data Points</p>
              <p className="text-xs text-text-muted">Show circles on chart data points</p>
            </div>
            <button
              onClick={() => onUpdatePrefs({ showDots: !prefs.showDots })}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                prefs.showDots ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted'
              }`}
            >{prefs.showDots ? 'On' : 'Off'}</button>
          </div>
        </div>
      </Card>

      {/* Account Colors */}
      <Card className="mb-6">
        <CardTitle>Account Colors</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Click any account to change its color across all charts</p>
        <div className="grid grid-cols-2 gap-3">
          {activeAccounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-2">
              <ColorPicker
                currentColor={prefs.accountColors[acc.id] || '#6b7280'}
                onColorChange={(color) => setAccountColor(acc.id, color)}
                label={acc.name}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Category / Label Colors */}
      <Card className="mb-6">
        <CardTitle>Category Colors</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Colors used for budget categories and labels</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-2">
              <ColorPicker
                currentColor={prefs.labelColors[cat] || '#8888a0'}
                onColorChange={(color) => setLabelColor(cat, color)}
                label={cat}
              />
            </div>
          ))}
          {['cash', 'investment', 'debt'].map(cat => (
            <div key={cat} className="flex items-center gap-2">
              <ColorPicker
                currentColor={prefs.labelColors[cat] || '#8888a0'}
                onColorChange={(color) => setLabelColor(cat, color)}
                label={cat.charAt(0).toUpperCase() + cat.slice(1) + ' (category)'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Reset Colors */}
      <Card className="mb-6">
        <CardTitle>Reset Colors</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Restore all colors and chart settings to defaults</p>
        <button
          onClick={resetPrefs}
          className="px-4 py-2 bg-red/10 text-red border border-red/30 rounded-lg text-sm hover:bg-red/20 transition-colors"
        >
          Reset All to Defaults
        </button>
      </Card>

      {/* Theme Editor */}
      <div className="mb-6">
        <ThemeEditor />
      </div>

      {/* ── Export Data ── */}
      <Card className="mb-6">
        <CardTitle>Export Data</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Download your data as JSON (full backup) or CSV (spreadsheet-friendly)</p>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary mb-2 font-medium">Full Backup (JSON)</p>
            <button onClick={handleExportJSON}
              className="px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/20 transition-colors">
              Export JSON
            </button>
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-2 font-medium">Spreadsheet Exports (CSV)</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportSnapshotsCSV}
                className="px-3 py-1.5 bg-surface-hover text-text-secondary border border-border rounded-lg text-xs hover:text-text-primary transition-colors">
                Snapshots CSV
              </button>
              <button onClick={handleExportBudgetCSV}
                className="px-3 py-1.5 bg-surface-hover text-text-secondary border border-border rounded-lg text-xs hover:text-text-primary transition-colors">
                Budget CSV
              </button>
              <button onClick={handleExportAccountsCSV}
                className="px-3 py-1.5 bg-surface-hover text-text-secondary border border-border rounded-lg text-xs hover:text-text-primary transition-colors">
                Accounts CSV
              </button>
            </div>
          </div>
        </div>

        {statusMsg && <p className="text-xs text-green mt-3">{statusMsg}</p>}
      </Card>

      {/* ── Import Data ── */}
      <Card className="mb-6">
        <CardTitle>Import Data</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Restore from a JSON backup or load a template. This replaces all current data.</p>

        {!importPreview ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-secondary mb-2 font-medium">From File</p>
              <button onClick={handleImportClick}
                className="px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-lg text-sm hover:text-text-primary transition-colors">
                Choose JSON File
              </button>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-2 font-medium">From Template</p>
              <p className="text-xs text-text-muted mb-2">Pre-built data sets you can load instantly. Your current data will be replaced.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/templates/thanh-2026.json')
                      const parsed = await res.json()
                      setImportPreview(parsed)
                    } catch { showStatus('Failed to load template') }
                  }}
                  className="px-3 py-1.5 bg-purple/10 text-purple border border-purple/30 rounded-lg text-xs hover:bg-purple/20 transition-colors"
                >
                  Thanh's 2026 Data ($175K comp, 21 accounts)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-amber/30 bg-amber/5 space-y-3">
            <p className="text-sm text-amber font-medium">Import Preview</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-text-secondary">
              <div>{importPreview.accounts?.length ?? 0} accounts</div>
              <div>{importPreview.snapshots?.length ?? 0} snapshots</div>
              <div>{importPreview.budgetItems?.length ?? 0} budget items</div>
              <div>{importPreview.goals?.length ?? 0} goals</div>
              <div>{importPreview.deductions?.length ?? 0} deductions</div>
              <div>{importPreview.allocations?.length ?? 0} allocations</div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleImportConfirm}
                className="px-4 py-2 bg-amber/10 text-amber border border-amber/30 rounded-lg text-sm hover:bg-amber/20 transition-colors">
                Confirm Import
              </button>
              <button onClick={() => setImportPreview(null)}
                className="px-4 py-2 border border-border text-text-muted rounded-lg text-sm hover:text-text-secondary transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Reset Data ── */}
      <Card className="mb-6">
        <CardTitle>Reset Data</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Clear specific categories or wipe everything. This cannot be undone — export first!</p>

        {/* Per-category resets */}
        <div className="space-y-2 mb-6">
          <p className="text-xs text-text-secondary font-medium mb-2">Reset by Category</p>
          {Object.entries(categoryResets).map(([key, { label, description, fn }]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{description}</p>
              </div>
              {categoryConfirm === key ? (
                <div className="flex gap-2">
                  <button onClick={fn}
                    className="px-3 py-1.5 bg-red/10 text-red border border-red/30 rounded-lg text-xs hover:bg-red/20 transition-colors">
                    Yes, Reset
                  </button>
                  <button onClick={() => setCategoryConfirm(null)}
                    className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setCategoryConfirm(key)}
                  className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-red hover:border-red/30 transition-colors">
                  Reset
                </button>
              )}
            </div>
          ))}
        </div>

        {/* System-wide nuke */}
        <div className="p-4 rounded-lg border border-red/30 bg-red/5">
          <p className="text-sm text-red font-medium mb-1">Delete All Data & Start Over</p>
          <p className="text-xs text-text-muted mb-3">
            This permanently deletes all your data and returns you to the setup wizard. Type DELETE to confirm.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nukeConfirm}
              onChange={e => setNukeConfirm(e.target.value)}
              placeholder='Type "DELETE"'
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary w-36"
            />
            <button
              onClick={handleNukeAll}
              disabled={nukeConfirm !== 'DELETE'}
              className="px-4 py-1.5 bg-red text-white rounded-lg text-sm hover:bg-red/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Card>

      {/* Preview & Testing */}
      <Card>
        <CardTitle>Preview & Testing</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Test the new-user experience or share a fresh link</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary mb-1">Preview as a new user (opens wizard in a new tab):</p>
            <a
              href={`${window.location.origin}?fresh=true`}
              target="_blank"
              rel="noopener"
              className="inline-flex px-4 py-2 bg-amber/10 text-amber border border-amber/30 rounded-lg text-sm hover:bg-amber/20 transition-colors"
            >
              Open Fresh Preview
            </a>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Share this link for others to try the wizard:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-text-muted font-mono truncate">
                {window.location.origin}?fresh=true
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}?fresh=true`)
                  showStatus('Link copied!')
                }}
                className="px-3 py-2 border border-border rounded-lg text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Re-run the setup wizard (keeps your existing data):</p>
            <button
              onClick={() => {
                localStorage.removeItem(getStorageKey('wizard-done'))
                window.location.reload()
              }}
              className="px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/20 transition-colors"
            >
              Re-run Wizard
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
