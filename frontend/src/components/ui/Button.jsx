import Spinner from './Spinner'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-indigo-500/25 focus:ring-primary',
    secondary:
      'bg-surface-card hover:bg-surface-hover text-text border border-border focus:ring-primary',
    ghost:
      'bg-transparent hover:bg-surface-card text-text-muted hover:text-text focus:ring-border',
    danger:
      'bg-danger/90 hover:bg-danger text-white shadow-md hover:shadow-red-500/25 focus:ring-danger',
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-current" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} />
      ) : null}
      <span>{children}</span>
    </button>
  )
}
