/**
 * 延期计算相关的工具函数
 */
import type { Application, SubTask } from '@/types'

export function useDelayCalculations() {
  // 计算两个日期之间的天数差
  const calculateDaysDiff = (date1: string, date2: string): number => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = d2.getTime() - d1.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // 计算两个日期之间的月数差
  const calculateMonthsDiff = (date1: string, date2: string): number => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const yearDiff = d2.getFullYear() - d1.getFullYear()
    const monthDiff = d2.getMonth() - d1.getMonth()
    return yearDiff * 12 + monthDiff
  }

  // 获取延期类型（用于样式）
  const getDelayType = (delayMonths: number): string => {
    if (Math.abs(delayMonths) > 3) return 'danger'
    if (Math.abs(delayMonths) > 1) return 'warning'
    return 'info'
  }

  // 获取应用的延期次数
  const getDelayCount = (row: Application, planAdjustmentCache: Map<number, any>): number => {
    if (!row.is_delayed && !planAdjustmentCache.has(row.id)) {
      return 0
    }

    const adjustments = planAdjustmentCache.get(row.id)
    if (adjustments && adjustments.length > 0) {
      const delayEvents = adjustments.filter((adj: any) => {
        return adj.field && adj.field.includes('planned_') && adj.field.includes('_date')
      })

      const uniqueDates = new Set(delayEvents.map((adj: any) => adj.adjusted_at.split('T')[0]))
      return Math.max(uniqueDates.size, row.is_delayed ? 1 : 0)
    }

    return row.is_delayed ? 1 : 0
  }

  // 获取子任务延期信息
  const getSubTaskDelayInfo = (row: SubTask) => {
    const today = new Date()
    let delayMonths = 0
    let delayType = ''

    const calcMonthDiff = (plannedDate: Date) => {
      const yearDiff = today.getFullYear() - plannedDate.getFullYear()
      const monthDiff = today.getMonth() - plannedDate.getMonth()
      return Math.max(0, yearDiff * 12 + monthDiff)
    }

    if (row.planned_biz_online_date && !row.actual_biz_online_date) {
      const plannedDate = new Date(row.planned_biz_online_date)
      if (today > plannedDate) {
        delayMonths = calcMonthDiff(plannedDate)
        delayType = '业务上线'
      }
    } else if (row.planned_tech_online_date && !row.actual_tech_online_date) {
      const plannedDate = new Date(row.planned_tech_online_date)
      if (today > plannedDate) {
        delayMonths = calcMonthDiff(plannedDate)
        delayType = '技术上线'
      }
    } else if (row.planned_release_date && !row.actual_release_date) {
      const plannedDate = new Date(row.planned_release_date)
      if (today > plannedDate) {
        delayMonths = calcMonthDiff(plannedDate)
        delayType = '发版'
      }
    }

    if (delayMonths > 0) {
      return {
        hasDelay: true,
        days: delayMonths,
        type: delayType,
        text: `${delayType}延期${delayMonths}月`,
        severity: delayMonths > 3 ? 'danger' : 'warning'
      }
    }

    return {
      hasDelay: false,
      days: 0,
      type: '',
      text: '',
      severity: ''
    }
  }

  // 获取日期对比CSS类
  const getDateComparisonClass = (plannedDate: string | null | undefined, actualDate: string | null | undefined): string => {
    if (!actualDate) return 'pending'
    if (!plannedDate) return 'completed'

    const planned = new Date(plannedDate)
    const actual = new Date(actualDate)

    if (actual <= planned) {
      return 'on-time'
    } else {
      const yearDiff = actual.getFullYear() - planned.getFullYear()
      const monthDiff = actual.getMonth() - planned.getMonth()
      const delayMonths = yearDiff * 12 + monthDiff
      if (delayMonths > 3) {
        return 'delayed-serious'
      } else {
        return 'delayed'
      }
    }
  }

  // 计算子任务的工作天数
  const getSubTaskWorkingDays = (row: SubTask): number => {
    const actualDates = [
      row.actual_requirement_date,
      row.actual_release_date,
      row.actual_tech_online_date,
      row.actual_biz_online_date
    ].filter(d => d && d !== null) as string[]

    if (actualDates.length === 0) return 0

    const earliestDate = new Date(actualDates.sort()[0])
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - earliestDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // 计算总延期天数
  const calculateTotalDelayDays = (delayHistory: any[]): number => {
    return delayHistory.reduce((sum, item) => sum + item.delayDays, 0)
  }

  return {
    calculateDaysDiff,
    calculateMonthsDiff,
    getDelayType,
    getDelayCount,
    getSubTaskDelayInfo,
    getDateComparisonClass,
    getSubTaskWorkingDays,
    calculateTotalDelayDays
  }
}
