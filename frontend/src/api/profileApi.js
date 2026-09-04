import axiosClient from './axiosClient'

export const profileApi = {
  async getProfile() {
    const res = await axiosClient.get('/api/v1/users/profile')
    return res.data
  },

  async updateProfile(data) {
    const res = await axiosClient.patch('/api/v1/users/profile', data)
    return res.data
  },
}

export default profileApi
