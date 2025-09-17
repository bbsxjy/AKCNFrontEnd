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
  'L2ID': 'application_id',
  'L2应用': 'application_name',
  '档位': 'service_tier',
  '所属项目': 'business_subdomain',
  '开发负责人': 'responsible_person',
  '开发团队': 'responsible_team',
  '监管验收年份': 'supervision_year',
  '改造目标': 'transformation_target',
  '当前改造阶段': 'current_stage',
  '硬件资源保障\n优先级': 'priority',
  '延误状态': 'delay_status',
  '改造状态': 'status'
}

// Map user's Excel column names to API field names for SubTasks (子追踪表)
export const SUBTASK_FIELD_MAPPING: ExcelFieldMapping = {
  'L2ID': 'application_l2_id',
  'L2应用名': 'application_name',
  '子目标': 'sub_target',
  '版本名': 'version_name',
  '改造状态': 'task_status',
  '【计划】\n需求完成时间': 'planned_start_date',
  '【实际】\n需求到达时间': 'actual_start_date',
  '【计划】\n发版时间': 'planned_release_date',
  '【实际】\n发版时间': 'actual_release_date',
  '【计划】\n技术上线时间': 'planned_tech_date',
  '【实际】\n技术上线时间': 'actual_tech_date',
  '【计划】\n业务上线时间': 'planned_end_date',
  '【实际】\n业务上线时间': 'actual_end_date',
  '验收年份': 'supervision_year',
  '所属指标': 'kpi_classification',
  '主表同步备注': 'technical_notes'
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
        case 'status':
          mappedValue = APPLICATION_STATUS_MAPPING[excelValue] || excelValue
          break
        case 'priority':
          mappedValue = PRIORITY_VALUE_MAPPING[excelValue] || excelValue
          break
        case 'transformation_target':
          mappedValue = TARGET_VALUE_MAPPING[excelValue] || excelValue
          break
        case 'supervision_year':
          // Extract year from "2026年" format
          if (typeof excelValue === 'string' && excelValue.includes('年')) {
            mappedValue = parseInt(excelValue.replace('年', ''))
          }
          break
        case 'application_id':
          // Ensure application_id is string
          mappedValue = String(excelValue)
          break
      }

      apiRow[apiField] = mappedValue
    }
  }

  // Set default values for required fields
  if (!apiRow.status) {
    apiRow.status = 'pending'
  }
  if (!apiRow.business_domain) {
    apiRow.business_domain = 'Core'
  }
  if (!apiRow.application_name) {
    apiRow.application_name = `Application_${apiRow.application_id || 'Unknown'}`
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
          mappedValue = SUBTASK_STATUS_MAPPING[excelValue] || excelValue
          break
        case 'supervision_year':
          // Extract year from "2026年" format
          if (typeof excelValue === 'string' && excelValue.includes('年')) {
            mappedValue = parseInt(excelValue.replace('年', ''))
          }
          break
        case 'application_l2_id':
          // Ensure application_l2_id is string
          mappedValue = String(excelValue)
          break
        // Handle date fields - Excel dates might be in serial format
        case 'planned_start_date':
        case 'actual_start_date':
        case 'planned_release_date':
        case 'actual_release_date':
        case 'planned_tech_date':
        case 'actual_tech_date':
        case 'planned_end_date':
        case 'actual_end_date':
          if (typeof excelValue === 'number') {
            // Excel date serial number to JavaScript Date
            const excelDate = new Date((excelValue - 25569) * 86400 * 1000)
            mappedValue = excelDate.toISOString().split('T')[0]
          } else if (excelValue instanceof Date) {
            mappedValue = excelValue.toISOString().split('T')[0]
          }
          break
      }

      apiRow[apiField] = mappedValue
    }
  }

  // Set default values for required fields
  if (!apiRow.task_status) {
    apiRow.task_status = 'pending'
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