/**
 * Excel Field Mapping Configuration
 * Maps user's existing Excel column names to API field names
 */

export interface ExcelFieldMapping {
  [excelColumn: string]: string
}

export interface ValueMapping {
  [excelValue: string]: string
}

// Map user's Excel column names to API field names for Applications (总追踪表)
export const APPLICATION_FIELD_MAPPING: ExcelFieldMapping = {
  // Primary identifiers
  'L2ID': 'l2_id',
  'L2 ID': 'l2_id',
  'L2应用': 'app_name',
  '应用名称': 'app_name',

  // Basic information
  '档位': 'app_tier',
  '所属L1': 'belonging_l1_name',
  '所属L1名称': 'belonging_l1_name',
  '所属项目': 'belonging_projects',

  // Team and ownership
  '开发负责人': 'dev_owner',
  '开发团队': 'dev_team',
  '运维负责人': 'ops_owner',
  '运维团队': 'ops_team',

  // Transformation details
  '监管验收年份': 'ak_supervision_acceptance_year',
  '监管年': 'ak_supervision_acceptance_year',
  '改造目标': 'overall_transformation_target',
  '转型目标': 'overall_transformation_target',
  '当前改造阶段': 'current_transformation_phase',
  '当前阶段': 'current_transformation_phase',
  '改造状态': 'current_status',
  '当前状态': 'current_status',
  '状态': 'current_status',

  // Completion flags
  '是否已完成AK': 'is_ak_completed',
  '是否已完成云原生': 'is_cloud_native_completed',

  // Planned dates (with line breaks as in Excel)
  '【计划】\n需求完成时间': 'planned_requirement_date',
  '【计划】需求完成时间': 'planned_requirement_date',
  '【计划】\n发版时间': 'planned_release_date',
  '【计划】发版时间': 'planned_release_date',
  '【计划】\n技术上线时间': 'planned_tech_online_date',
  '【计划】技术上线时间': 'planned_tech_online_date',
  '【计划】\n业务上线时间': 'planned_biz_online_date',
  '【计划】业务上线时间': 'planned_biz_online_date',

  // Actual dates (with line breaks as in Excel)
  '【实际】\n需求到达时间': 'actual_requirement_date',
  '【实际】需求到达时间': 'actual_requirement_date',
  '【实际】\n发版时间': 'actual_release_date',
  '【实际】发版时间': 'actual_release_date',
  '【实际】\n技术上线时间': 'actual_tech_online_date',
  '【实际】技术上线时间': 'actual_tech_online_date',
  '【实际】\n业务上线时间': 'actual_biz_online_date',
  '【实际】业务上线时间': 'actual_biz_online_date',

  // Additional fields
  '开发模式': 'dev_mode',
  '运维模式': 'ops_mode',
  '所属指标': 'belonging_kpi',
  '所属KPI': 'belonging_kpi',
  '验收状态': 'acceptance_status',
  '备注': 'notes'
}

// Map user's Excel column names to API field names for SubTasks (子追踪表)
export const SUBTASK_FIELD_MAPPING: ExcelFieldMapping = {
  // Primary identifiers
  'L2ID': 'l2_id',
  'L2 ID': 'l2_id',

  // Subtask details
  '子目标': 'sub_target',
  '版本名': 'version_name',
  '版本名称': 'version_name',
  '改造状态': 'task_status',
  '任务状态': 'task_status',

  // Planned dates (with line breaks as in Excel)
  '【计划】\n需求完成时间': 'planned_requirement_date',
  '【计划】需求完成时间': 'planned_requirement_date',
  '【计划】\n发版时间': 'planned_release_date',
  '【计划】发版时间': 'planned_release_date',
  '【计划】\n技术上线时间': 'planned_tech_online_date',
  '【计划】技术上线时间': 'planned_tech_online_date',
  '【计划】\n业务上线时间': 'planned_biz_online_date',
  '【计划】业务上线时间': 'planned_biz_online_date',

  // Actual dates (with line breaks as in Excel)
  '【实际】\n需求到达时间': 'actual_requirement_date',
  '【实际】需求到达时间': 'actual_requirement_date',
  '【实际】\n发版时间': 'actual_release_date',
  '【实际】发版时间': 'actual_release_date',
  '【实际】\n技术上线时间': 'actual_tech_online_date',
  '【实际】技术上线时间': 'actual_tech_online_date',
  '【实际】\n业务上线时间': 'actual_biz_online_date',
  '【实际】业务上线时间': 'actual_biz_online_date',

  // Additional fields
  '备注': 'notes',
  '主表同步备注': 'notes',
  '资源已申请': 'resource_applied',
  '运维需求提交时间': 'ops_requirement_submitted',
  '运维测试状态': 'ops_testing_status',
  '上线检查状态': 'launch_check_status'
}

// Legacy mapping for backward compatibility
export const EXCEL_FIELD_MAPPING = APPLICATION_FIELD_MAPPING

// Map Chinese status values to API status values for Applications
export const APPLICATION_STATUS_MAPPING: ValueMapping = {
  '研发进行中': 'in_progress',
  '待启动': 'pending',
  '业务上线中': 'deploying',
  '全部完成': 'completed',
  '存在阻塞': 'blocked'
}

// Map Chinese status values to API status values for SubTasks
export const SUBTASK_STATUS_MAPPING: ValueMapping = {
  '研发进行中': 'in_progress',
  '子任务完成': 'completed',
  '阻塞': 'blocked',
  '待启动': 'pending',
  '业务上线中': 'deploying'
}

// Legacy mapping for backward compatibility
export const STATUS_VALUE_MAPPING = APPLICATION_STATUS_MAPPING

// Map Chinese priority values to API priority values
export const PRIORITY_VALUE_MAPPING: ValueMapping = {
  'P0': 'high',
  'P1': 'medium',
  'P2': 'low'
}

// Map transformation target values
export const TARGET_VALUE_MAPPING: ValueMapping = {
  'AK': 'AK',
  '云原生': 'cloud_native'
}

/**
 * Transform Application Excel row data to API format (总追踪表)
 */
export function transformApplicationRowToAPI(excelRow: Record<string, any>): Record<string, any> {
  const apiRow: Record<string, any> = {}

  // Map field names using application mapping
  for (const [excelColumn, excelValue] of Object.entries(excelRow)) {
    const apiField = APPLICATION_FIELD_MAPPING[excelColumn]
    if (apiField && excelValue !== null && excelValue !== undefined) {
      let mappedValue = excelValue

      // Apply value mappings based on field type
      switch (apiField) {
        case 'current_status':
          mappedValue = excelValue  // Keep status as-is, backend accepts Chinese values
          break
        case 'overall_transformation_target':
          // Map to standard values
          if (excelValue === '云原生' || excelValue === 'cloud_native') {
            mappedValue = '云原生'
          } else {
            mappedValue = 'AK'
          }
          break
        case 'ak_supervision_acceptance_year':
          // Extract year from "2026年" format or convert number
          if (typeof excelValue === 'string' && excelValue.includes('年')) {
            mappedValue = parseInt(excelValue.replace('年', ''))
          } else if (typeof excelValue === 'number') {
            mappedValue = excelValue
          }
          break
        case 'l2_id':
          // Ensure l2_id is string
          mappedValue = String(excelValue)
          break
        case 'app_tier':
        case 'delay_days':
          // Ensure numeric fields are numbers
          mappedValue = typeof excelValue === 'number' ? excelValue : parseInt(excelValue)
          break
      }

      apiRow[apiField] = mappedValue
    }
  }

  // Set default values for required fields
  if (!apiRow.current_status) {
    apiRow.current_status = '待启动'
  }
  if (!apiRow.app_name) {
    apiRow.app_name = `未命名应用`
  }
  if (!apiRow.overall_transformation_target) {
    apiRow.overall_transformation_target = 'AK'
  }
  if (!apiRow.dev_team) {
    apiRow.dev_team = '待分配'
  }

  return apiRow
}

/**
 * Transform SubTask Excel row data to API format (子追踪表)
 */
export function transformSubTaskRowToAPI(excelRow: Record<string, any>): Record<string, any> {
  const apiRow: Record<string, any> = {}

  // Map field names using subtask mapping
  for (const [excelColumn, excelValue] of Object.entries(excelRow)) {
    const apiField = SUBTASK_FIELD_MAPPING[excelColumn]
    if (apiField && excelValue !== null && excelValue !== undefined) {
      let mappedValue = excelValue

      // Apply value mappings based on field type
      switch (apiField) {
        case 'task_status':
          mappedValue = excelValue  // Keep status as-is, backend accepts Chinese values
          break
        case 'l2_id':
          // l2_id should be a number (application's database ID)
          // If it's a string L2 ID, it needs to be looked up from applications
          // For now, try to convert to number
          if (typeof excelValue === 'number') {
            mappedValue = excelValue
          } else {
            // This will need to be resolved by looking up the application
            mappedValue = excelValue
          }
          break
        case 'sub_target':
          // Map to standard values
          if (excelValue === '云原生' || excelValue === 'cloud_native') {
            mappedValue = '云原生'
          } else {
            mappedValue = 'AK'
          }
          break
        // Handle date fields - Excel dates might be in serial format
        case 'planned_requirement_date':
        case 'actual_requirement_date':
        case 'planned_release_date':
        case 'actual_release_date':
        case 'planned_tech_online_date':
        case 'actual_tech_online_date':
        case 'planned_biz_online_date':
        case 'actual_biz_online_date':
          if (typeof excelValue === 'number') {
            // Excel date serial number to JavaScript Date
            const excelDate = new Date((excelValue - 25569) * 86400 * 1000)
            mappedValue = excelDate.toISOString().split('T')[0]
          } else if (excelValue instanceof Date) {
            mappedValue = excelValue.toISOString().split('T')[0]
          }
          break
        case 'resource_applied':
          // Convert to boolean
          mappedValue = excelValue === true || excelValue === '是' || excelValue === '1'
          break
      }

      apiRow[apiField] = mappedValue
    }
  }

  // Set default values for required fields
  if (!apiRow.task_status) {
    apiRow.task_status = '待启动'
  }
  if (!apiRow.sub_target) {
    apiRow.sub_target = 'AK'
  }

  return apiRow
}

/**
 * Legacy function for backward compatibility
 */
export function transformExcelRowToAPI(excelRow: Record<string, any>): Record<string, any> {
  return transformApplicationRowToAPI(excelRow)
}

/**
 * Get available Excel columns for field mapping display
 */
export function getExcelColumns(): string[] {
  return Object.keys(EXCEL_FIELD_MAPPING)
}

/**
 * Get API field name for Excel column
 */
export function getAPIFieldName(excelColumn: string): string | undefined {
  return EXCEL_FIELD_MAPPING[excelColumn]
}