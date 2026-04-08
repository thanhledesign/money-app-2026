import type { AppData } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { exportData, importData } from '@/lib/store'
import { ThemeEditor } from '@/components/ui/ThemeEditor'
import { useState } from 'react'

interface Props {
  data: AppData
  prefs: ChartPrefs
  setAccountColor: (id: string, color: string) => void
  setLabelColor: (label: string, color: string) => void
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
  resetPrefs: () => void
}

export default function SettingsPage({ data, prefs, setAccountColor, setLabelColor, onUpdatePrefs, resetPrefs }: Props) {
  const [exportMsg, setExportMsg] = useState('')

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-app-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('Exported!')
    setTimeout(() => setExportMsg(''), 2000)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          importData(reader.result as string)
          window.location.reload()
        } catch { setExportMsg('Invalid file') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const activeAccounts = data.accounts.filter(a => a.isActive)
  const categories = [...new Set(data.budgetItems.map(b => b.category))]

  return (
    <div>
      <PageHeader icon="⚙️" title="Settings" subtitle="Customize your dashboard, colors, and preferences" />

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

      {/* Reset */}
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
      <ThemeEditor />

      {/* Data Management */}
      <Card>
        <CardTitle>Data Management</CardTitle>
        <div className="mt-4 flex gap-3">
          <button onClick={handleExport}
            className="px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/20 transition-colors">
            Export Data
          </button>
          <button onClick={handleImport}
            className="px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-lg text-sm hover:text-text-primary transition-colors">
            Import Data
          </button>
          {exportMsg && <span className="text-xs text-green self-center">{exportMsg}</span>}
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
                  setExportMsg('Link copied!')
                  setTimeout(() => setExportMsg(''), 2000)
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
                localStorage.removeItem('money-app-wizard-done')
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
