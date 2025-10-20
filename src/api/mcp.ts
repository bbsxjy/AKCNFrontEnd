import axios from './index'

export interface MCPToolRequest {
  tool_name: string
  parameters: Record<string, any>
}

export interface MCPToolResponse {
  success: boolean
  result?: any
  error?: string
  execution_time?: number
}

export interface MCPTool {
  name: string
  description: string
  category: string
  requiresEdit: boolean  // Whether this tool requires edit permissions
  parameters?: Record<string, any>
}

export interface MCPQueryRequest {
  query: string
  context?: Record<string, any>
}

export interface MCPQueryResponse {
  success: boolean
  answer: string
  tools_used: string[]
  execution_details?: any
  ai_suggestions?: string[]
}

export interface MCPStreamEvent {
  event: 'status' | 'data' | 'ai_chunk' | 'done' | 'error'
  data: any
}

export interface MCPStreamCallbacks {
  onStatus?: (phase: string, message: string) => void
  onData?: (data: any) => void
  onChunk?: (chunk: string) => void
  onDone?: (success: boolean, message?: string) => void
  onError?: (error: string) => void
}

export const MCPAPI = {
  /**
   * Health check for MCP server
   */
  async healthCheck() {
    const response = await axios.get('/mcp/health')
    return response.data
  },

  /**
   * Get list of available MCP tools
   */
  async getTools() {
    const response = await axios.get('/mcp/tools')
    return response.data
  },

  /**
   * Execute an MCP tool
   * @param toolName - Name of the tool to execute
   * @param parameters - Tool parameters
   */
  async executeTool(toolName: string, parameters: Record<string, any> = {}) {
    const response = await axios.post('/mcp/execute', {
      tool_name: toolName,
      parameters
    })
    return response.data
  },

  /**
   * AI-enhanced natural language query
   * @param query - Natural language query
   * @param context - Optional context for the query
   */
  async query(query: string, context?: Record<string, any>) {
    const response = await axios.post('/mcp/query', { query, context })
    return response.data
  },

  /**
   * AI-enhanced natural language query with streaming response
   * @param query - Natural language query (required)
   * @param callbacks - Callback functions for handling streaming events
   * @param context - Optional context for the query
   * @param method - HTTP method: 'POST' (default) or 'GET'
   * @returns Promise<void> - Resolves when stream completes
   */
  async queryStream(
    query: string,
    callbacks: MCPStreamCallbacks,
    context?: Record<string, any>,
    method: 'POST' | 'GET' = 'POST'
  ): Promise<void> {
    // Validate required query parameter
    if (!query || query.trim() === '') {
      const error = 'Query parameter is required'
      callbacks.onError?.(error)
      throw new Error(error)
    }

    const baseUrl = axios.defaults.baseURL || ''
    // Get token from localStorage or use default test token
    let token = localStorage.getItem('access_token') || 'token_1_admin_full_access_test_2024'
    // Ensure token has Bearer prefix
    if (!token.startsWith('Bearer ')) {
      token = `Bearer ${token}`
    }

    // Build URL
    let url = `${baseUrl}/mcp/query/applications/stream`
    const headers: HeadersInit = {
      'Authorization': token
    }
    let body: string | undefined

    if (method === 'GET') {
      // GET method: query in URL params
      const params = new URLSearchParams()
      params.append('query', query)
      if (context) {
        params.append('context', JSON.stringify(context))
      }
      url = `${url}?${params.toString()}`
    } else {
      // POST method: query in JSON body (default)
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify({ query, context })
    }

    console.log(`[MCP Stream] Initiating ${method} request to ${url}`)
    console.log(`[MCP Stream] Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`)

    return new Promise((resolve, reject) => {
      // Use fetch for SSE streaming
      fetch(url, {
        method,
        headers,
        body
      })
        .then(async (response) => {
          console.log(`[MCP Stream] Response status: ${response.status}`)

          if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
              const errorText = await response.text()
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.detail || errorData.message || errorMessage
            } catch {
              // Ignore parse errors, use default message
            }
            console.error(`[MCP Stream] Request failed: ${errorMessage}`)
            throw new Error(errorMessage)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            const error = 'No response body available for streaming'
            console.error(`[MCP Stream] ${error}`)
            throw new Error(error)
          }

          console.log('[MCP Stream] Starting to read stream...')
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              console.log('[MCP Stream] Stream completed')
              resolve()
              break
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true })

            // Process complete SSE messages
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            let currentEvent = ''
            let currentData = ''

            for (const line of lines) {
              if (line.startsWith('event:')) {
                currentEvent = line.substring(6).trim()
              } else if (line.startsWith('data:')) {
                currentData = line.substring(5).trim()
              } else if (line === '') {
                // Empty line indicates end of event
                if (currentEvent && currentData) {
                  this.handleStreamEvent(currentEvent, currentData, callbacks)
                }
                currentEvent = ''
                currentData = ''
              }
            }
          }
        })
        .catch((error) => {
          console.error('[MCP Stream] Stream error:', error)
          callbacks.onError?.(error.message || '未知错误')
          reject(error)
        })
    })
  },

  /**
   * Handle individual stream events
   * @private
   */
  handleStreamEvent(event: string, data: string, callbacks: MCPStreamCallbacks) {
    try {
      const parsedData = JSON.parse(data)

      switch (event) {
        case 'status':
          callbacks.onStatus?.(parsedData.phase, parsedData.message)
          break
        case 'data':
          callbacks.onData?.(parsedData)
          break
        case 'ai_chunk':
          callbacks.onChunk?.(parsedData.content)
          break
        case 'done':
          callbacks.onDone?.(parsedData.success, parsedData.message)
          break
        case 'error':
          callbacks.onError?.(parsedData.error || parsedData.message)
          break
      }
    } catch (error) {
      console.error('Failed to parse stream event:', error)
    }
  },

  // ============================================
  // Database Query Tools (2 tools)
  // ============================================

  /**
   * Execute read-only SQL query
   */
  async dbQuery(query: string, limit: number = 1000) {
    return this.executeTool('db_query', { query, limit })
  },

  /**
   * Get database schema
   */
  async dbGetSchema(tableName?: string) {
    return this.executeTool('db_get_schema', { table_name: tableName })
  },

  // ============================================
  // Application Management Tools (4 tools)
  // ============================================

  /**
   * List applications with filtering
   */
  async appList(filters?: {
    status?: string
    team?: string
    limit?: number
    offset?: number
  }) {
    return this.executeTool('app_list', filters || {})
  },

  /**
   * Get single application details
   */
  async appGet(applicationId?: string, l2Id?: string) {
    return this.executeTool('app_get', {
      application_id: applicationId,
      l2_id: l2Id
    })
  },

  /**
   * Create new application
   */
  async appCreate(data: {
    l2_id: string
    app_name: string
    supervision_year: number
    target: 'AK' | '云原生'
    [key: string]: any
  }) {
    return this.executeTool('app_create', data)
  },

  /**
   * Update existing application
   */
  async appUpdate(applicationId: string, updateData: Record<string, any>) {
    return this.executeTool('app_update', {
      application_id: applicationId,
      update_data: updateData
    })
  },

  // ============================================
  // Sub-task Management Tools (3 tools)
  // ============================================

  /**
   * List subtasks with filtering
   */
  async taskList(filters?: {
    application_id?: string
    status?: string
    assigned_to?: string
    limit?: number
  }) {
    return this.executeTool('task_list', filters || {})
  },

  /**
   * Create new subtask
   */
  async taskCreate(data: {
    application_id: string
    module_name: string
    sub_target?: string
    task_status?: string
    assigned_to?: string
    [key: string]: any
  }) {
    return this.executeTool('task_create', data)
  },

  /**
   * Batch update multiple subtasks
   */
  async taskBatchUpdate(taskIds: string[], updateData: Record<string, any>) {
    return this.executeTool('task_batch_update', {
      task_ids: taskIds,
      update_data: updateData
    })
  },

  // ============================================
  // Excel Operations Tools (2 tools)
  // ============================================

  /**
   * Import data from Excel file
   */
  async excelImport(filePath: string, importType: 'applications' | 'subtasks') {
    return this.executeTool('excel_import', {
      file_path: filePath,
      import_type: importType
    })
  },

  /**
   * Export data to Excel file
   */
  async excelExport(
    exportType: 'applications' | 'subtasks' | 'reports',
    filters?: Record<string, any>,
    outputPath?: string
  ) {
    return this.executeTool('excel_export', {
      export_type: exportType,
      filters,
      output_path: outputPath
    })
  },

  // ============================================
  // Calculation Service Tools (2 tools)
  // ============================================

  /**
   * Calculate application progress
   */
  async calcProgress(applicationIds?: string[], recalculateAll: boolean = false) {
    return this.executeTool('calc_progress', {
      application_ids: applicationIds,
      recalculate_all: recalculateAll
    })
  },

  /**
   * Analyze project delays
   */
  async calcDelays(includeDetails: boolean = true) {
    return this.executeTool('calc_delays', {
      include_details: includeDetails
    })
  },

  // ============================================
  // Audit Operations Tools (2 tools)
  // ============================================

  /**
   * Get audit logs with filtering
   */
  async auditGetLogs(filters?: {
    table_name?: string
    operation?: 'INSERT' | 'UPDATE' | 'DELETE'
    user_id?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }) {
    return this.executeTool('audit_get_logs', filters || {})
  },

  /**
   * Rollback changes to previous state
   */
  async auditRollback(auditLogId: string) {
    return this.executeTool('audit_rollback', {
      audit_log_id: auditLogId
    })
  },

  // ============================================
  // CMDB System Catalog Tools (7 tools)
  // ============================================

  /**
   * Search L2 applications in CMDB
   */
  async cmdbSearchL2(filters?: {
    keyword?: string
    status?: string
    management_level?: string
    belongs_to_156l1?: string
    belongs_to_87l1?: string
    limit?: number
  }) {
    return this.executeTool('cmdb_search_l2', filters || {})
  },

  /**
   * Get single L2 application details
   */
  async cmdbGetL2(l2Id: string) {
    return this.executeTool('cmdb_get_l2', { l2_id: l2Id })
  },

  /**
   * Create new L2 application in CMDB
   */
  async cmdbCreateL2(data: {
    l2_id: string
    l2_name: string
    management_level: string
    [key: string]: any
  }) {
    return this.executeTool('cmdb_create_l2', data)
  },

  /**
   * Update L2 application
   */
  async cmdbUpdateL2(l2Id: string, updateData: Record<string, any>) {
    return this.executeTool('cmdb_update_l2', {
      l2_id: l2Id,
      update_data: updateData
    })
  },

  /**
   * Search 156L1 systems
   */
  async cmdbSearch156L1(keyword?: string, limit?: number) {
    return this.executeTool('cmdb_search_156l1', { keyword, limit })
  },

  /**
   * Get 156L1 system with all child L2s
   */
  async cmdbGet156L1WithL2s(l1156Id: string) {
    return this.executeTool('cmdb_get_156l1_with_l2s', {
      l1_156_id: l1156Id
    })
  },

  /**
   * Search 87L1 systems (future classification)
   */
  async cmdbSearch87L1(keyword?: string, limit?: number) {
    return this.executeTool('cmdb_search_87l1', { keyword, limit })
  },

  // ============================================
  // Dashboard & Analytics Tools (2 tools)
  // ============================================

  /**
   * Get dashboard statistics
   */
  async dashboardStats(
    statType: 'summary' | 'progress_trend' | 'department' | 'delayed',
    dateRange?: { start: string; end: string }
  ) {
    return this.executeTool('dashboard_stats', {
      stat_type: statType,
      date_range: dateRange
    })
  },

  /**
   * Export dashboard data
   */
  async dashboardExport(format: 'json' | 'csv' | 'excel', includeCharts: boolean = false) {
    return this.executeTool('dashboard_export', {
      format,
      include_charts: includeCharts
    })
  },

  // ============================================
  // Excel Template Filling
  // ============================================

  /**
   * Fill an Excel template with data from the database
   * @param file - Excel template file
   * @param context - Optional context for AI understanding
   * @param limit - Maximum rows to fill (1-10000, default: 1000)
   * @returns Promise with file blob and metadata
   */
  async fillExcelTemplate(
    file: File,
    context?: string,
    limit: number = 1000
  ): Promise<{
    blob: Blob
    filename: string
    metadata: {
      rowsFilled: number
      dataSource: string
      processingTimeMs: number
      templateTitle?: string
      aiReasoning?: string
    }
  }> {
    const baseUrl = axios.defaults.baseURL || ''
    // Get token from localStorage or use default test token
    let token = localStorage.getItem('access_token') || 'token_1_admin_full_access_test_2024'
    // Ensure token has Bearer prefix
    if (!token.startsWith('Bearer ')) {
      token = `Bearer ${token}`
    }

    // Build URL with query parameters
    const params = new URLSearchParams()
    if (context) params.append('context', context)
    params.append('limit', limit.toString())
    const url = `${baseUrl}/excel/fill-template?${params.toString()}`

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = '模板填充失败'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    // Extract metadata from headers
    const rowsFilled = parseInt(response.headers.get('X-Rows-Filled') || '0', 10)
    const dataSource = response.headers.get('X-Data-Source') || 'unknown'
    const processingTimeMs = parseInt(response.headers.get('X-Processing-Time-Ms') || '0', 10)
    const templateTitleRaw = response.headers.get('X-Template-Title')
    const aiReasoningRaw = response.headers.get('X-AI-Reasoning')
    const templateTitle = templateTitleRaw ? templateTitleRaw : undefined
    const aiReasoning = aiReasoningRaw ? aiReasoningRaw : undefined

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition') || ''
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    const filename = filenameMatch ? filenameMatch[1] : `filled_template_${Date.now()}.xlsx`

    // Get blob
    const blob = await response.blob()

    return {
      blob,
      filename,
      metadata: {
        rowsFilled,
        dataSource,
        processingTimeMs,
        templateTitle,
        aiReasoning
      }
    }
  },

  // ============================================
  // File Upload & Analysis
  // ============================================

  /**
   * Upload Excel file for analysis with streaming response
   * @param file - Excel file to upload
   * @param query - Analysis query for the file (required)
   * @param callbacks - Callback functions for handling streaming events
   * @param useMultipart - Use multipart/form-data (default: false, uses base64 JSON)
   * @returns Promise<void> - Resolves when stream completes
   */
  async uploadFileWithQuery(
    file: File,
    query: string,
    callbacks: MCPStreamCallbacks,
    useMultipart: boolean = false
  ): Promise<void> {
    // Validate inputs
    if (!file) {
      const error = 'File parameter is required'
      callbacks.onError?.(error)
      throw new Error(error)
    }
    if (!query || query.trim() === '') {
      const error = 'Query parameter is required'
      callbacks.onError?.(error)
      throw new Error(error)
    }

    const baseUrl = axios.defaults.baseURL || ''
    // Get token from localStorage or use default test token
    let token = localStorage.getItem('access_token') || 'token_1_admin_full_access_test_2024'
    // Ensure token has Bearer prefix
    if (!token.startsWith('Bearer ')) {
      token = `Bearer ${token}`
    }

    const url = `${baseUrl}/mcp/query/applications/stream`

    console.log(`[MCP File Upload] Uploading file: ${file.name} (${file.size} bytes)`)
    console.log(`[MCP File Upload] Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`)
    console.log(`[MCP File Upload] Upload mode: ${useMultipart ? 'multipart/form-data' : 'base64 JSON'}`)

    if (useMultipart) {
      // Method 1: Use multipart/form-data (backend must support this)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('query', query)

      return new Promise((resolve, reject) => {
        fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': token
            // Don't set Content-Type, let browser set it with boundary for multipart/form-data
          },
          body: formData
        })
          .then(response => this.handleStreamResponse(response, callbacks, resolve, reject))
          .catch((error) => {
            console.error('[MCP File Upload] Stream error:', error)
            callbacks.onError?.(error.message || '未知错误')
            reject(error)
          })
      })
    } else {
      // Method 2: Convert file to base64 and send as JSON (recommended)
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            // Remove data URL prefix (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
            const base64Data = base64.split(',')[1]

            const body = JSON.stringify({
              query,
              file_data: {
                filename: file.name,
                content: base64Data,
                content_type: file.type || 'application/octet-stream',
                size: file.size
              }
            })

            console.log('[MCP File Upload] File converted to base64, sending JSON request')

            fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              },
              body
            })
              .then(response => this.handleStreamResponse(response, callbacks, resolve, reject))
              .catch((error) => {
                console.error('[MCP File Upload] Stream error:', error)
                callbacks.onError?.(error.message || '未知错误')
                reject(error)
              })
          } catch (error: any) {
            console.error('[MCP File Upload] File conversion error:', error)
            callbacks.onError?.('文件转换失败: ' + error.message)
            reject(error)
          }
        }

        reader.onerror = () => {
          const error = 'Failed to read file'
          console.error(`[MCP File Upload] ${error}`)
          callbacks.onError?.(error)
          reject(new Error(error))
        }

        reader.readAsDataURL(file)
      })
    }
  },

  /**
   * Handle streaming response (shared by both upload methods)
   * @private
   */
  async handleStreamResponse(
    response: Response,
    callbacks: MCPStreamCallbacks,
    resolve: () => void,
    reject: (error: any) => void
  ): Promise<void> {
    console.log(`[MCP File Upload] Response status: ${response.status}`)

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorText = await response.text()
        const errorData = JSON.parse(errorText)
        // Handle FastAPI validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errors = errorData.detail.map((err: any) =>
            `${err.loc.join('.')} - ${err.msg}`
          ).join('; ')
          errorMessage = `Validation Error: ${errors}`
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage
        }
      } catch {
        // Ignore parse errors, use default message
      }
      console.error(`[MCP File Upload] Request failed: ${errorMessage}`)
      callbacks.onError?.(errorMessage)
      reject(new Error(errorMessage))
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      const error = 'No response body available for streaming'
      console.error(`[MCP File Upload] ${error}`)
      callbacks.onError?.(error)
      reject(new Error(error))
      return
    }

    console.log('[MCP File Upload] Starting to read stream...')
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('[MCP File Upload] Stream completed')
          resolve()
          break
        }

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim()
          } else if (line.startsWith('data:')) {
            currentData = line.substring(5).trim()
          } else if (line === '') {
            // Empty line indicates end of event
            if (currentEvent && currentData) {
              this.handleStreamEvent(currentEvent, currentData, callbacks)
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }
    } catch (error: any) {
      console.error('[MCP File Upload] Stream reading error:', error)
      callbacks.onError?.(error.message || '未知错误')
      reject(error)
    }
  }
}

/**
 * MCP Tool Categories with descriptions
 */
export const MCP_TOOL_CATEGORIES = {
  database: {
    name: '数据库查询',
    description: '执行数据库查询和模式查看',
    icon: 'database',
    color: '#409EFF'
  },
  application: {
    name: '应用管理',
    description: '创建、查询、更新应用信息',
    icon: 'document',
    color: '#67C23A'
  },
  subtask: {
    name: '子任务管理',
    description: '管理和更新子任务',
    icon: 'list',
    color: '#E6A23C'
  },
  excel: {
    name: 'Excel操作',
    description: '导入导出Excel数据',
    icon: 'document-copy',
    color: '#909399'
  },
  calculation: {
    name: '计算服务',
    description: '计算进度和延迟分析',
    icon: 'data-analysis',
    color: '#F56C6C'
  },
  audit: {
    name: '审计操作',
    description: '查看审计日志和回滚变更',
    icon: 'view',
    color: '#9370DB'
  },
  cmdb: {
    name: 'CMDB系统目录',
    description: 'L2/L1系统管理和搜索',
    icon: 'collection',
    color: '#FF69B4'
  },
  dashboard: {
    name: '仪表盘分析',
    description: '获取统计数据和导出报表',
    icon: 'data-board',
    color: '#20B2AA'
  },
  ai: {
    name: 'AI增强功能',
    description: 'AI报告生成、智能建议、SQL分析',
    icon: 'magic-stick',
    color: '#FF6347'
  }
}

/**
 * List of MCP tools that require edit permissions
 */
export const EDIT_REQUIRED_TOOLS = [
  'app_create',
  'app_update',
  'task_create',
  'task_batch_update',
  'excel_import',
  'calc_progress',
  'calc_delays',
  'audit_rollback',
  'cmdb_create_l2',
  'cmdb_update_l2'
]

/**
 * List of AI-enhanced features (internal functions, not direct tool calls)
 */
export const AI_FEATURES = {
  GENERATE_REPORT: 'generate_report',
  SUGGEST_ACTIONS: 'suggest_next_actions',
  ANALYZE_QUERY: 'analyze_query'
}

/**
 * Check if a tool requires edit permissions
 */
export function requiresEditPermission(toolName: string): boolean {
  return EDIT_REQUIRED_TOOLS.includes(toolName)
}

/**
 * Get category information for a tool
 */
export function getToolCategory(toolName: string): string {
  if (toolName.startsWith('db_')) return 'database'
  if (toolName.startsWith('app_')) return 'application'
  if (toolName.startsWith('task_')) return 'subtask'
  if (toolName.startsWith('excel_')) return 'excel'
  if (toolName.startsWith('calc_')) return 'calculation'
  if (toolName.startsWith('audit_')) return 'audit'
  if (toolName.startsWith('cmdb_')) return 'cmdb'
  if (toolName.startsWith('dashboard_')) return 'dashboard'
  return 'unknown'
}
