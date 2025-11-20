import api from './index'
import { NotificationsAPI } from './notifications'
import { ApplicationsAPI, type Application } from './applications'
import { SubTasksAPI } from './subtasks'

export interface DispatchApplicationRequest {
  application_ids: number[]
  assignee_name: string
  assignee_type: 'dev' | 'ops'
  message?: string
}

export interface DispatchApplicationResponse {
  success: number
  failed: number
  notification_sent: boolean
  dispatched_applications: Application[]
}

// 临时Mock模式 - 后端API实现后可以关闭
const USE_MOCK = true // 设置为 false 使用真实API

export class DispatchAPI {
  /**
   * Dispatch applications to assignee
   * This will:
   * 1. Update application's dev_owner or ops_owner field
   * 2. Send notification to assignee
   * 3. Update subtasks' assigned_to field
   */
  static async dispatchApplications(data: DispatchApplicationRequest): Promise<DispatchApplicationResponse> {
    try {
      let response: any

      if (USE_MOCK) {
        // 临时Mock实现 - 用于前端测试
        console.log('🔧 使用Mock模式派发应用:', data)

        // 模拟后端更新操作
        const updatedApplications: Application[] = []
        let totalSubTasksUpdated = 0

        for (const appId of data.application_ids) {
          try {
            // 获取应用详情
            const app = await ApplicationsAPI.getApplication(appId)
            console.log(`🔄 正在派发应用: ${app.l2_id} - ${app.app_name}`)

            // 更新对应的负责人字段
            const updateData: any = {}
            if (data.assignee_type === 'dev') {
              updateData.dev_owner = data.assignee_name
            } else {
              updateData.ops_owner = data.assignee_name
            }

            // 调用更新API
            const updatedApp = await ApplicationsAPI.updateApplication(appId, updateData)
            updatedApplications.push(updatedApp)
            console.log(`✅ 已更新应用 ${app.l2_id} 的${data.assignee_type === 'dev' ? '开发' : '运维'}负责人为: ${data.assignee_name}`)

            // 🔧 Mock: 更新该应用的所有子任务的负责人
            try {
              const subtasks = await SubTasksAPI.getSubTasks({ l2_id: appId, limit: 1000 })
              console.log(`📋 应用 ${app.l2_id} 有 ${subtasks.items.length} 个子任务需要更新负责人`)

              for (const subtask of subtasks.items) {
                const subtaskUpdate: any = {}
                if (data.assignee_type === 'dev') {
                  subtaskUpdate.dev_owner = data.assignee_name
                } else {
                  subtaskUpdate.ops_owner = data.assignee_name
                }

                await SubTasksAPI.updateSubTask(subtask.id, subtaskUpdate)
                totalSubTasksUpdated++
                console.log(`  ✅ 已更新子任务 ${subtask.version_name || subtask.id} 的${data.assignee_type === 'dev' ? '开发' : '运维'}负责人为: ${data.assignee_name}`)
              }
            } catch (subtaskErr) {
              console.warn(`⚠️ 更新应用 ${appId} 的子任务失败:`, subtaskErr)
            }

          } catch (err) {
            console.error(`❌ 派发应用 ${appId} 失败:`, err)
          }
        }

        console.log(`🎉 派发完成: 成功更新 ${updatedApplications.length} 个应用，${totalSubTasksUpdated} 个子任务`)

        // 🔧 临时Mock：保存派发记录到localStorage，用于在"我的任务"中显示
        try {
          const mockDispatches = JSON.parse(localStorage.getItem('mock_dispatches') || '[]')

          // 为每个派发的应用创建mock任务记录
          for (const app of updatedApplications) {
            mockDispatches.push({
              id: `mock_${Date.now()}_${Math.random()}`,
              appId: app.l2_id,
              appName: app.app_name,
              taskName: '派发任务',
              status: data.assignee_type === 'dev' ? '研发进行中' : '业务上线中',
              progress: 0,
              plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天后
              assigneeType: data.assignee_type,
              assigneeName: data.assignee_name,
              message: data.message || '',
              dispatchedAt: new Date().toISOString(),
              applicationId: app.id
            })
          }

          // 只保留最近10条
          const recentDispatches = mockDispatches.slice(-10)
          localStorage.setItem('mock_dispatches', JSON.stringify(recentDispatches))
          console.log('✅ [Mock] 已保存派发记录到本地:', recentDispatches.length, '条')
        } catch (err) {
          console.warn('⚠️ [Mock] 保存派发记录失败:', err)
        }

        response = {
          data: {
            success: updatedApplications.length,
            failed: data.application_ids.length - updatedApplications.length,
            notification_sent: true,
            dispatched_applications: updatedApplications
          }
        }
      } else {
        // 真实API调用
        response = await api.post('/applications/dispatch', data)
      }

      // Send notification to assignee
      try {
        await NotificationsAPI.sendNotification({
          type: 'task_assignment',
          title: '您有新的任务派发',
          message: data.message || `您被分配了 ${data.application_ids.length} 个应用的${data.assignee_type === 'dev' ? '开发' : '运维'}任务，请及时查看并填写进展。`,
          recipients: [data.assignee_name],
          channels: ['in_app'],
          severity: 'medium'
        })
        console.log('✅ 已发送通知给', data.assignee_name)
      } catch (notifError) {
        console.warn('⚠️ 发送通知失败:', notifError)
      }

      return response.data
    } catch (error) {
      console.error('Failed to dispatch applications:', error)
      throw error
    }
  }

  /**
   * Get dispatch history for an application
   */
  static async getDispatchHistory(applicationId: number): Promise<any[]> {
    try {
      const response = await api.get(`/applications/${applicationId}/dispatch-history`)
      return response.data
    } catch (error) {
      console.error('Failed to get dispatch history:', error)
      return []
    }
  }
}
