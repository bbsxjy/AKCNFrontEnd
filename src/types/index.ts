// Application types
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

  // Calculated fields (read-only from backend)
  progress_percentage?: number
  subtask_count?: number
  completed_subtask_count?: number

  // AK transformation progress (from backend)
  ak_subtask_count: number
  ak_completed_count: number
  ak_in_progress_count: number
  ak_blocked_count: number
  ak_not_started_count: number
  ak_completion_percentage: number
  ak_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'

  // Cloud-Native transformation progress (from backend)
  cloud_native_subtask_count: number
  cloud_native_completed_count: number
  cloud_native_in_progress_count: number
  cloud_native_blocked_count: number
  cloud_native_not_started_count: number
  cloud_native_completion_percentage: number
  cloud_native_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'

  // Comprehensive status description
  current_phase_description?: string
}

// SubTask types
export interface SubTask {
  id: number
  l2_id: number  // Stores application's database ID

  // Core fields
  sub_target?: 'AK' | '云原生'
  version_name?: string
  task_status: string
  progress_percentage: number
  is_blocked: boolean
  block_reason?: string | null

  // Date fields (flattened structure)
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