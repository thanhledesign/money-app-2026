import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '', style }: CardProps) {
  return <h3 className={`text-sm font-medium text-text-secondary uppercase tracking-wider ${className}`} style={style}>{children}</h3>
}

interface KPICardProps {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'cyan' | 'default'
  emoji?: string
}

interface GlassCardProps {
  children: ReactNode
  className?: string
  accent?: string
}

export function GlassCard({ children, className = '', accent = '#6366f1' }: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 backdrop-blur-sm ${className}`}
      style={{
        borderColor: accent + '40',
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 50%, transparent 100%)`,
      }}
    >
      {/* Subtle glow in corner */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function KPICard({ label, value, subValue, trend, trendValue, emoji }: KPICardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{label}</p>
        {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend && trendValue && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green' : trend === 'down' ? 'text-red' : 'text-text-muted'}`}>
            {trend === 'up' ? '+' : ''}{trendValue}
          </span>
        )}
        {subValue && <span className="text-xs text-text-muted">{subValue}</span>}
      </div>
    </Card>
  )
}
