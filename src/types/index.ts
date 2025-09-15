// Application types
export interface Application {
  id: number
  l2_id: string
  app_name: string
  supervision_year: number
  transformation_target: 'AK' | '云原生'
  is_ak_completed: boolean
  is_cloud_native_completed: boolean
  current_stage: string
  overall_status: string
  responsible_team: string
  responsible_person: string
  progress_percentage: number
  subtask_count: number
  completed_subtask_count: number
  planned_completion_date: string | null
  actual_completion_date: string | null
  is_delayed: boolean
  delay_days: number
  created_at: string
  updated_at: string
}

// SubTask types
export interface SubTask {
  id: number
  application_id: number
  module_name: string
  sub_target: 'AK' | '云原生'
  version_name: string
  task_status: string
  progress_percentage: number
  is_blocked: boolean
  block_reason: string | null
  planned_dates: {
    requirement_date: string | null
    release_date: string | null
    tech_online_date: string | null
    biz_online_date: string | null
  }
  actual_dates: {
    requirement_date: string | null
    release_date: string | null
    tech_online_date: string | null
    biz_online_date: string | null
  }
  created_at: string
  updated_at: string
}

// User types
export interface User {
  id: number
  sso_user_id: string
  username: string
  full_name: string
  email: string
  department: string
  role: 'admin' | 'manager' | 'editor' | 'viewer'
  permissions: string[]
}

// API Response types
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
  request_id: string
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  page_size: number
  total_pages: number
  items: T[]
}

// Audit Log types
export interface AuditLog {
  id: number
  table_name: string
  record_id: number
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Record<string, any> | null
  new_values: Record<string, any>
  changed_fields: string[]
  user?: User
  user_id?: number
  user_full_name?: string
  user_ip: string
  created_at: string
  request_id?: string
}

// Statistics types
export interface Statistics {
  total_applications: number
  completed: number
  in_progress: number
  not_started: number
  blocked: number
  completion_rate: number
  average_progress: number
}