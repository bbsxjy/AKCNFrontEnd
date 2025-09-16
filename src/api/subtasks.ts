import api from './index'

export interface SubTaskListParams {
  application_id?: number
  status?: string
  skip?: number
  limit?: number
}

export interface SubTaskListResponse {
  total: number
  items: SubTask[]
}

export interface SubTask {
  id: number
  application_id: number
  subtask_name: string
  responsible_person: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date: string | null
  actual_end_date: string | null
  status: string
  progress_percentage: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateSubTaskRequest {
  application_id: number
  module_name: string
  sub_target: 'AK' | '云原生'
  subtask_name: string
  responsible_person: string
  planned_start_date: string
  planned_end_date: string
  status: string
  notes?: string
}

export interface UpdateSubTaskRequest {
  subtask_name?: string
  responsible_person?: string
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  status?: string
  progress_percentage?: number
  notes?: string
}

export interface UpdateSubTaskProgressRequest {
  progress: number
}

export interface UpdateSubTaskProgressResponse {
  progress_percentage: number
  updated_at: string
}

export class SubTasksAPI {
  // Status mapping utilities
  private static frontendToBackendStatus: Record<string, string> = {
    'planning': 'planning',
    '待启动': 'planning',
    'in_progress': 'in_progress',
    '研发进行中': 'in_progress',
    'testing': 'testing',
    '业务上线中': 'testing',
    'completed': 'completed',
    '已完成': 'completed',
    'blocked': 'blocked',
    '存在阻塞': 'blocked'
  }

  private static backendToFrontendStatus: Record<string, string> = {
    'planning': '待启动',
    'in_progress': '研发进行中',
    'testing': '业务上线中',
    'completed': '已完成',
    'blocked': '存在阻塞'
  }

  private static mapSubTaskData(item: any): SubTask {
    return {
      id: item.id,
      application_id: item.application_id,
      subtask_name: item.subtask_name || item.module_name || '',
      responsible_person: item.responsible_person || '',
      planned_start_date: item.planned_start_date || '',
      planned_end_date: item.planned_end_date || '',
      actual_start_date: item.actual_start_date || null,
      actual_end_date: item.actual_end_date || null,
      status: this.backendToFrontendStatus[item.status] || item.status || '待启动',
      progress_percentage: Number(item.progress_percentage) || 0,
      notes: item.notes || null,
      created_at: item.created_at || '',
      updated_at: item.updated_at || ''
    }
  }
  // List subtasks with filtering and pagination
  static async getSubTasks(params: SubTaskListParams = {}): Promise<SubTaskListResponse> {
    const queryParams = new URLSearchParams()

    if (params.application_id !== undefined) queryParams.append('application_id', params.application_id.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/subtasks?${queryParams.toString()}`)

    // Ensure data consistency and proper field mapping
    if (response.data && response.data.items) {
      response.data.items = response.data.items.map((item: any) => this.mapSubTaskData(item))
    }

    return response.data
  }

  // Get single subtask by ID
  static async getSubTask(id: number): Promise<SubTask> {
    const response = await api.get(`/subtasks/${id}`)
    return this.mapSubTaskData(response.data)
  }

  // Create new subtask
  static async createSubTask(data: CreateSubTaskRequest): Promise<SubTask> {
    // Map frontend fields to backend expected format
    const backendData = {
      application_id: data.application_id,
      subtask_name: data.subtask_name,
      responsible_person: data.responsible_person,
      planned_start_date: data.planned_start_date,
      planned_end_date: data.planned_end_date,
      status: this.frontendToBackendStatus[data.status] || data.status,
      notes: data.notes || `Module: ${data.module_name}, Target: ${data.sub_target}`
    }

    const response = await api.post('/subtasks', backendData)
    return this.mapSubTaskData(response.data)
  }

  // Update subtask
  static async updateSubTask(id: number, data: UpdateSubTaskRequest): Promise<SubTask> {
    // Map status if provided
    const backendData = {
      ...data,
      status: data.status ? (this.frontendToBackendStatus[data.status] || data.status) : undefined
    }

    const response = await api.put(`/subtasks/${id}`, backendData)
    return this.mapSubTaskData(response.data)
  }

  // Update subtask progress only
  static async updateSubTaskProgress(id: number, data: UpdateSubTaskProgressRequest): Promise<UpdateSubTaskProgressResponse> {
    const response = await api.patch(`/subtasks/${id}/progress`, data)
    return response.data
  }

  // Delete subtask
  static async deleteSubTask(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/subtasks/${id}`)
    return response.data
  }

  // Get subtasks for current user (My Tasks)
  static async getMySubTasks(): Promise<SubTask[]> {
    try {
      const response = await this.getSubTasks({ limit: 1000 })
      // Filter by current user - this should be done by backend based on JWT token
      // For now, we'll return all tasks and let the backend handle the filtering
      return response.items
    } catch (error) {
      console.error('Failed to get my subtasks:', error)
      return []
    }
  }

  // Get subtasks by application ID for SubTasksView
  static async getSubTasksByApplication(applicationId: number): Promise<SubTask[]> {
    try {
      const response = await this.getSubTasks({ 
        application_id: applicationId,
        limit: 1000 
      })
      return response.items
    } catch (error) {
      console.error('Failed to get subtasks by application:', error)
      return []
    }
  }

  // Get subtask statistics
  static async getSubTaskStats(applicationId?: number): Promise<{
    total: number
    completed: number
    inProgress: number
    blocked: number
    notStarted: number
  }> {
    try {
      const params = applicationId ? { application_id: applicationId, limit: 1000 } : { limit: 1000 }
      const subtasks = await this.getSubTasks(params)
      
      const stats = {
        total: subtasks.total,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        notStarted: 0
      }

      if (subtasks.items.length > 0) {
        subtasks.items.forEach(task => {
          switch (task.status) {
            case '已完成':
              stats.completed++
              break
            case '研发进行中':
            case '业务上线中':
              stats.inProgress++
              break
            case '存在阻塞':
              stats.blocked++
              break
            case '待启动':
              stats.notStarted++
              break
          }
        })
      }

      return stats
    } catch (error) {
      console.error('Failed to get subtask stats:', error)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        notStarted: 0
      }
    }
  }
}