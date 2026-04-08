import { useState } from 'react'
import type { AppData, Goal } from '@/data/types'
import { formatDate } from '@/lib/calculations'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

interface GoalsPageProps {
  data: AppData
  addGoal: (g: Goal) => void
}

// ── Ranking helpers ───────────────────────────────────────────────────────────

function rankingTrophies(ranking: string): string {
  const n = parseInt(ranking, 10)
  if (n === 3) return '🏆🏆🏆'
  if (n === 2) return '🏆🏆'
  return '🏆'
}

function rankingLabel(ranking: string): string {
  const n = parseInt(ranking, 10)
  if (n === 3) return 'Major Milestone'
  if (n === 2) return 'Big Win'
  return 'Win'
}

function rankingAccent(ranking: string): string {
  const n = parseInt(ranking, 10)
  if (n === 3) return 'text-amber border-amber/30 bg-amber/5'
  if (n === 2) return 'text-accent border-accent/30 bg-accent/5'
  return 'text-green border-green/30 bg-green/5'
}

function rankingDot(ranking: string): string {
  const n = parseInt(ranking, 10)
  if (n === 3) return 'bg-amber'
  if (n === 2) return 'bg-accent'
  return 'bg-green'
}

// ── Add Goal Form ─────────────────────────────────────────────────────────────

function AddGoalForm({ onAdd }: { onAdd: (g: Goal) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [milestone, setMilestone] = useState('')
  const [ranking, setRanking] = useState<'1' | '2' | '3'>('1')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!milestone.trim()) {
      setError('Please enter a milestone description.')
      return
    }
    if (!date) {
      setError('Please select a date.')
      return
    }
    setError('')
    const goal: Goal = {
      id: `g-${Date.now()}`,
      ranking,
      completedDate: date,
      milestone: milestone.trim(),
    }
    onAdd(goal)
    setMilestone('')
    setDate(today)
    setRanking('1')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a New Achievement</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Ranking selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted uppercase tracking-wider">Tier</label>
            <div className="flex gap-2">
              {(['1', '2', '3'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRanking(r)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                    ranking === r
                      ? rankingAccent(r) + ' font-semibold'
                      : 'border-border text-text-muted hover:border-border-light hover:text-text-secondary'
                  }`}
                >
                  {rankingTrophies(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Ranking label display */}
          <div className="flex flex-col gap-1 justify-end">
            <span className={`text-sm font-medium px-3 py-2 rounded-lg border ${rankingAccent(ranking)}`}>
              {rankingLabel(ranking)}
            </span>
          </div>
        </div>

        {/* Milestone text */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted uppercase tracking-wider">Milestone</label>
          <input
            type="text"
            value={milestone}
            onChange={e => setMilestone(e.target.value)}
            placeholder="Describe the achievement..."
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && <p className="text-xs text-red">{error}</p>}

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Add Achievement
        </button>
      </form>
    </Card>
  )
}

// ── Timeline Goal Card ────────────────────────────────────────────────────────

function GoalCard({ goal, isLast }: { goal: Goal; isLast: boolean }) {
  const accent = rankingAccent(goal.ranking)
  const dot = rankingDot(goal.ranking)

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={`w-3.5 h-3.5 rounded-full mt-4 flex-shrink-0 ${dot} ring-2 ring-background`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-5 border rounded-xl p-4 ${accent}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary leading-snug">{goal.milestone}</p>
            <p className="text-xs text-text-muted mt-1">{formatDate(goal.completedDate)}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-lg leading-none">{rankingTrophies(goal.ranking)}</span>
            <p className="text-xs mt-0.5 font-medium opacity-80">{rankingLabel(goal.ranking)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function GoalTimeline({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-text-secondary text-sm">No goals yet. Record your first achievement above!</p>
        </div>
      </Card>
    )
  }

  const sorted = [...goals].sort(
    (a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Achievement Timeline</CardTitle>
          <span className="text-xs text-text-muted">{goals.length} total</span>
        </div>
      </CardHeader>
      <div className="mt-2">
        {sorted.map((goal, i) => (
          <GoalCard key={goal.id} goal={goal} isLast={i === sorted.length - 1} />
        ))}
      </div>
    </Card>
  )
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function GoalStats({ goals }: { goals: Goal[] }) {
  const major = goals.filter(g => g.ranking === '3').length
  const big   = goals.filter(g => g.ranking === '2').length
  const small = goals.filter(g => g.ranking === '1').length

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="text-center">
        <p className="text-2xl mb-1">🏆🏆🏆</p>
        <p className="text-xl font-semibold text-amber tabular-nums">{major}</p>
        <p className="text-xs text-text-muted mt-0.5">Major Milestones</p>
      </Card>
      <Card className="text-center">
        <p className="text-2xl mb-1">🏆🏆</p>
        <p className="text-xl font-semibold text-accent tabular-nums">{big}</p>
        <p className="text-xs text-text-muted mt-0.5">Big Wins</p>
      </Card>
      <Card className="text-center">
        <p className="text-2xl mb-1">🏆</p>
        <p className="text-xl font-semibold text-green tabular-nums">{small}</p>
        <p className="text-xs text-text-muted mt-0.5">Wins</p>
      </Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GoalsPage({ data, addGoal }: GoalsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="🏆"
        title="Goals & Achievements"
        subtitle="Victories, milestones, large and small wins"
      />

      <GoalStats goals={data.goals} />
      <AddGoalForm onAdd={addGoal} />
      <GoalTimeline goals={data.goals} />
    </div>
  )
}
