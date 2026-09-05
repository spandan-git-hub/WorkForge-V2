import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  Check,
  Bookmark,
  CheckCheck,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

import { getEventById, setInterest, removeInterest } from '../../api/eventsApi'
import { queryKeys } from '../../store/queryKeys'
import { useToast } from '../../hooks/useToast'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import EventStatusBadge from '../../components/events/EventStatusBadge'
import useDocumentTitle from '../../hooks/useDocumentTitle'


export default function EventDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Fetch event details
  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => getEventById(id),
    enabled: Boolean(id),
  })

  useDocumentTitle(event?.name ? event.name : 'Event Details')


  // Set interest mutation
  const setInterestMutation = useMutation({
    mutationFn: (status) => setInterest(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast({
        type: 'success',
        title: 'Status updated',
        message: `Your status is set to ${status}.`,
      })
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.detail || 'Failed to update interest status.',
      })
    },
  })

  // Remove interest mutation
  const removeInterestMutation = useMutation({
    mutationFn: () => removeInterest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast({
        type: 'info',
        title: 'Tracking cleared',
        message: 'Event removed from your tracked list.',
      })
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.detail || 'Failed to remove status.',
      })
    },
  })

  const handleSetStatus = (status) => {
    if (event?.user_interest_status === status) {
      // Toggle off if already active
      removeInterestMutation.mutate()
    } else {
      setInterestMutation.mutate(status)
    }
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isMutating = setInterestMutation.isPending || removeInterestMutation.isPending

  if (isError) {
    return (
      <PageWrapper
        title="Event Not Found"
        action={
          <Link to="/events">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Back to Events
            </Button>
          </Link>
        }
      >
        <Card className="text-center py-12">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-2">Event Not Found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-6">
            {error?.response?.data?.detail || "The event you are looking for doesn't exist or was removed."}
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/events">
              <Button variant="secondary" size="sm">
                Browse Events
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </Card>
      </PageWrapper>
    )
  }

  if (isLoading || !event) {
    return (
      <PageWrapper
        title="Loading Event..."
        action={
          <Link to="/events">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Back to Events
            </Button>
          </Link>
        }
      >
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <Skeleton width="20%" height="24px" className="rounded-full" />
            <Skeleton width="60%" height="36px" />
            <div className="flex gap-4">
              <Skeleton width="30%" height="20px" />
              <Skeleton width="30%" height="20px" />
            </div>
          </div>
          <div className="glass rounded-2xl border border-border p-6 space-y-3">
            <Skeleton width="40%" height="24px" />
            <Skeleton width="100%" height="80px" />
          </div>
        </div>
      </PageWrapper>
    )
  }

  const {
    name,
    event_type,
    start_date,
    end_date,
    location,
    organizer,
    description,
    skills = [],
    url,
    user_interest_status,
  } = event

  return (
    <PageWrapper
      title="Event Overview"
      action={
        <Link to="/events">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Events
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="glass rounded-2xl border border-border p-6 relative overflow-hidden shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <EventStatusBadge type={event_type} size="md" />
              {organizer && (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users className="w-3.5 h-3.5" />
                  Organized by <strong className="text-text font-medium">{organizer}</strong>
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">
              {name}
            </h2>

            {/* Meta Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/50 text-xs text-text-muted">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-text">Dates & Time</div>
                  <div>Starts: {formatDateTime(start_date)}</div>
                  {end_date && <div>Ends: {formatDateTime(end_date)}</div>}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-text">Location</div>
                  <div>{location || 'Online Event'}</div>
                </div>
              </div>
            </div>

            {url && (
              <div className="mt-6 pt-4 border-t border-border/50 flex justify-start">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-indigo-300 hover:bg-primary/20 hover:text-white transition text-xs font-semibold"
                >
                  <span>Visit Official Event Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Description Card */}
          <Card title="About this Event">
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-text-muted">
              {description ? (
                <p className="whitespace-pre-line">{description}</p>
              ) : (
                <p className="italic text-text-muted/60">No detailed description provided for this event.</p>
              )}
            </div>
          </Card>

          {/* Skills Covered Card */}
          {skills && skills.length > 0 && (
            <Card title="Skills & Topics Covered">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="neutral" size="md">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar / Status Control (1 Col) */}
        <div className="space-y-6">
          <Card title="Your Participation Status" subtitle="Keep track of your tech journey">
            <div className="space-y-2.5 mb-6">
              {/* Interested Button */}
              <button
                type="button"
                onClick={() => handleSetStatus('interested')}
                disabled={isMutating}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  user_interest_status === 'interested'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-surface-card/70 border-border text-text-muted hover:border-amber-500/30 hover:text-text'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  Interested
                </span>
                {user_interest_status === 'interested' && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* Registered Button */}
              <button
                type="button"
                onClick={() => handleSetStatus('registered')}
                disabled={isMutating}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  user_interest_status === 'registered'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-surface-card/70 border-border text-text-muted hover:border-emerald-500/30 hover:text-text'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Registered
                </span>
                {user_interest_status === 'registered' && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              {/* Attended Button */}
              <button
                type="button"
                onClick={() => handleSetStatus('attended')}
                disabled={isMutating}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  user_interest_status === 'attended'
                    ? 'bg-primary/20 border-primary/50 text-indigo-300 shadow-sm'
                    : 'bg-surface-card/70 border-border text-text-muted hover:border-primary/30 hover:text-text'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-indigo-400" />
                  Attended
                </span>
                {user_interest_status === 'attended' && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            </div>

            {user_interest_status && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-danger hover:text-danger hover:bg-danger/10"
                icon={X}
                onClick={() => removeInterestMutation.mutate()}
                isLoading={removeInterestMutation.isPending}
              >
                Clear My Status
              </Button>
            )}

            <div className="mt-5 pt-4 border-t border-border/40 text-[11px] text-text-muted flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                Tracking events helps WorkForge recommend relevant skills and upcoming networking opportunities.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
