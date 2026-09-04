import axiosClient from './axiosClient'

export async function getEvents(params = {}) {
  // Clean up params (omit undefined, empty strings, null)
  const cleanParams = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleanParams[key] = value
        }
      } else {
        cleanParams[key] = value
      }
    }
  }

  const response = await axiosClient.get('/api/v1/events', {
    params: cleanParams,
    paramsSerializer: {
      indexes: null, // serializes type as type=conference&type=hackathon
    },
  })
  return response.data
}

export async function getEventById(id) {
  const response = await axiosClient.get(`/api/v1/events/${id}`)
  return response.data
}

export async function setInterest(eventId, status) {
  const response = await axiosClient.post(`/api/v1/events/${eventId}/interest`, {
    status,
  })
  return response.data
}

export async function removeInterest(eventId) {
  const response = await axiosClient.delete(`/api/v1/events/${eventId}/interest`)
  return response.data
}
