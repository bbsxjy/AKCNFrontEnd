<template>
  <div class="subtasks-view">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h2>{{ applicationName }} - 子任务详情</h2>
            <div class="app-info">{{ l2Id }} | 负责人：{{ responsiblePerson }}</div>
          </div>
          <div class="actions">
            <el-button @click="goBack">返回列表</el-button>
            <el-button type="primary" @click="showCreateTaskDialog">
              <el-icon><plus /></el-icon>
              新增子任务
            </el-button>
          </div>
        </div>
      </template>

      <!-- Overview Statistics -->
      <el-row :gutter="20" class="overview">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ safeStatistics.total }}</div>
            <div class="stat-label">子任务总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value success">{{ safeStatistics.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value primary">{{ safeStatistics.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value danger">{{ safeStatistics.blocked }}</div>
            <div class="stat-label">阻塞中</div>
          </div>
        </el-col>
      </el-row>

      <!-- SubTasks Table -->
      <el-table
        :data="subTasks"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="module_name" label="模块名称" min-width="150" fixed="left">
          <template #default="{ row }">
            <strong>{{ row.module_name || '默认模块' }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="sub_target" label="改造目标" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.sub_target === 'AK' ? 'primary' : 'success'">
              {{ row.sub_target || 'AK' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 负责人信息 -->
        <el-table-column label="开发负责人" width="100">
          <template #default="{ row }">
            {{ row.dev_owner || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开发团队" width="100">
          <template #default="{ row }">
            {{ row.dev_team || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="运维负责人" width="100">
          <template #default="{ row }">
            {{ row.ops_owner || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="运维团队" width="100">
          <template #default="{ row }">
            {{ row.ops_team || '-' }}
          </template>
        </el-table-column>
        <!-- 状态和进度 -->
        <el-table-column prop="task_status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.task_status || row.status)" size="small">
              {{ row.task_status || row.status || '待启动' }}
            </el-tag>
            <div v-if="row.is_blocked" class="block-warning">⚠️</div>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(row.progress_percentage) || 0"
              :stroke-width="6"
              :color="getProgressColor(row)"
            />
          </template>
        </el-table-column>
        <!-- 计划时间 -->
        <el-table-column label="计划需求" width="95">
          <template #default="{ row }">
            {{ formatShortDate(row.planned_requirement_date) }}
          </template>
        </el-table-column>
        <el-table-column label="计划发版" width="95">
          <template #default="{ row }">
            {{ formatShortDate(row.planned_release_date) }}
          </template>
        </el-table-column>
        <el-table-column label="计划技术上线" width="110">
          <template #default="{ row }">
            {{ formatShortDate(row.planned_tech_online_date) }}
          </template>
        </el-table-column>
        <el-table-column label="计划业务上线" width="110">
          <template #default="{ row }">
            {{ formatShortDate(row.planned_biz_online_date) }}
          </template>
        </el-table-column>
        <!-- 实际时间 -->
        <el-table-column label="实际需求" width="95">
          <template #default="{ row }">
            <span :class="{ 'completed-date': row.actual_requirement_date }">
              {{ formatShortDate(row.actual_requirement_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="实际发版" width="95">
          <template #default="{ row }">
            <span :class="{ 'completed-date': row.actual_release_date }">
              {{ formatShortDate(row.actual_release_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="实际技术上线" width="110">
          <template #default="{ row }">
            <span :class="{ 'completed-date': row.actual_tech_online_date }">
              {{ formatShortDate(row.actual_tech_online_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="实际业务上线" width="110">
          <template #default="{ row }">
            <span :class="{ 'completed-date': row.actual_biz_online_date }">
              {{ formatShortDate(row.actual_biz_online_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.is_blocked"
              size="small"
              type="danger"
              @click="resolveBlock(row)"
            >
              解决阻塞
            </el-button>
            <el-button v-else size="small" type="primary" @click="updateProgress(row)">
              更新
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Batch Operations -->
      <div class="batch-operations">
        <strong>批量操作：</strong>
        <el-button @click="batchUpdateStatus" :disabled="selectedTasks.length === 0">
          批量更新状态
        </el-button>
        <el-button @click="batchUpdateDates" :disabled="selectedTasks.length === 0">
          批量修改日期
        </el-button>
      </div>
    </el-card>

    <!-- Create SubTask Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增子任务" width="600px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="模块名称" required>
          <el-input v-model="createForm.module_name" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="改造目标" required>
          <el-radio-group v-model="createForm.sub_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="子任务名称" required>
          <el-input v-model="createForm.subtask_name" placeholder="请输入子任务名称" />
        </el-form-item>
        <el-form-item label="负责人" required>
          <el-input v-model="createForm.responsible_person" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="计划开始日期" required>
          <el-date-picker
            v-model="createForm.planned_start_date"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划结束日期" required>
          <el-date-picker
            v-model="createForm.planned_end_date"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="createForm.status" placeholder="请选择状态">
            <el-option value="planning" label="待启动" />
            <el-option value="in_progress" label="研发进行中" />
            <el-option value="testing" label="业务上线中" />
            <el-option value="completed" label="已完成" />
            <el-option value="blocked" label="存在阻塞" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.notes"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>

    <!-- Edit SubTask Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑子任务" width="600px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="子任务名称" required>
          <el-input v-model="editForm.subtask_name" placeholder="请输入子任务名称" />
        </el-form-item>
        <el-form-item label="负责人" required>
          <el-input v-model="editForm.responsible_person" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="计划开始日期">
          <el-date-picker
            v-model="editForm.planned_start_date"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划结束日期">
          <el-date-picker
            v-model="editForm.planned_end_date"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="实际开始日期">
          <el-date-picker
            v-model="editForm.actual_start_date"
            type="date"
            placeholder="选择实际开始日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="实际结束日期">
          <el-date-picker
            v-model="editForm.actual_end_date"
            type="date"
            placeholder="选择实际结束日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option value="planning" label="待启动" />
            <el-option value="in_progress" label="研发进行中" />
            <el-option value="testing" label="业务上线中" />
            <el-option value="completed" label="已完成" />
            <el-option value="blocked" label="存在阻塞" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度百分比">
          <el-slider v-model="safeProgressPercentage" :max="100" :min="0" show-input />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button type="danger" @click="deleteSubTaskInEdit">删除子任务</el-button>
          <div>
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="handleEdit">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApplicationsAPI, type Application } from '@/api/applications'
import { SubTasksAPI, type SubTask, type CreateSubTaskRequest, type UpdateSubTaskRequest } from '@/api/subtasks'

const router = useRouter()
const route = useRoute()

// Get application ID from route params
const applicationId = parseInt(route.params.id as string)

// Reactive data
const loading = ref(false)
const application = ref<Application | null>(null)
const subTasks = ref<SubTask[]>([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingTask = ref<SubTask | null>(null)
const selectedTasks = ref<SubTask[]>([])

const statistics = reactive({
  total: 0,
  completed: 0,
  inProgress: 0,
  blocked: 0
})

const createForm = reactive<CreateSubTaskRequest>({
  application_id: Number(applicationId),
  module_name: '',
  sub_target: 'AK',
  subtask_name: '',
  responsible_person: '',
  planned_start_date: '',
  planned_end_date: '',
  status: 'planning',
  notes: ''
})

const editForm = reactive<UpdateSubTaskRequest>({
  subtask_name: '',
  responsible_person: '',
  planned_start_date: '',
  planned_end_date: '',
  actual_start_date: '',
  actual_end_date: '',
  status: '',
  progress_percentage: 0,
  notes: ''
})

// Computed properties
const applicationName = computed(() => application.value?.application_name || 'Loading...')
const l2Id = computed(() => application.value?.application_id || '')
const responsiblePerson = computed(() => application.value?.responsible_person || '')

// Computed property to ensure progress percentage is always a number
const safeProgressPercentage = computed({
  get: () => Number(editForm.progress_percentage) || 0,
  set: (val: number) => {
    editForm.progress_percentage = Number(val) || 0
  }
})

// Safe computed properties for statistics to prevent Vue attribute errors
const safeStatistics = computed(() => ({
  total: Number(statistics.total) || 0,
  completed: Number(statistics.completed) || 0,
  inProgress: Number(statistics.inProgress) || 0,
  blocked: Number(statistics.blocked) || 0
}))

// Completely isolated message handler to prevent reactive data contamination
const safeMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Use setTimeout to completely isolate from current reactive context
  setTimeout(() => {
    try {
      ElMessage({
        message: String(message),
        type: type,
        duration: 3000
      })
    } catch (error) {
      // Fallback to console if ElMessage fails
      console.log(`[${type.toUpperCase()}]: ${message}`)
    }
  }, 0)
}

// Load application data
const loadApplication = async () => {
  try {
    application.value = await ApplicationsAPI.getApplication(applicationId)
  } catch (error) {
    console.error('Failed to load application:', error)
    ElMessage.error('加载应用信息失败')
  }
}

// Load subtasks data
const loadSubTasks = async () => {
  try {
    loading.value = true
    const rawSubTasks = await SubTasksAPI.getSubTasksByApplication(applicationId)
    // Ensure all data properties are properly formatted
    subTasks.value = rawSubTasks.map(task => ({
      ...task,
      progress_percentage: Number(task.progress_percentage) || 0,
      subtask_name: task.subtask_name || '',
      responsible_person: task.responsible_person || '',
      status: task.status || '',
      notes: task.notes || null
    }))
    await loadStatistics()
  } catch (error) {
    console.error('Failed to load subtasks:', error)
    ElMessage.error('加载子任务失败')
    subTasks.value = []
  } finally {
    loading.value = false
  }
}

// Load statistics
const loadStatistics = async () => {
  try {
    const stats = await SubTasksAPI.getSubTaskStats(applicationId)
    statistics.total = stats.total
    statistics.completed = stats.completed
    statistics.inProgress = stats.inProgress
    statistics.blocked = stats.blocked
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadApplication(),
    loadSubTasks()
  ])
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '阻塞中': 'danger',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const getProgressColor = (row: SubTask) => {
  if (row.status === '存在阻塞') return '#f56565'
  if (row.progress_percentage >= 80) return '#48bb78'
  return '#667eea'
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    // Handle different date formats
    let date: Date
    if (dateString.includes('T')) {
      // ISO format: 2024-01-01T00:00:00
      date = new Date(dateString)
    } else if (dateString.includes('-')) {
      // Date format: 2024-01-01
      date = new Date(dateString + 'T00:00:00')
    } else {
      // Fallback
      date = new Date(dateString)
    }

    if (isNaN(date.getTime())) {
      return '-'
    }

    // Return formatted date
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

const formatShortDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    // Format as MM-DD
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  } catch (error) {
    return '-'
  }
}

const goBack = () => {
  router.push('/applications')
}

// Create subtask
const showCreateTaskDialog = () => {
  // Reset form
  Object.assign(createForm, {
    application_id: Number(applicationId),
    module_name: '',
    sub_target: 'AK',
    subtask_name: '',
    responsible_person: '',
    planned_start_date: '',
    planned_end_date: '',
    status: 'planning',
    notes: ''
  })
  showCreateDialog.value = true
}

const handleCreate = async () => {
  if (!createForm.module_name || !createForm.subtask_name || !createForm.responsible_person) {
    safeMessage('请填写必填字段', 'error')
    return
  }

  try {
    await SubTasksAPI.createSubTask(createForm)
    safeMessage('子任务创建成功', 'success')
    showCreateDialog.value = false
    await loadSubTasks()
  } catch (error) {
    console.error('Failed to create subtask:', error)
    safeMessage('创建子任务失败', 'error')
  }
}

// Edit subtask
const editTask = (task: SubTask) => {
  editingTask.value = task
  Object.assign(editForm, {
    subtask_name: task.subtask_name || '',
    responsible_person: task.responsible_person || '',
    planned_start_date: task.planned_start_date || '',
    planned_end_date: task.planned_end_date || '',
    actual_start_date: task.actual_start_date || '',
    actual_end_date: task.actual_end_date || '',
    status: task.status || '',
    progress_percentage: Number(task.progress_percentage) || 0,
    notes: task.notes || ''
  })
  showEditDialog.value = true
}

const handleEdit = async () => {
  if (!editingTask.value || !editForm.subtask_name) {
    safeMessage('请填写必填字段', 'error')
    return
  }

  try {
    // Format dates to YYYY-MM-DD strings if they are Date objects
    const formattedData = {
      ...editForm,
      planned_start_date: editForm.planned_start_date instanceof Date
        ? editForm.planned_start_date.toISOString().split('T')[0]
        : editForm.planned_start_date,
      planned_end_date: editForm.planned_end_date instanceof Date
        ? editForm.planned_end_date.toISOString().split('T')[0]
        : editForm.planned_end_date,
      actual_start_date: editForm.actual_start_date instanceof Date
        ? editForm.actual_start_date.toISOString().split('T')[0]
        : editForm.actual_start_date,
      actual_end_date: editForm.actual_end_date instanceof Date
        ? editForm.actual_end_date.toISOString().split('T')[0]
        : editForm.actual_end_date,
      // Ensure progress_percentage is a number
      progress_percentage: Number(editForm.progress_percentage) || 0
    }

    await SubTasksAPI.updateSubTask(editingTask.value.id, formattedData)
    safeMessage('子任务更新成功', 'success')
    showEditDialog.value = false
    await loadSubTasks()
  } catch (error: any) {
    console.error('Failed to update subtask:', error)

    // Handle specific backend error
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('更新子任务失败', 'error')
    }
  }
}

// Quick actions
const resolveBlock = async (task: SubTask) => {
  try {
    await ElMessageBox.confirm(`确定要解决阻塞吗？`, '解决阻塞', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await SubTasksAPI.updateSubTask(task.id, {
      status: 'in_progress'
    })
    safeMessage('阻塞已解决', 'success')
    await loadSubTasks()
  } catch (error: any) {
    console.error('Failed to resolve block:', error)

    // Handle specific backend error
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('解决阻塞失败', 'error')
    }
  }
}

const updateProgress = (task: SubTask) => {
  editTask(task)
}


// Table selection
const handleSelectionChange = (selection: SubTask[]) => {
  selectedTasks.value = selection
}

// Batch operations
const batchUpdateStatus = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要操作的子任务')
    return
  }

  try {
    const { value: status } = await ElMessageBox.prompt('请输入新状态', '批量更新状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (value) => {
        const validStatus = ['待启动', '研发进行中', '业务上线中', '已完成', '存在阻塞']
        return validStatus.includes(value) || '请输入有效的状态'
      }
    })

    for (const task of selectedTasks.value) {
      await SubTasksAPI.updateSubTask(task.id, { status })
    }

    ElMessage({
      message: `成功更新 ${Number(selectedTasks.value.length)} 个子任务状态`,
      type: 'success'
    })
    await loadSubTasks()
  } catch (error) {
    console.error('Failed batch update status:', error)
    ElMessage({
      message: '批量更新失败',
      type: 'error'
    })
  }
}

const batchUpdateDates = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要操作的子任务')
    return
  }

  try {
    const { value: endDate } = await ElMessageBox.prompt('请输入新的计划结束日期', '批量修改日期', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'date'
    })

    for (const task of selectedTasks.value) {
      await SubTasksAPI.updateSubTask(task.id, { planned_end_date: endDate })
    }

    ElMessage({
      message: `成功更新 ${Number(selectedTasks.value.length)} 个子任务日期`,
      type: 'success'
    })
    await loadSubTasks()
  } catch (error) {
    console.error('Failed batch update dates:', error)
    ElMessage({
      message: '批量更新失败',
      type: 'error'
    })
  }
}

// Delete subtask from edit dialog
const deleteSubTaskInEdit = async () => {
  if (!editingTask.value) {
    safeMessage('没有选中的子任务', 'error')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除子任务"${editingTask.value.subtask_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await SubTasksAPI.deleteSubTask(editingTask.value.id)
    safeMessage('子任务删除成功', 'success')
    showEditDialog.value = false
    await loadSubTasks()
  } catch (error: any) {
    if (error === 'cancel') {
      return // User cancelled
    }

    console.error('Failed to delete subtask:', error)
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('删除子任务失败', 'error')
    }
  }
}

</script>

<style scoped>
.subtasks-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #2d3748;
}

.app-info {
  color: #718096;
  font-size: 14px;
}

.overview {
  margin-bottom: 30px;
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-value.success { color: #48bb78; }
.stat-value.primary { color: #3182ce; }
.stat-value.danger { color: #e53e3e; }

.stat-label {
  color: #718096;
}

.block-warning {
  color: #e53e3e;
  font-size: 12px;
}

.completed-date {
  color: #48bb78;
}

.blocked-text {
  color: #e53e3e;
}

.batch-operations {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.batch-operations .el-button {
  margin-left: 10px;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .subtasks-view {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header h2 {
    font-size: 18px;
    text-align: center;
  }
  
  .app-info {
    text-align: center;
    font-size: 13px;
  }
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .actions .el-button {
    flex: 1;
    font-size: 12px;
  }
  
  .overview {
    margin-bottom: 20px;
  }
  
  .overview .el-col {
    margin-bottom: 10px;
  }
  
  .stat-item {
    padding: 15px 10px;
  }
  
  .stat-value {
    font-size: 1.5em;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  /* 表格移动端优化 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-table__cell {
    padding: 8px 4px;
  }
  
  .batch-operations {
    margin-top: 15px;
    padding: 10px;
  }
  
  .batch-operations .el-button {
    margin: 5px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .subtasks-view {
    padding: 8px;
  }
  
  .header h2 {
    font-size: 16px;
  }
  
  .app-info {
    font-size: 12px;
  }
  
  .actions .el-button {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .overview .el-row {
    gap: 10px;
  }
  
  .stat-value {
    font-size: 1.3em;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .el-table {
    font-size: 11px;
  }
  
  .el-table .el-table__cell {
    padding: 6px 2px;
  }
  
  .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .el-button--small {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>