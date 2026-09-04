import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export default function Toast({
  id,
  type = 'info',
  message,
  duration = 4000,
  onClose,
}) {
  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-sky-500/30',
  }

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-card/95 backdrop-blur-md border ${
        borders[type] || borders.info
      } shadow-lg text-text animate-slide-in min-w-[280px] max-w-md pointer-events-auto`}
    >
      {icons[type] || icons.info}
      <div className="flex-1 text-sm font-medium leading-snug">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="text-text-muted hover:text-text rounded p-0.5 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
