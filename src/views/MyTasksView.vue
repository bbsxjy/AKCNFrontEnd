<template>
  <div class="my-tasks-view">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h2>我的任务</h2>
            <div class="user-info">
              当前用户：{{ authStore.user?.full_name }} | {{ authStore.user?.department }} | 
              共 <strong>{{ totalTasks }}</strong> 个待处理任务
            </div>
          </div>
          <div class="actions">
            <el-button @click="refreshTasks">
              <el-icon><refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- Smart Filter Notice -->
      <el-alert
        :closable="false"
        type="warning"
        show-icon
        class="smart-notice"
      >
        <template #title>
          💡 智能提示：系统已自动筛选出您负责的任务，避免误操作其他任务
        </template>
      </el-alert>

      <!-- Quick Filter Tabs -->
      <div class="filter-tabs">
        <el-button
          :type="activeFilter === 'all' ? 'primary' : 'default'"
          @click="setFilter('all')"
        >
          全部 ({{ allTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'pending' ? 'primary' : 'default'"
          @click="setFilter('pending')"
        >
          待处理 ({{ pendingTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'progress' ? 'primary' : 'default'"
          @click="setFilter('progress')"
        >
          进行中 ({{ progressTasks.length }})
        </el-button>
        <el-button
          :type="activeFilter === 'delayed' ? 'primary' : 'default'"
          @click="setFilter('delayed')"
        >
          已延期 ({{ delayedTasks.length }})
        </el-button>
      </div>

      <!-- Task List -->
      <div class="task-list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="['task-item', { 'task-urgent': task.isUrgent, 'task-delayed': task.isDelayed }]"
        >
          <div class="task-content">
            <div class="task-header">
              <span class="task-priority-icon">{{ task.priorityIcon }}</span>
              <div class="task-title">
                <strong>{{ task.appName }} - {{ task.moduleName }}</strong>
                <el-tag
                  :type="getStatusTagType(task.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ task.status }}
                </el-tag>
              </div>
            </div>

            <div class="task-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">L2 ID:</span>
                  <span>{{ task.l2Id }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">模块:</span>
                  <span>{{ task.moduleName }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">计划日期:</span>
                  <span :class="{ 'date-overdue': task.isDelayed }">
                    {{ task.plannedDate }}
                    <span v-if="task.isDelayed" class="overdue-text">
                      （已延期{{ task.delayDays }}天）
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">当前进度:</span>
                  <span>{{ task.progress }}%</span>
                </div>
              </div>
            </div>

            <div class="progress-section">
              <el-progress
                :percentage="task.progress"
                :stroke-width="8"
                :color="getProgressColor(task)"
              />
            </div>
          </div>

          <div class="task-actions">
            <el-button
              type="primary"
              @click="updateTask(task)"
              :loading="task.updating"
            >
              {{ task.isDelayed ? '立即更新' : '更新进度' }}
            </el-button>
            <el-button @click="viewTaskDetails(task)">
              查看详情
            </el-button>
          </div>
        </div>

        <el-empty v-if="filteredTasks.length === 0" description="暂无任务" />
      </div>

      <!-- Confirmation Notice -->
      <el-alert
        :closable="false"
        type="success"
        show-icon
        class="confirmation-notice"
      >
        <template #title>
          ✅ 二次确认机制（防误操作）
        </template>
        点击"更新进度"后，系统会弹出确认窗口，显示即将修改的内容，避免误操作
      </el-alert>
    </el-card>

    <!-- Update Task Dialog -->
    <el-dialog v-model="showUpdateDialog" title="更新任务进度" width="500px">
      <div v-if="selectedTask" class="update-form">
        <div class="task-info">
          <h4>{{ selectedTask.appName }} - {{ selectedTask.moduleName }}</h4>
          <p class="task-l2id">L2 ID: {{ selectedTask.l2Id }}</p>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { SubTasksAPI } from '@/api/subtasks'

interface MyTask {
  id: number
  l2Id: string
  appName: string
  moduleName: string
  status: string
  progress: number
  plannedDate: string
  isDelayed: boolean
  delayDays: number
  isUrgent: boolean
  priorityIcon: string
  isBlocked: boolean
  blockReason?: string
  updating?: boolean
}

const authStore = useAuthStore()

const activeFilter = ref('all')
const showUpdateDialog = ref(false)
const selectedTask = ref<MyTask | null>(null)
const updating = ref(false)
const loading = ref(false)

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
const pendingTasks = computed(() => allTasks.value.filter(t => t.status === '待启动'))
const progressTasks = computed(() => allTasks.value.filter(t => t.status === '研发进行中'))
const delayedTasks = computed(() => allTasks.value.filter(t => t.isDelayed))

const filteredTasks = computed(() => {
  switch (activeFilter.value) {
    case 'pending':
      return pendingTasks.value
    case 'progress':
      return progressTasks.value
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
  if (task.isDelayed) return '#f56565'
  if (task.progress >= 80) return '#48bb78'
  if (task.progress >= 50) return '#ed8936'
  return '#667eea'
}

const loadMyTasks = async () => {
  try {
    loading.value = true
    
    // Get subtasks assigned to current user
    const mySubtasks = await SubTasksAPI.getMySubTasks()
    
    // Transform API data to MyTask format
    allTasks.value = mySubtasks.map((task: any) => {
      const plannedDate = new Date(task.planned_end_date)
      const today = new Date()
      const isDelayed = plannedDate < today && task.status !== '已完成'
      const delayDays = isDelayed ? Math.floor((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      const daysUntilDue = Math.floor((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0
      
      return {
        id: task.id,
        l2Id: task.application_id || 'N/A',
        appName: task.application_name || '未知应用',
        moduleName: task.subtask_name,
        status: task.status,
        progress: task.progress_percentage || 0,
        plannedDate: task.planned_end_date,
        isDelayed,
        delayDays,
        isUrgent: isUrgent || isDelayed,
        priorityIcon: isDelayed ? '🔴' : (isUrgent ? '🟡' : '🟢'),
        isBlocked: task.status === '存在阻塞',
        blockReason: task.notes
      }
    })
  } catch (error) {
    console.error('Failed to load my tasks:', error)
    // No fallback - show empty state
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

const updateTask = (task: MyTask) => {
  selectedTask.value = task
  
  // Pre-fill form with current values
  updateForm.status = task.status
  updateForm.progress = task.progress
  updateForm.isBlocked = task.isBlocked
  updateForm.blockReason = task.blockReason || ''
  updateForm.actualDate = null
  
  showUpdateDialog.value = true
}

const viewTaskDetails = (task: MyTask) => {
  ElMessage.info(`查看任务详情：${task.appName} - ${task.moduleName}`)
}

const confirmUpdate = async () => {
  if (!selectedTask.value) return

  try {
    updating.value = true
    selectedTask.value.updating = true

    // Update via API
    await SubTasksAPI.updateSubTask(selectedTask.value.id, {
      status: updateForm.status,
      progress_percentage: updateForm.progress,
      notes: updateForm.isBlocked ? updateForm.blockReason : '',
      actual_end_date: updateForm.actualDate ? updateForm.actualDate.toISOString().split('T')[0] : undefined
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

onMounted(async () => {
  // Load initial data
  await loadMyTasks()
  
  // Auto-refresh tasks every 30 seconds (no notification for auto-refresh)
  setInterval(() => refreshTasks(false), 30000)
})
</script>

<style scoped>
.my-tasks-view {
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
  background: #fef5e7;
  border-left: 4px solid #f39c12;
}

.task-delayed {
  border-left: 4px solid #f56565;
}

.task-content {
  flex: 1;
  margin-right: 20px;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.task-priority-icon {
  font-size: 24px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-title strong {
  font-size: 16px;
}

.status-tag {
  margin-left: 10px;
}

.task-details {
  margin-bottom: 15px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.label {
  color: #718096;
  font-weight: 500;
  min-width: 70px;
}

.date-overdue {
  color: #e53e3e;
}

.overdue-text {
  font-weight: bold;
}

.progress-section {
  margin-top: 10px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: flex-start;
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