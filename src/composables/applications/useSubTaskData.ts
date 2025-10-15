import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { SubTasksAPI, type SubTask } from '@/api/subtasks'
import { ExcelAPI } from '@/api/reports'

export function useSubTaskData() {
  const subTasks = ref<SubTask[]>([])
  const loading = ref(false)

  // Load all subtasks
  const loadSubTasks = async (params?: { skip?: number; limit?: number }) => {
    try {
      loading.value = true
      const response = await SubTasksAPI.getSubTasks({
        skip: params?.skip || 0,
        limit: params?.limit || 1000
      })
      subTasks.value = response.items || []
      return response
    } catch (error) {
      console.error('Failed to load subtasks:', error)
      ElMessage.error('加载子任务列表失败，请检查网络连接')
      subTasks.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // Create new subtask
  const createSubTask = async (data: Partial<SubTask>) => {
    try {
      loading.value = true
      const newSubTask = await SubTasksAPI.createSubTask(data)
      ElMessage.success('子任务创建成功')

      // Add to local list
      subTasks.value.unshift(newSubTask)

      return newSubTask
    } catch (error) {
      console.error('Failed to create subtask:', error)
      ElMessage.error('创建子任务失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update existing subtask
  const updateSubTask = async (id: number, data: Partial<SubTask>) => {
    try {
      loading.value = true
      const updatedSubTask = await SubTasksAPI.updateSubTask(id, data)
      ElMessage.success('子任务更新成功')

      // Update local list
      const index = subTasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        subTasks.value[index] = updatedSubTask
      }

      return updatedSubTask
    } catch (error) {
      console.error('Failed to update subtask:', error)
      ElMessage.error('更新子任务失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete subtask
  const deleteSubTask = async (id: number) => {
    try {
      loading.value = true
      await SubTasksAPI.deleteSubTask(id)
      ElMessage.success('子任务删除成功')

      // Remove from local list
      const index = subTasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        subTasks.value.splice(index, 1)
      }
    } catch (error: any) {
      console.error('Failed to delete subtask:', error)
      if (error.response?.status === 500) {
        ElMessage.error('服务器内部错误，请稍后重试')
      } else if (error.response?.status === 404) {
        ElMessage.error('子任务不存在或已被删除')
      } else {
        ElMessage.error('删除子任务失败')
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  // Export subtasks to Excel
  const exportSubTasks = async (options?: {
    filters?: Record<string, any>
    columns?: string[]
    filename?: string
  }) => {
    try {
      loading.value = true
      await ExcelAPI.exportAndDownloadSubTasks({
        filters: options?.filters || {},
        columns: options?.columns || [
          'l2_id',
          'version_name',
          'sub_target',
          'dev_owner',
          'ops_owner',
          'task_status',
          'progress_percentage',
          'planned_requirement_date',
          'actual_requirement_date',
          'planned_release_date',
          'actual_release_date',
          'planned_tech_online_date',
          'actual_tech_online_date',
          'planned_biz_online_date',
          'actual_biz_online_date',
          'is_blocked',
          'blocking_reason',
          'resource_applied',
          'ops_requirement_submitted',
          'ops_testing_status',
          'launch_check_status'
        ],
        filename: options?.filename
      })
      ElMessage.success('子任务Excel文件导出成功')
    } catch (error) {
      console.error('Failed to export subtasks:', error)
      ElMessage.error('导出失败，请稍后重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Export monthly subtask plan
  const exportSubTaskMonthlyPlan = async (
    targetTasks: SubTask[],
    year: number,
    month: number
  ) => {
    try {
      loading.value = true

      if (targetTasks.length === 0) {
        ElMessage.warning('当前月份没有计划子任务')
        return
      }

      const fileName = `${year}年${month}月计划子任务清单.xlsx`

      await ExcelAPI.exportAndDownloadSubTasks({
        filters: {
          ids: targetTasks.map(task => task.id)
        },
        columns: [
          'l2_id',
          'version_name',
          'sub_target',
          'dev_owner',
          'ops_owner',
          'task_status',
          'planned_requirement_date',
          'planned_release_date',
          'planned_tech_online_date',
          'planned_biz_online_date',
          'resource_applied',
          'ops_requirement_submitted',
          'ops_testing_status',
          'launch_check_status'
        ],
        filename: fileName
      })

      ElMessage.success('月度子任务计划导出成功')
    } catch (error) {
      console.error('Failed to export monthly subtask plan:', error)
      ElMessage.error('导出失败，请稍后重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Filter subtasks by month
  const filterSubTasksByMonth = (tasks: SubTask[], targetYear: number, targetMonth: number) => {
    return tasks.filter(task => {
      // Check all planned dates for the target month
      const dates = [
        task.planned_requirement_date,
        task.planned_release_date,
        task.planned_tech_online_date,
        task.planned_biz_online_date
      ]

      return dates.some(dateStr => {
        if (!dateStr) return false
        const date = new Date(dateStr)
        return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
      })
    })
  }

  // Update filter options from loaded data
  const extractFilterOptions = (tasks: SubTask[]) => {
    const versionSet = new Set<string>()
    const devOwnerSet = new Set<string>()
    const opsOwnerSet = new Set<string>()

    tasks.forEach(task => {
      if (task.version_name) versionSet.add(task.version_name)
      if (task.dev_owner) devOwnerSet.add(task.dev_owner)
      if (task.ops_owner) opsOwnerSet.add(task.ops_owner)
    })

    return {
      versionOptions: Array.from(versionSet).sort().map(version => ({ label: version, value: version })),
      devOwnerOptions: Array.from(devOwnerSet).sort().map(owner => ({ label: owner, value: owner })),
      opsOwnerOptions: Array.from(opsOwnerSet).sort().map(owner => ({ label: owner, value: owner }))
    }
  }

  return {
    subTasks,
    loading,
    loadSubTasks,
    createSubTask,
    updateSubTask,
    deleteSubTask,
    exportSubTasks,
    exportSubTaskMonthlyPlan,
    filterSubTasksByMonth,
    extractFilterOptions
  }
}
