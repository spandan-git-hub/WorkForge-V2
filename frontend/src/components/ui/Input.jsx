import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    id,
    type = 'text',
    icon: Icon,
    rightElement,
    className = '',
    containerClassName = '',
    helperText,
    ...props
  },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full rounded-lg bg-surface-card border text-text placeholder-text-muted/60 transition-all duration-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            Icon ? 'pl-9' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger flex items-center gap-1 animate-fade-in">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      )}
    </div>
  )
})

export default Input
