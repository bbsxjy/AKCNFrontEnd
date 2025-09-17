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
  l2_id: string  // 后端字段名
  app_name: string  // 后端字段名
  supervision_year: number
  transformation_target: string  // AK或云原生
  is_ak_completed: boolean
  is_cloud_native_completed: boolean
  current_stage: string
  overall_status: string  // 研发进行中、全部完成等
  responsible_team: string
  responsible_person: string
  progress_percentage: number
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  actual_requirement_date?: string
  actual_release_date?: string
  actual_tech_online_date?: string
  actual_biz_online_date?: string
  is_delayed: boolean
  delay_days: number
  notes?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  // 前端兼容字段
  application_id?: string  // 映射自l2_id
  application_name?: string  // 映射自app_name
  status?: string  // 映射自overall_status
}

export interface CreateApplicationRequest {
  application_id: string
  application_name: string
  transformation_target?: string
  responsible_person: string
  responsible_team: string
  status: string
  supervision_year?: number
}

export interface UpdateApplicationRequest {
  application_id?: string
  application_name?: string
  transformation_target?: string
  responsible_person?: string
  responsible_team?: string
  status?: string
  supervision_year?: number
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

    // Map backend fields to frontend fields
    if (response.data && response.data.items) {
      response.data.items = response.data.items.map((item: any) => ({
        ...item,
        // 兼容字段映射
        application_id: item.l2_id,
        application_name: item.app_name,
        status: item.overall_status
      }))
    }

    return response.data
  }

  // Get single application by ID
  static async getApplication(id: number): Promise<Application> {
    const response = await api.get(`/applications/${id}`)

    // Map backend fields to frontend fields
    const item = response.data
    return {
      id: item.id,
      application_id: item.l2_id || item.application_id,
      application_name: item.app_name || item.application_name,
      business_domain: item.business_domain,
      business_subdomain: item.business_subdomain,
      responsible_person: item.responsible_person,
      responsible_team: item.responsible_team,
      status: item.status,
      priority: item.priority,
      kpi_classification: item.kpi_classification,
      service_tier: item.service_tier,
      traffic: item.traffic,
      size: item.size,
      public_cloud_vendor: item.public_cloud_vendor,
      progress_percentage: item.progress_percentage || 0,
      resource_progress: item.resource_progress || 0,
      service_progress: item.service_progress || 0,
      traffic_progress: item.traffic_progress || 0,
      transformation_target: item.transformation_target,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }

  // Create new application
  static async createApplication(data: CreateApplicationRequest): Promise<Application> {
    // Map frontend fields to backend fields
    const backendData = {
      l2_id: data.application_id,
      app_name: data.application_name,
      supervision_year: data.supervision_year || new Date().getFullYear(),
      transformation_target: data.transformation_target || 'AK',
      responsible_team: data.responsible_team,
      responsible_person: data.responsible_person
    }

    const response = await api.post('/applications', backendData)

    // Map backend response to frontend format
    const item = response.data
    return {
      ...item,
      // 兼容字段映射
      application_id: item.l2_id,
      application_name: item.app_name,
      status: item.overall_status
    }
  }

  // Update application
  static async updateApplication(id: number, data: UpdateApplicationRequest): Promise<Application> {
    // Map frontend fields to backend fields
    const backendData: any = {}

    if (data.application_id) backendData.l2_id = data.application_id
    if (data.application_name) backendData.app_name = data.application_name
    if (data.transformation_target) backendData.transformation_target = data.transformation_target
    if (data.responsible_team) backendData.responsible_team = data.responsible_team
    if (data.responsible_person) backendData.responsible_person = data.responsible_person
    if (data.supervision_year) backendData.supervision_year = data.supervision_year

    const response = await api.put(`/applications/${id}`, backendData)

    // Map backend response to frontend format
    const item = response.data
    return {
      ...item,
      // 兼容字段映射
      application_id: item.l2_id,
      application_name: item.app_name,
      status: item.overall_status
    }
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