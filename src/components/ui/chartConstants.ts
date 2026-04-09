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
    background: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#8888a0' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

// Flat version for pages using contentStyle={TOOLTIP_CONTENT_STYLE}
export const TOOLTIP_CONTENT_STYLE = CHART_TOOLTIP.contentStyle

export const AXIS_TICK = { fill: '#55556a', fontSize: 11 }

export const LEGEND_TEXT_STYLE: React.CSSProperties = { color: '#8888a0', fontSize: 11 }
