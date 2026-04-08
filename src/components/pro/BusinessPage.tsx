import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Building2, Lock } from 'lucide-react'

export default function BusinessPage() {
  return (
    <div>
      <PageHeader
        icon="🏢"
        title="Business Finances"
        subtitle="Track business income, expenses, and P&L"
        rightContent={
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-amber/10 text-amber border border-amber/20">
            Pro Feature — Free Preview
          </span>
        }
      />

      <Card className="mb-6">
        <div className="text-center py-16">
          <Building2 size={48} className="mx-auto text-amber/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Business Finance Tracking</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Track revenue, expenses, profit & loss, invoices, and tax deductions for your business.
            Separate your business finances from personal with dedicated tools.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            {[
              { title: 'Revenue Tracking', desc: 'Log income by client or source' },
              { title: 'Expense Categories', desc: 'Business deductions organized by type' },
              { title: 'P&L Statements', desc: 'Monthly profit & loss auto-generated' },
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
