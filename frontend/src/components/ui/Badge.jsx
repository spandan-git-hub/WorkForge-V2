export default function Badge({
  label,
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) {
  const content = label || children

  const variantStyles = {
    neutral: 'bg-surface-card text-text-muted border-border',
    primary: 'bg-primary/15 text-indigo-300 border-primary/30',
    success: 'bg-success/15 text-emerald-400 border-success/30',
    warning: 'bg-warning/15 text-amber-400 border-warning/30',
    danger: 'bg-danger/15 text-rose-400 border-danger/30',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {content}
    </span>
  )
}
