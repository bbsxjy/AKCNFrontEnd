import axios from './index'

export interface TaskAssignment {
  id: number
  application_id: number
  application_name?: string
  l2_id?: string
  assigned_to_user_id: number
  assigned_to_name?: string
  assigned_by_user_id: number
  assigned_by_name?: string
  task_type: 'update_progress' | 'fix_blocking' | 'complete_milestone' | 'general'
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed_at?: string
  created_at: string
  updated_at?: string
}

export interface CreateTaskAssignmentRequest {
  application_id: number
  assigned_to_user_id: number
  task_type: 'update_progress' | 'fix_blocking' | 'complete_milestone' | 'general'
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
}

export interface UpdateTaskAssignmentRequest {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export interface TaskAssignmentListParams {
  page?: number
  page_size?: number
  assigned_to_user_id?: number
  assigned_by_user_id?: number
  application_id?: number
  status?: string
  priority?: string
  task_type?: string
}

export const TaskAssignmentsAPI = {
  /**
   * Get list of task assignments
   */
  async getTaskAssignments(params?: TaskAssignmentListParams) {
    const response = await axios.get('/task-assignments', { params })
    return response.data
  },

  /**
   * Get a single task assignment
   */
  async getTaskAssignment(taskId: number) {
    const response = await axios.get(`/task-assignments/${taskId}`)
    return response.data
  },

  /**
   * Create a new task assignment
   */
  async createTaskAssignment(taskData: CreateTaskAssignmentRequest) {
    const response = await axios.post('/task-assignments', taskData)
    return response.data
  },

  /**
   * Update a task assignment
   */
  async updateTaskAssignment(taskId: number, taskData: UpdateTaskAssignmentRequest) {
    const response = await axios.put(`/task-assignments/${taskId}`, taskData)
    return response.data
  },

  /**
   * Delete a task assignment
   */
  async deleteTaskAssignment(taskId: number) {
    const response = await axios.delete(`/task-assignments/${taskId}`)
    return response.data
  },

  /**
   * Mark task as completed
   */
  async completeTask(taskId: number) {
    const response = await axios.patch(`/task-assignments/${taskId}/complete`)
    return response.data
  },

  /**
   * Get my assigned tasks
   */
  async getMyTasks(params?: { status?: string; limit?: number }) {
    const response = await axios.get('/task-assignments/my-tasks', { params })
    return response.data
  },

  /**
   * Get tasks I assigned to others
   */
  async getAssignedByMe(params?: { status?: string; limit?: number }) {
    const response = await axios.get('/task-assignments/assigned-by-me', { params })
    return response.data
  }
}
