// Shared Recharts styling constants — used across all chart pages

// Use as: <Tooltip {...CHART_TOOLTIP} />
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
