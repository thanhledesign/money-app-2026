import { useState, useCallback } from 'react'
import { getUserTier, setUserTier, canUseFeature, type Tier } from '@/lib/tiers'

export function useTier(userEmail?: string) {
  const [tier, setTier] = useState<Tier>(() => getUserTier(userEmail))

  const upgrade = useCallback((newTier: Tier) => {
    setUserTier(newTier)
    setTier(newTier)
  }, [])

  const checkFeature = useCallback((featureId: string) => {
    return canUseFeature(tier, featureId)
  }, [tier])

  return { tier, upgrade, checkFeature }
}
