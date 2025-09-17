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
  module_name: string
  sub_target: string  // AK或云原生
  version_name: string  // 实际的子任务名称
  task_status: string  // 后端状态字段
  progress_percentage: number
  is_blocked: boolean
  block_reason?: string
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  actual_requirement_date?: string
  actual_release_date?: string
  actual_tech_online_date?: string
  actual_biz_online_date?: string
  requirements?: string
  technical_notes?: string
  test_notes?: string
  deployment_notes?: string
  priority?: number
  estimated_hours?: number
  actual_hours?: number
  assigned_to?: string  // 负责人
  reviewer?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  // 前端兼容字段
  subtask_name?: string  // 映射自version_name
  responsible_person?: string  // 映射自assigned_to
  status?: string  // 映射自task_status
  planned_start_date?: string  // 映射自planned_requirement_date
  planned_end_date?: string  // 映射自planned_biz_online_date
  actual_start_date?: string | null  // 映射自actual_requirement_date
  actual_end_date?: string | null  // 映射自actual_biz_online_date
  notes?: string | null  // 映射自technical_notes或block_reason
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
    // 映射后端task_status到前端显示
    const statusMap: Record<string, string> = {
      '待启动': '待启动',
      '研发进行中': '研发进行中',
      '业务上线中': '业务上线中',
      '全部完成': '已完成',
      '存在阻塞': '存在阻塞'
    }

    return {
      ...item,
      // 兼容字段映射
      subtask_name: item.version_name || item.module_name || '未命名任务',
      responsible_person: item.assigned_to || '未分配',
      status: statusMap[item.task_status] || item.task_status || '待启动',
      planned_start_date: item.planned_requirement_date || '',
      planned_end_date: item.planned_biz_online_date || '',
      actual_start_date: item.actual_requirement_date || null,
      actual_end_date: item.actual_biz_online_date || null,
      notes: item.technical_notes || item.block_reason || ''
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
      module_name: data.module_name || '默认模块',
      sub_target: data.sub_target || 'AK',
      version_name: data.subtask_name,  // 使用subtask_name作为version_name
      task_status: data.status || '待启动',
      assigned_to: data.responsible_person,
      planned_requirement_date: data.planned_start_date,
      planned_biz_online_date: data.planned_end_date,
      technical_notes: data.notes || ''
    }

    const response = await api.post('/subtasks', backendData)
    return this.mapSubTaskData(response.data)
  }

  // Update subtask
  static async updateSubTask(id: number, data: UpdateSubTaskRequest): Promise<SubTask> {
    // Map frontend fields to backend fields
    const backendData: any = {}

    if (data.subtask_name !== undefined) backendData.version_name = data.subtask_name
    if (data.responsible_person !== undefined) backendData.assigned_to = data.responsible_person
    if (data.status !== undefined) backendData.task_status = data.status
    if (data.progress_percentage !== undefined) backendData.progress_percentage = data.progress_percentage
    if (data.planned_start_date !== undefined) backendData.planned_requirement_date = data.planned_start_date
    if (data.planned_end_date !== undefined) backendData.planned_biz_online_date = data.planned_end_date
    if (data.actual_start_date !== undefined) backendData.actual_requirement_date = data.actual_start_date
    if (data.actual_end_date !== undefined) backendData.actual_biz_online_date = data.actual_end_date
    if (data.notes !== undefined) backendData.technical_notes = data.notes

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