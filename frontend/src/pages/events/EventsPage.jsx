import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, AlertCircle, Sparkles, Inbox } from 'lucide-react'

import { getEvents, setInterest, removeInterest } from '../../api/eventsApi'
import { queryKeys } from '../../store/queryKeys'
import { useToast } from '../../hooks/useToast'
import PageWrapper from '../../components/layout/PageWrapper'
import EventFilter from '../../components/events/EventFilter'
import EventCard from '../../components/events/EventCard'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'

export default function EventsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    type: [],
    date_from: '',
    date_to: '',
    location: '',
    skill: '',
  })
  const [updatingEventId, setUpdatingEventId] = useState(null)

  // Fetch events with current filters and pagination
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.events.all({ ...filters, page }),
    queryFn: () =>
      getEvents({
        type: filters.type,
        date_from: filters.date_from ? `${filters.date_from}T00:00:00Z` : undefined,
        date_to: filters.date_to ? `${filters.date_to}T23:59:59Z` : undefined,
        location: filters.location,
        skill: filters.skill,
        page,
        per_page: 9,
      }),
    placeholderData: (prev) => prev,
  })

  // Set interest mutation
  const setInterestMutation = useMutation({
    mutationFn: ({ eventId, status }) => setInterest(eventId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast({
        type: 'success',
        title: 'Status updated',
        message: `Event status marked as ${variables.status}.`,
      })
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.detail || 'Could not update event status.',
      })
    },
    onSettled: () => {
      setUpdatingEventId(null)
    },
  })

  // Remove interest mutation
  const removeInterestMutation = useMutation({
    mutationFn: (eventId) => removeInterest(eventId),
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
        message: err.response?.data?.detail || 'Could not remove event status.',
      })
    },
    onSettled: () => {
      setUpdatingEventId(null)
    },
  })

  const handleStatusChange = (eventId, nextStatus) => {
    setUpdatingEventId(eventId)
    if (nextStatus) {
      setInterestMutation.mutate({ eventId, status: nextStatus })
    } else {
      removeInterestMutation.mutate(eventId)
    }
  }

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      type: [],
      date_from: '',
      date_to: '',
      location: '',
      skill: '',
    })
    setPage(1)
  }

  const items = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <PageWrapper
      title="Tech Events & Meetups"
      subtitle="Discover conferences, hackathons, and workshops to elevate your skills and expand your network."
    >
      {/* Filter Panel */}
      <EventFilter
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {isError && (
        <div className="glass rounded-2xl border border-danger/30 p-6 text-center my-6">
          <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-text mb-1">Failed to load events</h3>
          <p className="text-xs text-text-muted mb-4">
            {error?.response?.data?.detail || 'An unexpected error occurred while fetching events.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-border p-5 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton width="40%" height="20px" />
                <Skeleton width="30%" height="24px" className="rounded-full" />
              </div>
              <Skeleton width="80%" height="24px" />
              <div className="space-y-2">
                <Skeleton width="60%" height="16px" />
                <Skeleton width="50%" height="16px" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton width="25%" height="20px" />
                <Skeleton width="25%" height="20px" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="glass rounded-2xl border border-border p-12 text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-surface-card flex items-center justify-center mx-auto mb-4 text-text-muted">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text mb-1">No events found</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto mb-6">
            We couldn't find any events matching your selected filters. Try widening your date range or clearing specific skill keywords.
          </p>
          <Button variant="secondary" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Events Grid */}
      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-text-muted mb-4">
            <span>
              Showing <strong className="text-text">{items.length}</strong> of{' '}
              <strong className="text-text">{total}</strong> events
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Click "Track Event" to cycle status
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onStatusChange={handleStatusChange}
                isUpdating={updatingEventId === event.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-border/40">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-text-muted px-2">
                Page <strong className="text-text">{page}</strong> of{' '}
                <strong className="text-text">{pages}</strong>
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  )
}
