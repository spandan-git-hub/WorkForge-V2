import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function ResourceCard({ resource }) {
  const { title, type, platform, url, duration, description } = resource

  // Distinct styling configurations for resource types
  const typeConfig = {
    course: {
      label: 'Course',
      variant: 'primary',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    video: {
      label: 'Video',
      variant: 'danger',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    documentation: {
      label: 'Documentation',
      variant: 'success',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    book: {
      label: 'Book',
      variant: 'warning',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    tutorial: {
      label: 'Tutorial',
      variant: 'info',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
    interactive: {
      label: 'Interactive',
      variant: 'info',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m10 8 6 4-6 4V8z" />
        </svg>
      ),
    },
    article: {
      label: 'Article',
      variant: 'neutral',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
          <path d="M18 14h4" />
          <path d="M18 18h4" />
          <path d="M18 22h4" />
        </svg>
      ),
    },
  }

  const normalizedType = (type || 'article').toLowerCase()
  const currentConfig = typeConfig[normalizedType] || typeConfig.article

  return (
    <div className="p-5 rounded-2xl bg-surface-card border border-border/80 hover:border-primary/50 transition-all duration-200 shadow-card flex flex-col justify-between group hover:shadow-lg hover:shadow-primary/5">
      <div>
        {/* Top Badges: Type + Duration */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Badge variant={currentConfig.variant} size="sm" className="gap-1">
              {currentConfig.icon}
              <span>{currentConfig.label}</span>
            </Badge>
            {platform && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface text-text-muted border border-border/60">
                {platform}
              </span>
            )}
          </span>

          {duration && (
            <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
              <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{duration}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-text tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>
        )}
      </div>

      {/* Footer Link Action */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-muted truncate">
          {platform ? `Available on ${platform}` : 'Online learning resource'}
        </span>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:text-white hover:bg-primary transition-all duration-150 border border-primary/30 hover:border-transparent active:scale-95"
          >
            <span>Open Resource</span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : (
          <span className="text-xs text-text-muted italic">Direct link unavailable</span>
        )}
      </div>
    </div>
  )
}
