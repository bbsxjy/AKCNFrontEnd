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
  l2_id: string
  app_name: string

  // Renamed fields
  ak_supervision_acceptance_year?: number  // was: supervision_year
  overall_transformation_target?: 'AK' | '云原生'  // was: transformation_target
  current_transformation_phase?: string  // was: current_stage
  current_status: string  // was: overall_status

  // New fields
  app_tier?: number
  belonging_l1_name?: string
  belonging_projects?: string
  is_domain_transformation_completed: boolean
  is_dbpm_transformation_completed: boolean
  dev_mode?: string
  ops_mode?: string
  dev_owner?: string
  dev_team?: string
  ops_owner?: string
  ops_team?: string
  belonging_kpi?: string
  acceptance_status?: string

  // Existing fields
  is_ak_completed: boolean
  is_cloud_native_completed: boolean
  planned_requirement_date?: string | null
  planned_release_date?: string | null
  planned_tech_online_date?: string | null
  planned_biz_online_date?: string | null
  actual_requirement_date?: string | null
  actual_release_date?: string | null
  actual_tech_online_date?: string | null
  actual_biz_online_date?: string | null
  is_delayed: boolean
  delay_days: number
  notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number

  // Calculated fields (read-only from backend)
  progress_percentage?: number
  subtask_count?: number
  completed_subtask_count?: number
}

export interface CreateApplicationRequest {
  l2_id: string
  app_name: string
  overall_transformation_target?: 'AK' | '云原生'
  dev_owner?: string
  dev_team?: string
  ops_owner?: string
  ops_team?: string
  current_status?: string
  ak_supervision_acceptance_year?: number
  app_tier?: number
  belonging_l1_name?: string
  belonging_projects?: string
}

export interface UpdateApplicationRequest {
  l2_id?: string
  app_name?: string
  overall_transformation_target?: 'AK' | '云原生'
  dev_owner?: string
  dev_team?: string
  ops_owner?: string
  ops_team?: string
  current_status?: string
  ak_supervision_acceptance_year?: number
  app_tier?: number
  belonging_l1_name?: string
  belonging_projects?: string
  is_domain_transformation_completed?: boolean
  is_dbpm_transformation_completed?: boolean
  dev_mode?: string
  ops_mode?: string
  belonging_kpi?: string
  acceptance_status?: string
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

    // Ensure data consistency
    if (response.data && response.data.items) {
      console.log(response.data.items)
      response.data.items = response.data.items.map((item: any) => ({
        ...item,
        // Set defaults for new fields if missing
        is_domain_transformation_completed: item.is_domain_transformation_completed || false,
        is_dbpm_transformation_completed: item.is_dbpm_transformation_completed || false,
        progress_percentage: item.progress_percentage || 0
      }))
    }

    return response.data
  }

  // Get single application by ID
  static async getApplication(id: number): Promise<Application> {
    const response = await api.get(`/applications/${id}`)

    // Return with defaults for new fields
    return {
      ...response.data,
      is_domain_transformation_completed: response.data.is_domain_transformation_completed || false,
      is_dbpm_transformation_completed: response.data.is_dbpm_transformation_completed || false,
      progress_percentage: response.data.progress_percentage || 0
    }
  }

  // Create new application
  static async createApplication(data: CreateApplicationRequest): Promise<Application> {
    // Send data as-is, field names already match backend
    const backendData = {
      ...data,
      // Set defaults if not provided
      ak_supervision_acceptance_year: data.ak_supervision_acceptance_year || new Date().getFullYear(),
      overall_transformation_target: data.overall_transformation_target || 'AK',
      current_status: data.current_status || '待启动',
      dev_team: data.dev_team || '待分配',
      dev_owner: data.dev_owner || '待分配',
      is_ak_completed: false,
      is_cloud_native_completed: false,
      is_domain_transformation_completed: false,
      is_dbpm_transformation_completed: false,
      is_delayed: false,
      delay_days: 0
    }

    const response = await api.post('/applications', backendData)
    return response.data
  }

  // Update application
  static async updateApplication(id: number, data: UpdateApplicationRequest): Promise<Application> {
    // Send data as-is, field names already match backend
    const response = await api.put(`/applications/${id}`, data)
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
          switch (app.current_status) {
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