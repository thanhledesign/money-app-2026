import { useState, useRef } from 'react'
import { Upload, X, RotateCcw, Image as ImageIcon, Lock } from 'lucide-react'
import { Card, CardTitle } from './Card'
import { useBackground, BACKGROUND_PRESETS, CSS_BACKGROUNDS, type BackgroundConfig } from '@/hooks/useBackground'
import { getUserTier, canUseFeature } from '@/lib/tiers'

const ASPECT_RATIOS: { value: BackgroundConfig['aspectRatio']; label: string }[] = [
  { value: 'fill', label: 'Fill' },
  { value: '16:9', label: '16:9' },
  { value: '21:9', label: '21:9' },
  { value: '4:3', label: '4:3' },
]

const CATEGORIES = [...new Set(BACKGROUND_PRESETS.map(p => p.category))]

export function BackgroundEditor() {
  const { config, update, reset } = useBackground()
  const [showPresets, setShowPresets] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update({ type: 'custom', url: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  function handleUrlPaste() {
    if (!urlInput.trim()) return
    update({ type: 'custom', url: urlInput.trim() })
    setUrlInput('')
  }

  function handlePresetSelect(url: string) {
    update({ type: 'preset', url })
    setShowPresets(false)
  }

  function handleRemove() {
    reset()
  }

  const filteredPresets = activeCategory
    ? BACKGROUND_PRESETS.filter(p => p.category === activeCategory)
    : BACKGROUND_PRESETS

  return (
    <Card className="mb-6">
      <CardTitle>Background Image</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">
        Set a background image behind the glass UI. Adjust focal point, blur, and overlay darkness.
      </p>

      {/* Built-in CSS backgrounds */}
      <div className="mb-4">
        <p className="text-xs text-text-muted mb-2">Built-in Themes</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <button
            onClick={() => update({ type: 'none', url: '', cssGradient: undefined })}
            className={`rounded-lg border-2 aspect-video flex items-center justify-center transition-all ${
              config.type === 'none' ? 'border-accent' : 'border-border hover:border-accent/40'
            }`}
            style={{ background: 'var(--color-background)' }}
          >
            <span className="text-[9px] text-text-muted">Plain</span>
          </button>
          {Object.entries(CSS_BACKGROUNDS).map(([key, bg]) => (
            <button
              key={key}
              onClick={() => update({ type: 'css', url: '', cssGradient: key })}
              className={`rounded-lg border-2 aspect-video overflow-hidden transition-all ${
                config.type === 'css' && config.cssGradient === key ? 'border-accent scale-[1.03]' : 'border-border hover:border-accent/40'
              }`}
              style={{ background: bg.css.replace(/\n\s*/g, '') }}
              title={bg.name}
            >
              <span className="text-[8px] text-white/60 drop-shadow">{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current background preview */}
      {config.type !== 'none' && config.type !== 'css' && config.url && (
        <div className="relative mb-4 rounded-lg overflow-hidden border border-border h-32">
          <img
            src={config.url}
            alt="Background preview"
            className="w-full h-full object-cover"
            style={{ objectPosition: `${config.focalX}% ${config.focalY}%` }}
          />
          <div className="absolute inset-0 bg-background" style={{ opacity: config.scrimOpacity }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-text-primary font-medium">Preview with scrim</p>
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red/80 text-white rounded-full hover:bg-red transition-colors"
            title="Remove background"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => canUseFeature(getUserTier(), 'photo-backgrounds') ? setShowPresets(!showPresets) : alert('Photo backgrounds require a Pro subscription.')}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <ImageIcon size={13} />
          {showPresets ? 'Hide Photos' : 'Photo Backgrounds'}
          {!canUseFeature(getUserTier(), 'photo-backgrounds') && <Lock size={10} className="ml-1 opacity-60" />}
        </button>
        <button
          onClick={() => canUseFeature(getUserTier(), 'custom-upload-bg') ? fileRef.current?.click() : alert('Custom uploads require a Pro subscription.')}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary rounded-lg text-xs hover:text-text-primary hover:border-accent/40 transition-colors"
        >
          <Upload size={13} />
          Upload Image
        </button>
        {config.type !== 'none' && (
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-muted rounded-lg text-xs hover:text-red hover:border-red/40 transition-colors"
          >
            <RotateCcw size={13} />
            Remove
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* URL paste */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUrlPaste()}
          placeholder="Paste image URL..."
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleUrlPaste}
          disabled={!urlInput.trim()}
          className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-lg text-xs hover:bg-accent/20 transition-colors disabled:opacity-30"
        >
          Apply
        </button>
      </div>

      {/* Preset gallery */}
      {showPresets && (
        <div className="mb-4">
          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                !activeCategory ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  activeCategory === cat ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-text-muted hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.url)}
                className={`relative group rounded-lg overflow-hidden border-2 aspect-video transition-all ${
                  config.url === preset.url ? 'border-accent scale-[1.02]' : 'border-transparent hover:border-accent/40'
                }`}
              >
                <img
                  src={preset.url.replace('w=1920', 'w=400')}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[9px] text-white font-medium">{preset.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls — only show when background is set */}
      {config.type !== 'none' && config.url && (
        <div className="space-y-4 pt-3 border-t border-border">
          {/* Focal Point */}
          <div>
            <label className="block text-xs text-text-muted mb-2">Focal Point</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted">Horizontal ({config.focalX}%)</label>
                <input
                  type="range" min={0} max={100} step={1}
                  value={config.focalX}
                  onChange={e => update({ focalX: Number(e.target.value) })}
                  className="w-full accent-accent h-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">Vertical ({config.focalY}%)</label>
                <input
                  type="range" min={0} max={100} step={1}
                  value={config.focalY}
                  onChange={e => update({ focalY: Number(e.target.value) })}
                  className="w-full accent-accent h-1"
                />
              </div>
            </div>
          </div>

          {/* Zoom */}
          <div>
            <label className="text-xs text-text-muted">Zoom ({config.zoom.toFixed(1)}x)</label>
            <input
              type="range" min={1} max={2} step={0.05}
              value={config.zoom}
              onChange={e => update({ zoom: Number(e.target.value) })}
              className="w-full accent-accent h-1 mt-1"
            />
          </div>

          {/* Blur */}
          <div>
            <label className="text-xs text-text-muted">Background Blur ({config.blur}px)</label>
            <input
              type="range" min={0} max={20} step={1}
              value={config.blur}
              onChange={e => update({ blur: Number(e.target.value) })}
              className="w-full accent-accent h-1 mt-1"
            />
          </div>

          {/* Scrim Darkness */}
          <div>
            <label className="text-xs text-text-muted">Overlay Darkness ({Math.round(config.scrimOpacity * 100)}%)</label>
            <input
              type="range" min={0.3} max={0.95} step={0.05}
              value={config.scrimOpacity}
              onChange={e => update({ scrimOpacity: Number(e.target.value) })}
              className="w-full accent-accent h-1 mt-1"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Higher = more contrast for text readability (AAA compliance at 75%+)
            </p>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar.value}
                  onClick={() => update({ aspectRatio: ar.value })}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    config.aspectRatio === ar.value
                      ? 'bg-accent/20 text-accent font-medium'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
