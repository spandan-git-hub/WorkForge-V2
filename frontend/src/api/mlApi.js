import axiosClient from './axiosClient'

/**
 * Fetch list of available engineering target roles
 */
export async function getAvailableRoles() {
  const response = await axiosClient.get('/api/v1/ml/roles')
  return response.data
}

/**
 * Run ML gap analysis for current user against a target role
 * @param {string} targetRole
 */
export async function runGapAnalysis(targetRole) {
  const response = await axiosClient.post('/api/v1/ml/gap-analysis', {
    target_role: targetRole,
  })
  return response.data
}

/**
 * Placeholder for Phase 8: Get prioritized skill recommendations
 */
export async function getRecommendations() {
  const response = await axiosClient.get('/api/v1/ml/recommendations')
  return response.data
}

/**
 * Placeholder for Phase 9: Get resource suggestions for a skill
 * @param {string} skillName
 */
export async function getResources(skillName) {
  const response = await axiosClient.get(`/api/v1/ml/resources/${encodeURIComponent(skillName)}`)
  return response.data
}
