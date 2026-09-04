export default function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  glass = true,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        glass ? 'glass' : 'bg-surface-card border-border'
      } shadow-card p-6 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-border/50">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-text tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
