import axiosClient from './axiosClient'

export const dashboardApi = {
  async getDashboard() {
    const res = await axiosClient.get('/api/v1/users/dashboard')
    return res.data
  },
}

export default dashboardApi
