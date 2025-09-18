import { ApplicationsAPI } from './applications'
import { SubTasksAPI } from './subtasks'
import { NotificationsAPI } from './notifications'

export interface DashboardStats {
  total: number
  active: number
  completed: number
  blocked: number
  averageProgress: number
  // 按改造目标分类
  akTotal: number
  akCompleted: number
  akInProgress: number
  cloudNativeTotal: number
  cloudNativeCompleted: number
  cloudNativeInProgress: number
  // 按详细状态分类
  notStarted: number
  inDevelopment: number
  inTesting: number
  online: number
  offline: number
}

export interface TrendDataPoint {
  date: string
  value: number
}

export interface MonthlyCompletionData {
  month: string
  requirement: number  // 需求完成数
  release: number      // 发版完成数
  techOnline: number   // 技术上线完成数
  bizOnline: number    // 业务上线完成数
}

export interface DepartmentProgress {
  name: string
  value: number
  percentage?: number
}

export interface DashboardChartData {
  progressTrend: TrendDataPoint[]
  departmentDistribution: DepartmentProgress[]
}

export class DashboardAPI {
  // 获取仪表盘统计数据 - 使用现有API计算
  static async getDashboardStats(): Promise<DashboardStats> {
    // 从应用列表API计算统计数据
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    const stats: DashboardStats = {
      total: applications.total,
      active: 0,
      completed: 0,
      blocked: 0,
      averageProgress: 0,
      akTotal: 0,
      akCompleted: 0,
      akInProgress: 0,
      cloudNativeTotal: 0,
      cloudNativeCompleted: 0,
      cloudNativeInProgress: 0,
      notStarted: 0,
      inDevelopment: 0,
      inTesting: 0,
      online: 0,
      offline: 0
    }

    if (applications.items.length > 0) {
      let totalProgress = 0

      applications.items.forEach(app => {
        totalProgress += app.progress_percentage || 0

        // 按改造目标分类 (using new field names)
        const transformTarget = app.overall_transformation_target || app.transformation_target
        if (transformTarget === 'AK') {
          stats.akTotal++
          const status = app.current_status || app.overall_status || app.status
          if (status === '全部完成' || status === 'completed') {
            stats.akCompleted++
          } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress') {
            stats.akInProgress++
          }
        } else if (transformTarget === '云原生') {
          stats.cloudNativeTotal++
          const status = app.current_status || app.overall_status || app.status
          if (status === '全部完成' || status === 'completed') {
            stats.cloudNativeCompleted++
          } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress') {
            stats.cloudNativeInProgress++
          }
        }

        // 按状态分类 (using new field names)
        const status = app.current_status || app.overall_status || app.status
        switch (status) {
          case '待启动':
          case 'not_started':
            stats.notStarted++
            break
          case '研发进行中':
          case 'in_progress':
            stats.active++
            stats.inDevelopment++
            break
          case '业务上线中':
          case 'testing':
            stats.active++
            stats.inTesting++
            break
          case '全部完成':
          case 'completed':
            stats.completed++
            stats.online++
            break
          case '存在阻塞':
          case 'blocked':
            stats.blocked++
            stats.offline++
            break
        }
      })

      stats.averageProgress = Math.round(totalProgress / applications.items.length)
    }

    return stats
  }

  // 获取月度完成数据 - 统计各阶段完成的应用数量
  static async getMonthlyCompletionTrend(type: 'planned' | 'actual' = 'actual'): Promise<MonthlyCompletionData[]> {
    // 获取所有应用数据
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    // 生成最近12个月的数据
    const monthlyData: MonthlyCompletionData[] = []
    const today = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // JavaScript月份从0开始

      // 统计该月份完成的各阶段数量
      let requirementCount = 0
      let releaseCount = 0
      let techOnlineCount = 0
      let bizOnlineCount = 0

      applications.items.forEach(app => {
        // 根据type决定使用计划日期还是实际日期
        const requirementDate = type === 'planned' ? app.planned_requirement_date : app.actual_requirement_date
        const releaseDate = type === 'planned' ? app.planned_release_date : app.actual_release_date
        const techDate = type === 'planned' ? app.planned_tech_online_date : app.actual_tech_online_date
        const bizDate = type === 'planned' ? app.planned_biz_online_date : app.actual_biz_online_date

        // 检查是否在当前月份完成
        if (requirementDate) {
          const d = new Date(requirementDate)
          if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            requirementCount++
          }
        }
        if (releaseDate) {
          const d = new Date(releaseDate)
          if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            releaseCount++
          }
        }
        if (techDate) {
          const d = new Date(techDate)
          if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            techOnlineCount++
          }
        }
        if (bizDate) {
          const d = new Date(bizDate)
          if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            bizOnlineCount++
          }
        }
      })

      monthlyData.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        requirement: requirementCount,
        release: releaseCount,
        techOnline: techOnlineCount,
        bizOnline: bizOnlineCount
      })
    }

    console.log('Monthly completion data:', {
      type,
      totalApps: applications.items.length,
      monthlyData: monthlyData.slice(-3) // 显示最后3个月的数据
    })

    return monthlyData
  }

  // 保留原方法以兼容，但改为调用新方法
  static async getProgressTrend(_period: string = '6months'): Promise<TrendDataPoint[]> {
    // 调用新方法获取实际完成数据
    const monthlyData = await this.getMonthlyCompletionTrend('actual')

    // 转换为旧格式，使用业务上线数作为进度值
    return monthlyData.map(data => ({
      date: data.month,
      value: data.bizOnline
    }))
  }

  // 获取部门进度分布 - 使用现有API计算
  static async getDepartmentDistribution(): Promise<DepartmentProgress[]> {
    // 从应用列表API计算部门分布
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })
    const departmentMap = new Map<string, { count: number; progress: number }>()

    applications.items.forEach(app => {
      const team = app.responsible_team || app.dev_team || app.ops_team || '未分配'
      const existing = departmentMap.get(team) || { count: 0, progress: 0 }
      existing.count++
      existing.progress += app.progress_percentage || 0
      departmentMap.set(team, existing)
    })

    const distribution: DepartmentProgress[] = []
    departmentMap.forEach((data, team) => {
      distribution.push({
        name: team,
        value: data.count,
        percentage: data.count > 0 ? Math.round(data.progress / data.count) : 0
      })
    })

    return distribution.sort((a, b) => b.value - a.value).slice(0, 5)
  }

  // 获取图表数据
  static async getChartData(): Promise<DashboardChartData> {
    const [progressTrend, departmentDistribution] = await Promise.all([
      this.getProgressTrend(),
      this.getDepartmentDistribution()
    ])

    return {
      progressTrend,
      departmentDistribution
    }
  }

  // 获取待办任务（我的任务）
  static async getMyTasks(limit: number = 5): Promise<any[]> {
    // 获取当前用户的子任务
    const subtasks = await SubTasksAPI.getMySubTasks()

    // 过滤未完成的任务并排序
    const pendingTasks = subtasks
      .filter(task => task.status !== '已完成' && task.status !== 'completed')
      .sort((a, b) => {
        // 按计划结束日期排序，紧急的在前
        const dateA = new Date(a.planned_end_date).getTime()
        const dateB = new Date(b.planned_end_date).getTime()
        return dateA - dateB
      })
      .slice(0, limit)

    // 转换为仪表盘显示格式
    const now = Date.now()
    const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000

    return pendingTasks.map(task => ({
      id: task.id,
      title: task.subtask_name,
      plannedDate: task.planned_end_date,
      isUrgent: new Date(task.planned_end_date).getTime() < sevenDaysLater,
      status: task.status,
      progress: task.progress_percentage,
      applicationId: task.application_id,
      responsiblePerson: task.responsible_person
    }))
  }

  // 获取最新通知
  static async getRecentNotifications(limit: number = 10): Promise<any[]> {
    const notifications = await NotificationsAPI.getNotifications({
      unread_only: true,
      limit
    })

    return notifications.items
  }

  // 获取完整的仪表盘数据
  static async getDashboardData() {
    const [stats, chartData, myTasks, notifications] = await Promise.all([
      this.getDashboardStats(),
      this.getChartData(),
      this.getMyTasks(),
      this.getRecentNotifications()
    ])

    return {
      stats,
      chartData,
      myTasks,
      notifications
    }
  }
}

// 缺失的API端点建议
export const MISSING_DASHBOARD_APIS = {
  // 1. 进度趋势历史数据API
  progressTrend: {
    route: 'GET /api/v1/dashboard/progress-trend',
    description: '获取应用改造进度的历史趋势数据',
    input: {
      query: {
        period: 'string - 时间段 (1month/3months/6months/1year)',
        team: 'string (optional) - 团队筛选',
        application_id: 'number (optional) - 应用ID筛选'
      }
    },
    output: {
      trend_data: [
        {
          date: 'string - 日期 (YYYY-MM-DD)',
          total_applications: 'number - 总应用数',
          active_applications: 'number - 进行中应用数',
          completed_applications: 'number - 已完成应用数',
          average_progress: 'number - 平均进度百分比'
        }
      ]
    },
    reason: '当前无法获取历史进度数据，仪表盘图表显示空状态'
  },

  // 2. 仪表盘统计汇总API (可选，当前通过applications API计算)
  stats: {
    route: 'GET /api/v1/dashboard/stats',
    description: '获取仪表盘统计汇总数据（可选，提升性能）',
    input: {
      query: {
        team: 'string (optional) - 团队筛选',
        period: 'string (optional) - 统计时间段'
      }
    },
    output: {
      total_applications: 'number - 应用总数',
      active_applications: 'number - 进行中应用数',
      completed_applications: 'number - 已完成应用数',
      blocked_applications: 'number - 阻塞应用数',
      average_progress: 'number - 平均进度',
      last_updated: 'string - 最后更新时间'
    },
    reason: '当前通过applications API计算，专用API可提升性能'
  }
}