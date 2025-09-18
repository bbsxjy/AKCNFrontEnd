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

// Map user's Excel column names to API field names for Applications (总追踪表（勿动）)
export const APPLICATION_FIELD_MAPPING: ExcelFieldMapping = {
  // Primary identifiers
  'L2ID': 'l2_id',
  'L2应用': 'app_name',

  // Supervision and transformation
  '监管验收年份': 'ak_supervision_acceptance_year',
  '改造目标': 'overall_transformation_target',
  '是否已完成AK': 'is_ak_completed',
  '是否已完成云原生': 'is_cloud_native_completed',
  '当前改造阶段': 'current_transformation_phase',
  '改造状态': 'current_status',

  // Planned dates (with line breaks as in Excel)
  '【计划】\n需求完成时间': 'planned_requirement_date',
  '【计划】\n发版时间': 'planned_release_date',
  '【计划】\n技术上线时间': 'planned_tech_online_date',
  '【计划】\n业务上线时间': 'planned_biz_online_date',

  // Actual dates (with line breaks as in Excel)
  '【实际】\n需求到达时间': 'actual_requirement_date',
  '【实际】\n发版时间': 'actual_release_date',
  '【实际】\n技术上线时间': 'actual_tech_online_date',
  '【实际】\n业务上线时间': 'actual_biz_online_date',

  // Basic information
  '备注': 'notes',
  '档位': 'app_tier',
  '所属L1': 'belonging_l1_name',
  '所属项目': 'belonging_projects',

  // Development and operations
  '开发模式': 'dev_mode',
  '运维模式': 'ops_mode',
  '开发负责人': 'dev_owner',
  '开发团队': 'dev_team',
  '运维负责人': 'ops_owner',
  '运维团队': 'ops_team',

  // KPI and acceptance
  '所属指标': 'belonging_kpi',
  '验收状态': 'acceptance_status'
}

// Map user's Excel column names to API field names for SubTasks (子追踪表)
export const SUBTASK_FIELD_MAPPING: ExcelFieldMapping = {
  // Primary identifiers
  'L2ID': 'l2_id',
  'L2应用': 'app_name',

  // Task details
  '子目标': 'sub_target',
  '版本名': 'version_name',
  '改造状态': 'task_status',

  // Planned dates (with line breaks as in Excel)
  '【计划】\n需求完成时间': 'planned_requirement_date',
  '【计划】\n发版时间': 'planned_release_date',
  '【计划】\n技术上线时间': 'planned_tech_online_date',
  '【计划】\n业务上线时间': 'planned_biz_online_date',

  // Actual dates (with line breaks as in Excel)
  '【实际】\n需求到达时间': 'actual_requirement_date',
  '【实际】\n发版时间': 'actual_release_date',
  '【实际】\n技术上线时间': 'actual_tech_online_date',
  '【实际】\n业务上线时间': 'actual_biz_online_date',

  // Additional fields
  '备注': 'notes',
  '资源是否申请': 'resource_applied',
  '运营需求提交': 'ops_requirement_submitted',
  '运营测试': 'ops_testing_status',
  '上线检查': 'launch_check_status'
}

// Value mappings for specific fields
export const STATUS_VALUE_MAPPING: ValueMapping = {
  '待启动': 'planning',
  '研发进行中': 'in_progress',
  '业务上线中': 'testing',
  '全部完成': 'completed',
  '存在阻塞': 'blocked'
}

export const BOOLEAN_VALUE_MAPPING: ValueMapping = {
  '是': 'true',
  '否': 'false',
  '已完成': 'true',
  '未完成': 'false',
  '1': 'true',
  '0': 'false',
  'true': 'true',
  'false': 'false'
}

export const TARGET_VALUE_MAPPING: ValueMapping = {
  'AK': 'AK',
  '云原生': '云原生',
  'CloudNative': '云原生',
  'cloud-native': '云原生'
}

/**
 * Convert Excel date serial number to ISO date string
 */
export function excelDateToISO(excelDate: number | string): string | null {
  if (!excelDate) return null

  // If already a string date, return as is
  if (typeof excelDate === 'string') {
    // Check if it's already in ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(excelDate)) {
      return excelDate.split('T')[0]
    }
    // Try parsing the date string
    const parsed = new Date(excelDate)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    return null
  }

  // Convert Excel serial number to date
  // Excel dates start from 1900-01-01 (serial number 1)
  // But Excel incorrectly considers 1900 as a leap year, so we need to adjust
  const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
  const msPerDay = 24 * 60 * 60 * 1000

  // Adjust for Excel's leap year bug
  let adjustedDate = excelDate
  if (excelDate > 60) {
    adjustedDate = excelDate - 1
  }

  const date = new Date(excelEpoch.getTime() + adjustedDate * msPerDay)
  return date.toISOString().split('T')[0]
}

/**
 * Map Excel column value to API field value
 */
export function mapFieldValue(fieldName: string, value: any): any {
  // Handle null or undefined
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Handle date fields
  if (fieldName.includes('date') || fieldName.includes('_at')) {
    return excelDateToISO(value)
  }

  // Handle boolean fields
  if (fieldName.startsWith('is_') || fieldName === 'resource_applied') {
    const strValue = String(value).toLowerCase()
    return BOOLEAN_VALUE_MAPPING[strValue] === 'true'
  }

  // Handle status fields
  if (fieldName === 'current_status' || fieldName === 'task_status') {
    return STATUS_VALUE_MAPPING[value] || value
  }

  // Handle transformation target
  if (fieldName === 'overall_transformation_target' || fieldName === 'sub_target') {
    return TARGET_VALUE_MAPPING[value] || value
  }

  // Handle year field
  if (fieldName === 'ak_supervision_acceptance_year') {
    return parseInt(value)
  }

  return value
}