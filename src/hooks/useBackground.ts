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

// CSS-only gradient backgrounds — no external images needed
export const CSS_BACKGROUNDS: Record<string, { name: string; css: string; category: string }> = {
  corporate: {
    name: 'Midnight Pro',
    category: 'Minimal',
    css: `
      radial-gradient(ellipse at 15% 5%, rgba(124,111,247,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 90%, rgba(52,211,153,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(30,30,48,1) 0%, rgba(8,8,13,1) 100%)
    `,
  },
  mesh: {
    name: 'Soft Mesh',
    category: 'Abstract',
    css: `
      radial-gradient(at 20% 20%, rgba(124,111,247,0.12) 0%, transparent 50%),
      radial-gradient(at 80% 30%, rgba(52,211,153,0.10) 0%, transparent 50%),
      radial-gradient(at 40% 80%, rgba(248,113,113,0.08) 0%, transparent 50%),
      radial-gradient(at 90% 80%, rgba(96,165,250,0.08) 0%, transparent 50%),
      linear-gradient(135deg, #0c0c14 0%, #08080d 100%)
    `,
  },
  aurora_css: {
    name: 'Aurora Wave',
    category: 'Abstract',
    css: `
      radial-gradient(ellipse at 10% 0%, rgba(52,211,153,0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 10%, rgba(96,165,250,0.12) 0%, transparent 40%),
      radial-gradient(ellipse at 90% 0%, rgba(192,132,252,0.10) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 100%, rgba(8,8,13,1) 0%, transparent 60%),
      linear-gradient(180deg, #0a0a12 0%, #08080d 100%)
    `,
  },
  ember: {
    name: 'Warm Ember',
    category: 'Abstract',
    css: `
      radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.10) 0%, transparent 45%),
      radial-gradient(ellipse at 70% 70%, rgba(248,113,113,0.08) 0%, transparent 45%),
      radial-gradient(ellipse at 10% 80%, rgba(192,132,252,0.06) 0%, transparent 40%),
      linear-gradient(145deg, #100c08 0%, #08080d 100%)
    `,
  },
  deep: {
    name: 'Deep Space',
    category: 'Abstract',
    css: `
      radial-gradient(ellipse at 25% 15%, rgba(96,165,250,0.10) 0%, transparent 45%),
      radial-gradient(ellipse at 75% 85%, rgba(124,111,247,0.12) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(20,20,35,0.5) 0%, transparent 70%),
      linear-gradient(160deg, #06060c 0%, #0a0a14 50%, #08080d 100%)
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
