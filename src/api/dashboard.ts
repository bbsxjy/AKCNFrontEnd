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

          // 统计AK改造（所有应用都计入AK统计）
          stats.akTotal++

          // 使用精确的 is_ak_completed 字段判断AK完成情况
          if (app.is_ak_completed === true || app.ak_status === 'COMPLETED') {
            stats.akCompleted++
          } else if (app.ak_status === 'IN_PROGRESS') {
            stats.akInProgress++
          }

          // 统计云原生改造（仅目标为云原生的应用计入）
          const transformTarget = app.overall_transformation_target
          if (transformTarget === '云原生' || transformTarget === 'cloud_native') {
            stats.cloudNativeTotal++

            // 使用精确的 is_cloud_native_completed 字段判断云原生完成情况
            if (app.is_cloud_native_completed === true || app.cloud_native_status === 'COMPLETED') {
              stats.cloudNativeCompleted++
            } else if (app.cloud_native_status === 'IN_PROGRESS') {
              stats.cloudNativeInProgress++
            }
          }

        // 应用级别的总体统计（按应用状态分类）
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

        // total 保持为应用总数，不需要修改
        // akTotal 和 cloudNativeTotal 是改造任务的统计，与应用总数是不同的维度
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

  // 获取月度统计数据 - 延期、阻塞、新增应用、新增子任务
  static async getMonthlyStatistics(): Promise<any[]> {
    try {
      // 获取所有应用和子任务数据
      const [applications, subtasks] = await Promise.all([
        ApplicationsAPI.getApplications({ limit: 1000 }),
        SubTasksAPI.getSubTasks({ limit: 1000 })
      ])

      // 生成最近12个月的数据
      const monthlyStats: any[] = []
      const today = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const monthStr = `${year}-${String(month).padStart(2, '0')}`

        // 统计该月份的数据
        let delayed = 0
        let blocked = 0
        let newApps = 0
        let newTasks = 0

        // 计算延期的任务（计划时间在该月，但实际完成时间晚于计划）
        if (subtasks.items && subtasks.items.length > 0) {
          subtasks.items.forEach((task: any) => {
            // 检查延期
            if (task.planned_biz_online_date) {
              const plannedDate = new Date(task.planned_biz_online_date)
              if (plannedDate.getFullYear() === year && plannedDate.getMonth() + 1 === month) {
                if (task.actual_biz_online_date) {
                  const actualDate = new Date(task.actual_biz_online_date)
                  if (actualDate > plannedDate) {
                    delayed++
                  }
                } else if (today > plannedDate && task.task_status !== '已完成') {
                  // 还未完成且已过期
                  delayed++
                }
              }
            }

            // 检查阻塞
            if (task.is_blocked || task.task_status === '存在阻塞') {
              // 检查任务创建或更新时间是否在该月
              const updatedDate = new Date(task.updated_at)
              if (updatedDate.getFullYear() === year && updatedDate.getMonth() + 1 === month) {
                blocked++
              }
            }

            // 统计新增子任务
            const createdDate = new Date(task.created_at)
            if (createdDate.getFullYear() === year && createdDate.getMonth() + 1 === month) {
              newTasks++
            }
          })
        }

        // 统计新增应用
        if (applications.items && applications.items.length > 0) {
          applications.items.forEach(app => {
            const createdDate = new Date(app.created_at)
            if (createdDate.getFullYear() === year && createdDate.getMonth() + 1 === month) {
              newApps++
            }
          })
        }

        monthlyStats.push({
          month: monthStr,
          delayed,
          blocked,
          newApps,
          newTasks
        })
      }

      console.log('Monthly statistics data:', monthlyStats.slice(-3))
      return monthlyStats
    } catch (error) {
      console.error('Failed to get monthly statistics:', error)
      // 返回空数据
      const monthlyStats: any[] = []
      const today = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)
        const year = date.getFullYear()
        const month = date.getMonth() + 1

        monthlyStats.push({
          month: `${year}-${String(month).padStart(2, '0')}`,
          delayed: 0,
          blocked: 0,
          newApps: 0,
          newTasks: 0
        })
      }

      return monthlyStats
    }
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

  // 获取待办任务（我的任务）- 根据用户角色和任务阶段筛选
  static async getMyTasks(limit: number = 5, currentUserName?: string): Promise<any[]> {
    try {
      console.log('🔍 [DashboardAPI] 开始获取任务，用户名:', currentUserName)

      // 获取当前用户的子任务
      const subtasks = await SubTasksAPI.getMySubTasks()
      console.log('🔍 [DashboardAPI] 获取到所有子任务数量:', subtasks.length)

      if (subtasks.length > 0) {
        console.log('🔍 [DashboardAPI] 前3个子任务示例:', subtasks.slice(0, 3).map(t => ({
          id: t.id,
          version_name: t.version_name,
          status: t.task_status,
          dev_owner: t.dev_owner,
          ops_owner: t.ops_owner
        })))
        console.log('🔍 [DashboardAPI] 第1个子任务完整数据:', subtasks[0])
      }

      // 获取所有应用信息以便获取应用名称
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })
      const appMap = new Map<number, { l2_id: string, app_name: string }>()
      if (applications.items) {
        applications.items.forEach(app => {
          appMap.set(app.id, { l2_id: app.l2_id, app_name: app.app_name })
        })
      }

      // 过滤真正需要处理的任务，根据用户角色和任务阶段
      const pendingTasks = subtasks
      .filter(task => {
        // 过滤掉已完成的任务
        const isCompleted = task.task_status === '已完成' ||
                           task.task_status === '全部完成' ||
                           task.task_status === 'completed'
        if (isCompleted) {
          console.log(`  ⏭️  跳过已完成任务: ${task.version_name}`)
          return false
        }

        // 只显示正在进行中或有阻塞的任务
        const isInProgress = task.task_status === '研发进行中' ||
                            task.task_status === 'in_progress'

        const isTesting = task.task_status === '业务上线中' ||
                         task.task_status === '技术上线中' ||  // 新增：支持技术上线中
                         task.task_status === 'testing'

        const isBlocked = task.task_status === '存在阻塞' ||
                         task.task_status === 'blocked' ||
                         task.is_blocked === true

        console.log(`  🔎 检查任务 ${task.version_name}:`, {
          id: task.id,
          status: task.task_status,
          isInProgress,
          isTesting,
          isBlocked,
          dev_owner: task.dev_owner,
          ops_owner: task.ops_owner,
          '完整子任务对象': task
        })

        // 如果没有提供当前用户名，显示所有任务（向后兼容）
        if (!currentUserName) {
          const shouldShow = isInProgress || isTesting || isBlocked
          console.log(`  ${shouldShow ? '✅' : '❌'} 无用户名过滤，${shouldShow ? '显示' : '不显示'}`)
          return shouldShow
        }

        // 根据任务阶段和用户角色筛选：
        // 1. 研发进行中：匹配开发负责人(dev_owner)
        // 2. 技术上线/业务上线中：匹配运维负责人(ops_owner)
        // 3. 阻塞状态：匹配开发或运维负责人

        const isDevOwner = task.dev_owner &&
                          (task.dev_owner === currentUserName ||
                           task.dev_owner.includes(currentUserName) ||
                           currentUserName.includes(task.dev_owner))

        const isOpsOwner = task.ops_owner &&
                          (task.ops_owner === currentUserName ||
                           task.ops_owner.includes(currentUserName) ||
                           currentUserName.includes(task.ops_owner))

        console.log(`  👤 用户匹配检查:`, {
          currentUserName,
          dev_owner: task.dev_owner,
          ops_owner: task.ops_owner,
          isDevOwner,
          isOpsOwner
        })

        // 研发阶段 - 匹配开发负责人
        if (isInProgress && isDevOwner) {
          console.log(`  ✅ 研发阶段任务，匹配开发负责人`)
          return true
        }

        // 上线阶段（技术上线、业务上线）- 匹配运维负责人
        if (isTesting && isOpsOwner) {
          console.log(`  ✅ 上线阶段任务，匹配运维负责人`)
          return true
        }

        // 阻塞状态 - 匹配开发或运维负责人
        if (isBlocked && (isDevOwner || isOpsOwner)) {
          console.log(`  ✅ 阻塞任务，匹配负责人`)
          return true
        }

        console.log(`  ❌ 不匹配，不显示`)
        return false
      })
      .sort((a, b) => {
        // 按计划结束日期排序，紧急的在前
        const dateA = new Date(a.planned_biz_online_date || '9999-12-31').getTime()
        const dateB = new Date(b.planned_biz_online_date || '9999-12-31').getTime()
        return dateA - dateB
      })

    console.log(`🎯 [DashboardAPI] 过滤后得到 ${pendingTasks.length} 个待办任务`)

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
    const finalTasks = tasksWithAppInfo.slice(0, limit)
    console.log(`✅ [DashboardAPI] 返回 ${finalTasks.length} 个任务`)

    return finalTasks
    } catch (error) {
      console.error('❌ [DashboardAPI] 获取任务失败:', error)
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

  // 获取项目统计数据 - 按项目分组的应用完成情况
  static async getProjectStatistics(): Promise<any[]> {
    try {
      // 获取所有应用数据
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

      // 按项目分组统计
      const projectMap = new Map<string, { total: number; completed: number; inProgress: number; notStarted: number }>()

      if (applications.items && applications.items.length > 0) {
        applications.items.forEach(app => {
          // 获取项目字段，可能包含逗号分隔的多个项目
          const projectsField = app.belonging_projects || '未分配项目'

          // 分割项目名称（支持逗号、分号等分隔符）
          const projects = projectsField.split(/[,;，；]/).map(p => p.trim()).filter(p => p.length > 0)

          // 如果没有有效的项目名，使用默认值
          if (projects.length === 0) {
            projects.push('未分配项目')
          }

          // 为每个项目增加统计
          projects.forEach(project => {
            const existing = projectMap.get(project) || {
              total: 0,
              completed: 0,
              inProgress: 0,
              notStarted: 0
            }

            existing.total++

            // 根据状态分类
            const status = app.current_status
            if (status === '全部完成' || status === 'completed') {
              existing.completed++
            } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress' || status === 'testing') {
              existing.inProgress++
            } else if (status === '待启动' || status === 'not_started') {
              existing.notStarted++
            } else if (status === '存在阻塞' || status === 'blocked') {
              existing.inProgress++ // 阻塞也算进行中
            }

            projectMap.set(project, existing)
          })
        })
      }

      // 转换为数组格式
      const projectStats: any[] = []
      projectMap.forEach((data, project) => {
        projectStats.push({
          name: project,
          total: data.total,
          completed: data.completed,
          inProgress: data.inProgress,
          notStarted: data.notStarted,
          completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
        })
      })

      // 按总数排序，取前15个项目（由于可能分割后项目数增多）
      return projectStats.sort((a, b) => b.total - a.total).slice(0, 15)
    } catch (error) {
      console.error('Failed to get project statistics:', error)
      return []
    }
  }

  // 获取应用优先级分布 - 按档位（1-5级）和改造类型（AK/云原生）分组
  static async getPriorityDistribution(): Promise<any[]> {
    try {
      // 获取所有应用数据
      const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

      // 初始化统计结构
      const priorityData = [
        { name: '第一级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第二级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第三级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第四级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第五级', value: 0, akCount: 0, cloudCount: 0 }
      ]

      if (applications.items && applications.items.length > 0) {
        applications.items.forEach(app => {
          // 根据优先级字段或其他标识判断档位
          // 这里使用优先级字段，如果没有则根据监管年份等信息推断
          let priority = app.priority_level || 3 // 默认第三级

          // 如果有监管年份，根据年份设置优先级
          if (app.ak_supervision_acceptance_year) {
            const year = parseInt(app.ak_supervision_acceptance_year)
            const currentYear = new Date().getFullYear()
            if (year <= currentYear) {
              priority = 1 // 当年或过期的为最高优先级
            } else if (year === currentYear + 1) {
              priority = 2 // 明年的为第二优先级
            } else if (year === currentYear + 2) {
              priority = 3 // 后年的为第三优先级
            } else {
              priority = 4 // 更远的为第四优先级
            }
          }

          // 确保优先级在1-5范围内
          priority = Math.max(1, Math.min(5, priority))
          const index = priority - 1

          // 统计总数
          priorityData[index].value++

          // 按改造类型分类
          const transformTarget = app.overall_transformation_target
          if (transformTarget === 'AK' || transformTarget === 'ak') {
            priorityData[index].akCount++
          } else if (transformTarget === '云原生' || transformTarget === 'cloud_native') {
            priorityData[index].cloudCount++
          } else {
            // 默认算作AK
            priorityData[index].akCount++
          }
        })
      }

      console.log('Priority distribution data:', priorityData)
      return priorityData
    } catch (error) {
      console.error('Failed to get priority distribution:', error)
      // 返回默认结构
      return [
        { name: '第一级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第二级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第三级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第四级', value: 0, akCount: 0, cloudCount: 0 },
        { name: '第五级', value: 0, akCount: 0, cloudCount: 0 }
      ]
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
