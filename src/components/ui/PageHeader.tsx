interface PageHeaderProps {
  icon: string
  title: string
  subtitle: string
  rightContent?: React.ReactNode
}

export function PageHeader({ icon, title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
      </div>
      {rightContent}
    </div>
  )
}
