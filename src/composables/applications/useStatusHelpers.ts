/**
 * 状态相关的辅助函数
 */
import type { Application, SubTask } from '@/types'

export function useStatusHelpers() {
  // 获取状态对应的标签类型
  const getStatusType = (status: string): string => {
    const statusMap: Record<string, string> = {
      '待启动': 'info',
      '研发进行中': 'primary',
      '业务上线中': 'warning',
      '全部完成': 'success',
      '存在阻塞': 'danger'
    }
    return statusMap[status] || 'info'
  }

  // 获取子任务状态标签类型
  const getSubTaskStatusType = (status: string): string => {
    const statusMap: Record<string, string> = {
      '待启动': 'info',
      '研发进行中': 'primary',
      '业务上线中': 'warning',
      '已完成': 'success',
      '存在阻塞': 'danger'
    }
    return statusMap[status] || 'info'
  }

  // 获取进度条颜色
  const getProgressColor = (row: Application): string => {
    if (row.progress_percentage >= 80) return '#48bb78'
    if (row.progress_percentage >= 50) return '#ed8936'
    return '#667eea'
  }

  // 获取子任务进度条颜色
  const getSubTaskProgressColor = (row: SubTask): string => {
    if (row.task_status === '存在阻塞' || row.is_blocked) return '#f56565'
    const progress = calculateSubTaskProgress(row)
    if (progress >= 80) return '#48bb78'
    return '#667eea'
  }

  // 计算子任务进度
  const calculateSubTaskProgress = (row: SubTask): number => {
    if (row.progress_percentage !== undefined && row.progress_percentage !== null) {
      return Number(row.progress_percentage)
    }

    let progress = 0
    if (row.actual_requirement_date) progress += 25
    if (row.actual_release_date) progress += 25
    if (row.actual_tech_online_date) progress += 25
    if (row.actual_biz_online_date) progress += 25

    return progress
  }

  // 获取操作类型（用于审计日志）
  const getOperationType = (operation: string): string => {
    const typeMap: Record<string, string> = {
      'INSERT': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger'
    }
    return typeMap[operation] || 'info'
  }

  // 获取操作文本（中文）
  const getOperationText = (operation: string): string => {
    const textMap: Record<string, string> = {
      'INSERT': '创建',
      'UPDATE': '更新',
      'DELETE': '删除'
    }
    return textMap[operation] || operation
  }

  // 获取阶段状态CSS类
  const getPhaseStatusClass = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'): string => {
    const classMap = {
      'NOT_STARTED': 'status-not-started',
      'IN_PROGRESS': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'BLOCKED': 'status-blocked'
    }
    return classMap[status] || 'status-not-started'
  }

  // 获取阶段状态文本
  const getPhaseStatusText = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'): string => {
    const textMap = {
      'NOT_STARTED': '未开始',
      'IN_PROGRESS': '进行中',
      'COMPLETED': '已完成',
      'BLOCKED': '阻塞'
    }
    return textMap[status] || '未开始'
  }

  // 获取状态标签类型（Element Plus）
  const getStatusTagType = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'): string => {
    const typeMap = {
      'NOT_STARTED': 'info',
      'IN_PROGRESS': '',
      'COMPLETED': 'success',
      'BLOCKED': 'danger'
    }
    return typeMap[status] || 'info'
  }

  // 获取详细阶段文本
  const getDetailedPhaseText = (app: any): string => {
    if (app.actual_biz_online_date) {
      return '已完成'
    }
    if (app.actual_tech_online_date) {
      return '业务上线中'
    }
    if (app.actual_release_date) {
      return '技术上线中'
    }
    if (app.actual_requirement_date) {
      return '研发中'
    }

    const now = new Date()

    if (app.planned_biz_online_date) {
      const plannedBizDate = new Date(app.planned_biz_online_date)
      if (now >= plannedBizDate) {
        return '业务上线中'
      }
    }

    if (app.planned_tech_online_date) {
      const plannedTechDate = new Date(app.planned_tech_online_date)
      if (now >= plannedTechDate) {
        return '技术上线中'
      }
    }

    if (app.planned_release_date) {
      const plannedReleaseDate = new Date(app.planned_release_date)
      if (now >= plannedReleaseDate) {
        return '研发中'
      }
    }

    if (app.planned_requirement_date) {
      const plannedReqDate = new Date(app.planned_requirement_date)
      if (now >= plannedReqDate) {
        return '需求中'
      }
    }

    return '需求中'
  }

  // 获取阶段颜色类
  const getPhaseColorClass = (phaseText: string, baseStatus: string): string => {
    if (phaseText === '已完成') return 'phase-completed'
    if (phaseText === '阻塞') return 'phase-blocked'
    if (phaseText === '未开始') return 'phase-not-started'

    if (phaseText.includes('需求')) return 'phase-requirement'
    if (phaseText.includes('发版')) return 'phase-release'
    if (phaseText.includes('技术上线')) return 'phase-tech'
    if (phaseText.includes('业务上线')) return 'phase-biz'

    return 'status-in_progress'
  }

  return {
    getStatusType,
    getSubTaskStatusType,
    getProgressColor,
    getSubTaskProgressColor,
    calculateSubTaskProgress,
    getOperationType,
    getOperationText,
    getPhaseStatusClass,
    getPhaseStatusText,
    getStatusTagType,
    getDetailedPhaseText,
    getPhaseColorClass
  }
}
