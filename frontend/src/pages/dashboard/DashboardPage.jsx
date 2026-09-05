import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  Layers,
  Sparkles,
  Calendar,
  ArrowRight,
  MapPin,
  Target,
  AlertCircle,
  PlusCircle,
} from 'lucide-react'

import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EventStatusBadge from '../../components/events/EventStatusBadge'
import { profileApi } from '../../api/profileApi'
import useDocumentTitle from '../../hooks/useDocumentTitle'


const PROFICIENCY_CONFIG = [
  { level: '1', name: 'Beginner', color: '#64748b' },
  { level: '2', name: 'Basic', color: '#0284c7' },
  { level: '3', name: 'Intermediate', color: '#6366f1' },
  { level: '4', name: 'Advanced', color: '#8b5cf6' },
  { level: '5', name: 'Expert', color: '#10b981' },
]

function ProficiencyTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface-card/95 backdrop-blur-md border border-border p-2.5 rounded-xl shadow-xl text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-text">{data.name} (Lv {data.level})</span>
        </div>
        <div className="text-text-muted pl-4.5">
          <span className="font-medium text-text">{data.value}</span> {data.value === 1 ? 'skill' : 'skills'}
        </div>
      </div>
    )
  }
  return null
}

function DashboardSkeleton() {
  return (
    <PageWrapper
      title="Welcome back..."
      subtitle="Gathering your skill progression, gap analysis, and events..."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Skeleton height="74px" className="rounded-xl" />
        <Skeleton height="74px" className="rounded-xl" />
        <Skeleton height="74px" className="rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton height="400px" className="rounded-2xl" />
        <Skeleton height="400px" className="rounded-2xl" />
        <Skeleton height="400px" className="rounded-2xl" />
      </div>
    </PageWrapper>
  )
}

export default function DashboardPage() {

  useDocumentTitle('Dashboard')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: profileApi.getDashboard,
  })


  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <PageWrapper
        title="Dashboard Overview"
        subtitle="Error loading your personalized dashboard"
      >
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
            {error?.response?.data?.detail || error?.message || 'An unexpected error occurred while fetching your data.'}
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Try Again
          </Button>
        </Card>
      </PageWrapper>
    )
  }

  const userName = data?.user?.name || 'Developer'
  const targetRole = data?.user?.target_role || 'General Software Engineering'
  const skillCount = data?.skill_count ?? 0

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  // Format data for Donut PieChart
  const pieData = PROFICIENCY_CONFIG.map((cfg) => ({
    name: cfg.name,
    level: cfg.level,
    value: data?.proficiency_distribution?.[cfg.level] || 0,
    color: cfg.color,
  })).filter((item) => item.value > 0)

  return (
    <PageWrapper
      title={`Welcome back, ${userName} 👋`}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{todayFormatted}</span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5 text-indigo-300 font-medium">
            <Target className="w-3.5 h-3.5" />
            Track: {targetRole}
          </span>
        </span>
      }
    >
      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/skills" className="group">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/70 bg-surface-card/60 hover:bg-surface-hover hover:border-primary/50 transition-all duration-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                Skill Inventory
              </h4>
              <p className="text-xs text-text-muted truncate">Manage & level up technologies</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link to="/ai-insights" className="group">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/70 bg-surface-card/60 hover:bg-surface-hover hover:border-primary/50 transition-all duration-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                Run Gap Analysis
              </h4>
              <p className="text-xs text-text-muted truncate">AI recommendations for {targetRole}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link to="/events" className="group">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/70 bg-surface-card/60 hover:bg-surface-hover hover:border-primary/50 transition-all duration-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                Browse Events
              </h4>
              <p className="text-xs text-text-muted truncate">Conferences, hackathons & meetups</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Main 3-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Skill Snapshot */}
        <Card
          title="Skill Snapshot"
          subtitle="Inventory & proficiency breakdown"
          action={
            <Link to="/skills">
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          }
          className="flex flex-col justify-between"
        >
          {skillCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-text-muted mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-text mb-1">No Skills Added Yet</h4>
              <p className="text-xs text-text-muted max-w-xs mb-5">
                Start tracking your stack to unlock custom gap analyses and targeted learning paths.
              </p>
              <Link to="/skills">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Add Your First Skill
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-hover/40 border border-border/50">
                <div>
                  <span className="text-2xl font-bold text-text tracking-tight">{skillCount}</span>
                  <p className="text-xs text-text-muted">Total Verified Skills</p>
                </div>
                <Badge variant="primary" size="md">
                  Active Stack
                </Badge>
              </div>

              {/* Donut Chart */}
              <div className="h-[180px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ProficiencyTooltip />} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#1e293b"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-text">{skillCount}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">Skills</span>
                </div>
              </div>

              {/* Proficiency Level Legend Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                {PROFICIENCY_CONFIG.map((cfg) => {
                  const count = data?.proficiency_distribution?.[cfg.level] || 0
                  return (
                    <div
                      key={cfg.level}
                      className="flex items-center justify-between text-xs px-2 py-1 rounded bg-surface-hover/30"
                    >
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span>{cfg.name}</span>
                      </span>
                      <span className="font-semibold text-text">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* CARD 2: Top Skill Gaps */}
        <Card
          title="Top Skill Gaps"
          subtitle={`Priority targets for ${targetRole}`}
          action={
            <Link to="/ai-insights">
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5">
                AI Insights <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          }
          className="flex flex-col justify-between"
        >
          {data?.top_gaps === null ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-text mb-1">No Gap Analysis Run</h4>
              <p className="text-xs text-text-muted max-w-xs mb-5">
                Benchmark your proficiencies against standard industry expectations for your target role.
              </p>
              <Link to="/ai-insights">
                <Button variant="primary" size="sm" icon={Sparkles}>
                  Run First Gap Analysis
                </Button>
              </Link>
            </div>
          ) : data.top_gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center text-success mb-3 text-lg font-bold">
                ✓
              </div>
              <h4 className="text-sm font-semibold text-text mb-1">No Gaps Found!</h4>
              <p className="text-xs text-text-muted max-w-xs mb-5">
                You meet or exceed all benchmark proficiencies for {targetRole}.
              </p>
              <Link to="/ai-insights">
                <Button variant="secondary" size="sm">
                  View Skill Recommendations
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.top_gaps.map((gap, idx) => {
                const severityVariant =
                  gap.severity === 'High'
                    ? 'danger'
                    : gap.severity === 'Medium'
                    ? 'warning'
                    : 'info'

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-surface-hover/30 hover:border-border transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-text text-sm">{gap.skill}</span>
                      <Badge variant={severityVariant} size="sm">
                        {gap.severity} Priority
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                      <span>Current: Lv {gap.current}</span>
                      <span className="font-medium text-text">Req: Lv {gap.required}</span>
                    </div>

                    <div className="w-full bg-surface-card h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          gap.severity === 'High'
                            ? 'bg-rose-500'
                            : gap.severity === 'Medium'
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, Math.round((gap.current / gap.required) * 100)))}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              <div className="pt-2 text-right">
                <Link
                  to="/ai-insights"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  View full learning roadmap <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* CARD 3: Upcoming Events */}
        <Card
          title="Upcoming Events"
          subtitle="Events you are tracking"
          action={
            <Link to="/events">
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5">
                Browse All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          }
          className="flex flex-col justify-between"
        >
          {data?.upcoming_events?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-text mb-1">No Events Tracked Yet</h4>
              <p className="text-xs text-text-muted max-w-xs mb-5">
                Browse upcoming conferences, workshops, and hackathons and mark your interest to see them here.
              </p>
              <Link to="/events">
                <Button variant="secondary" size="sm" icon={Calendar}>
                  Browse Tech Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcoming_events.map((event) => {
                const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                const interestStatusVariant =
                  event.user_interest_status === 'registered'
                    ? 'success'
                    : event.user_interest_status === 'attended'
                    ? 'info'
                    : 'warning'

                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-3 rounded-xl border border-border/60 bg-surface-hover/30 hover:border-primary/40 hover:bg-surface-hover/60 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EventStatusBadge type={event.event_type} size="sm" />
                        {event.user_interest_status && (
                          <Badge variant={interestStatusVariant} size="sm">
                            {event.user_interest_status.charAt(0).toUpperCase() +
                              event.user_interest_status.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted shrink-0">{eventDate}</span>
                    </div>

                    <h5 className="text-sm font-semibold text-text group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {event.name}
                    </h5>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {event.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0 text-text-muted/80" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                      {event.skills?.length > 0 && (
                        <span className="truncate text-text-muted/80">
                          {event.skills.slice(0, 2).join(', ')}
                          {event.skills.length > 2 && ` +${event.skills.length - 2}`}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}

              <div className="pt-2 text-right">
                <Link
                  to="/events"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Explore community calendar <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}
