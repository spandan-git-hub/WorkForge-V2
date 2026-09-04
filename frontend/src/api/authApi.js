import axiosClient from './axiosClient'

export const authApi = {
  async register(data) {
    const res = await axiosClient.post('/api/v1/auth/register', data)
    return res.data
  },

  async login(data) {
    const res = await axiosClient.post('/api/v1/auth/login', data)
    return res.data
  },

  async getMe() {
    const res = await axiosClient.get('/api/v1/auth/me')
    return res.data
  },
}

export default authApi
