/**
 * MCP (Model Context Protocol) Type Definitions
 * Comprehensive types for all 27 MCP tools and AI features
 */

// ============================================
// Core MCP Types
// ============================================

export interface MCPToolDefinition {
  name: string
  description: string
  category: MCPToolCategory
  parameters: MCPParameterSchema[]
  requiresEdit: boolean
}

export type MCPToolCategory =
  | 'database'
  | 'application'
  | 'subtask'
  | 'excel'
  | 'calculation'
  | 'audit'
  | 'cmdb'
  | 'dashboard'
  | 'ai'

export interface MCPParameterSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  default?: any
}

export interface MCPExecutionResult<T = any> {
  success: boolean
  result?: T
  error?: string
  execution_time?: number
  timestamp?: string
}

// ============================================
// Database Query Tool Types
// ============================================

export interface DBQueryRequest {
  query: string
  limit?: number
}

export interface DBQueryResult {
  columns: string[]
  rows: Record<string, any>[]
  row_count: number
  execution_time: number
}

export interface DBSchemaRequest {
  table_name?: string
}

export interface DBSchemaResult {
  tables: {
    name: string
    columns: {
      name: string
      type: string
      nullable: boolean
      default?: any
      primary_key: boolean
      foreign_key?: {
        table: string
        column: string
      }
    }[]
  }[]
}

// ============================================
// Application Management Tool Types
// ============================================

export interface AppListRequest {
  status?: string
  team?: string
  limit?: number
  offset?: number
}

export interface AppGetRequest {
  application_id?: string
  l2_id?: string
}

export interface AppCreateRequest {
  l2_id: string
  app_name: string
  supervision_year: number
  target: 'AK' | '云原生'
  // Optional fields
  app_tier?: number
  belonging_l1_name?: string
  dev_owner?: string
  dev_team?: string
  ops_owner?: string
  ops_team?: string
  notes?: string
}

export interface AppUpdateRequest {
  application_id: string
  update_data: Partial<AppCreateRequest>
}

// ============================================
// Sub-task Management Tool Types
// ============================================

export interface TaskListRequest {
  application_id?: string
  status?: string
  assigned_to?: string
  limit?: number
}

export interface TaskCreateRequest {
  application_id: string
  module_name: string
  sub_target?: 'AK' | '云原生'
  task_status?: string
  assigned_to?: string
  progress_percentage?: number
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  notes?: string
}

export interface TaskBatchUpdateRequest {
  task_ids: string[]
  update_data: Partial<TaskCreateRequest>
}

export interface TaskBatchUpdateResult {
  success_count: number
  failure_count: number
  updated_task_ids: string[]
  errors?: {
    task_id: string
    error: string
  }[]
}

// ============================================
// Excel Operations Tool Types
// ============================================

export interface ExcelImportRequest {
  file_path: string
  import_type: 'applications' | 'subtasks'
}

export interface ExcelImportResult {
  success_count: number
  failure_count: number
  total_rows: number
  errors?: {
    row: number
    error: string
    data?: Record<string, any>
  }[]
  warnings?: string[]
}

export interface ExcelExportRequest {
  export_type: 'applications' | 'subtasks' | 'reports'
  filters?: Record<string, any>
  output_path?: string
}

export interface ExcelExportResult {
  file_path: string
  row_count: number
  file_size: number
  generated_at: string
}

// ============================================
// Calculation Service Tool Types
// ============================================

export interface CalcProgressRequest {
  application_ids?: string[]
  recalculate_all?: boolean
}

export interface CalcProgressResult {
  updated_count: number
  applications: {
    id: string
    l2_id: string
    app_name: string
    old_progress: number
    new_progress: number
    old_status: string
    new_status: string
  }[]
}

export interface CalcDelaysRequest {
  include_details?: boolean
}

export interface CalcDelaysResult {
  total_delayed: number
  total_at_risk: number
  delayed_applications: {
    id: string
    l2_id: string
    app_name: string
    delay_days: number
    planned_end_date: string
    current_status: string
    blocking_tasks?: {
      id: string
      module_name: string
      block_reason: string
    }[]
  }[]
  summary: {
    minor_delays: number // < 7 days
    moderate_delays: number // 7-30 days
    severe_delays: number // > 30 days
  }
}

// ============================================
// Audit Operations Tool Types
// ============================================

export interface AuditGetLogsRequest {
  table_name?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Record<string, any> | null
  new_values: Record<string, any>
  changed_fields: string[]
  user_id: string
  user_name: string
  user_ip: string
  created_at: string
  request_id?: string
}

export interface AuditRollbackRequest {
  audit_log_id: string
}

export interface AuditRollbackResult {
  success: boolean
  restored_values: Record<string, any>
  rollback_audit_id: string
  message: string
}

// ============================================
// CMDB System Catalog Tool Types
// ============================================

export interface CMDBSearchL2Request {
  keyword?: string
  status?: string
  management_level?: '集团级' | '156一级部门级' | '二级部门级'
  belongs_to_156l1?: string
  belongs_to_87l1?: string
  limit?: number
}

export interface CMDBL2Application {
  l2_id: string
  l2_name: string
  management_level: string
  lifecycle_status: string
  belongs_to_156l1?: string
  belongs_to_87l1?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CMDBCreateL2Request {
  l2_id: string
  l2_name: string
  management_level: string
  belongs_to_156l1?: string
  description?: string
}

export interface CMDBUpdateL2Request {
  l2_id: string
  update_data: Partial<CMDBCreateL2Request>
}

export interface CMDBL1System {
  l1_id: string
  l1_name: string
  classification_type: '156L1' | '87L1'
  description?: string
  l2_count?: number
  created_at: string
}

export interface CMDB156L1WithL2s {
  l1_system: CMDBL1System
  l2_applications: CMDBL2Application[]
}

// ============================================
// Dashboard & Analytics Tool Types
// ============================================

export interface DashboardStatsRequest {
  stat_type: 'summary' | 'progress_trend' | 'department' | 'delayed'
  date_range?: {
    start: string
    end: string
  }
}

export interface DashboardSummaryStats {
  total_applications: number
  completed: number
  in_progress: number
  not_started: number
  blocked: number
  completion_rate: number
  average_progress: number
  total_subtasks: number
  delayed_count: number
}

export interface DashboardProgressTrend {
  dates: string[]
  completion_rates: number[]
  active_projects: number[]
}

export interface DashboardDepartmentStats {
  departments: {
    name: string
    total: number
    completed: number
    in_progress: number
    completion_rate: number
  }[]
}

export interface DashboardDelayedStats {
  total_delayed: number
  by_severity: {
    minor: number
    moderate: number
    severe: number
  }
  top_delayed: {
    l2_id: string
    app_name: string
    delay_days: number
    department: string
  }[]
}

export interface DashboardExportRequest {
  format: 'json' | 'csv' | 'excel'
  include_charts?: boolean
}

export interface DashboardExportResult {
  file_path?: string
  data?: any
  format: string
  generated_at: string
}

// ============================================
// AI-Enhanced Feature Types
// ============================================

export interface AIGenerateReportRequest {
  data: Record<string, any>
  report_type?: 'summary' | 'detailed' | 'executive'
  language?: 'zh-CN' | 'en-US'
}

export interface AIGenerateReportResult {
  report: string
  key_insights: string[]
  recommendations?: string[]
  generated_at: string
}

export interface AISuggestActionsRequest {
  context: {
    delayed_projects?: number
    blocked_tasks?: number
    recent_changes?: any[]
    current_user_role?: string
  }
}

export interface AISuggestActionsResult {
  suggestions: {
    priority: 'high' | 'medium' | 'low'
    action: string
    tool_name: string
    reason: string
    parameters?: Record<string, any>
  }[]
  context_analysis: string
}

export interface AIAnalyzeQueryRequest {
  query: string
  dialect?: 'postgresql' | 'mysql' | 'sqlite'
}

export interface AIAnalyzeQueryResult {
  explanation: string
  performance_issues: string[]
  optimization_suggestions: string[]
  security_warnings: string[]
  complexity_score: number
  estimated_cost: 'low' | 'medium' | 'high'
}

// ============================================
// MCP Query (Natural Language) Types
// ============================================

export interface MCPQueryRequest {
  query: string
  context?: {
    user_id?: string
    department?: string
    date_range?: {
      start: string
      end: string
    }
    [key: string]: any
  }
}

export interface MCPQueryResponse {
  success: boolean
  answer: string
  tools_used: {
    tool_name: string
    parameters: Record<string, any>
    execution_time: number
  }[]
  data?: any
  ai_suggestions?: string[]
  follow_up_questions?: string[]
}

// ============================================
// MCP Store State Types
// ============================================

export interface MCPState {
  // Available tools
  availableTools: MCPToolDefinition[]
  toolsLoaded: boolean

  // Execution history
  executionHistory: MCPExecutionHistoryEntry[]

  // AI features state
  aiEnabled: boolean
  lastAISuggestions: string[]

  // Loading states
  loading: {
    tools: boolean
    execution: boolean
    query: boolean
  }

  // Error states
  errors: {
    tools: string | null
    execution: string | null
    query: string | null
  }
}

export interface MCPExecutionHistoryEntry {
  id: string
  tool_name: string
  parameters: Record<string, any>
  result: MCPExecutionResult
  timestamp: string
  user_id?: string
}

// ============================================
// Helper Types
// ============================================

export type MCPToolName =
  // Database
  | 'db_query'
  | 'db_get_schema'
  // Application
  | 'app_list'
  | 'app_get'
  | 'app_create'
  | 'app_update'
  // Subtask
  | 'task_list'
  | 'task_create'
  | 'task_batch_update'
  // Excel
  | 'excel_import'
  | 'excel_export'
  // Calculation
  | 'calc_progress'
  | 'calc_delays'
  // Audit
  | 'audit_get_logs'
  | 'audit_rollback'
  // CMDB
  | 'cmdb_search_l2'
  | 'cmdb_get_l2'
  | 'cmdb_create_l2'
  | 'cmdb_update_l2'
  | 'cmdb_search_156l1'
  | 'cmdb_get_156l1_with_l2s'
  | 'cmdb_search_87l1'
  // Dashboard
  | 'dashboard_stats'
  | 'dashboard_export'

export type AIFeatureName = 'generate_report' | 'suggest_next_actions' | 'analyze_query'
