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
  // List subtasks with filtering and pagination
  static async getSubTasks(params: SubTaskListParams = {}): Promise<SubTaskListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.application_id !== undefined) queryParams.append('application_id', params.application_id.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/subtasks?${queryParams.toString()}`)
    return response.data
  }

  // Get single subtask by ID
  static async getSubTask(id: number): Promise<SubTask> {
    const response = await api.get(`/subtasks/${id}`)
    return response.data
  }

  // Create new subtask
  static async createSubTask(data: CreateSubTaskRequest): Promise<SubTask> {
    const response = await api.post('/subtasks', data)
    return response.data
  }

  // Update subtask
  static async updateSubTask(id: number, data: UpdateSubTaskRequest): Promise<SubTask> {
    const response = await api.put(`/subtasks/${id}`, data)
    return response.data
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