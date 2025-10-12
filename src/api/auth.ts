import api from './index'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface SSOCallbackRequest {
  code: string
  state?: string
  ip_address: string
}

export interface UserInfo {
  id: number
  employee_id: string
  email: string
  full_name: string
  role: 'Admin' | 'Manager' | 'Editor' | 'Viewer'
  team: string
  is_active: boolean
  created_at: string
  last_login: string
}

export interface UserPermissions {
  user_id: number
  role: string
  permissions: {
    applications: string[]
    subtasks: string[]
    reports: string[]
    users: string[]
    audit: string[]
    notifications: string[]
  }
}

export interface MenuItem {
  id: string
  name: string
  title: string
  path: string
  icon: string
  order: number
  enabled: boolean
  badge?: string
  badge_type?: string
}

export interface MenuGroup {
  id: string
  title: string
  order: number
  items: MenuItem[]
}

export interface MenuPermissionsResponse {
  user_role: string
  menu_groups: MenuGroup[]
}

export class AuthAPI {
  // SSO Callback
  static async ssoCallback(data: SSOCallbackRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/sso/callback', data)
    return response.data
  }

  // Development Login
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // Refresh Token
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    return response.data
  }

  // Get Current User
  static async getCurrentUser(): Promise<UserInfo> {
    const response = await api.get('/auth/me')
    return response.data
  }

  // Get User Permissions
  static async getUserPermissions(): Promise<UserPermissions> {
    const response = await api.get('/auth/permissions')
    return response.data
  }

  // Get Menu Permissions
  static async getMenuPermissions(): Promise<MenuPermissionsResponse> {
    const response = await api.get('/auth/menu-permissions')
    return response.data
  }

  // Logout
  static async logout(sessionId?: string): Promise<{ message: string }> {
    const response = await api.post('/auth/logout', {
      session_id: sessionId
    })
    return response.data
  }

  // Helper method to save login response
  static saveTokens(loginResponse: LoginResponse): void {
    localStorage.setItem('access_token', loginResponse.access_token)
    localStorage.setItem('refresh_token', loginResponse.refresh_token)
    localStorage.setItem('token_type', loginResponse.token_type)
    localStorage.setItem('expires_in', loginResponse.expires_in.toString())
  }

  // Helper method to clear tokens
  static clearTokens(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('expires_in')
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }
}