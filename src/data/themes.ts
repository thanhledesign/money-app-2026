export interface ThemeVars {
  background: string
  surface: string
  'surface-hover': string
  border: string
  'border-light': string
  'text-primary': string
  'text-secondary': string
  'text-muted': string
  accent: string
  'accent-hover': string
  green: string
  red: string
  amber: string
  blue: string
  purple: string
  cyan: string
}

export interface SavedTheme {
  name: string
  vars: Partial<ThemeVars>
  customCSS: string
}

const THEMES_KEY = 'money-app-themes'
const ACTIVE_THEME_KEY = 'money-app-active-theme'
const CUSTOM_CSS_KEY = 'money-app-custom-css'

export const DEFAULT_VARS: ThemeVars = {
  background: '#0a0a0f',
  surface: '#12121a',
  'surface-hover': '#1a1a26',
  border: '#2a2a3a',
  'border-light': '#1e1e2e',
  'text-primary': '#e4e4eb',
  'text-secondary': '#8888a0',
  'text-muted': '#55556a',
  accent: '#6366f1',
  'accent-hover': '#818cf8',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
}

export const PRESET_THEMES: SavedTheme[] = [
  {
    name: 'Default Dark',
    vars: {},
    customCSS: '',
  },
  {
    name: 'Green Terminal',
    vars: {
      background: '#0a0f0a',
      surface: '#0f1a0f',
      'surface-hover': '#152215',
      border: '#1a3a1a',
      'border-light': '#152a15',
      'text-primary': '#c0f0c0',
      'text-secondary': '#70a070',
      'text-muted': '#406040',
      accent: '#22c55e',
      'accent-hover': '#4ade80',
    },
    customCSS: '',
  },
  {
    name: 'Midnight Blue',
    vars: {
      background: '#0a0c14',
      surface: '#101828',
      'surface-hover': '#1a2540',
      border: '#253560',
      'border-light': '#1a2845',
      accent: '#3b82f6',
      'accent-hover': '#60a5fa',
    },
    customCSS: '',
  },
  {
    name: 'Warm Ember',
    vars: {
      background: '#120a08',
      surface: '#1a100c',
      'surface-hover': '#261812',
      border: '#3a2218',
      accent: '#f59e0b',
      'accent-hover': '#fbbf24',
      green: '#84cc16',
      purple: '#f97316',
    },
    customCSS: '',
  },
  {
    name: 'Spreadsheet Classic',
    vars: {
      background: '#1a2e1a',
      surface: '#203020',
      'surface-hover': '#2a402a',
      border: '#3a5a3a',
      'border-light': '#2a4a2a',
      'text-primary': '#e0ffe0',
      'text-secondary': '#90c090',
      'text-muted': '#507050',
      accent: '#44bb44',
      'accent-hover': '#66dd66',
    },
    customCSS: '',
  },
]

export function loadSavedThemes(): SavedTheme[] {
  try {
    const raw = localStorage.getItem(THEMES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveSavedThemes(themes: SavedTheme[]): void {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes))
}

export function loadActiveThemeName(): string {
  return localStorage.getItem(ACTIVE_THEME_KEY) || 'Default Dark'
}

export function saveActiveThemeName(name: string): void {
  localStorage.setItem(ACTIVE_THEME_KEY, name)
}

export function loadCustomCSS(): string {
  return localStorage.getItem(CUSTOM_CSS_KEY) || ''
}

export function saveCustomCSS(css: string): void {
  localStorage.setItem(CUSTOM_CSS_KEY, css)
}

export function applyThemeVars(vars: Partial<ThemeVars>): void {
  const root = document.documentElement
  const merged = { ...DEFAULT_VARS, ...vars }
  for (const [key, value] of Object.entries(merged)) {
    root.style.setProperty(`--color-${key}`, value)
  }
}

export function applyCustomCSS(css: string): void {
  let el = document.getElementById('money-app-custom-css')
  if (!el) {
    el = document.createElement('style')
    el.id = 'money-app-custom-css'
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function initTheme(): void {
  const name = loadActiveThemeName()
  const allThemes = [...PRESET_THEMES, ...loadSavedThemes()]
  const theme = allThemes.find(t => t.name === name)
  if (theme) {
    applyThemeVars(theme.vars)
  }
  const css = loadCustomCSS()
  if (css) applyCustomCSS(css)
}
