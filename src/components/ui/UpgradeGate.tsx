import type { ReactNode } from 'react'
import { Lock, Sparkles, Crown, Check } from 'lucide-react'
import { canUseFeature, getRequiredTier, TIER_CONFIGS, type Tier } from '@/lib/tiers'
import { Card } from './Card'

interface Props {
  featureId: string
  userTier: Tier
  children: ReactNode
}

export function UpgradeGate({ featureId, userTier, children }: Props) {
  if (canUseFeature(userTier, featureId)) {
    return <>{children}</>
  }

  const requiredTier = getRequiredTier(featureId)
  const config = TIER_CONFIGS[requiredTier]

  return (
    <div className="relative">
      {/* Blurred preview of the gated content */}
      <div className="pointer-events-none select-none blur-sm opacity-40 saturate-50">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <Card className="max-w-md w-full mx-4 !bg-surface/95 !backdrop-blur-xl text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: config.color + '20' }}>
              {requiredTier === 'premium' ? <Crown size={24} style={{ color: config.color }} /> : <Lock size={24} style={{ color: config.color }} />}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">{config.name} Feature</h3>
          <p className="text-xs text-text-muted mb-4">
            This feature requires a {config.name} subscription ({config.price}).
          </p>
          <div className="text-left space-y-1.5 mb-5">
            {config.features.slice(0, 5).map(f => (
              <div key={f} className="flex items-start gap-2 text-xs">
                <Check size={12} className="shrink-0 mt-0.5" style={{ color: config.color }} />
                <span className="text-text-secondary">{f}</span>
              </div>
            ))}
          </div>
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: config.color }}
            onClick={() => {
              // TODO: Stripe checkout or contact link
              alert(`Upgrade to ${config.name} coming soon! Contact support for early access.`)
            }}
          >
            <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />
            Upgrade to {config.name}
          </button>
          <p className="text-[10px] text-text-muted mt-2">Cancel anytime. 7-day free trial.</p>
        </Card>
      </div>
    </div>
  )
}

// Inline gate for small elements (buttons, links)
export function FeatureBadge({ featureId, userTier }: { featureId: string; userTier: Tier }) {
  if (canUseFeature(userTier, featureId)) return null
  const required = getRequiredTier(featureId)
  const config = TIER_CONFIGS[required]
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
      style={{ background: config.color + '20', color: config.color }}
    >
      <Lock size={8} />
      {config.badge}
    </span>
  )
}
