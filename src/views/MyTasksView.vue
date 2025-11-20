<template>
  <div class="my-tasks-view">
    <el-card>
      <template #header>
        <div class="header">
          <div class="header-title-with-badge">
            <h2>我的任务</h2>
            <el-badge
              v-if="urgentTasksCount > 0"
              :value="urgentTasksCount"
              class="header-badge"
              type="danger"
            />
            <el-badge
              v-else-if="totalTasks > 0"
              :value="totalTasks"
              class="header-badge"
              type="primary"
            />
          </div>
          <div class="actions">
            <el-button @click="refreshTasks">
              <el-icon><refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- Dispatch Notifications Alert -->
      <el-alert
        v-if="unreadNotifications.length > 0 && showNotificationAlert"
        type="info"
        :title="`您有 ${unreadNotifications.length} 条新的任务派发通知`"
        :closable="true"
        show-icon
        class="notification-alert"
        @close="dismissNotifications"
      >
        <div class="notification-list">
          <div
            v-for="notif in unreadNotifications.slice(0, 3)"
            :key="notif.id"
            class="notification-item"
          >
            <div class="notification-content">
              <strong>{{ notif.title }}</strong>
              <p>{{ notif.message }}</p>
              <span class="notification-time">{{ formatDate(notif.created_at) }}</span>
            </div>
            <el-button
              size="small"
              type="primary"
              @click="markNotificationAsRead(notif.id)"
            >
              标记已读
            </el-button>
          </div>
          <div v-if="unreadNotifications.length > 3" class="more-notifications">
            还有 {{ unreadNotifications.length - 3 }} 条通知...
          </div>
        </div>
      </el-alert>

      <!-- Quick Filter Tabs - Loading Skeleton -->
      <div v-if="loading" class="filter-tabs">
        <el-skeleton :rows="1" animated style="height: 32px;" />
      </div>

      <!-- Quick Filter Tabs - Loaded Content -->
      <div v-else class="filter-tabs">
        <el-button
          :type="activeFilter === 'all' ? 'primary' : 'default'"
          @click="setFilter('all')"
        >
          全部 ({{ allTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'progress' ? 'primary' : 'default'"
          @click="setFilter('progress')"
        >
          研发中 ({{ progressTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'testing' ? 'primary' : 'default'"
          @click="setFilter('testing')"
        >
          上线中 ({{ testingTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'blocked' ? 'primary' : 'default'"
          @click="setFilter('blocked')"
        >
          阻塞中 ({{ blockedTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'delayed' ? 'primary' : 'default'"
          @click="setFilter('delayed')"
        >
          已延期 ({{ delayedTasks.length }})
        </el-button>
      </div>

      <!-- Task List - Loading Skeleton -->
      <div v-if="loading" class="task-list">
        <div v-for="i in 5" :key="i" style="margin-bottom: 15px;">
          <el-skeleton :rows="4" animated style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;" />
        </div>
      </div>

      <!-- Task List - Loaded Content -->
      <div v-else class="task-list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="['task-item', { 'task-urgent': task.isUrgent, 'task-overdue': task.isOverdue }]"
        >
          <div class="task-content">
            <div class="task-header">
              <div class="app-info-badge">
                <el-icon><Document /></el-icon>
                <span class="app-id">{{ task.appId }}</span>
                <span class="separator">-</span>
                <span class="app-name">{{ task.appName }}</span>
              </div>
            </div>
            <div class="task-title">
              <span class="task-label">子任务：</span>
              <strong class="task-name-value">{{ task.taskName }}</strong>
              <div class="task-tags">
                <el-tag
                  size="small"
                  :type="getStatusTagType(task.status)"
                >
                  {{ task.status }}
                </el-tag>
                <el-tag
                  v-if="task.isOverdue"
                  size="small"
                  type="danger"
                >
                  逾期 {{ Math.abs(task.daysRemaining) }} 天
                </el-tag>
                <el-tag
                  v-else-if="task.daysRemaining <= 3"
                  size="small"
                  type="warning"
                >
                  剩余 {{ task.daysRemaining }} 天
                </el-tag>
              </div>
            </div>

            <div class="task-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                计划完成：{{ formatDate(task.plannedDate) }}
              </span>
              <span class="meta-item">
                <el-progress
                  :percentage="task.progress"
                  :stroke-width="4"
                  :color="getProgressColor(task)"
                  style="width: 100px"
                />
              </span>
            </div>

          </div>

          <div class="task-actions">
            <el-button
              size="small"
              :type="task.isOverdue ? 'danger' : 'primary'"
              @click="goToTaskDetail(task)"
            >
              {{ task.isOverdue ? '立即处理' : task.isUrgent ? '优先处理' : '编辑' }}
            </el-button>
            <el-button size="small" @click="viewTaskDetails(task)">
              查看所有子任务
            </el-button>
          </div>
        </div>

        <el-empty v-if="filteredTasks.length === 0" :description="getEmptyDescription()">
          <div v-if="activeFilter === 'all'" style="margin-top: 10px; color: #718096; font-size: 13px;">
            只有"研发进行中"、"业务上线中"或"存在阻塞"的任务会显示在这里
          </div>
        </el-empty>
      </div>
    </el-card>

    <!-- Update Task Dialog -->
    <el-dialog v-model="showUpdateDialog" title="更新任务进度" width="500px">
      <div v-if="selectedTask" class="update-form">
        <div class="task-info">
          <h4>{{ selectedTask.appName }} - {{ selectedTask.taskName }}</h4>
          <p class="task-l2id">应用ID: {{ selectedTask.appId }}</p>
        </div>

        <el-form :model="updateForm" label-width="100px">
          <el-form-item label="任务状态">
            <el-select v-model="updateForm.status" placeholder="请选择状态">
              <el-option value="待启动" label="待启动" />
              <el-option value="研发进行中" label="研发进行中" />
              <el-option value="业务上线中" label="业务上线中" />
              <el-option value="已完成" label="已完成" />
            </el-select>
          </el-form-item>
          <el-form-item label="完成进度">
            <el-slider
              v-model="updateForm.progress"
              :max="100"
              show-input
              :show-input-controls="false"
            />
          </el-form-item>
          <el-form-item label="是否阻塞">
            <el-switch v-model="updateForm.isBlocked" />
          </el-form-item>
          <el-form-item v-if="updateForm.isBlocked" label="阻塞原因">
            <el-input
              v-model="updateForm.blockReason"
              type="textarea"
              placeholder="请描述阻塞原因"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="实际完成日期">
            <el-date-picker
              v-model="updateForm.actualDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>

        <!-- Confirmation Summary -->
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="confirmation-summary"
        >
          <template #title>即将执行的更新</template>
          <ul class="change-list">
            <li v-if="updateForm.status !== selectedTask.status">
              状态：{{ selectedTask.status }} → {{ updateForm.status }}
            </li>
            <li v-if="updateForm.progress !== selectedTask.progress">
              进度：{{ selectedTask.progress }}% → {{ updateForm.progress }}%
            </li>
            <li v-if="updateForm.isBlocked !== selectedTask.isBlocked">
              阻塞状态：{{ selectedTask.isBlocked ? '是' : '否' }} → {{ updateForm.isBlocked ? '是' : '否' }}
            </li>
          </ul>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="showUpdateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdate" :loading="updating">
          确认更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Refresh, Calendar, Document } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { SubTasksAPI } from '@/api/subtasks'
import { DashboardAPI } from '@/api/dashboard'
import { NotificationsAPI } from '@/api/notifications'
import { useAuthStore } from '@/stores/auth'

interface MyTask {
  id: number
  appId: string
  appName: string
  taskName: string
  status: string
  progress: number
  plannedDate: string
  isOverdue: boolean
  isUrgent: boolean
  daysRemaining: number
  applicationId: number
  isBlocked: boolean
  blockReason?: string
  updating?: boolean
}

const router = useRouter()
const authStore = useAuthStore()

const activeFilter = ref('all')
const showUpdateDialog = ref(false)
const selectedTask = ref<MyTask | null>(null)
const updating = ref(false)
const loading = ref(false)
const unreadNotifications = ref<any[]>([])
const showNotificationAlert = ref(true)

// Get current user's name for filtering tasks
const currentUserName = computed(() => {
  // Try to use full_name first, fallback to employee_id
  return authStore.user?.full_name || authStore.user?.employee_id || ''
})

const updateForm = reactive({
  status: '',
  progress: 0,
  isBlocked: false,
  blockReason: '',
  actualDate: null as Date | null
})

// Task data from API
const allTasks = ref<MyTask[]>([])

const totalTasks = computed(() => allTasks.value.length)
const urgentTasksCount = computed(() => allTasks.value.filter(task => task.isUrgent).length)
const progressTasks = computed(() => allTasks.value.filter(t => t.status === '研发进行中' || t.status === 'in_progress'))
const testingTasks = computed(() => allTasks.value.filter(t => t.status === '业务上线中' || t.status === 'testing'))
const blockedTasks = computed(() => allTasks.value.filter(t => t.status === '存在阻塞' || t.status === 'blocked'))
const delayedTasks = computed(() => allTasks.value.filter(t => t.isOverdue))

const filteredTasks = computed(() => {
  switch (activeFilter.value) {
    case 'progress':
      return progressTasks.value
    case 'testing':
      return testingTasks.value
    case 'blocked':
      return blockedTasks.value
    case 'delayed':
      return delayedTasks.value
    default:
      return allTasks.value
  }
})

const setFilter = (filter: string) => {
  activeFilter.value = filter
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const getProgressColor = (task: MyTask) => {
  if (task.isOverdue) return '#f56565'
  if (task.progress >= 80) return '#48bb78'
  if (task.progress >= 50) return '#3182ce'
  if (task.progress >= 30) return '#ed8936'
  return '#a0aec0'
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return '-'
  }
}

const getEmptyDescription = () => {
  switch (activeFilter.value) {
    case 'progress':
      return '暂无研发进行中的任务'
    case 'testing':
      return '暂无业务上线中的任务'
    case 'blocked':
      return '暂无阻塞的任务'
    case 'delayed':
      return '暂无延期的任务'
    default:
      return '暂无进行中的任务'
  }
}

const loadMyTasks = async () => {
  try {
    loading.value = true

    // Use DashboardAPI to get properly formatted tasks with user filtering
    const userName = currentUserName.value
    console.log('🔍 [我的任务] 当前用户:', userName)
    console.log('🔍 [我的任务] 用户完整信息:', authStore.user)

    const tasks = await DashboardAPI.getMyTasks(100, userName) // Get more tasks for My Tasks view
    console.log('🔍 [我的任务] API返回的任务数量:', tasks.length)
    console.log('🔍 [我的任务] API返回的任务详情:', tasks)

    // 🔧 临时Mock：加载localStorage中的派发记录
    let mockTasks: any[] = []
    try {
      const mockDispatches = JSON.parse(localStorage.getItem('mock_dispatches') || '[]')
      console.log('🔍 [Mock] 从本地加载派发记录:', mockDispatches.length, '条')

      // 过滤出属于当前用户的mock任务
      mockTasks = mockDispatches
        .filter((dispatch: any) => dispatch.assigneeName === userName)
        .map((dispatch: any) => {
          const plannedDate = new Date(dispatch.plannedDate)
          const now = Date.now()
          const isOverdue = plannedDate < new Date()
          const isUrgent = plannedDate.getTime() <= now + 3 * 24 * 60 * 60 * 1000

          return {
            id: dispatch.id,
            appId: dispatch.appId,
            appName: dispatch.appName,
            taskName: dispatch.taskName,
            status: dispatch.status,
            progress: dispatch.progress,
            plannedDate: dispatch.plannedDate,
            isOverdue: isOverdue,
            isUrgent: isUrgent,
            daysRemaining: Math.ceil((plannedDate.getTime() - now) / (24 * 60 * 60 * 1000)),
            applicationId: dispatch.applicationId,
            isBlocked: false,
            blockReason: '',
            isMock: true // 标记为mock数据
          }
        })

      console.log(`✅ [Mock] 找到 ${mockTasks.length} 个属于当前用户的mock任务`)
    } catch (err) {
      console.warn('⚠️ [Mock] 加载派发记录失败:', err)
    }

    // Transform to MyTask format
    const realTasks = tasks
      .filter(task => {
        // Filter out completed tasks
        const isCompleted = task.status === '已完成' ||
                           task.status === '全部完成' ||
                           task.status === 'completed'
        return !isCompleted
      })
      .map((task: any) => ({
        id: task.id,
        appId: task.appId,
        appName: task.appName,
        taskName: task.taskName,
        status: task.status,
        progress: task.progress,
        plannedDate: task.plannedDate,
        isOverdue: task.isOverdue,
        isUrgent: task.isUrgent,
        daysRemaining: task.daysRemaining,
        applicationId: task.applicationId,
        isBlocked: task.status === '存在阻塞',
        blockReason: '',
        isMock: false
      }))

    // 合并真实任务和mock任务
    allTasks.value = [...mockTasks, ...realTasks]

    console.log(`✅ [我的任务] 最终显示 ${allTasks.value.length} 个任务 (${mockTasks.length} mock + ${realTasks.length} 真实)`)
    if (allTasks.value.length > 0) {
      console.log('📋 [我的任务] 任务列表:', allTasks.value)
    }
  } catch (error) {
    console.error('❌ [我的任务] 加载失败:', error)
    allTasks.value = []
  } finally {
    loading.value = false
  }
}

const refreshTasks = async (isManual = true) => {
  await loadMyTasks()
  if (isManual) {
    ElMessage.success('任务列表已刷新')
  }
}

// 加载派发通知
const loadDispatchNotifications = async () => {
  try {
    console.log('🔔 [通知] 开始加载派发通知...')

    const notifications = await NotificationsAPI.getNotifications({
      unread_only: true,
      limit: 10
    })

    console.log('🔔 [通知] API返回的所有未读通知:', notifications)
    console.log('🔔 [通知] 未读通知总数:', notifications?.total)
    console.log('🔔 [通知] 通知列表:', notifications?.items)

    let realNotifications: any[] = []

    // 检查返回数据格式
    if (!notifications || !notifications.items) {
      console.warn('⚠️ [通知] API返回格式不正确，应为 {total, unread_count, items}')
    } else {
      // 过滤出任务派发类型的通知
      realNotifications = notifications.items.filter(
        (notif: any) => notif.type === 'task_assignment'
      )
    }

    // 🔧 临时Mock：加载localStorage中的派发通知
    let mockNotifications: any[] = []
    try {
      const mockDispatches = JSON.parse(localStorage.getItem('mock_dispatches') || '[]')
      const userName = currentUserName.value

      // 将派发记录转换为通知格式
      mockNotifications = mockDispatches
        .filter((dispatch: any) => dispatch.assigneeName === userName)
        .map((dispatch: any) => ({
          id: `notif_${dispatch.id}`,
          type: 'task_assignment',
          title: '您有新的任务派发',
          message: dispatch.message || `您被分配了应用 ${dispatch.appName} 的${dispatch.assigneeType === 'dev' ? '开发' : '运维'}任务，请及时查看并填写进展。`,
          severity: 'medium',
          is_read: false,
          created_at: dispatch.dispatchedAt,
          data: {
            appId: dispatch.appId,
            appName: dispatch.appName,
            assigneeType: dispatch.assigneeType
          },
          isMock: true
        }))

      console.log(`✅ [Mock] 找到 ${mockNotifications.length} 条mock通知`)
    } catch (err) {
      console.warn('⚠️ [Mock] 加载mock通知失败:', err)
    }

    // 合并真实通知和mock通知
    unreadNotifications.value = [...mockNotifications, ...realNotifications]

    console.log(`✅ [通知] 最终显示 ${unreadNotifications.value.length} 条任务派发通知 (${mockNotifications.length} mock + ${realNotifications.length} 真实)`)
    if (unreadNotifications.value.length > 0) {
      console.log('📧 [通知] 派发通知详情:', unreadNotifications.value)
    }
  } catch (error) {
    console.error('❌ [通知] 加载失败:', error)
    unreadNotifications.value = []
  }
}

// 标记通知为已读
const markNotificationAsRead = async (notificationId: number | string) => {
  try {
    // 如果是mock通知（ID是字符串且以notif_mock_开头）
    if (typeof notificationId === 'string' && notificationId.startsWith('notif_mock_')) {
      console.log('🔔 [Mock] 删除mock通知:', notificationId)

      // 从localStorage中移除对应的派发记录
      const mockDispatches = JSON.parse(localStorage.getItem('mock_dispatches') || '[]')
      const dispatchId = notificationId.replace('notif_', '')
      const updatedDispatches = mockDispatches.filter((d: any) => d.id !== dispatchId)
      localStorage.setItem('mock_dispatches', JSON.stringify(updatedDispatches))

      // 重新加载通知
      await loadDispatchNotifications()
      return
    }

    // 真实通知，调用API
    await NotificationsAPI.markAsRead(notificationId as number)
    await loadDispatchNotifications()
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

// 关闭通知提示
const dismissNotifications = () => {
  showNotificationAlert.value = false
}


// Navigate directly to subtask detail page for editing
const goToTaskDetail = (task: MyTask) => {
  if (task.applicationId) {
    // Navigate to subtasks view with the task ID as a hash
    router.push(`/subtasks/${task.applicationId}?taskId=${task.id}`)
  } else {
    ElMessage.warning('无法找到对应的应用ID')
  }
}

const viewTaskDetails = (task: MyTask) => {
  if (task.applicationId) {
    router.push(`/subtasks/${task.applicationId}`)
  }
}

const confirmUpdate = async () => {
  if (!selectedTask.value) return

  try {
    updating.value = true
    selectedTask.value.updating = true

    // Update via API
    await SubTasksAPI.updateSubTask(selectedTask.value.id, {
      task_status: updateForm.status,
      progress_percentage: updateForm.progress,
      is_blocked: updateForm.isBlocked,
      block_reason: updateForm.isBlocked ? updateForm.blockReason : '',
      actual_biz_online_date: updateForm.actualDate ? updateForm.actualDate.toISOString().split('T')[0] : undefined
    })

    ElMessage.success('任务更新成功')
    showUpdateDialog.value = false
    
    // Reload tasks to get updated data
    await loadMyTasks()
  } catch (error) {
    console.error('Failed to update task:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    updating.value = false
    if (selectedTask.value) {
      selectedTask.value.updating = false
    }
  }
}

// Store interval ID for cleanup
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // Load initial data
  await loadMyTasks()
  await loadDispatchNotifications()

  // Auto-refresh tasks every 30 seconds (no notification for auto-refresh)
  refreshInterval = setInterval(() => {
    refreshTasks(false)
    loadDispatchNotifications()
  }, 30000)
})

onUnmounted(() => {
  // Clean up interval
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.my-tasks-view {
  padding: 20px;
}

.notification-alert {
  margin-bottom: 20px;
}

.notification-list {
  margin-top: 10px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.notification-item:last-child {
  margin-bottom: 0;
}

.notification-content {
  flex: 1;
  margin-right: 15px;
}

.notification-content strong {
  display: block;
  color: #2d3748;
  margin-bottom: 4px;
}

.notification-content p {
  margin: 0;
  color: #4a5568;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #718096;
}

.more-notifications {
  text-align: center;
  padding: 8px;
  color: #667eea;
  font-size: 13px;
}


.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-with-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-badge {
  margin-left: 0;
  vertical-align: middle;
  margin-top: 5px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #2d3748;
}

.user-info {
  color: #718096;
  font-size: 14px;
}

.smart-notice {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.task-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  transition: all 0.3s;
}

.task-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.task-urgent {
  border-left: 4px solid #f39c12;
}

.task-overdue {
  border-left: 4px solid #e53e3e;
}

.task-content {
  flex: 1;
  margin-right: 20px;
}

.task-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.app-info-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  color: white;
  font-weight: 500;
}

.app-info-badge .el-icon {
  font-size: 16px;
}

.app-id {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.separator {
  opacity: 0.6;
  margin: 0 2px;
}

.app-name {
  font-size: 14px;
}

.task-title {
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-label {
  color: #718096;
  font-size: 13px;
}

.task-name-value {
  color: #2d3748;
  font-size: 15px;
}

.task-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.task-name {
  color: #4a5568;
  font-size: 13px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}

.meta-item .el-icon {
  font-size: 14px;
  color: #a0aec0;
}

.status-tag {
  margin-left: 10px;
}


.task-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirmation-notice {
  margin-top: 30px;
}

.update-form .task-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.task-info h4 {
  margin: 0 0 5px 0;
  color: #2d3748;
}

.task-l2id {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.confirmation-summary {
  margin-top: 20px;
}

.change-list {
  margin: 10px 0 0 20px;
  color: #4a5568;
}

.change-list li {
  margin-bottom: 5px;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .my-tasks-view {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header h2 {
    font-size: 20px;
    text-align: center;
  }
  
  .user-info {
    font-size: 13px;
    text-align: center;
  }
  
  .filter-tabs {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  
  .filter-tabs .el-button {
    flex: 1;
    min-width: 80px;
    font-size: 12px;
  }
  
  .task-card {
    margin-bottom: 15px;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .task-title {
    width: 100%;
  }
  
  .task-title strong {
    font-size: 14px;
  }
  
  .status-tag {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .detail-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .task-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .task-actions .el-button {
    flex: 1;
    min-width: 100px;
    font-size: 12px;
  }
  
  .task-progress {
    margin: 10px 0;
  }
}

@media (max-width: 480px) {
  .my-tasks-view {
    padding: 8px;
  }
  
  .header h2 {
    font-size: 18px;
  }
  
  .user-info {
    font-size: 12px;
  }
  
  .filter-tabs .el-button {
    font-size: 11px;
    padding: 6px 12px;
  }
  
  .task-card .el-card__body {
    padding: 12px;
  }
  
  .task-priority-icon {
    font-size: 20px;
  }
  
  .task-title strong {
    font-size: 13px;
  }
  
  .detail-item {
    font-size: 12px;
  }
  
  .task-l2id {
    font-size: 12px;
  }
  
  .task-actions .el-button {
    font-size: 11px;
    padding: 6px 12px;
  }
}
</style>