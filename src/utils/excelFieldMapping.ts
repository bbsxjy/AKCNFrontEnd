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

// Map user's Excel column names to API field names
export const EXCEL_FIELD_MAPPING: ExcelFieldMapping = {
  'L2ID': 'application_id',
  'L2应用': 'application_name',
  '所属L1': 'business_domain',
  '所属项目': 'business_subdomain',
  '开发负责人': 'responsible_person',
  '开发团队': 'responsible_team',
  '改造状态': 'status',
  '硬件资源保障\n优先级': 'priority', // Exact column name with newline
  '所属指标': 'kpi_classification',
  '档位': 'service_tier',
  '改造目标': 'transformation_target',
  '监管验收年份': 'supervision_year',
  '延误状态': 'delay_status',
  '当前改造阶段': 'current_stage',
  '验收状态': 'acceptance_status'
}

// Map Chinese status values to API status values
export const STATUS_VALUE_MAPPING: ValueMapping = {
  '研发进行中': 'in_progress',
  '待启动': 'pending',
  '业务上线中': 'deploying',
  '全部完成': 'completed',
  '存在阻塞': 'blocked'
}

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
 * Transform Excel row data to API format
 */
export function transformExcelRowToAPI(excelRow: Record<string, any>): Record<string, any> {
  const apiRow: Record<string, any> = {}

  // Map field names
  for (const [excelColumn, excelValue] of Object.entries(excelRow)) {
    const apiField = EXCEL_FIELD_MAPPING[excelColumn]
    if (apiField && excelValue !== null && excelValue !== undefined) {
      let mappedValue = excelValue

      // Apply value mappings based on field type
      switch (apiField) {
        case 'status':
          mappedValue = STATUS_VALUE_MAPPING[excelValue] || excelValue
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

  // Set default values for required fields if not present
  if (!apiRow.status) {
    apiRow.status = 'pending'
  }
  if (!apiRow.priority) {
    apiRow.priority = 'medium'
  }
  if (!apiRow.kpi_classification) {
    apiRow.kpi_classification = 'P1'
  }
  if (!apiRow.service_tier) {
    apiRow.service_tier = 'Tier 1'
  }

  return apiRow
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