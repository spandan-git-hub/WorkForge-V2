import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight, Check, Star, CheckCheck, Bookmark } from 'lucide-react'
import EventStatusBadge from './EventStatusBadge'
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'

export default function EventCard({
  event,
  onStatusChange,
  isUpdating = false,
}) {
  const {
    id,
    name,
    event_type,
    start_date,
    end_date,
    location,
    skills = [],
    user_interest_status,
  } = event

  // Format date range nicely
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const startDateFormatted = formatDate(start_date)
  const endDateFormatted = end_date ? formatDate(end_date) : null
  const dateDisplay =
    endDateFormatted && endDateFormatted !== startDateFormatted
      ? `${startDateFormatted} – ${endDateFormatted}`
      : startDateFormatted

  // Cycle to next status: null -> interested -> registered -> attended -> null
  const handleCycleStatus = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isUpdating) return

    let nextStatus = null
    if (!user_interest_status) {
      nextStatus = 'interested'
    } else if (user_interest_status === 'interested') {
      nextStatus = 'registered'
    } else if (user_interest_status === 'registered') {
      nextStatus = 'attended'
    } else if (user_interest_status === 'attended') {
      nextStatus = null
    }

    onStatusChange?.(id, nextStatus)
  }

  // Interest Status styling and icon
  const getInterestConfig = () => {
    switch (user_interest_status) {
      case 'interested':
        return {
          label: 'Interested',
          icon: Bookmark,
          classes: 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25',
          hint: 'Click to mark Registered',
        }
      case 'registered':
        return {
          label: 'Registered',
          icon: Check,
          classes: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25',
          hint: 'Click to mark Attended',
        }
      case 'attended':
        return {
          label: 'Attended',
          icon: CheckCheck,
          classes: 'bg-primary/20 border-primary/40 text-indigo-300 hover:bg-primary/30',
          hint: 'Click to clear status',
        }
      default:
        return {
          label: 'Track Event',
          icon: Star,
          classes: 'bg-surface border-border text-text-muted hover:border-primary/50 hover:text-text',
          hint: 'Click to mark Interested',
        }
    }
  }

  const interestConfig = getInterestConfig()
  const StatusIcon = interestConfig.icon

  const displayedSkills = skills.slice(0, 3)
  const overflowSkills = skills.length - 3

  return (
    <div className="glass rounded-2xl border border-border p-5 flex flex-col justify-between transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group">
      <div>
        {/* Card Header: Type Badge + Interest Tracker button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <EventStatusBadge type={event_type} size="sm" />
          <button
            type="button"
            onClick={handleCycleStatus}
            disabled={isUpdating}
            title={interestConfig.hint}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${interestConfig.classes}`}
          >
            {isUpdating ? (
              <Spinner size="sm" className="w-3 h-3 text-current" />
            ) : (
              <StatusIcon className="w-3.5 h-3.5" />
            )}
            <span>{interestConfig.label}</span>
          </button>
        </div>

        {/* Title */}
        <Link to={`/events/${id}`} className="block group-hover:text-primary transition-colors">
          <h4 className="text-base font-semibold text-text line-clamp-1 mb-2">
            {name}
          </h4>
        </Link>

        {/* Date & Location meta */}
        <div className="space-y-1.5 mb-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="truncate">{dateDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="truncate">{location || 'Online'}</span>
          </div>
        </div>
      </div>

      <div>
        {/* Skills tags */}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 pt-3 border-t border-border/40">
            {displayedSkills.map((sk) => (
              <Badge key={sk} variant="neutral" size="sm">
                {sk}
              </Badge>
            ))}
            {overflowSkills > 0 && (
              <Badge variant="primary" size="sm">
                +{overflowSkills}
              </Badge>
            )}
          </div>
        )}

        {/* View Details Link */}
        <div className="flex items-center justify-end pt-2">
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
