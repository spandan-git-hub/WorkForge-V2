import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import GapAnalysisChart from '../../components/ml/GapAnalysisChart'
import { getAvailableRoles, runGapAnalysis } from '../../api/mlApi'
import { queryKeys } from '../../store/queryKeys'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatSkillLevel } from '../../utils/formatSkillLevel'

export default function AIInsightsPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [selectedRole, setSelectedRole] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  // Fetch available roles from backend
  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useQuery({
    queryKey: queryKeys.ml.roles,
    queryFn: getAvailableRoles,
    staleTime: 10 * 60 * 1000,
  })

  // Pre-fill selectedRole with user's target_role or the first available role
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      if (user?.target_role && roles.includes(user.target_role)) {
        setSelectedRole(user.target_role)
      } else {
        setSelectedRole(roles[0])
      }
    }
  }, [roles, user?.target_role, selectedRole])

  // Gap analysis mutation
  const gapMutation = useMutation({
    mutationFn: (role) => runGapAnalysis(role),
    onSuccess: (data) => {
      setAnalysisResult(data)
      toast.success(`Gap analysis completed for ${data.target_role}!`)
    },
    onError: (err) => {
      const message = err.response?.data?.detail || 'Failed to run gap analysis.'
      toast.error(message)
    },
  })

  const handleRunAnalysis = (e) => {
    e?.preventDefault()
    if (!selectedRole) {
      toast.error('Please select a target role.')
      return
    }
    gapMutation.mutate(selectedRole)
  }

  // Calculate quick metrics from results
  const totalGaps = analysisResult?.gaps?.length || 0
  const highSeverityGaps =
    analysisResult?.gaps?.filter((g) => g.severity === 'High').length || 0
  const mediumSeverityGaps =
    analysisResult?.gaps?.filter((g) => g.severity === 'Medium').length || 0

  return (
    <PageWrapper
      title="AI Career Insights"
      subtitle="Machine learning-powered skill gap analysis and personalized progression paths."
    >
      <div className="space-y-8">
        {/* Navigation / Feature Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm"
          >
            <span>Section A: Gap Analysis</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-muted hover:text-text text-sm font-medium opacity-60 cursor-not-allowed"
          >
            <span>Section B: Recommendations</span>
            <Badge variant="neutral" size="sm">Phase 8</Badge>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-muted hover:text-text text-sm font-medium opacity-60 cursor-not-allowed"
          >
            <span>Section C: Learning Resources</span>
            <Badge variant="neutral" size="sm">Phase 9</Badge>
          </button>
        </div>

        {/* Section A: Role Selector & Action Card */}
        <Card
          title="Role Requirements & Gap Analysis"
          subtitle="Compare your existing inventory against industry expectations for your chosen role."
        >
          {isRolesLoading ? (
            <div className="space-y-3">
              <Skeleton height="42px" className="w-full max-w-md" />
              <Skeleton height="38px" className="w-36" />
            </div>
          ) : isRolesError ? (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
              Failed to load available roles. Please refresh or try again later.
            </div>
          ) : (
            <form onSubmit={handleRunAnalysis} className="space-y-4 max-w-2xl">
              <div>
                <label
                  htmlFor="target-role-select"
                  className="block text-sm font-medium text-text mb-1.5"
                >
                  Select Target Engineering Role
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    id="target-role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 bg-surface-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role} className="bg-surface text-text">
                        {role} {user?.target_role === role ? '(Your Profile Target)' : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={gapMutation.isPending}
                    className="sm:w-auto w-full whitespace-nowrap shadow-lg shadow-indigo-500/20"
                  >
                    Run Gap Analysis
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Our gap analyzer evaluates your recorded proficiencies against requirements across 15+ specialized technical tracks.
                </p>
              </div>
            </form>
          )}
        </Card>

        {/* Loading Skeleton during Analysis */}
        {gapMutation.isPending && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton height="90px" className="rounded-2xl" />
              <Skeleton height="90px" className="rounded-2xl" />
              <Skeleton height="90px" className="rounded-2xl" />
            </div>
            <Card title="Analyzing Skill Profile...">
              <div className="space-y-4 py-6 text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-text-muted">
                  Cross-referencing your skill inventory with industry benchmarks for{' '}
                  <span className="text-primary font-semibold">{selectedRole}</span>...
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysisResult && !gapMutation.isPending && (
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-card border border-border p-4 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Target Role
                </span>
                <p className="text-xl font-bold text-text mt-1 truncate">
                  {analysisResult.target_role}
                </p>
                <span className="text-[11px] text-text-muted">
                  Analyzed on {new Date(analysisResult.ran_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-surface-card border border-border p-4 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Identified Gaps
                </span>
                <p className="text-xl font-bold text-indigo-400 mt-1">
                  {totalGaps} {totalGaps === 1 ? 'Skill' : 'Skills'}
                </p>
                <span className="text-[11px] text-text-muted">
                  {totalGaps === 0 ? 'Fully qualified' : 'Required to meet role benchmark'}
                </span>
              </div>

              <div className="bg-surface-card border border-border p-4 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Critical Focus Areas
                </span>
                <p className="text-xl font-bold text-rose-400 mt-1">
                  {highSeverityGaps} High Priority
                </p>
                <span className="text-[11px] text-text-muted">
                  {mediumSeverityGaps} moderate priority gaps
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <Card
              title="Skill Proficiency Comparison"
              subtitle={`Visualizing current proficiency versus role target for ${analysisResult.target_role}.`}
            >
              <GapAnalysisChart gaps={analysisResult.gaps} />
            </Card>

            {/* Detailed Gap Breakdown List */}
            {analysisResult.gaps && analysisResult.gaps.length > 0 && (
              <Card
                title="Prioritized Gap Breakdown"
                subtitle="Ranked by severity and gap magnitude to help plan your learning roadmap."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {analysisResult.gaps.map((gap) => {
                    const severityVariant =
                      gap.severity === 'High'
                        ? 'danger'
                        : gap.severity === 'Medium'
                        ? 'warning'
                        : 'success'

                    return (
                      <div
                        key={gap.skill}
                        className="p-4 rounded-xl bg-surface/70 border border-border/80 hover:border-primary/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-text text-sm tracking-tight">
                            {gap.skill}
                          </h4>
                          <Badge variant={severityVariant} size="sm">
                            {gap.severity} Priority
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-text-muted">
                            <span>Your Current Level:</span>
                            <span className="font-medium text-text">
                              {gap.current > 0
                                ? `${gap.current}/5 — ${formatSkillLevel(gap.current)}`
                                : 'Not acquired yet'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-text-muted">
                            <span>Role Benchmark:</span>
                            <span className="font-medium text-indigo-300">
                              {gap.required}/5 — {formatSkillLevel(gap.required)}
                            </span>
                          </div>
                        </div>

                        {/* Visual progress comparison */}
                        <div className="pt-1">
                          <div className="w-full bg-surface-card rounded-full h-2 overflow-hidden flex border border-border/50">
                            <div
                              style={{ width: `${(gap.current / 5) * 100}%` }}
                              className="bg-primary h-full transition-all"
                              title={`Current: ${gap.current}/5`}
                            />
                            <div
                              style={{
                                width: `${(gap.gap_magnitude / 5) * 100}%`,
                              }}
                              className="bg-indigo-300/30 h-full transition-all"
                              title={`Gap: +${gap.gap_magnitude}`}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-text-muted mt-1">
                            <span>Gap: +{gap.gap_magnitude} levels</span>
                            <span>Target: {gap.required}/5</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Transition Call to Action to Section B */}
                <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/40 p-4 rounded-xl">
                  <div>
                    <h5 className="text-sm font-semibold text-text">
                      Ready to bridge these skill gaps?
                    </h5>
                    <p className="text-xs text-text-muted mt-0.5">
                      Generate a personalized, weighted learning recommendation based on market demand and synergy.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    className="whitespace-nowrap"
                  >
                    Skill Recommendations (Phase 8) →
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
