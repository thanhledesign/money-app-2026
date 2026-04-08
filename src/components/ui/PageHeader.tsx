import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { getPageTitle, DEFAULT_PAGE_TITLES } from '@/hooks/usePageTitles'

const STORAGE_KEY = 'money-app-page-titles'

function saveTitle(key: string, value: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const titles = raw ? JSON.parse(raw) : {}
    if (value === DEFAULT_PAGE_TITLES[key] || value === '') {
      delete titles[key]
    } else {
      titles[key] = value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(titles))
  } catch { /* ignore */ }
}

interface PageHeaderProps {
  icon: string
  title: string
  subtitle: string
  rightContent?: React.ReactNode
  titleKey?: string
}

export function PageHeader({ icon, title, subtitle, rightContent, titleKey }: PageHeaderProps) {
  const displayTitle = titleKey ? getPageTitle(titleKey, title) : title
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(displayTitle)
  const [currentTitle, setCurrentTitle] = useState(displayTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = () => {
    if (!titleKey) return
    setEditValue(currentTitle)
    setEditing(true)
  }

  const saveEdit = () => {
    if (!titleKey) return
    const trimmed = editValue.trim()
    const final = trimmed || DEFAULT_PAGE_TITLES[titleKey] || title
    saveTitle(titleKey, final)
    setCurrentTitle(final)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
          <span>{icon}</span>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') cancelEdit()
              }}
              onBlur={saveEdit}
              className="bg-transparent border-b border-accent text-2xl font-semibold text-text-primary outline-none w-auto"
              style={{ minWidth: '100px' }}
            />
          ) : (
            <span
              onClick={startEdit}
              className={titleKey ? 'cursor-pointer hover:text-accent transition-colors group/title inline-flex items-center gap-1.5' : ''}
              title={titleKey ? 'Click to rename' : undefined}
            >
              {currentTitle}
              {titleKey && <Pencil size={14} className="opacity-0 group-hover/title:opacity-40 transition-opacity" />}
            </span>
          )}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
      </div>
      {rightContent}
    </div>
  )
}
