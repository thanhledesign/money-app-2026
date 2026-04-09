// Shared Recharts styling constants — used across all chart pages

function isLight() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('light')
}

// Use as: <Tooltip {...CHART_TOOLTIP} />
export function getChartTooltip() {
  const light = isLight()
  return {
    contentStyle: {
      background: light ? '#ffffff' : '#12121a',
      border: `1px solid ${light ? '#e0e0e6' : '#2a2a3a'}`,
      borderRadius: '8px',
      fontSize: '12px',
      color: light ? '#1a1a2e' : '#e4e4eb',
    },
    labelStyle: { color: light ? '#6b6b80' : '#8888a0' },
    cursor: { fill: light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' },
  }
}

// Static versions for backwards compat — most pages will still use these
export const CHART_TOOLTIP = {
  contentStyle: {
    background: 'var(--color-surface, #12121a)',
    border: '1px solid var(--color-border, #2a2a3a)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--color-text-primary, #e4e4eb)',
  },
  itemStyle: { color: 'var(--color-text-primary, #e4e4eb)' },
  labelStyle: { color: 'var(--color-text-muted, #8888a0)' },
  cursor: { fill: 'rgba(128,128,128,0.08)' },
}

// Flat version for pages using contentStyle={TOOLTIP_CONTENT_STYLE}
export const TOOLTIP_CONTENT_STYLE = CHART_TOOLTIP.contentStyle

export const AXIS_TICK = { fill: '#55556a', fontSize: 11 }

export const LEGEND_TEXT_STYLE: React.CSSProperties = { color: '#8888a0', fontSize: 11 }

// Pastel chart palette — softer, modern, streaming-platform aesthetic
export const COLORS = {
  cash: '#6ee7b7',       // soft mint green
  investments: '#93c5fd', // soft sky blue
  debt: '#fca5a5',       // soft coral
  netWorth: '#c4b5fd',   // soft lavender
  taxes: '#fca5a5',      // soft coral
  bonus: '#fcd34d',      // soft gold
  lti: '#d8b4fe',        // soft purple
  savings: '#6ee7b7',    // soft mint
  medical: '#67e8f9',    // soft cyan
  dental: '#a5f3fc',     // lighter cyan
  k401: '#93c5fd',       // soft blue
} as const
