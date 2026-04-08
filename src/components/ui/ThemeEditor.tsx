import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Trash2, RotateCcw } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import {
  type ThemeVars, type SavedTheme, DEFAULT_VARS, PRESET_THEMES,
  loadSavedThemes, saveSavedThemes, loadActiveThemeName, saveActiveThemeName,
  loadCustomCSS, saveCustomCSS, applyThemeVars, applyCustomCSS,
} from '@/data/themes'

// Lazy-load CodeMirror to avoid SSR issues
let cmLoaded = false
let EditorView: any = null
let EditorState: any = null
let css: any = null
let oneDark: any = null

async function loadCM() {
  if (cmLoaded) return
  const [viewMod, stateMod, cssMod, themeMod] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/lang-css'),
    import('@codemirror/theme-one-dark'),
  ])
  EditorView = viewMod.EditorView
  EditorState = stateMod.EditorState
  css = cssMod.css
  oneDark = themeMod.oneDark
  cmLoaded = true
}

export function ThemeEditor() {
  const [activeTheme, setActiveTheme] = useState(loadActiveThemeName)
  const [userThemes, setUserThemes] = useState<SavedTheme[]>(() => loadSavedThemes())
  const [editVars, setEditVars] = useState<Partial<ThemeVars>>({})
  const [customCSSText, setCustomCSSText] = useState(() => loadCustomCSS())
  const [newThemeName, setNewThemeName] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)

  const allThemes = [...PRESET_THEMES, ...userThemes]

  // Load active theme's vars on mount and when switching
  useEffect(() => {
    const theme = allThemes.find(t => t.name === activeTheme)
    if (theme) {
      setEditVars({ ...DEFAULT_VARS, ...theme.vars })
      applyThemeVars(theme.vars)
    }
  }, [activeTheme])

  // Init CodeMirror
  useEffect(() => {
    let mounted = true
    loadCM().then(() => {
      if (!mounted || !editorRef.current || viewRef.current) return
      const state = EditorState.create({
        doc: customCSSText,
        extensions: [
          css(),
          oneDark,
          EditorView.updateListener.of((update: any) => {
            if (update.docChanged) {
              const val = update.state.doc.toString()
              setCustomCSSText(val)
            }
          }),
          EditorView.theme({
            '&': { height: '200px', fontSize: '12px' },
            '.cm-scroller': { overflow: 'auto' },
            '.cm-content': { fontFamily: 'monospace' },
          }),
        ],
      })
      viewRef.current = new EditorView({ state, parent: editorRef.current })
    })
    return () => {
      mounted = false
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [])

  const handleVarChange = useCallback((key: string, value: string) => {
    setEditVars(prev => {
      const next = { ...prev, [key]: value }
      applyThemeVars(next)
      return next
    })
  }, [])

  const handleApplyCSS = useCallback(() => {
    saveCustomCSS(customCSSText)
    applyCustomCSS(customCSSText)
  }, [customCSSText])

  const handleSelectTheme = useCallback((name: string) => {
    setActiveTheme(name)
    saveActiveThemeName(name)
    const theme = allThemes.find(t => t.name === name)
    if (theme) {
      setEditVars({ ...DEFAULT_VARS, ...theme.vars })
      applyThemeVars(theme.vars)
      if (theme.customCSS) {
        setCustomCSSText(theme.customCSS)
        saveCustomCSS(theme.customCSS)
        applyCustomCSS(theme.customCSS)
        // Update CodeMirror content
        if (viewRef.current) {
          const state = viewRef.current.state
          viewRef.current.dispatch({
            changes: { from: 0, to: state.doc.length, insert: theme.customCSS },
          })
        }
      }
    }
  }, [allThemes])

  const handleSaveTheme = useCallback(() => {
    const name = newThemeName.trim()
    if (!name) return
    const vars: Partial<ThemeVars> = {}
    for (const [k, v] of Object.entries(editVars)) {
      if (v !== (DEFAULT_VARS as any)[k]) {
        (vars as any)[k] = v
      }
    }
    const theme: SavedTheme = { name, vars, customCSS: customCSSText }
    const updated = userThemes.filter(t => t.name !== name)
    updated.push(theme)
    setUserThemes(updated)
    saveSavedThemes(updated)
    setActiveTheme(name)
    saveActiveThemeName(name)
    setNewThemeName('')
  }, [newThemeName, editVars, customCSSText, userThemes])

  const handleDeleteTheme = useCallback((name: string) => {
    const updated = userThemes.filter(t => t.name !== name)
    setUserThemes(updated)
    saveSavedThemes(updated)
    if (activeTheme === name) {
      handleSelectTheme('Default Dark')
    }
  }, [userThemes, activeTheme, handleSelectTheme])

  const handleReset = useCallback(() => {
    setEditVars({ ...DEFAULT_VARS })
    applyThemeVars({})
    setActiveTheme('Default Dark')
    saveActiveThemeName('Default Dark')
    setCustomCSSText('')
    saveCustomCSS('')
    applyCustomCSS('')
    if (viewRef.current) {
      const state = viewRef.current.state
      viewRef.current.dispatch({
        changes: { from: 0, to: state.doc.length, insert: '' },
      })
    }
  }, [])

  const varGroups = [
    { label: 'Background', keys: ['background', 'surface', 'surface-hover'] },
    { label: 'Borders', keys: ['border', 'border-light'] },
    { label: 'Text', keys: ['text-primary', 'text-secondary', 'text-muted'] },
    { label: 'Accent', keys: ['accent', 'accent-hover'] },
    { label: 'Status Colors', keys: ['green', 'red', 'amber', 'blue', 'purple', 'cyan'] },
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selector */}
      <Card>
        <CardTitle>Theme</CardTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          {allThemes.map(theme => (
            <div key={theme.name} className="flex items-center gap-1">
              <button
                onClick={() => handleSelectTheme(theme.name)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  activeTheme === theme.name
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {theme.name}
              </button>
              {!PRESET_THEMES.find(p => p.name === theme.name) && (
                <button
                  onClick={() => handleDeleteTheme(theme.name)}
                  className="text-text-muted hover:text-red transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* CSS Variable Editor */}
      <Card>
        <CardTitle>Theme Variables</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Click any swatch to change. Changes preview live.</p>
        <div className="space-y-4">
          {varGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-medium text-text-secondary mb-2">{group.label}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {group.keys.map(key => (
                  <label key={key} className="flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="color"
                      value={(editVars as any)[key] || (DEFAULT_VARS as any)[key] || '#000000'}
                      onChange={e => handleVarChange(key, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-border"
                    />
                    <span className="truncate">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Theme */}
      <Card>
        <CardTitle>Save Theme</CardTitle>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newThemeName}
            onChange={e => setNewThemeName(e.target.value)}
            placeholder="Theme name..."
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary"
          />
          <button
            onClick={handleSaveTheme}
            disabled={!newThemeName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-lg text-xs hover:bg-accent/20 disabled:opacity-30 transition-colors"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red/10 text-red border border-red/30 rounded-lg text-xs hover:bg-red/20 transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </Card>

      {/* Custom CSS Editor */}
      <Card>
        <CardTitle>Custom CSS</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-3">
          Write any CSS to override styles. Injected as a &lt;style&gt; tag. Use browser DevTools to find class names.
        </p>
        <div
          ref={editorRef}
          className="border border-border rounded-lg overflow-hidden"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleApplyCSS}
            className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-lg text-xs hover:bg-accent/20 transition-colors"
          >
            Apply CSS
          </button>
          <button
            onClick={() => {
              setCustomCSSText('')
              saveCustomCSS('')
              applyCustomCSS('')
              if (viewRef.current) {
                const state = viewRef.current.state
                viewRef.current.dispatch({
                  changes: { from: 0, to: state.doc.length, insert: '' },
                })
              }
            }}
            className="px-3 py-1.5 text-text-muted border border-border rounded-lg text-xs hover:text-text-secondary transition-colors"
          >
            Clear
          </button>
        </div>
      </Card>
    </div>
  )
}
