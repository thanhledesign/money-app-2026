import type { ReactNode } from 'react'

export interface PageThemeColors {
  accent: string
  accentHover: string
  accentDim: string
}

const PAGE_THEMES: Record<string, PageThemeColors> = {
  dashboard: { accent: '#6366f1', accentHover: '#818cf8', accentDim: '#4f46e5' },
  accounts: { accent: '#22c55e', accentHover: '#4ade80', accentDim: '#16a34a' },
  investments: { accent: '#06b6d4', accentHover: '#22d3ee', accentDim: '#0891b2' },
  debt: { accent: '#f59e0b', accentHover: '#fbbf24', accentDim: '#d97706' },
  'net-worth': { accent: '#a855f7', accentHover: '#c084fc', accentDim: '#9333ea' },
  income: { accent: '#4ade80', accentHover: '#86efac', accentDim: '#22c55e' },
  budget: { accent: '#eab308', accentHover: '#facc15', accentDim: '#ca8a04' },
  goals: { accent: '#3b82f6', accentHover: '#60a5fa', accentDim: '#2563eb' },
  settings: { accent: '#6366f1', accentHover: '#818cf8', accentDim: '#4f46e5' },
  enter: { accent: '#6366f1', accentHover: '#818cf8', accentDim: '#4f46e5' },
}

interface Props {
  page: string
  children: ReactNode
}

export function PageTheme({ page, children }: Props) {
  const theme = PAGE_THEMES[page] || PAGE_THEMES.dashboard
  return (
    <div
      style={{
        '--page-accent': theme.accent,
        '--page-accent-hover': theme.accentHover,
        '--page-accent-dim': theme.accentDim,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export function getPageTheme(page: string): PageThemeColors {
  return PAGE_THEMES[page] || PAGE_THEMES.dashboard
}
