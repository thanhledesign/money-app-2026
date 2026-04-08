import { useNavigate } from 'react-router-dom'
import { getStorageKey } from '@/lib/store'

interface Props {
  icon?: string
  title?: string
  message?: string
}

export function EmptyState({
  icon = '📋',
  title = 'No data yet',
  message = 'Get started by adding your accounts and recording your first snapshot.',
}: Props) {
  const navigate = useNavigate()

  const handleStartWizard = () => {
    localStorage.removeItem(getStorageKey('wizard-done'))
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mb-8">{message}</p>

      {/* Quick-start checklist */}
      <div className="w-full max-w-sm space-y-2 mb-8">
        <button
          onClick={() => navigate('/accounts')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg hover:border-accent/40 hover:bg-surface-hover transition-colors text-left group"
        >
          <span className="text-lg">1</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Add accounts</p>
            <p className="text-xs text-text-muted">Checking, savings, credit cards, investments</p>
          </div>
          <span className="text-text-muted group-hover:text-accent transition-colors">&rarr;</span>
        </button>
        <button
          onClick={() => navigate('/enter')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg hover:border-accent/40 hover:bg-surface-hover transition-colors text-left group"
        >
          <span className="text-lg">2</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Record first snapshot</p>
            <p className="text-xs text-text-muted">Enter your current balances for each account</p>
          </div>
          <span className="text-text-muted group-hover:text-accent transition-colors">&rarr;</span>
        </button>
        <button
          onClick={() => navigate('/budget')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg hover:border-accent/40 hover:bg-surface-hover transition-colors text-left group"
        >
          <span className="text-lg">3</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Set a budget</p>
            <p className="text-xs text-text-muted">Track spending across categories</p>
          </div>
          <span className="text-text-muted group-hover:text-accent transition-colors">&rarr;</span>
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>or</span>
        <button
          onClick={handleStartWizard}
          className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          Run Setup Wizard
        </button>
      </div>
    </div>
  )
}
