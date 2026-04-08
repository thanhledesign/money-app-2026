import { useRef, useState, useEffect, useCallback } from 'react'

interface ScrollableTableProps {
  children: React.ReactNode
  className?: string
}

export function ScrollableTable({ children, className = '' }: ScrollableTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 2
    setCanScroll(hasOverflow)
    setScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  useEffect(() => {
    checkScroll()
  })

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        onScroll={checkScroll}
      >
        {children}
      </div>
      {canScroll && !scrolledToEnd && (
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-background/80 to-transparent" />
      )}
      {canScroll && !scrolledToEnd && (
        <p className="sm:hidden text-[10px] text-text-muted text-right mt-1 pr-1 animate-pulse">
          swipe for more →
        </p>
      )}
    </div>
  )
}
