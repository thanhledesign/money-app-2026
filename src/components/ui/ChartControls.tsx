import type { ChartPrefs } from '@/data/chartPrefs'

interface ChartControlsProps {
  prefs: ChartPrefs
  onToggleCurve: () => void
  onToggleDots: () => void
}

export function ChartControls({ prefs, onToggleCurve, onToggleDots }: ChartControlsProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={onToggleCurve}
        className={`px-2.5 py-1 rounded-md border transition-colors ${
          prefs.curveType === 'smooth'
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border text-text-muted hover:text-text-secondary'
        }`}
      >
        {prefs.curveType === 'smooth' ? 'Smooth' : 'Sharp'}
      </button>
      <button
        onClick={onToggleDots}
        className={`px-2.5 py-1 rounded-md border transition-colors ${
          prefs.showDots
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border text-text-muted hover:text-text-secondary'
        }`}
      >
        {prefs.showDots ? 'Dots On' : 'Dots Off'}
      </button>
    </div>
  )
}
