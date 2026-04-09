import { useState } from 'react'
import type { AppData } from '@/data/types'
import * as calc from '@/lib/calculations'

interface Props {
  data: AppData
  score: number
}

interface ScoreItem {
  label: string
  earned: number
  max: number
  status: 'good' | 'warn' | 'bad'
  tip: string
}

export function HealthScoreTooltip({ data, score }: Props) {
  const [open, setOpen] = useState(false)
  const latest = calc.getLatestSnapshot(data)

  const items: ScoreItem[] = []
  if (latest) {
    const utilization = calc.getCreditUtilization(latest, data)
    items.push({
      label: 'Credit Utilization',
      earned: utilization < 0.30 ? 15 : 0,
      max: 15,
      status: utilization < 0.30 ? 'good' : 'bad',
      tip: utilization < 0.30
        ? 'Under 30% — healthy'
        : `At ${calc.formatPercent(utilization)} — pay down balances below 30%`,
    })

    const savingsRate = calc.getSavingsRate(data)
    items.push({
      label: 'Savings Rate',
      earned: savingsRate > 0.30 ? 20 : savingsRate > 0.15 ? 10 : 0,
      max: 20,
      status: savingsRate > 0.30 ? 'good' : savingsRate > 0.15 ? 'warn' : 'bad',
      tip: savingsRate > 0.30
        ? `${calc.formatPercent(savingsRate)} — excellent`
        : `${calc.formatPercent(savingsRate)} — aim for 30%+ by reducing variable spending`,
    })

    const topConc = calc.getDisneyConcentration(latest, data)
    items.push({
      label: 'Diversification',
      earned: topConc < 0.50 ? 15 : topConc < 0.70 ? 5 : 0,
      max: 15,
      status: topConc < 0.50 ? 'good' : topConc < 0.70 ? 'warn' : 'bad',
      tip: topConc < 0.50
        ? 'No single employer above 50%'
        : `Top holding at ${calc.formatPercent(topConc)} — consider diversifying into index funds`,
    })

    const runway = calc.getRunwayMonths(data)
    items.push({
      label: 'Emergency Runway',
      earned: runway > 6 ? 15 : runway > 3 ? 10 : 0,
      max: 15,
      status: runway > 6 ? 'good' : runway > 3 ? 'warn' : 'bad',
      tip: runway > 6
        ? `${runway.toFixed(1)} months — solid buffer`
        : `${runway.toFixed(1)} months — build to 6+ months of expenses in cash`,
    })

    const debtTotal = calc.getTotalDebt(latest, data)
    const prev = calc.getPreviousSnapshot(data)
    const debtImproving = prev ? debtTotal > calc.getTotalDebt(prev, data) : false
    items.push({
      label: 'Debt Trend',
      earned: debtTotal >= 0 ? 15 : debtImproving ? 10 : 0,
      max: 15,
      status: debtTotal >= 0 ? 'good' : debtImproving ? 'warn' : 'bad',
      tip: debtTotal >= 0
        ? 'Debt-free'
        : `${calc.formatCurrency(debtTotal)} — ${debtImproving ? 'improving' : 'growing, pay down high-APR balances first'}`,
    })

    if (data.snapshots.length >= 2) {
      const prevSnap = data.snapshots[data.snapshots.length - 2]
      const nwNow = calc.getNetWorth(latest, data)
      const nwPrev = calc.getNetWorth(prevSnap, data)
      items.push({
        label: 'Net Worth Growth',
        earned: nwNow > nwPrev ? 10 : 0,
        max: 10,
        status: nwNow > nwPrev ? 'good' : 'bad',
        tip: nwNow > nwPrev
          ? `+${calc.formatCurrency(nwNow - nwPrev)} since last snapshot`
          : `${calc.formatCurrency(nwNow - nwPrev)} — review spending or market losses`,
      })
    }

    if (latest.creditScore) {
      items.push({
        label: 'Credit Score',
        earned: latest.creditScore >= 750 ? 10 : latest.creditScore >= 700 ? 5 : 0,
        max: 10,
        status: latest.creditScore >= 750 ? 'good' : latest.creditScore >= 700 ? 'warn' : 'bad',
        tip: latest.creditScore >= 750
          ? `${latest.creditScore} — excellent`
          : `${latest.creditScore} — keep utilization low and make on-time payments`,
      })
    }
  }

  const statusColors = { good: 'text-green', warn: 'text-amber', bad: 'text-red' }
  const barColors = { good: 'bg-green', warn: 'bg-amber', bad: 'bg-red' }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="cursor-pointer text-right">
        <div className="text-xs text-text-muted">Health Score</div>
        <div className={`text-3xl font-bold tabular-nums ${
          score >= 70 ? 'text-green' : score >= 40 ? 'text-amber' : 'text-red'
        }`}>
          {score}<span className="text-lg text-text-muted">/100</span>
        </div>
      </button>

      {open && (
        <>
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
        <div className="fixed inset-x-4 bottom-4 md:absolute md:right-0 md:left-auto md:bottom-auto md:top-full md:mt-2 md:w-80 md:inset-x-auto max-w-[calc(100vw-2rem)] bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
          <h4 className="text-sm font-semibold text-text-primary mb-1">Financial Health Score</h4>
          <p className="text-xs text-text-muted mb-3">
            Composite score based on 7 key financial metrics. Higher is better.
          </p>
          <div className="space-y-2.5">
            {items.map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className={`text-xs font-medium ${statusColors[item.status]}`}>
                    {item.earned}/{item.max}
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden mb-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${barColors[item.status]}`}
                    style={{ width: `${(item.earned / item.max) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted">{item.tip}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-[10px] text-text-muted">
              {score >= 70
                ? 'Strong financial position. Focus on diversification and growth.'
                : score >= 40
                ? 'Solid foundation with room to improve. Address amber/red items above.'
                : 'Needs attention. Prioritize paying down debt and building emergency savings.'}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 text-xs text-text-muted border border-border rounded-lg hover:text-text-secondary md:hidden">
            Close
          </button>
        </div>
        </>
      )}
    </div>
  )
}
