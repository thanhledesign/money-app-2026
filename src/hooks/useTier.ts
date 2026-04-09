import { useState, useCallback } from 'react'
import { getUserTier, setUserTier, canUseFeature, type Tier } from '@/lib/tiers'

export function useTier(userId?: string) {
  const [tier, setTier] = useState<Tier>(() => getUserTier(userId))

  const upgrade = useCallback((newTier: Tier) => {
    setUserTier(newTier)
    setTier(newTier)
  }, [])

  const checkFeature = useCallback((featureId: string) => {
    return canUseFeature(tier, featureId)
  }, [tier])

  return { tier, upgrade, checkFeature }
}
