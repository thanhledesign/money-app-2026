import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Home, Lock } from 'lucide-react'

export default function PropertiesPage() {
  return (
    <div>
      <div className="mb-4 px-4 py-2 bg-amber/10 border border-amber/25 rounded-lg text-xs text-amber flex items-center gap-2">
        <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase bg-amber/20 rounded">Premium</span>
        This is a Premium feature, currently free during beta. It will require a Premium subscription after launch.
      </div>
      <PageHeader
        icon="🏠"
        title="Properties & Mortgage"
        subtitle="Track real estate, mortgage payments, and equity"
        rightContent={
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-amber/10 text-amber border border-amber/20">
            Premium — Beta
          </span>
        }
      />

      <Card className="mb-6">
        <div className="text-center py-16">
          <Home size={48} className="mx-auto text-amber/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Property & Mortgage Tracking</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Track property values, mortgage balances, equity growth, rental income,
            and maintenance costs across multiple properties.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            {[
              { title: 'Mortgage Tracker', desc: 'Balance, rate, payment schedule, amortization' },
              { title: 'Equity Calculator', desc: 'Home value vs remaining balance over time' },
              { title: 'Rental Income', desc: 'Track rent, vacancies, and ROI per property' },
            ].map(f => (
              <div key={f.title} className="bg-surface-hover rounded-lg p-3">
                <p className="text-xs font-medium text-text-primary">{f.title}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-6 flex items-center justify-center gap-1">
            <Lock size={12} /> This feature will be a paid upgrade upon monetization
          </p>
        </div>
      </Card>
    </div>
  )
}
