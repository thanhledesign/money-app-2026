import type { ReactNode } from 'react'
import { useCallback } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, className = '', style }: CardProps) {
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <div
      className={`glass-glow backdrop-blur-md border rounded-xl p-5 ${className}`}
      style={{
        ...style,
        background: 'linear-gradient(135deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-surface) 85%, transparent) 100%)',
        borderColor: 'color-mix(in oklab, var(--color-border) 60%, transparent)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseMove={handleMouseMove}
    >
      <div className="relative z-10">{children}</div>
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
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <div
      className={`glass-glow relative overflow-hidden rounded-xl border p-5 backdrop-blur-md ${className}`}
      style={{
        borderColor: accent + '30',
        background: `linear-gradient(145deg, ${accent}12 0%, ${accent}06 40%, color-mix(in oklab, var(--color-surface) 90%, transparent) 100%)`,
        boxShadow: `inset 0 1px 0 0 ${accent}15, 0 2px 8px rgba(0,0,0,0.25)`,
        '--glow-color': accent + '12',
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
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
