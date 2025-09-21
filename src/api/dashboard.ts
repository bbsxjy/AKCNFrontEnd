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
    try {
      // 从应用列表API计算统计数据
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

      console.log('Dashboard Stats - Applications data:', {
        total: applications.total,
        itemsCount: applications.items?.length || 0,
        firstItem: applications.items?.[0]
      })

      const stats: DashboardStats = {
        total: applications.total || 0,
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

      if (applications.items && applications.items.length > 0) {
      let totalProgress = 0

      applications.items.forEach(app => {
        totalProgress += app.progress_percentage || 0

          // 按改造目标分类 (using new field names)
          const transformTarget = app.overall_transformation_target
          if (transformTarget === 'AK' || transformTarget === 'ak') {
          stats.akTotal++
          const status = app.current_status
          if (status === '全部完成' || status === 'completed') {
            stats.akCompleted++
            } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress' || status === 'testing') {
              stats.akInProgress++
          }
          } else if (transformTarget === '云原生' || transformTarget === 'cloud_native') {
          stats.cloudNativeTotal++
          const status = app.current_status
          if (status === '全部完成' || status === 'completed') {
            stats.cloudNativeCompleted++
            } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress' || status === 'testing') {
              stats.cloudNativeInProgress++
            }
          } else {
            // 如果没有明确指定目标，默认统计到AK
            stats.akTotal++
            const status = app.current_status
            if (status === '全部完成' || status === 'completed') {
              stats.akCompleted++
            } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress' || status === 'testing') {
              stats.akInProgress++
            }
          }

        // 按状态分类 (using new field names)
        const status = app.current_status
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

        stats.averageProgress = applications.items.length > 0 ? Math.round(totalProgress / applications.items.length) : 0

        // 确保总数至少等于各分类之和
        stats.total = Math.max(stats.total, stats.akTotal + stats.cloudNativeTotal)
      }

      console.log('Dashboard Stats - Final calculated stats:', stats)
      return stats

    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      // 返回默认值而不是空值
      return {
        total: 0,
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
    }
  }

  // 获取月度完成数据 - 统计各阶段完成的应用数量
  static async getMonthlyCompletionTrend(type: 'planned' | 'actual' = 'actual'): Promise<MonthlyCompletionData[]> {
    try {
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

        if (applications.items && applications.items.length > 0) {
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
        }

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
        totalApps: applications.items?.length || 0,
        monthlyData: monthlyData.slice(-3) // 显示最后3个月的数据
      })

      return monthlyData
    } catch (error) {
      console.error('Failed to get monthly completion trend:', error)
      // 返回空数据而不是mock data
      const monthlyData: MonthlyCompletionData[] = []
      const today = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)
        const year = date.getFullYear()
        const month = date.getMonth() + 1

        monthlyData.push({
          month: `${year}-${String(month).padStart(2, '0')}`,
          requirement: 0,
          release: 0,
          techOnline: 0,
          bizOnline: 0
        })
      }

      return monthlyData
    }
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
    try {
      // 从应用列表API计算部门分布
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })
      const departmentMap = new Map<string, { count: number; progress: number }>()

      if (applications.items && applications.items.length > 0) {
        applications.items.forEach(app => {
          const team = app.dev_team || app.ops_team || '未分配'
          const existing = departmentMap.get(team) || { count: 0, progress: 0 }
          existing.count++
          existing.progress += app.progress_percentage || 0
          departmentMap.set(team, existing)
        })
      }

      const distribution: DepartmentProgress[] = []
      departmentMap.forEach((data, team) => {
        distribution.push({
          name: team,
          value: data.count,
          percentage: data.count > 0 ? Math.round(data.progress / data.count) : 0
        })
      })

      console.log('Department Distribution:', distribution)
      return distribution.sort((a, b) => b.value - a.value).slice(0, 5)
    } catch (error) {
      console.error('Failed to get department distribution:', error)
      // 返回空数组而不是mock data
      return []
    }
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
    try {
      // 获取当前用户的子任务
      const subtasks = await SubTasksAPI.getMySubTasks()

      // 获取所有应用信息以便获取应用名称
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })
      const appMap = new Map<number, { l2_id: string, app_name: string }>()
      if (applications.items) {
        applications.items.forEach(app => {
          appMap.set(app.id, { l2_id: app.l2_id, app_name: app.app_name })
        })
      }

      // 过滤真正需要处理的任务
      const pendingTasks = subtasks
      .filter(task => {
        // 过滤掉已完成的任务
        const isCompleted = task.task_status === '已完成' ||
                           task.task_status === '全部完成' ||
                           task.task_status === 'completed'
        if (isCompleted) return false

        // 只显示正在进行中或有阻塞的任务
        const isInProgress = task.task_status === '研发进行中' ||
                            task.task_status === '业务上线中' ||
                            task.task_status === 'in_progress' ||
                            task.task_status === 'testing'

        const isBlocked = task.task_status === '存在阻塞' ||
                         task.task_status === 'blocked' ||
                         task.is_blocked === true

        // 只有在进行中或有阻塞的任务才是待办
        // 待启动的任务不应该出现在待办中
        return isInProgress || isBlocked
      })
      .sort((a, b) => {
        // 按计划结束日期排序，紧急的在前
        const dateA = new Date(a.planned_biz_online_date || '9999-12-31').getTime()
        const dateB = new Date(b.planned_biz_online_date || '9999-12-31').getTime()
        return dateA - dateB
      })

    // 转换为仪表盘显示格式
    const now = Date.now()
    const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000  // 改为3天内的为紧急
    const today = new Date()
    today.setHours(23, 59, 59, 999)  // 今天结束时

    const tasksWithAppInfo = pendingTasks.map(task => {
      const app = appMap.get(task.l2_id)
      const plannedDate = new Date(task.planned_biz_online_date || '')
      const isOverdue = plannedDate < today
      const isUrgent = plannedDate.getTime() <= threeDaysLater

      return {
        id: task.id,
        title: app ? `[${app.l2_id}] ${app.app_name} - ${task.version_name}` : task.version_name,
        appId: app?.l2_id || '',
        appName: app?.app_name || '',
        taskName: task.version_name,
        plannedDate: task.planned_biz_online_date,
        isUrgent: isUrgent || isOverdue,
        isOverdue: isOverdue,
        status: task.task_status,
        progress: task.progress_percentage || 0,
        applicationId: task.l2_id,
        daysRemaining: Math.ceil((plannedDate.getTime() - now) / (24 * 60 * 60 * 1000))
      }
    })

    // 限制返回数量
    return tasksWithAppInfo.slice(0, limit)
    } catch (error) {
      console.error('Failed to get my tasks:', error)
      return []
    }
  }

  // 获取最新通知
  static async getRecentNotifications(limit: number = 10): Promise<any[]> {
    try {
      const notifications = await NotificationsAPI.getNotifications({
        unread_only: true,
        limit
      })

      return notifications.items
    } catch (error) {
      console.error('Failed to get notifications:', error)
      return []
    }
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
