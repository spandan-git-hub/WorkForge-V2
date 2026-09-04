import axiosClient from './axiosClient'

export async function getUserSkills() {
  const response = await axiosClient.get('/api/v1/skills')
  return response.data
}

export async function addSkill(data) {
  const response = await axiosClient.post('/api/v1/skills', data)
  return response.data
}

export async function updateSkill(skillId, data) {
  const response = await axiosClient.patch(`/api/v1/skills/${skillId}`, data)
  return response.data
}

export async function deleteSkill(skillId) {
  const response = await axiosClient.delete(`/api/v1/skills/${skillId}`)
  return response.data
}

export async function getSkillCatalog() {
  const response = await axiosClient.get('/api/v1/skills/catalog')
  return response.data
}
