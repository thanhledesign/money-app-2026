import { useState, useEffect, useCallback } from 'react'

export interface BackgroundConfig {
  type: 'none' | 'preset' | 'custom' | 'css'
  url: string
  cssGradient?: string
  focalX: number // 0-100 percent
  focalY: number // 0-100 percent
  zoom: number   // 1-2 scale
  blur: number   // 0-20px
  scrimOpacity: number // 0-1
  aspectRatio: '16:9' | '21:9' | '4:3' | 'fill'
}

const STORAGE_KEY = 'money-app-background'

const DEFAULT_CONFIG: BackgroundConfig = {
  type: 'css',
  url: '',
  cssGradient: 'corporate',
  focalX: 50,
  focalY: 50,
  zoom: 1,
  blur: 0,
  scrimOpacity: 0.65,
  aspectRatio: 'fill',
}

// CSS-only gradient backgrounds — 5 distinct, vibrant themes
export const CSS_BACKGROUNDS: Record<string, { name: string; css: string; category: string }> = {
  corporate: {
    name: 'Midnight Pro',
    category: 'Minimal',
    css: `
      radial-gradient(ellipse at 15% 5%, rgba(124,111,247,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 90%, rgba(52,211,153,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(25,25,42,1) 0%, rgba(8,8,13,1) 100%)
    `,
  },
  neon: {
    name: 'Neon Split',
    category: 'Vibrant',
    css: `
      radial-gradient(ellipse at 0% 30%, rgba(236,72,153,0.22) 0%, transparent 45%),
      radial-gradient(ellipse at 100% 70%, rgba(34,211,238,0.22) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(124,111,247,0.06) 0%, transparent 50%),
      linear-gradient(135deg, #0d0418 0%, #040812 50%, #08080d 100%)
    `,
  },
  ember: {
    name: 'Solar Flare',
    category: 'Warm',
    css: `
      radial-gradient(ellipse at 20% 10%, rgba(251,146,60,0.25) 0%, transparent 45%),
      radial-gradient(ellipse at 80% 80%, rgba(239,68,68,0.18) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.05) 0%, transparent 50%),
      linear-gradient(150deg, #140a04 0%, #0e0606 50%, #08080d 100%)
    `,
  },
  aurora_css: {
    name: 'Northern Glow',
    category: 'Nature',
    css: `
      radial-gradient(ellipse at 10% 0%, rgba(52,211,153,0.25) 0%, transparent 40%),
      radial-gradient(ellipse at 55% 5%, rgba(96,165,250,0.20) 0%, transparent 40%),
      radial-gradient(ellipse at 90% 0%, rgba(192,132,252,0.18) 0%, transparent 35%),
      radial-gradient(ellipse at 50% 100%, rgba(8,8,13,0.9) 0%, transparent 60%),
      linear-gradient(180deg, #060c10 0%, #08080d 100%)
    `,
  },
  royal: {
    name: 'Electric Violet',
    category: 'Luxe',
    css: `
      radial-gradient(ellipse at 30% 10%, rgba(168,85,247,0.28) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 90%, rgba(59,130,246,0.18) 0%, transparent 40%),
      radial-gradient(ellipse at 90% 30%, rgba(236,72,153,0.10) 0%, transparent 35%),
      linear-gradient(150deg, #0e0618 0%, #060410 50%, #08080d 100%)
    `,
  },
}

export const BACKGROUND_PRESETS = [
  { id: 'aurora', name: 'Northern Lights', category: 'Nature', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80' },
  { id: 'mountains', name: 'Mountain Lake', category: 'Nature', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { id: 'ocean', name: 'Deep Ocean', category: 'Nature', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80' },
  { id: 'forest', name: 'Misty Forest', category: 'Nature', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
  { id: 'stars', name: 'Starfield', category: 'Science', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80' },
  { id: 'nebula', name: 'Nebula', category: 'Science', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80' },
  { id: 'earth', name: 'Earth from Space', category: 'Earth', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&q=80' },
  { id: 'coral', name: 'Coral Reef', category: 'Animals', url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=80' },
  { id: 'city', name: 'City Skyline', category: 'Civilization', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80' },
  { id: 'tokyo', name: 'Tokyo Nights', category: 'Culture', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80' },
  { id: 'abstract', name: 'Abstract Flow', category: 'Abstract', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80' },
  { id: 'gradient', name: 'Gradient Mesh', category: 'Abstract', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80' },
]

function loadConfig(): BackgroundConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function useBackground() {
  const [config, setConfig] = useState<BackgroundConfig>(loadConfig)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    applyBackground(config)
  }, [config])

  // Apply on mount
  useEffect(() => {
    applyBackground(config)
  }, [])

  const update = useCallback((partial: Partial<BackgroundConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
  }, [])

  return { config, update, reset }
}

function applyBackground(config: BackgroundConfig) {
  const el = document.getElementById('app-background')
  const scrim = document.getElementById('app-scrim')
  if (!el) return

  if (config.type === 'none') {
    el.style.display = 'none'
    if (scrim) scrim.style.opacity = '0'
    return
  }

  if (config.type === 'css' && config.cssGradient) {
    const bg = CSS_BACKGROUNDS[config.cssGradient]
    if (bg) {
      el.style.display = 'block'
      el.style.backgroundImage = bg.css.replace(/\n\s*/g, '')
      el.style.backgroundPosition = 'center'
      el.style.backgroundSize = 'cover'
      el.style.filter = 'none'
      if (scrim) scrim.style.opacity = '0' // CSS bgs have built-in contrast
      return
    }
  }

  if (!config.url) {
    el.style.display = 'none'
    if (scrim) scrim.style.opacity = '0'
    return
  }

  el.style.display = 'block'
  el.style.backgroundImage = `url(${config.url})`
  el.style.backgroundPosition = `${config.focalX}% ${config.focalY}%`
  el.style.backgroundSize = config.zoom > 1 ? `${config.zoom * 100}%` : 'cover'
  el.style.filter = config.blur > 0 ? `blur(${config.blur}px)` : 'none'

  if (scrim) scrim.style.opacity = String(config.scrimOpacity)
}
