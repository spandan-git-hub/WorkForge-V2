import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import GapAnalysisChart from '../../components/ml/GapAnalysisChart'
import RecommendedSkillCard from '../../components/ml/RecommendedSkillCard'
import { getAvailableRoles, runGapAnalysis, getRecommendations } from '../../api/mlApi'
import { queryKeys } from '../../store/queryKeys'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatSkillLevel } from '../../utils/formatSkillLevel'

export default function AIInsightsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'gap-analysis' | 'recommendations'
  const [selectedRole, setSelectedRole] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [selectedSkillPreview, setSelectedSkillPreview] = useState(null)

  // 1. Fetch available roles from backend
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

  // 2. Recommendations Query (Phase 8)
  const {
    data: recommendationsData,
    isLoading: isRecsLoading,
    isError: isRecsError,
    error: recsError,
    refetch: refetchRecs,
    isFetching: isRecsFetching,
  } = useQuery({
    queryKey: queryKeys.ml.recommendations,
    queryFn: getRecommendations,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  // 3. Gap analysis mutation
  const gapMutation = useMutation({
    mutationFn: (role) => runGapAnalysis(role),
    onSuccess: (data) => {
      setAnalysisResult(data)
      // Automatically refresh recommendations on new analysis
      queryClient.invalidateQueries({ queryKey: queryKeys.ml.recommendations })
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

  const handleViewResources = (skillName) => {
    setSelectedSkillPreview(skillName)
    toast.info(
      `Resource suggestions for "${skillName}" will be available in Phase 9!`,
      { duration: 4000 }
    )
    const element = document.getElementById('phase-9-preview')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const recommendations = recommendationsData?.recommendations || []

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
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text bg-surface hover:bg-surface-hover'
            }`}
          >
            <span>Overview & All Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gap-analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'gap-analysis'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text bg-surface hover:bg-surface-hover'
            }`}
          >
            <span>Section A: Gap Analysis</span>
            {analysisResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'recommendations'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text bg-surface hover:bg-surface-hover'
            }`}
          >
            <span>Section B: Recommendations</span>
            {recommendations.length > 0 ? (
              <Badge variant="success" size="sm">
                {recommendations.length} Active
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                ML Ready
              </Badge>
            )}
          </button>

          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-muted text-sm font-medium opacity-60 cursor-not-allowed"
          >
            <span>Section C: Learning Resources</span>
            <Badge variant="neutral" size="sm">
              Phase 9
            </Badge>
          </button>
        </div>

        {/* SECTION A: Gap Analysis Section */}
        {(activeTab === 'all' || activeTab === 'gap-analysis') && (
          <div className="space-y-6">
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
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveTab('recommendations')
                          const recsEl = document.getElementById('section-b-recommendations')
                          if (recsEl) {
                            recsEl.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        className="whitespace-nowrap shadow-md shadow-indigo-500/20"
                      >
                        <span>View Skill Recommendations →</span>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: Skill Recommendations Section (Phase 8) */}
        {(activeTab === 'all' || activeTab === 'recommendations') && (
          <div id="section-b-recommendations" className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text tracking-tight">
                    Section B: AI Skill Recommendations
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-indigo-300 border border-primary/30">
                    Phase 8
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  Algorithmically ranked based on gap severity (50%), market universality across 15+ tech tracks (30%), and synergy with your current skills (20%).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isRecsFetching}
                  onClick={() => refetchRecs()}
                  className="text-xs whitespace-nowrap"
                >
                  Refresh Recommendations
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isRecsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                <Skeleton height="180px" className="rounded-2xl" />
                <Skeleton height="180px" className="rounded-2xl" />
                <Skeleton height="180px" className="rounded-2xl" />
              </div>
            ) : isRecsError ? (
              /* Error State / No Analysis Run Yet */
              <Card className="text-center py-10 bg-surface-card/60">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    ⚡
                  </div>
                  <h3 className="text-base font-semibold text-text">
                    {recsError?.response?.data?.detail?.includes('gap analysis')
                      ? 'No Gap Analysis Found'
                      : 'Skill Recommendations Unavailable'}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted">
                    {recsError?.response?.data?.detail ||
                      'Please run a gap analysis for your chosen target role above first to calculate personalized recommendations.'}
                  </p>
                  <div className="pt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveTab('gap-analysis')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      Run Gap Analysis Above
                    </Button>
                  </div>
                </div>
              </Card>
            ) : recommendations.length === 0 ? (
              /* Empty State (No Gaps Found) */
              <Card className="text-center py-10 bg-emerald-950/10 border-emerald-500/20">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="text-3xl">🎉</div>
                  <h3 className="text-base font-semibold text-emerald-300">
                    No Skill Gaps Detected
                  </h3>
                  <p className="text-xs text-text-muted">
                    Your current skill inventory meets or exceeds all required benchmarks for your analyzed target role.
                  </p>
                </div>
              </Card>
            ) : (
              /* Success State: Grid of RecommendedSkillCards */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-text-muted px-1">
                  <span>
                    Showing Top <span className="font-semibold text-text">{recommendations.length}</span> prioritized learning targets:
                  </span>
                  <span>Top 3 highlighted with high-impact badges</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec) => (
                    <RecommendedSkillCard
                      key={rec.skill}
                      recommendation={rec}
                      onViewResources={handleViewResources}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION C PREVIEW / STUB (Phase 9) */}
        {selectedSkillPreview && (
          <div
            id="phase-9-preview"
            className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-surface-card to-surface-card border border-primary/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  Phase 9 Preview
                </Badge>
                <h4 className="font-semibold text-text text-sm">
                  Curated Resources for <span className="text-primary font-bold">{selectedSkillPreview}</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkillPreview(null)}
                className="text-xs text-text-muted hover:text-text"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-text-muted">
              In Phase 9 (Resource Suggester), TF-IDF machine learning models will curate top-rated courses, books, and official documentation tailored to this skill.
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
