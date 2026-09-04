import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function RecommendedSkillCard({ recommendation, onViewResources }) {
  const { skill, priority, reason, score } = recommendation
  const isTopThree = priority <= 3

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:shadow-lg ${
        isTopThree
          ? 'bg-gradient-to-b from-surface-card to-surface border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/5'
          : 'bg-surface-card border-border/80 hover:border-primary/40 shadow-card'
      }`}
    >
      <div>
        {/* Header with Priority and Score Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {isTopThree ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <svg
                className="w-3.5 h-3.5 text-amber-400 fill-current"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>#{priority} High Priority</span>
            </span>
          ) : (
            <Badge variant="primary" size="sm">
              #{priority} Recommendation
            </Badge>
          )}

          {typeof score === 'number' && (
            <span
              className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface border border-border/60 text-text-muted"
              title="Algorithm weighted score"
            >
              Weight: {(score * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Skill Title */}
        <h3 className="text-lg font-bold text-text tracking-tight mb-2 group-hover:text-primary transition-colors">
          {skill}
        </h3>

        {/* Reason Blurb */}
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-4">
          {reason}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
        <span className="text-[11px] text-text-muted">
          Curated learning resources available
        </span>
        <Button
          variant={isTopThree ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onViewResources?.(skill)}
          className="whitespace-nowrap transition-transform active:scale-95"
        >
          <span>View Resources</span>
          <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
        </Button>
      </div>
    </div>
  )
}
