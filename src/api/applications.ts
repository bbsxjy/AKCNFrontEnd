import api from './index'

export interface ApplicationListParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
  team?: string
}

export interface ApplicationListResponse {
  total: number
  items: Application[]
}

export interface Application {
  id: number
  application_id: string
  application_name: string
  business_domain: string
  business_subdomain: string
  responsible_person: string
  responsible_team: string
  status: string
  priority: string
  kpi_classification: string
  service_tier: string
  traffic: number
  size: string
  public_cloud_vendor: string
  progress_percentage: number
  resource_progress: number
  service_progress: number
  traffic_progress: number
  transformation_target?: string  // 添加改造目标字段
  created_at: string
  updated_at: string
}

export interface CreateApplicationRequest {
  application_id: string
  application_name: string
  business_domain: string
  business_subdomain: string
  responsible_person: string
  responsible_team: string
  status: string
  priority: string
  kpi_classification: string
  service_tier: string
  traffic: number
  size: string
  public_cloud_vendor: string
}

export interface UpdateApplicationRequest {
  application_id?: string
  application_name?: string
  business_domain?: string
  business_subdomain?: string
  responsible_person?: string
  responsible_team?: string
  status?: string
  priority?: string
  kpi_classification?: string
  service_tier?: string
  traffic?: number
  size?: string
  public_cloud_vendor?: string
}

export interface BatchOperationRequest {
  operation: 'update' | 'delete'
  ids: number[]
  data?: UpdateApplicationRequest
}

export interface BatchOperationResponse {
  success: number
  failed: number
  results: any[]
}

export class ApplicationsAPI {
  // List applications with filtering and pagination
  static async getApplications(params: ApplicationListParams = {}): Promise<ApplicationListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.team) queryParams.append('team', params.team)

    const response = await api.get(`/applications?${queryParams.toString()}`)
    return response.data
  }

  // Get single application by ID
  static async getApplication(id: number): Promise<Application> {
    const response = await api.get(`/applications/${id}`)
    return response.data
  }

  // Create new application
  static async createApplication(data: CreateApplicationRequest): Promise<Application> {
    // Map frontend fields to backend fields
    const backendData = {
      l2_id: data.application_id,
      app_name: data.application_name,
      supervision_year: new Date().getFullYear(),
      transformation_target: data.business_domain === 'AK' ? 'AK' : '云原生',
      responsible_team: data.responsible_team,
      responsible_person: data.responsible_person,
      notes: `Business Domain: ${data.business_domain}, Subdomain: ${data.business_subdomain}, Size: ${data.size}, Cloud: ${data.public_cloud_vendor}`
    }

    const response = await api.post('/applications', backendData)
    return response.data
  }

  // Update application
  static async updateApplication(id: number, data: UpdateApplicationRequest): Promise<Application> {
    // Map frontend fields to backend fields
    const backendData: any = {}

    if (data.application_id) backendData.l2_id = data.application_id
    if (data.application_name) backendData.app_name = data.application_name
    if (data.responsible_team) backendData.responsible_team = data.responsible_team
    if (data.responsible_person) backendData.responsible_person = data.responsible_person
    if (data.business_domain || data.business_subdomain || data.size || data.public_cloud_vendor) {
      backendData.notes = `Business Domain: ${data.business_domain || ''}, Subdomain: ${data.business_subdomain || ''}, Size: ${data.size || ''}, Cloud: ${data.public_cloud_vendor || ''}`
    }

    const response = await api.put(`/applications/${id}`, backendData)
    return response.data
  }

  // Delete application
  static async deleteApplication(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/applications/${id}`)
    return response.data
  }

  // Batch operations
  static async batchOperation(data: BatchOperationRequest): Promise<BatchOperationResponse> {
    const response = await api.post('/applications/batch', data)
    return response.data
  }

  // Get application statistics for dashboard
  static async getApplicationStats(): Promise<{
    total: number
    active: number
    completed: number
    blocked: number
    progress_average: number
  }> {
    try {
      const applications = await this.getApplications({ limit: 1000 })
      
      const stats = {
        total: applications.total,
        active: 0,
        completed: 0,
        blocked: 0,
        progress_average: 0
      }

      if (applications.items.length > 0) {
        applications.items.forEach(app => {
          switch (app.status) {
            case '研发进行中':
            case '业务上线中':
              stats.active++
              break
            case '全部完成':
              stats.completed++
              break
            case '存在阻塞':
              stats.blocked++
              break
          }
        })

        const totalProgress = applications.items.reduce((sum, app) => sum + app.progress_percentage, 0)
        stats.progress_average = Math.round(totalProgress / applications.items.length)
      }

      return stats
    } catch (error) {
      console.error('Failed to get application stats:', error)
      return {
        total: 0,
        active: 0,
        completed: 0,
        blocked: 0,
        progress_average: 0
      }
    }
  }
}

// For backward compatibility with existing code
export const applicationApi = {
  getApplications: ApplicationsAPI.getApplications.bind(ApplicationsAPI),
  getApplication: ApplicationsAPI.getApplication.bind(ApplicationsAPI),
  createApplication: ApplicationsAPI.createApplication.bind(ApplicationsAPI),
  updateApplication: ApplicationsAPI.updateApplication.bind(ApplicationsAPI),
  deleteApplication: ApplicationsAPI.deleteApplication.bind(ApplicationsAPI),
  batchOperation: ApplicationsAPI.batchOperation.bind(ApplicationsAPI),
  getApplicationStats: ApplicationsAPI.getApplicationStats.bind(ApplicationsAPI)
}