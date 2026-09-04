import { useState, useEffect } from 'react'
import { Search, Calendar, MapPin, Tag, RotateCcw, Filter } from 'lucide-react'
import Button from '../ui/Button'

const EVENT_TYPES = [
  { id: 'conference', label: 'Conferences' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'meetup', label: 'Meetups' },
]

export default function EventFilter({ filters, onApply, onReset }) {
  const [localFilters, setLocalFilters] = useState({
    type: filters.type || [],
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    location: filters.location || '',
    skill: filters.skill || '',
  })

  useEffect(() => {
    setLocalFilters({
      type: filters.type || [],
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
      location: filters.location || '',
      skill: filters.skill || '',
    })
  }, [filters])

  const toggleType = (typeId) => {
    setLocalFilters((prev) => {
      const exists = prev.type.includes(typeId)
      const updated = exists
        ? prev.type.filter((t) => t !== typeId)
        : [...prev.type, typeId]
      return { ...prev, type: updated }
    })
  }

  const handleInputChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply(localFilters)
  }

  const handleResetClick = () => {
    const emptyFilters = {
      type: [],
      date_from: '',
      date_to: '',
      location: '',
      skill: '',
    }
    setLocalFilters(emptyFilters)
    onReset()
  }

  const activeCount =
    (localFilters.type.length > 0 ? 1 : 0) +
    (localFilters.date_from ? 1 : 0) +
    (localFilters.date_to ? 1 : 0) +
    (localFilters.location ? 1 : 0) +
    (localFilters.skill ? 1 : 0)

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl border border-border p-5 mb-8 shadow-card"
    >
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text">Filter Tech Events</span>
          {activeCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            icon={RotateCcw}
            onClick={handleResetClick}
            disabled={activeCount === 0}
          >
            Reset
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Event Types Pill Toggles */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-2">Event Types</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => {
            const isSelected = localFilters.type.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleType(t.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-indigo-200 shadow-sm'
                    : 'bg-surface-card/60 border-border text-text-muted hover:border-text-muted hover:text-text'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              From Date
            </span>
          </label>
          <input
            type="date"
            value={localFilters.date_from}
            onChange={(e) => handleInputChange('date_from', e.target.value)}
            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              To Date
            </span>
          </label>
          <input
            type="date"
            value={localFilters.date_to}
            onChange={(e) => handleInputChange('date_to', e.target.value)}
            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-text-muted" />
              Location
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Online, San Francisco..."
              value={localFilters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-surface-card border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Skill Tag */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-text-muted" />
              Skill Tag
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. React, Python, Docker..."
              value={localFilters.skill}
              onChange={(e) => handleInputChange('skill', e.target.value)}
              className="w-full bg-surface-card border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </form>
  )
}
