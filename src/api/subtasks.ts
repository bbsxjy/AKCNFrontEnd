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
  l2_id: number  // was: application_id, now stores application's database ID

  // Core fields
  sub_target?: 'AK' | '云原生'
  version_name?: string
  task_status: string
  progress_percentage: number
  is_blocked: boolean
  block_reason?: string | null

  // Date fields
  planned_requirement_date?: string | null
  planned_release_date?: string | null
  planned_tech_online_date?: string | null
  planned_biz_online_date?: string | null
  actual_requirement_date?: string | null
  actual_release_date?: string | null
  actual_tech_online_date?: string | null
  actual_biz_online_date?: string | null

  // New fields
  resource_applied: boolean
  ops_requirement_submitted?: string | null  // ISO timestamp
  ops_testing_status?: string | null
  launch_check_status?: string | null

  // Changed fields
  notes?: string  // was: technical_notes

  // Timestamps
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number

  // Compatibility fields (for UI display only, not sent to backend)
  application_id?: number  // Compatibility field
  subtask_name?: string  // Alias for version_name
}

export interface CreateSubTaskRequest {
  l2_id: number  // Application's database ID
  sub_target?: 'AK' | '云原生'
  version_name: string
  task_status?: string
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  notes?: string
  resource_applied?: boolean
}

export interface UpdateSubTaskRequest {
  version_name?: string
  task_status?: string
  progress_percentage?: number
  is_blocked?: boolean
  block_reason?: string
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  actual_requirement_date?: string
  actual_release_date?: string
  actual_tech_online_date?: string
  actual_biz_online_date?: string
  notes?: string
  resource_applied?: boolean
  ops_requirement_submitted?: string
  ops_testing_status?: string
  launch_check_status?: string
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
      ...item,
      // Ensure required fields have defaults
      l2_id: item.l2_id || item.application_id,
      resource_applied: item.resource_applied || false,
      ops_requirement_submitted: item.ops_requirement_submitted || null,
      ops_testing_status: item.ops_testing_status || null,
      launch_check_status: item.launch_check_status || null,
      notes: item.notes || '',

      // Compatibility fields for UI display (not sent to backend)
      application_id: item.l2_id,
      subtask_name: item.version_name || '未命名任务'
    }
  }
  // List subtasks with filtering and pagination
  static async getSubTasks(params: SubTaskListParams = {}): Promise<SubTaskListResponse> {
    const queryParams = new URLSearchParams()

    // Note: application_id in params refers to the Application's database ID
    // Backend expects 'l2_id' parameter for filtering by application
    if (params.application_id !== undefined) queryParams.append('l2_id', params.application_id.toString())
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
    // Send data as-is, field names already match backend
    const backendData = {
      ...data,
      // Set defaults if not provided
      sub_target: data.sub_target || 'AK',
      task_status: data.task_status || '待启动',
      progress_percentage: 0,
      is_blocked: false,
      resource_applied: data.resource_applied || false
    }

    const response = await api.post('/subtasks', backendData)
    return this.mapSubTaskData(response.data)
  }

  // Update subtask
  static async updateSubTask(id: number, data: UpdateSubTaskRequest): Promise<SubTask> {
    // Send data as-is, field names already match backend
    const response = await api.put(`/subtasks/${id}`, data)
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
        application_id: applicationId,  // This is the Application's database ID
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
          switch (task.task_status) {
            case '全部完成':
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