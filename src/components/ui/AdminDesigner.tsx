import { useState, useCallback, useRef, useEffect } from 'react'
import { Palette, X, GripVertical, RotateCcw, Copy, Eye, EyeOff } from 'lucide-react'

const STORAGE_KEY = 'money-app-admin-overrides'

interface Override {
  selector: string
  property: string
  value: string
}

function loadOverrides(): Override[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveOverrides(overrides: Override[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

function applyOverrides(overrides: Override[]): void {
  let el = document.getElementById('admin-designer-overrides')
  if (!el) {
    el = document.createElement('style')
    el.id = 'admin-designer-overrides'
    document.head.appendChild(el)
  }
  const css = overrides.map(o => `${o.selector} { ${o.property}: ${o.value} !important; }`).join('\n')
  el.textContent = css
}

const QUICK_VARS = [
  { label: 'Border Radius', prop: '--admin-radius', cssTarget: 'border-radius', default: '12px', selector: '.rounded-xl' },
  { label: 'Card Radius', prop: '--admin-card-radius', cssTarget: 'border-radius', default: '12px', selector: '.rounded-xl' },
  { label: 'Font Size Base', prop: 'font-size', cssTarget: 'font-size', default: '14px', selector: 'body' },
  { label: 'Font Family', prop: 'font-family', cssTarget: 'font-family', default: "'Inter', sans-serif", selector: 'body' },
  { label: 'Sidebar Width', prop: 'width', cssTarget: 'width', default: '224px', selector: 'aside' },
  { label: 'Card Padding', prop: 'padding', cssTarget: 'padding', default: '20px', selector: '.bg-surface.border' },
  { label: 'Page Padding', prop: 'padding', cssTarget: 'padding', default: '24px', selector: 'main' },
  { label: 'Gap (grid)', prop: 'gap', cssTarget: 'gap', default: '12px', selector: '.gap-3' },
  { label: 'Letter Spacing', prop: 'letter-spacing', cssTarget: 'letter-spacing', default: '0.05em', selector: '.uppercase' },
]

const FONT_OPTIONS = [
  "'Inter', sans-serif",
  "'SF Pro Display', -apple-system, sans-serif",
  "'JetBrains Mono', monospace",
  "'Fira Code', monospace",
  "'Space Grotesk', sans-serif",
  "'IBM Plex Sans', sans-serif",
  "system-ui, sans-serif",
]

export function AdminDesigner() {
  const [open, setOpen] = useState(false)
  const [overrides, setOverrides] = useState<Override[]>(() => {
    const saved = loadOverrides()
    applyOverrides(saved)
    return saved
  })
  const [liveCSS, setLiveCSS] = useState('')
  const [inspecting, setInspecting] = useState(false)
  const [inspected, setInspected] = useState<{ tag: string; classes: string; computed: Record<string, string> } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Apply overrides whenever they change
  useEffect(() => {
    applyOverrides(overrides)
    saveOverrides(overrides)
  }, [overrides])

  // Apply live CSS
  useEffect(() => {
    let el = document.getElementById('admin-live-css')
    if (!el) {
      el = document.createElement('style')
      el.id = 'admin-live-css'
      document.head.appendChild(el)
    }
    el.textContent = liveCSS
  }, [liveCSS])

  // Element inspector
  useEffect(() => {
    if (!inspecting) return
    const handler = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const target = e.target as HTMLElement
      const computed = window.getComputedStyle(target)
      setInspected({
        tag: target.tagName.toLowerCase(),
        classes: target.className?.toString().slice(0, 120) || '',
        computed: {
          color: computed.color,
          background: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily.slice(0, 60),
          padding: computed.padding,
          margin: computed.margin,
          borderRadius: computed.borderRadius,
          border: computed.border,
          gap: computed.gap,
          width: computed.width,
          height: computed.height,
        },
      })
      setInspecting(false)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [inspecting])

  const setQuickVar = useCallback((selector: string, property: string, value: string) => {
    setOverrides(prev => {
      const existing = prev.findIndex(o => o.selector === selector && o.property === property)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { selector, property, value }
        return next
      }
      return [...prev, { selector, property, value }]
    })
  }, [])

  const resetAll = useCallback(() => {
    setOverrides([])
    setLiveCSS('')
    applyOverrides([])
  }, [])

  const exportCSS = useCallback(() => {
    const css = overrides.map(o => `${o.selector} { ${o.property}: ${o.value}; }`).join('\n')
    const full = liveCSS ? css + '\n\n/* Custom */\n' + liveCSS : css
    navigator.clipboard.writeText(full)
  }, [overrides, liveCSS])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-amber/90 text-background flex items-center justify-center shadow-2xl hover:bg-amber transition-colors"
        title="Admin Designer Mode"
      >
        <Palette size={20} />
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      className="fixed right-4 bottom-4 z-[9999] w-80 max-h-[85vh] bg-surface border border-amber/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-amber/5">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-amber" />
          <span className="text-sm font-semibold text-amber">Designer Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={exportCSS} className="p-1.5 text-text-muted hover:text-text-primary" title="Copy CSS">
            <Copy size={14} />
          </button>
          <button type="button" onClick={resetAll} className="p-1.5 text-text-muted hover:text-red" title="Reset all">
            <RotateCcw size={14} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Inspector */}
        <div>
          <button
            type="button"
            onClick={() => setInspecting(!inspecting)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              inspecting ? 'border-amber bg-amber/10 text-amber' : 'border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {inspecting ? <EyeOff size={12} /> : <Eye size={12} />}
            {inspecting ? 'Click any element...' : 'Inspect Element'}
          </button>
          {inspected && (
            <div className="mt-2 bg-background rounded-lg p-2 text-[10px] space-y-0.5">
              <p className="text-amber font-mono">&lt;{inspected.tag}&gt;</p>
              <p className="text-text-muted truncate">{inspected.classes}</p>
              {Object.entries(inspected.computed).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-text-muted">{k}:</span>
                  <span className="text-text-secondary font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Controls */}
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Quick Controls</p>
          <div className="space-y-2">
            {QUICK_VARS.map(v => (
              <div key={v.label}>
                <label className="text-[10px] text-text-secondary mb-0.5 block">{v.label}</label>
                {v.label === 'Font Family' ? (
                  <select
                    onChange={e => setQuickVar(v.selector, v.cssTarget, e.target.value)}
                    className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-text-primary"
                    defaultValue=""
                  >
                    <option value="" disabled>Select font...</option>
                    {FONT_OPTIONS.map(f => (
                      <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>
                    ))}
                  </select>
                ) : v.label.includes('Color') || v.label.includes('Background') ? (
                  <input
                    type="color"
                    onChange={e => setQuickVar(v.selector, v.cssTarget, e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border border-border"
                  />
                ) : (
                  <input
                    type="text"
                    defaultValue={v.default}
                    onChange={e => setQuickVar(v.selector, v.cssTarget, e.target.value)}
                    placeholder={v.default}
                    className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-text-primary font-mono"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CSS Colors (theme vars) */}
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Theme Colors</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['background', 'surface', 'surface-hover', 'border', 'text-primary', 'text-secondary', 'text-muted', 'accent', 'green', 'red', 'amber', 'blue', 'purple', 'cyan'].map(name => (
              <label key={name} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <input
                  type="color"
                  defaultValue={getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim() || '#000000'}
                  onChange={e => {
                    document.documentElement.style.setProperty(`--color-${name}`, e.target.value)
                    setOverrides(prev => {
                      const sel = ':root'
                      const prop = `--color-${name}`
                      const idx = prev.findIndex(o => o.selector === sel && o.property === prop)
                      if (idx >= 0) {
                        const next = [...prev]
                        next[idx] = { selector: sel, property: prop, value: e.target.value }
                        return next
                      }
                      return [...prev, { selector: sel, property: prop, value: e.target.value }]
                    })
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                />
                <span className="truncate">{name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Live CSS */}
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Live CSS</p>
          <textarea
            value={liveCSS}
            onChange={e => setLiveCSS(e.target.value)}
            placeholder=".my-class { color: red; }"
            className="w-full h-24 px-2 py-1.5 bg-background border border-border rounded-lg text-[11px] text-text-primary font-mono resize-y"
            spellCheck={false}
          />
        </div>

        {/* Active Overrides */}
        {overrides.length > 0 && (
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Active ({overrides.length})</p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {overrides.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] bg-background rounded px-1.5 py-0.5">
                  <span className="text-text-muted font-mono truncate flex-1">{o.selector} → {o.property}: {o.value}</span>
                  <button
                    type="button"
                    onClick={() => setOverrides(prev => prev.filter((_, j) => j !== i))}
                    className="text-text-muted hover:text-red ml-1 flex-shrink-0"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
