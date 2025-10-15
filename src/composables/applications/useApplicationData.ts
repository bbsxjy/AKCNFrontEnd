import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ApplicationsAPI, type Application, type CreateApplicationRequest } from '@/api/applications'
import { ExcelAPI } from '@/api/reports'

export function useApplicationData() {
  const applications = ref<Application[]>([])
  const loading = ref(false)

  // Load all applications
  const loadApplications = async (params?: { skip?: number; limit?: number }) => {
    try {
      loading.value = true
      const response = await ApplicationsAPI.getApplications({
        skip: params?.skip || 0,
        limit: params?.limit || 1000
      })
      applications.value = response.items || []
      return response
    } catch (error) {
      console.error('Failed to load applications:', error)
      ElMessage.error('加载应用列表失败，请检查网络连接')
      applications.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // Create new application
  const createApplication = async (data: CreateApplicationRequest) => {
    try {
      loading.value = true
      const newApp = await ApplicationsAPI.createApplication(data)
      ElMessage.success('应用创建成功')

      // Add to local list
      applications.value.unshift(newApp)

      return newApp
    } catch (error) {
      console.error('Failed to create application:', error)
      ElMessage.error('创建应用失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update existing application
  const updateApplication = async (id: number, data: Partial<Application>) => {
    try {
      loading.value = true
      const updatedApp = await ApplicationsAPI.updateApplication(id, data)
      ElMessage.success('应用更新成功')

      // Update local list
      const index = applications.value.findIndex(app => app.id === id)
      if (index !== -1) {
        applications.value[index] = updatedApp
      }

      return updatedApp
    } catch (error) {
      console.error('Failed to update application:', error)
      ElMessage.error('更新应用失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete application
  const deleteApplication = async (id: number) => {
    try {
      loading.value = true
      await ApplicationsAPI.deleteApplication(id)
      ElMessage.success('应用删除成功')

      // Remove from local list
      const index = applications.value.findIndex(app => app.id === id)
      if (index !== -1) {
        applications.value.splice(index, 1)
      }
    } catch (error: any) {
      console.error('Failed to delete application:', error)
      if (error.response?.status === 500) {
        ElMessage.error('服务器内部错误，请稍后重试')
      } else if (error.response?.status === 404) {
        ElMessage.error('应用不存在或已被删除')
      } else {
        ElMessage.error('删除应用失败')
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  // Export applications to Excel
  const exportApplications = async (options?: {
    filters?: Record<string, any>
    columns?: string[]
    filename?: string
  }) => {
    try {
      loading.value = true
      await ExcelAPI.exportAndDownloadApplications({
        filters: options?.filters || {},
        columns: options?.columns || [
          'l2_id',
          'app_name',
          'ak_supervision_acceptance_year',
          'overall_transformation_target',
          'current_transformation_phase',
          'current_status',
          'dev_team',
          'dev_owner',
          'ops_team',
          'ops_owner',
          'app_tier',
          'belonging_l1_name',
          'belonging_projects',
          'progress_percentage',
          'is_delayed',
          'delay_days'
        ],
        filename: options?.filename
      })
      ElMessage.success('Excel文件导出成功')
    } catch (error) {
      console.error('Failed to export applications:', error)
      ElMessage.error('导出失败，请稍后重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Export monthly plan
  const exportMonthlyPlan = async (
    targetApps: Application[],
    year: number,
    month: number
  ) => {
    try {
      loading.value = true

      if (targetApps.length === 0) {
        ElMessage.warning('当前月份没有计划应用')
        return
      }

      const fileName = `${year}年${month}月计划应用清单.xlsx`

      await ExcelAPI.exportAndDownloadApplications({
        filters: {
          ids: targetApps.map(app => app.id)
        },
        columns: [
          'l2_id',
          'app_name',
          'current_status',
          'planned_requirement_date',
          'planned_release_date',
          'planned_tech_online_date',
          'planned_biz_online_date',
          'dev_team',
          'dev_owner',
          'ops_team',
          'ops_owner',
          'is_delayed',
          'delay_days'
        ],
        filename: fileName
      })

      ElMessage.success('月度计划导出成功')
    } catch (error) {
      console.error('Failed to export monthly plan:', error)
      ElMessage.error('导出失败，请稍后重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Filter applications by month
  const filterApplicationsByMonth = (apps: Application[], targetYear: number, targetMonth: number) => {
    return apps.filter(app => {
      // Check all planned dates for the target month
      const dates = [
        app.planned_requirement_date,
        app.planned_release_date,
        app.planned_tech_online_date,
        app.planned_biz_online_date
      ]

      return dates.some(dateStr => {
        if (!dateStr) return false
        const date = new Date(dateStr)
        return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
      })
    })
  }

  return {
    applications,
    loading,
    loadApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    exportApplications,
    exportMonthlyPlan,
    filterApplicationsByMonth
  }
}
