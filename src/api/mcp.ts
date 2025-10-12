import axios from './index'

export interface MCPToolRequest {
  tool_name: string
  arguments: Record<string, any>
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

export const MCPAPI = {
  /**
   * Get list of available MCP tools
   */
  async getAvailableTools() {
    const response = await axios.get('/mcp/tools')
    return response.data
  },

  /**
   * Execute an MCP tool
   */
  async executeTool(toolRequest: MCPToolRequest) {
    const response = await axios.post('/mcp/execute', toolRequest)
    return response.data
  },

  /**
   * Query applications using natural language
   */
  async queryApplications(query: string) {
    const response = await axios.post('/mcp/query/applications', { query })
    return response.data
  },

  /**
   * Get database schema
   */
  async getDatabaseSchema(tableName?: string) {
    const response = await axios.get('/mcp/schema', {
      params: { table_name: tableName }
    })
    return response.data
  },

  /**
   * Execute a read-only SQL query
   */
  async executeQuery(query: string, params?: Record<string, any>) {
    const response = await axios.post('/mcp/query', { query, params })
    return response.data
  }
}

/**
 * MCP Tool Categories with descriptions
 */
export const MCP_TOOL_CATEGORIES = {
  database: {
    name: '数据库操作',
    description: '执行数据库查询和模式查看',
    icon: 'database'
  },
  applications: {
    name: '应用管理',
    description: '创建、查询、更新应用信息',
    icon: 'document'
  },
  subtasks: {
    name: '子任务管理',
    description: '管理和更新子任务',
    icon: 'list'
  },
  excel: {
    name: 'Excel操作',
    description: '导入导出Excel数据',
    icon: 'document-copy'
  },
  calculation: {
    name: '计算服务',
    description: '计算进度和延迟分析',
    icon: 'calculator'
  },
  audit: {
    name: '审计操作',
    description: '查看审计日志和回滚变更',
    icon: 'view'
  },
  dashboard: {
    name: '仪表盘分析',
    description: '获取统计数据和导出报表',
    icon: 'data-analysis'
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
  'audit_rollback'
]

/**
 * Check if a tool requires edit permissions
 */
export function requiresEditPermission(toolName: string): boolean {
  return EDIT_REQUIRED_TOOLS.includes(toolName)
}
