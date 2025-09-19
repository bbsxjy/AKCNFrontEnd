import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthAPI, type UserInfo, type UserPermissions, type LoginRequest } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>({
    id: 1,
    employee_id: 'TEST001',
    email: 'admin@test.com',
    full_name: '测试管理员',
    role: 'Admin',
    team: '研发一部',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString()
  })
  const permissions = ref<UserPermissions | null>({
    user_id: 1,
    role: 'Admin',
    permissions: {
      applications: ['create', 'read', 'update', 'delete'],
      subtasks: ['create', 'read', 'update', 'delete'],
      reports: ['create', 'read', 'export'],
      users: ['create', 'read', 'update', 'delete'],
      audit: ['read', 'export'],
      notifications: ['create', 'read', 'manage']
    }
  })
  const token = ref<string | null>('token_1_admin_full_access_test_2024')
  const loading = ref(false)

  const isAuthenticated = computed(() => true) // Always authenticated for testing
  
  const hasPermission = (resource: string, action: string) => {
    if (!permissions.value) return false
    const resourcePermissions = permissions.value.permissions[resource as keyof typeof permissions.value.permissions]
    return Array.isArray(resourcePermissions) && resourcePermissions.includes(action)
  }

  const isAdmin = computed(() => user.value?.role === 'Admin')
  const canManageApplications = computed(() => hasPermission('applications', 'create') || isAdmin.value)
  const canManageSubtasks = computed(() => hasPermission('subtasks', 'create') || isAdmin.value)

  // Check if user has a specific role
  const hasRole = (role: string): boolean => {
    if (!user.value) return false
    return user.value.role?.toLowerCase() === role.toLowerCase()
  }

  const loadUserInfo = async () => {
    if (!token.value) return false

    try {
      loading.value = true
      const [userInfo, userPermissions] = await Promise.all([
        AuthAPI.getCurrentUser(),
        AuthAPI.getUserPermissions()
      ])
      
      user.value = userInfo
      permissions.value = userPermissions
      return true
    } catch (error) {
      console.error('Failed to load user info:', error)
      logout()
      return false
    } finally {
      loading.value = false
    }
  }

  const login = async (loginData: LoginRequest) => {
    try {
      loading.value = true
      const loginResponse = await AuthAPI.login(loginData)
      
      // Save tokens
      AuthAPI.saveTokens(loginResponse)
      token.value = loginResponse.access_token
      
      // Load user info
      const success = await loadUserInfo()
      
      if (success) {
        ElMessage.success('登录成功')
      }
      
      return success
    } catch (error: any) {
      console.error('Login failed:', error)
      ElMessage.error('登录失败：' + (error.response?.data?.detail || error.message))
      return false
    } finally {
      loading.value = false
    }
  }

  const ssoLogin = async (code: string, state?: string) => {
    try {
      loading.value = true
      const loginResponse = await AuthAPI.ssoCallback({
        code,
        state,
        ip_address: 'frontend' // Will be set by server
      })
      
      // Save tokens
      AuthAPI.saveTokens(loginResponse)
      token.value = loginResponse.access_token
      
      // Load user info
      const success = await loadUserInfo()
      
      if (success) {
        ElMessage.success('SSO登录成功')
      }
      
      return success
    } catch (error: any) {
      console.error('SSO login failed:', error)
      ElMessage.error('SSO登录失败：' + (error.response?.data?.detail || error.message))
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await AuthAPI.logout()
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local state regardless of API call result
      user.value = null
      permissions.value = null
      token.value = null
      AuthAPI.clearTokens()
      ElMessage.success('退出成功')
    }
  }

  const refreshUserInfo = async () => {
    try {
      await loadUserInfo()
    } catch (error) {
      console.error('Failed to refresh user info:', error)
    }
  }

  // Initialize auth state on store creation - skip for testing
  const initializeAuth = async () => {
    // Skip auth initialization for testing
    console.log('Auth initialized with test user')
  }

  return {
    user,
    permissions,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    canManageApplications,
    canManageSubtasks,
    hasPermission,
    hasRole,
    loadUserInfo,
    login,
    ssoLogin,
    logout,
    refreshUserInfo,
    initializeAuth
  }
})