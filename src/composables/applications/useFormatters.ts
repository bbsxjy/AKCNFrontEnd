/**
 * 格式化相关的工具函数
 */

export function useFormatters() {
  // 格式化完整日期时间
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'

    try {
      let date: Date
      if (dateString.includes('T')) {
        date = new Date(dateString)
      } else if (dateString.includes('-')) {
        date = new Date(dateString + 'T00:00:00')
      } else {
        date = new Date(dateString)
      }

      if (isNaN(date.getTime())) {
        return '-'
      }

      if (dateString.includes('T')) {
        return date.toLocaleString('zh-CN')
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString)
      return '-'
    }
  }

  // 格式化为年月格式（xx年xx月）
  const formatYearMonth = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'

    try {
      let date: Date
      if (dateString.includes('T')) {
        date = new Date(dateString)
      } else if (dateString.includes('-')) {
        date = new Date(dateString + 'T00:00:00')
      } else {
        date = new Date(dateString)
      }

      if (isNaN(date.getTime())) {
        return '-'
      }

      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthStr = month < 10 ? '0' + month : month.toString()
      return `${year}年${monthStr}月`
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString)
      return '-'
    }
  }

  // 格式化为短日期格式（MM-DD）
  const formatShortDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'

      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}-${day}`
    } catch (error) {
      return '-'
    }
  }

  // 格式化字段值用于显示
  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined || value === '') return '空'

    // 日期字段
    if (field.includes('_date') || field.includes('_at')) {
      return formatYearMonth(value)
    }

    // 布尔字段
    if (field.startsWith('is_')) {
      return value ? '是' : '否'
    }

    // 年份字段
    if (field === 'ak_supervision_acceptance_year') {
      return value + '年'
    }

    return value.toString()
  }

  // 获取字段的中文标签
  const getFieldLabel = (field: string): string => {
    const labelMap: Record<string, string> = {
      'app_name': '应用名称',
      'l2_id': 'L2 ID',
      'belonging_l1_name': '所属L1',
      'belonging_projects': '所属项目',
      'belonging_kpi': '所属指标',
      'ak_supervision_acceptance_year': '监管验收年份',
      'overall_transformation_target': '改造目标',
      'current_status': '当前状态',
      'current_transformation_phase': '当前改造阶段',
      'dev_owner': '开发负责人',
      'dev_team': '开发团队',
      'ops_owner': '运维负责人',
      'ops_team': '运维团队',
      'app_tier': '应用档位',
      'dev_mode': '开发模式',
      'ops_mode': '运维模式',
      'acceptance_status': '验收状态',
      'is_domain_transformation_completed': '域AK改造完成',
      'is_dbpm_transformation_completed': 'DBPM改造完成',
      'planned_requirement_date': '计划需求时间',
      'planned_release_date': '计划发版时间',
      'planned_tech_online_date': '计划技术上线',
      'planned_biz_online_date': '计划业务上线',
      'actual_requirement_date': '实际需求时间',
      'actual_release_date': '实际发版时间',
      'actual_tech_online_date': '实际技术上线',
      'actual_biz_online_date': '实际业务上线',
      'notes': '备注'
    }
    return labelMap[field] || field
  }

  // 获取调整字段的标签
  const getAdjustmentFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'planned_requirement_date': '需求完成',
      'planned_release_date': '发版时间',
      'planned_tech_online_date': '技术上线',
      'planned_biz_online_date': '业务上线'
    }
    return labels[field] || field
  }

  // 获取延期阶段的标签
  const getDelayPhaseLabel = (phase: string): string => {
    const labels: Record<string, string> = {
      'requirement': '需求阶段',
      'release': '发版阶段',
      'tech': '技术上线',
      'biz': '业务上线',
      'planned_requirement_date': '需求阶段',
      'planned_release_date': '发版阶段',
      'planned_tech_online_date': '技术上线',
      'planned_biz_online_date': '业务上线'
    }
    return labels[phase] || phase
  }

  return {
    formatDate,
    formatYearMonth,
    formatShortDate,
    formatFieldValue,
    getFieldLabel,
    getAdjustmentFieldLabel,
    getDelayPhaseLabel
  }
}
