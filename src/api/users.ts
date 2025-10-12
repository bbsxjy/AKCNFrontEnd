import axios from './index'

export interface User {
  id: number
  sso_user_id: string
  employee_id: string
  username: string
  full_name: string
  email: string
  department: string
  team?: string
  role: 'admin' | 'manager' | 'editor' | 'viewer'
  is_active: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

export interface UserListParams {
  page?: number
  page_size?: number
  role?: string
  department?: string
  is_active?: boolean
  search?: string
}

export interface CreateUserRequest {
  sso_user_id?: string
  employee_id: string
  username: string
  full_name: string
  email: string
  department: string
  team?: string
  role: 'admin' | 'manager' | 'editor' | 'viewer'
  is_active?: boolean
}

export interface UpdateUserRequest {
  full_name?: string
  email?: string
  department?: string
  team?: string
  role?: 'admin' | 'manager' | 'editor' | 'viewer'
  is_active?: boolean
}

export interface BatchUpdateRoleRequest {
  user_ids: number[]
  role: 'admin' | 'manager' | 'editor' | 'viewer'
}

export interface BatchUpdateDepartmentRequest {
  user_ids: number[]
  department: string
}

export interface BatchUpdateTeamRequest {
  user_ids: number[]
  team: string
}

export interface BatchUpdateStatusRequest {
  user_ids: number[]
  is_active: boolean
}

export interface BatchOperationResponse {
  success_count: number
  failed_count: number
  total: number
  failed_ids: number[]
  message: string
}

export const UsersAPI = {
  /**
   * Get list of users with pagination and filters
   */
  async getUsers(params?: UserListParams) {
    const response = await axios.get('/users', { params })
    return response.data
  },

  /**
   * Get a single user by ID
   */
  async getUser(userId: number) {
    const response = await axios.get(`/users/${userId}`)
    return response.data
  },

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest) {
    const response = await axios.post('/users', userData)
    return response.data
  },

  /**
   * Update an existing user
   */
  async updateUser(userId: number, userData: UpdateUserRequest) {
    const response = await axios.put(`/users/${userId}`, userData)
    return response.data
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: number) {
    const response = await axios.delete(`/users/${userId}`)
    return response.data
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: number, role: 'admin' | 'manager' | 'editor' | 'viewer') {
    const response = await axios.patch(`/users/${userId}/role`, { role })
    return response.data
  },

  /**
   * Activate/deactivate user
   */
  async toggleUserStatus(userId: number, is_active: boolean) {
    const response = await axios.patch(`/users/${userId}/status`, { is_active })
    return response.data
  },

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: number, params?: { limit?: number; offset?: number }) {
    const response = await axios.get(`/users/${userId}/activity`, { params })
    return response.data
  },

  /**
   * Batch update user roles
   */
  async batchUpdateRole(data: BatchUpdateRoleRequest): Promise<BatchOperationResponse> {
    const response = await axios.post('/users/batch/update-role', data)
    return response.data
  },

  /**
   * Batch update user departments
   */
  async batchUpdateDepartment(data: BatchUpdateDepartmentRequest): Promise<BatchOperationResponse> {
    const response = await axios.post('/users/batch/update-department', data)
    return response.data
  },

  /**
   * Batch update user teams
   */
  async batchUpdateTeam(data: BatchUpdateTeamRequest): Promise<BatchOperationResponse> {
    const response = await axios.post('/users/batch/update-team', data)
    return response.data
  },

  /**
   * Batch update user status (activate/deactivate)
   */
  async batchUpdateStatus(data: BatchUpdateStatusRequest): Promise<BatchOperationResponse> {
    const response = await axios.post('/users/batch/update-status', data)
    return response.data
  }
}
