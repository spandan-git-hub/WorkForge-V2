export default function EventStatusBadge({ type, size = 'md', className = '' }) {
  if (!type) return null

  const normalized = type.toLowerCase().trim()

  const config = {
    conference: {
      label: 'Conference',
      styles: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
    },
    hackathon: {
      label: 'Hackathon',
      styles: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    workshop: {
      label: 'Workshop',
      styles: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400',
    },
    meetup: {
      label: 'Meetup',
      styles: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
  }

  const current = config[normalized] || {
    label: type.charAt(0).toUpperCase() + type.slice(1),
    styles: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.styles} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  )
}
