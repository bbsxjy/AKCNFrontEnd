/**
 * MCP结果渲染类型自动检测工具
 * 根据后端 docs/MCP_RESPONSE_FORMAT.md 的规范实现
 */

export interface MCPMetadata {
  renderType: string
  title?: string
  count?: number
  total?: number
  primaryKey?: string
  columns?: string[]
  rowCount?: number
  hasSubtasks?: boolean
  [key: string]: any
}

export interface MCPResponse {
  success: boolean
  data: any
  metadata?: MCPMetadata
  error?: string
  count?: number
  total?: number
}

/**
 * 自动检测数据的renderType
 * 优先使用后端提供的metadata，否则根据数据结构自动判断
 */
export function detectRenderType(response: MCPResponse): MCPMetadata {
  // 优先使用后端提供的metadata
  if (response.metadata?.renderType) {
    return response.metadata
  }

  const data = response.data

  // 如果没有数据，返回空类型
  if (!data) {
    return { renderType: 'empty', title: '无数据' }
  }

  // === 列表类型检测 ===
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0]

    // 1. application_list - 转型应用列表
    if (firstItem.l2_id && firstItem.app_name && firstItem.current_status) {
      return {
        renderType: 'application_list',
        title: `查询到 ${data.length} 个转型应用`,
        count: data.length,
        total: response.total,
        primaryKey: 'l2_id'
      }
    }

    // 2. subtask_list - 子任务列表
    if (firstItem.sub_target && firstItem.task_status) {
      return {
        renderType: 'subtask_list',
        title: `查询到 ${data.length} 个子任务`,
        count: data.length,
        primaryKey: 'id'
      }
    }

    // 3. cmdb_l2_list - CMDB L2应用列表
    if (firstItem.config_id && firstItem.short_name && firstItem.management_level) {
      return {
        renderType: 'cmdb_l2_list',
        title: `查询到 ${data.length} 个CMDB应用`,
        count: data.length,
        primaryKey: 'config_id'
      }
    }

    // 4. cmdb_l1_list - CMDB L1系统列表
    if (firstItem.config_id && (firstItem.belongs_to_domain || firstItem.belongs_to_layer)) {
      return {
        renderType: 'cmdb_l1_list',
        title: `查询到 ${data.length} 个L1系统`,
        count: data.length,
        primaryKey: 'config_id'
      }
    }

    // 5. audit_log_list - 审计日志列表
    if (firstItem.table_name && firstItem.operation && firstItem.changed_fields) {
      return {
        renderType: 'audit_log_list',
        title: `审计日志 (${data.length}条)`,
        count: data.length
      }
    }

    // 6. 统计数据（数组形式）
    const keys = Object.keys(firstItem)
    const statKeywords = ['count', 'total', 'avg', 'sum', 'percentage', 'rate']
    if (keys.some(k => statKeywords.some(sk => k.toLowerCase().includes(sk)))) {
      return {
        renderType: 'statistics',
        title: '统计分析结果'
      }
    }

    // 默认：通用列表
    return {
      renderType: 'generic_list',
      title: `查询结果 (${data.length}条)`,
      count: data.length
    }
  }

  // === 详情类型检测 ===
  if (typeof data === 'object' && !Array.isArray(data)) {
    // 1. integrated_detail - 完整关联数据
    if (data.l2_id && data.cmdb_info && data.transformation_info) {
      return {
        renderType: 'integrated_detail',
        title: `${data.l2_id} - 完整关联数据`,
        hasSubtasks: !!(data.subtasks && data.subtasks.length > 0)
      }
    }

    // 2. application_detail - 应用详情
    if (data.l2_id && data.current_status && data.current_transformation_phase) {
      return {
        renderType: 'application_detail',
        title: `${data.l2_id} - 应用详情`
      }
    }

    // 3. cmdb_l1_to_l2_mapping - L1到L2映射
    if (data.l1_system_name && data.applications) {
      return {
        renderType: 'cmdb_l1_to_l2_mapping',
        title: `${data.l1_system_name} 关联的L2应用 (${data.applications.length}个)`,
        count: data.applications.length
      }
    }

    // 4. schema_detail - 数据库表结构
    if (data.table && data.columns) {
      return {
        renderType: 'schema_detail',
        title: `表结构: ${data.table}`
      }
    }

    // 5. schema_list - 多表结构
    if (data.tables && Array.isArray(data.tables)) {
      return {
        renderType: 'schema_list',
        title: `数据库结构 (${data.tables.length}个表)`
      }
    }

    // 6. sql_result - SQL查询结果
    if (data.columns && data.rows) {
      return {
        renderType: 'sql_result',
        title: `SQL查询结果 (${data.row_count || data.rows.length}行)`,
        columns: data.columns,
        rowCount: data.row_count || data.rows.length
      }
    }

    // 7. progress_trend - 进度趋势
    if (data.trend_data && Array.isArray(data.trend_data)) {
      return {
        renderType: 'progress_trend',
        title: '进度趋势分析'
      }
    }

    // 8. operation_result - 操作结果
    if (data.updated_count !== undefined ||
        data.created_count !== undefined ||
        data.deleted_count !== undefined ||
        data.download_url !== undefined) {
      return {
        renderType: 'operation_result',
        title: '操作结果'
      }
    }

    // 9. statistics - 统计数据（对象形式）
    const values = Object.values(data)
    const hasStatFields = values.some(v => {
      if (v && typeof v === 'object') {
        const keys = Object.keys(v)
        return keys.some(k =>
          k.includes('total') ||
          k.includes('count') ||
          k.includes('by_') ||
          k.includes('avg') ||
          k.includes('sum')
        )
      }
      return false
    })
    if (hasStatFields) {
      return {
        renderType: 'statistics',
        title: '统计分析结果'
      }
    }

    // 默认：通用详情
    return {
      renderType: 'generic_detail',
      title: '详细信息'
    }
  }

  // === 原始值类型 ===
  return {
    renderType: 'primitive',
    title: '查询结果'
  }
}

/**
 * 判断字段是否为数字类型（用于高亮显示）
 */
export function isNumberField(key: string): boolean {
  const numberKeywords = [
    'count', 'total', 'avg', 'sum', 'percentage',
    'rate', 'number', 'amount', 'price', 'cost',
    'quantity', 'days', 'hours', 'minutes'
  ]
  const lowerKey = key.toLowerCase()
  return numberKeywords.some(keyword => lowerKey.includes(keyword))
}

/**
 * 判断字段是否为日期类型
 */
export function isDateField(key: string): boolean {
  const dateKeywords = ['date', 'time', 'at', 'created', 'updated', 'started', 'ended']
  const lowerKey = key.toLowerCase()
  return dateKeywords.some(keyword => lowerKey.includes(keyword))
}

/**
 * 判断字段是否为状态类型
 */
export function isStatusField(key: string): boolean {
  const statusKeywords = ['status', 'state', 'is_', 'has_']
  const lowerKey = key.toLowerCase()
  return statusKeywords.some(keyword => lowerKey.includes(keyword))
}

/**
 * 格式化数字显示（千分位）
 */
export function formatNumber(value: any): string {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化日期显示
 */
export function formatDate(date: string | null | undefined, format: 'full' | 'date' | 'month' = 'date'): string {
  if (!date) return '-'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return String(date)

    switch (format) {
      case 'full':
        return d.toLocaleString('zh-CN')
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      case 'date':
      default:
        return d.toLocaleDateString('zh-CN')
    }
  } catch {
    return String(date)
  }
}
