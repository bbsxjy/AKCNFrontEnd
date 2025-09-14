import api from './index'
import type { Application, ApiResponse, PaginatedResponse } from '@/types'

export interface ApplicationFilters {
  page?: number
  page_size?: number
  l2_id?: string
  app_name?: string
  status?: string
  department?: string
  year?: number
  target?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}

export const applicationApi = {
  // Get applications list
  getApplications(filters: ApplicationFilters = {}) {
    return api.get<ApiResponse<PaginatedResponse<Application>>>('/applications', {
      params: filters
    })
  },

  // Get single application
  getApplication(id: number) {
    return api.get<ApiResponse<Application>>(`/applications/${id}`)
  },

  // Create application
  createApplication(data: Partial<Application>) {
    return api.post<ApiResponse<Application>>('/applications', data)
  },

  // Update application
  updateApplication(id: number, data: Partial<Application>) {
    return api.put<ApiResponse<Application>>(`/applications/${id}`, data)
  },

  // Delete application
  deleteApplication(id: number) {
    return api.delete<ApiResponse>(`/applications/${id}`)
  },

  // Export applications
  exportApplications(filters: ApplicationFilters = {}) {
    return api.get('/reports/export', {
      params: { type: 'main', format: 'xlsx', ...filters },
      responseType: 'blob'
    })
  },

  // Get applications for current user (My Tasks)
  getMyApplications() {
    return api.get<ApiResponse<Application[]>>('/applications', {
      params: { my_tasks_only: true }
    })
  }
}