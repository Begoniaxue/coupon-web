import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.name || '',
    userRole: (state) => state.userInfo?.role || ''
  },

  actions: {
    async login(credentials) {
      try {
        const res = await login(credentials)
        this.token = res.data.token
        this.userInfo = res.data.user
        
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
        
        return res
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await logout()
      } finally {
        this.clearAuth()
      }
    },

    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return res
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    clearAuth() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
