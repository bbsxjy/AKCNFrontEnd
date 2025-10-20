import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MCPAPI } from '@/api/mcp'
import { ElMessage } from 'element-plus'
import type {
  MCPToolDefinition,
  MCPExecutionHistoryEntry,
  MCPExecutionResult,
  MCPQueryResponse,
  AISuggestActionsResult,
  AIGenerateReportResult,
  AIAnalyzeQueryResult
} from '@/types/mcp'

export const useMCPStore = defineStore('mcp', () => {
  // ============================================
  // State
  // ============================================

  const availableTools = ref<MCPToolDefinition[]>([])
  const toolsLoaded = ref(false)
  const executionHistory = ref<MCPExecutionHistoryEntry[]>([])
  const aiEnabled = ref(true)
  const lastAISuggestions = ref<string[]>([])

  // Loading states
  const loadingTools = ref(false)
  const loadingExecution = ref(false)
  const loadingQuery = ref(false)

  // Error states
  const toolsError = ref<string | null>(null)
  const executionError = ref<string | null>(null)
  const queryError = ref<string | null>(null)

  // Health status
  const mcpHealthy = ref(false)
  const lastHealthCheck = ref<Date | null>(null)

  // ============================================
  // Computed
  // ============================================

  const toolsByCategory = computed(() => {
    const categories: Record<string, MCPToolDefinition[]> = {}
    availableTools.value.forEach((tool) => {
      if (!categories[tool.category]) {
        categories[tool.category] = []
      }
      categories[tool.category].push(tool)
    })
    return categories
  })

  const recentExecutions = computed(() => {
    return executionHistory.value.slice(0, 10)
  })

  const isLoading = computed(() => {
    return loadingTools.value || loadingExecution.value || loadingQuery.value
  })

  // ============================================
  // Actions - Health & Tools
  // ============================================

  /**
   * Check MCP server health
   */
  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await MCPAPI.healthCheck()
      mcpHealthy.value = response.success || response.status === 'healthy'
      lastHealthCheck.value = new Date()
      return mcpHealthy.value
    } catch (error: any) {
      console.error('MCP health check failed:', error)
      mcpHealthy.value = false
      return false
    }
  }

  /**
   * Load available MCP tools
   */
  const loadTools = async () => {
    try {
      loadingTools.value = true
      toolsError.value = null

      const response = await MCPAPI.getTools()
      availableTools.value = response.tools || []
      toolsLoaded.value = true

      console.log(`Loaded ${availableTools.value.length} MCP tools`)
      return true
    } catch (error: any) {
      console.error('Failed to load MCP tools:', error)
      toolsError.value = error.response?.data?.detail || error.message
      ElMessage.error('加载MCP工具失败')
      return false
    } finally {
      loadingTools.value = false
    }
  }

  // ============================================
  // Actions - Tool Execution
  // ============================================

  /**
   * Execute an MCP tool
   */
  const executeTool = async <T = any>(
    toolName: string,
    parameters: Record<string, any> = {}
  ): Promise<MCPExecutionResult<T> | null> => {
    try {
      loadingExecution.value = true
      executionError.value = null

      const startTime = Date.now()
      const response = await MCPAPI.executeTool(toolName, parameters)
      const executionTime = Date.now() - startTime

      // Add to history
      const historyEntry: MCPExecutionHistoryEntry = {
        id: `exec_${Date.now()}`,
        tool_name: toolName,
        parameters,
        result: {
          ...response,
          execution_time: executionTime
        },
        timestamp: new Date().toISOString()
      }
      executionHistory.value.unshift(historyEntry)

      // Keep only last 100 entries
      if (executionHistory.value.length > 100) {
        executionHistory.value = executionHistory.value.slice(0, 100)
      }

      if (response.success) {
        return response as MCPExecutionResult<T>
      } else {
        executionError.value = response.error || 'Execution failed'
        ElMessage.error(response.error || '工具执行失败')
        return null
      }
    } catch (error: any) {
      console.error(`Failed to execute tool ${toolName}:`, error)
      executionError.value = error.response?.data?.detail || error.message
      ElMessage.error('工具执行失败：' + executionError.value)
      return null
    } finally {
      loadingExecution.value = false
    }
  }

  /**
   * Execute natural language query
   */
  const query = async (
    queryText: string,
    context?: Record<string, any>
  ): Promise<MCPQueryResponse | null> => {
    try {
      loadingQuery.value = true
      queryError.value = null

      const response = await MCPAPI.query(queryText, context)

      if (response.success) {
        // Store AI suggestions if available
        if (response.ai_suggestions) {
          lastAISuggestions.value = response.ai_suggestions
        }
        return response
      } else {
        queryError.value = response.error || 'Query failed'
        ElMessage.error(response.error || '查询失败')
        return null
      }
    } catch (error: any) {
      console.error('Natural language query failed:', error)
      queryError.value = error.response?.data?.detail || error.message
      ElMessage.error('查询失败：' + queryError.value)
      return null
    } finally {
      loadingQuery.value = false
    }
  }

  // ============================================
  // Actions - Database Tools
  // ============================================

  const dbQuery = async (sqlQuery: string, limit: number = 1000) => {
    return executeTool('db_query', { query: sqlQuery, limit })
  }

  const dbGetSchema = async (tableName?: string) => {
    return executeTool('db_get_schema', { table_name: tableName })
  }

  // ============================================
  // Actions - Application Tools
  // ============================================

  const appList = async (filters?: Record<string, any>) => {
    return executeTool('app_list', filters || {})
  }

  const appGet = async (applicationId?: string, l2Id?: string) => {
    return executeTool('app_get', { application_id: applicationId, l2_id: l2Id })
  }

  const appCreate = async (data: Record<string, any>) => {
    const result = await executeTool('app_create', data)
    if (result?.success) {
      ElMessage.success('应用创建成功')
    }
    return result
  }

  const appUpdate = async (applicationId: string, updateData: Record<string, any>) => {
    const result = await executeTool('app_update', {
      application_id: applicationId,
      update_data: updateData
    })
    if (result?.success) {
      ElMessage.success('应用更新成功')
    }
    return result
  }

  // ============================================
  // Actions - Subtask Tools
  // ============================================

  const taskList = async (filters?: Record<string, any>) => {
    return executeTool('task_list', filters || {})
  }

  const taskCreate = async (data: Record<string, any>) => {
    const result = await executeTool('task_create', data)
    if (result?.success) {
      ElMessage.success('子任务创建成功')
    }
    return result
  }

  const taskBatchUpdate = async (taskIds: string[], updateData: Record<string, any>) => {
    const result = await executeTool('task_batch_update', {
      task_ids: taskIds,
      update_data: updateData
    })
    if (result?.success) {
      ElMessage.success(`成功更新 ${result.result?.success_count || 0} 个子任务`)
    }
    return result
  }

  // ============================================
  // Actions - Calculation Tools
  // ============================================

  const calcProgress = async (applicationIds?: string[], recalculateAll: boolean = false) => {
    const result = await executeTool('calc_progress', {
      application_ids: applicationIds,
      recalculate_all: recalculateAll
    })
    if (result?.success) {
      ElMessage.success('进度计算完成')
    }
    return result
  }

  const calcDelays = async (includeDetails: boolean = true) => {
    return executeTool('calc_delays', { include_details: includeDetails })
  }

  // ============================================
  // Actions - Audit Tools
  // ============================================

  const auditGetLogs = async (filters?: Record<string, any>) => {
    return executeTool('audit_get_logs', filters || {})
  }

  const auditRollback = async (auditLogId: string) => {
    const result = await executeTool('audit_rollback', { audit_log_id: auditLogId })
    if (result?.success) {
      ElMessage.success('回滚成功')
    }
    return result
  }

  // ============================================
  // Actions - CMDB Tools
  // ============================================

  const cmdbSearchL2 = async (filters?: Record<string, any>) => {
    return executeTool('cmdb_search_l2', filters || {})
  }

  const cmdbGetL2 = async (l2Id: string) => {
    return executeTool('cmdb_get_l2', { l2_id: l2Id })
  }

  const cmdbCreateL2 = async (data: Record<string, any>) => {
    const result = await executeTool('cmdb_create_l2', data)
    if (result?.success) {
      ElMessage.success('L2应用创建成功')
    }
    return result
  }

  const cmdbUpdateL2 = async (l2Id: string, updateData: Record<string, any>) => {
    const result = await executeTool('cmdb_update_l2', {
      l2_id: l2Id,
      update_data: updateData
    })
    if (result?.success) {
      ElMessage.success('L2应用更新成功')
    }
    return result
  }

  const cmdbSearch156L1 = async (keyword?: string, limit?: number) => {
    return executeTool('cmdb_search_156l1', { keyword, limit })
  }

  const cmdbGet156L1WithL2s = async (l1156Id: string) => {
    return executeTool('cmdb_get_156l1_with_l2s', { l1_156_id: l1156Id })
  }

  const cmdbSearch87L1 = async (keyword?: string, limit?: number) => {
    return executeTool('cmdb_search_87l1', { keyword, limit })
  }

  // ============================================
  // Actions - Dashboard Tools
  // ============================================

  const dashboardStats = async (
    statType: 'summary' | 'progress_trend' | 'department' | 'delayed',
    dateRange?: { start: string; end: string }
  ) => {
    return executeTool('dashboard_stats', {
      stat_type: statType,
      date_range: dateRange
    })
  }

  const dashboardExport = async (
    format: 'json' | 'csv' | 'excel',
    includeCharts: boolean = false
  ) => {
    return executeTool('dashboard_export', {
      format,
      include_charts: includeCharts
    })
  }

  // ============================================
  // Actions - Excel Tools
  // ============================================

  const excelImport = async (filePath: string, importType: 'applications' | 'subtasks') => {
    const result = await executeTool('excel_import', {
      file_path: filePath,
      import_type: importType
    })
    if (result?.success) {
      const stats = result.result
      ElMessage.success(
        `导入完成：成功 ${stats?.success_count || 0} 条，失败 ${stats?.failure_count || 0} 条`
      )
    }
    return result
  }

  const excelExport = async (
    exportType: 'applications' | 'subtasks' | 'reports',
    filters?: Record<string, any>,
    outputPath?: string
  ) => {
    const result = await executeTool('excel_export', {
      export_type: exportType,
      filters,
      output_path: outputPath
    })
    if (result?.success) {
      ElMessage.success('导出成功')
    }
    return result
  }

  // ============================================
  // Actions - Utility
  // ============================================

  /**
   * Clear execution history
   */
  const clearHistory = () => {
    executionHistory.value = []
    ElMessage.success('历史记录已清空')
  }

  /**
   * Initialize MCP store
   */
  const initialize = async () => {
    await checkHealth()
    if (mcpHealthy.value) {
      await loadTools()
    } else {
      console.warn('MCP server is not healthy, skipping tool loading')
    }
  }

  return {
    // State
    availableTools,
    toolsLoaded,
    executionHistory,
    aiEnabled,
    lastAISuggestions,
    loadingTools,
    loadingExecution,
    loadingQuery,
    toolsError,
    executionError,
    queryError,
    mcpHealthy,
    lastHealthCheck,

    // Computed
    toolsByCategory,
    recentExecutions,
    isLoading,

    // Actions - Health & Tools
    checkHealth,
    loadTools,
    executeTool,
    query,

    // Actions - Database
    dbQuery,
    dbGetSchema,

    // Actions - Application
    appList,
    appGet,
    appCreate,
    appUpdate,

    // Actions - Subtask
    taskList,
    taskCreate,
    taskBatchUpdate,

    // Actions - Calculation
    calcProgress,
    calcDelays,

    // Actions - Audit
    auditGetLogs,
    auditRollback,

    // Actions - CMDB
    cmdbSearchL2,
    cmdbGetL2,
    cmdbCreateL2,
    cmdbUpdateL2,
    cmdbSearch156L1,
    cmdbGet156L1WithL2s,
    cmdbSearch87L1,

    // Actions - Dashboard
    dashboardStats,
    dashboardExport,

    // Actions - Excel
    excelImport,
    excelExport,

    // Actions - Utility
    clearHistory,
    initialize
  }
})
