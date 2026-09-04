export default function PageWrapper({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
