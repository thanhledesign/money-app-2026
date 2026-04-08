import { getStorageKey } from '@/lib/store'

interface Props {
  icon?: string
  title?: string
  message?: string
}

export function EmptyState({
  icon = '📋',
  title = 'No data yet',
  message = 'Run the setup wizard to add your accounts, income, budget, and goals.',
}: Props) {
  const handleStartWizard = () => {
    localStorage.removeItem(getStorageKey('wizard-done'))
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mb-6">{message}</p>
      <button
        onClick={handleStartWizard}
        className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
      >
        Start Setup Wizard
      </button>
    </div>
  )
}
