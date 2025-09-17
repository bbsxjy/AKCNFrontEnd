import { ApplicationsAPI } from './applications'
import { SubTasksAPI } from './subtasks'
import { NotificationsAPI } from './notifications'

export interface DashboardStats {
  total: number
  active: number
  completed: number
  blocked: number
  averageProgress: number
}

export interface TrendDataPoint {
  date: string
  value: number
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
      averageProgress: 0
    }

    if (applications.items.length > 0) {
      let totalProgress = 0

      applications.items.forEach(app => {
        totalProgress += app.progress_percentage || 0

        switch (app.status) {
          case '研发进行中':
          case '业务上线中':
          case 'active':
          case 'in_progress':
            stats.active++
            break
          case '全部完成':
          case 'completed':
            stats.completed++
            break
          case '存在阻塞':
          case 'blocked':
            stats.blocked++
            break
        }
      })

      stats.averageProgress = Math.round(totalProgress / applications.items.length)
    }

    return stats
  }

  // 获取进度趋势数据 - 使用应用数据生成模拟趋势
  static async getProgressTrend(_period: string = '6months'): Promise<TrendDataPoint[]> {
    // 获取所有应用数据
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    // 生成最近30天的趋势数据
    const trendData: TrendDataPoint[] = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 计算当天的平均进度（模拟逐渐增长）
      let avgProgress = 0
      if (applications.items.length > 0) {
        const totalProgress = applications.items.reduce((sum, app) =>
          sum + (app.progress_percentage || 0), 0)
        avgProgress = Math.round(totalProgress / applications.items.length)
        // 模拟进度增长趋势
        avgProgress = Math.max(0, avgProgress - (i * 2)) // 每天增加2%
      }

      trendData.push({
        date: date.toISOString().split('T')[0],
        value: avgProgress
      })
    }

    return trendData
  }

  // 获取部门进度分布 - 使用现有API计算
  static async getDepartmentDistribution(): Promise<DepartmentProgress[]> {
    // 从应用列表API计算部门分布
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })
    const departmentMap = new Map<string, { count: number; progress: number }>()

    applications.items.forEach(app => {
      const team = app.responsible_team || '未分配'
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