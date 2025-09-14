import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import type { User, ApiResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('sso_token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const hasPermission = (permission: string) => {
    return user.value?.permissions?.includes(permission) || false
  }

  const verifyToken = async () => {
    if (!token.value) return false

    try {
      loading.value = true
      const response = await api.get<ApiResponse<User>>('/sso/verify')
      user.value = response.data.data
      return true
    } catch (error) {
      logout()
      return false
    } finally {
      loading.value = false
    }
  }

  const login = (ssoToken: string) => {
    token.value = ssoToken
    localStorage.setItem('sso_token', ssoToken)
    return verifyToken()
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('sso_token')
  }

  const refreshPermissions = async () => {
    try {
      await api.post('/sso/refresh')
      await verifyToken()
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    hasPermission,
    verifyToken,
    login,
    logout,
    refreshPermissions
  }
})