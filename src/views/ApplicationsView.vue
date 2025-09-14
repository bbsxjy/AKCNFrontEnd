<template>
  <div class="applications-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>应用系统列表</h2>
          <div class="actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><plus /></el-icon>
              新增应用
            </el-button>
            <el-button type="success" @click="showImportDialog = true">
              <el-icon><upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="warning" @click="exportExcel">
              <el-icon><download /></el-icon>
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search Bar -->
      <div class="search-bar">
        <el-form :model="searchForm" inline>
          <el-form-item>
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索 L2 ID 或应用名称..."
              style="width: 250px"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
              <el-option label="全部状态" value="" />
              <el-option label="待启动" value="待启动" />
              <el-option label="研发进行中" value="研发进行中" />
              <el-option label="业务上线中" value="业务上线中" />
              <el-option label="全部完成" value="全部完成" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.department" placeholder="全部部门" clearable>
              <el-option label="全部部门" value="" />
              <el-option label="研发一部" value="研发一部" />
              <el-option label="研发二部" value="研发二部" />
              <el-option label="运维部" value="运维部" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.target" placeholder="改造目标" clearable>
              <el-option label="全部目标" value="" />
              <el-option label="AK" value="AK" />
              <el-option label="云原生" value="云原生" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Data Table -->
      <el-table
        :data="applicationStore.applications"
        :loading="applicationStore.loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="l2_id" label="L2 ID" width="130">
          <template #default="{ row }">
            <strong>{{ row.l2_id }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" width="180" />
        <el-table-column prop="transformation_target" label="改造目标" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.transformation_target === '云原生' ? 'primary' : 'warning'"
              size="small"
            >
              {{ row.transformation_target }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overall_status" label="当前状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.overall_status)" size="small">
              {{ row.overall_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" width="140">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress_percentage || 0"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(row)"
              />
              <span class="progress-text">{{ row.progress_percentage || 0 }}%</span>
              <span v-if="row.is_delayed" class="delay-warning">⚠️</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_team" label="负责团队" width="120" />
        <el-table-column prop="responsible_person" label="负责人" width="100" />
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editApplication(row)">编辑</el-button>
            <el-button
              size="small"
              type="primary"
              @click="viewSubTasks(row)"
            >
              子任务
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="applicationStore.pagination.page"
          v-model:page-size="applicationStore.pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="applicationStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Create Application Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增应用" width="600px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="L2 ID" required>
          <el-input v-model="createForm.l2_id" placeholder="如：L2_APP_001" />
        </el-form-item>
        <el-form-item label="应用名称" required>
          <el-input v-model="createForm.app_name" />
        </el-form-item>
        <el-form-item label="监管年份" required>
          <el-select v-model="createForm.supervision_year" placeholder="请选择年份">
            <el-option :value="2025" label="2025年" />
            <el-option :value="2026" label="2026年" />
            <el-option :value="2027" label="2027年" />
          </el-select>
        </el-form-item>
        <el-form-item label="改造目标" required>
          <el-radio-group v-model="createForm.transformation_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责团队" required>
          <el-select v-model="createForm.responsible_team" placeholder="请选择团队">
            <el-option value="研发一部" label="研发一部" />
            <el-option value="研发二部" label="研发二部" />
            <el-option value="运维部" label="运维部" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="createForm.responsible_person" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="applicationStore.loading">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useApplicationStore } from '@/stores/applications'
import type { Application } from '@/types'

const router = useRouter()
const applicationStore = useApplicationStore()

const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const selectedApplications = ref<Application[]>([])

const searchForm = reactive({
  keyword: '',
  status: '',
  department: '',
  target: ''
})

const createForm = reactive({
  l2_id: '',
  app_name: '',
  supervision_year: 2026,
  transformation_target: '云原生',
  responsible_team: '',
  responsible_person: ''
})

const mockApplications = ref<Application[]>([
  {
    id: 1,
    l2_id: 'L2_APP_001',
    app_name: '用户管理系统',
    supervision_year: 2026,
    transformation_target: '云原生',
    is_ak_completed: false,
    is_cloud_native_completed: false,
    current_stage: '研发进行中',
    overall_status: '研发进行中',
    responsible_team: '研发一部',
    responsible_person: '李四',
    progress_percentage: 65,
    subtask_count: 5,
    completed_subtask_count: 3,
    planned_completion_date: '2026-06-30',
    actual_completion_date: null,
    is_delayed: false,
    delay_days: 0,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T09:30:00Z'
  },
  {
    id: 2,
    l2_id: 'L2_APP_002',
    app_name: '订单管理系统',
    supervision_year: 2026,
    transformation_target: 'AK',
    is_ak_completed: false,
    is_cloud_native_completed: false,
    current_stage: '待启动',
    overall_status: '待启动',
    responsible_team: '研发二部',
    responsible_person: '王五',
    progress_percentage: 0,
    subtask_count: 3,
    completed_subtask_count: 0,
    planned_completion_date: '2026-08-30',
    actual_completion_date: null,
    is_delayed: false,
    delay_days: 0,
    created_at: '2025-01-10T14:00:00Z',
    updated_at: '2025-01-14T14:20:00Z'
  },
  {
    id: 3,
    l2_id: 'L2_APP_003',
    app_name: '库存系统',
    supervision_year: 2026,
    transformation_target: '云原生',
    is_ak_completed: false,
    is_cloud_native_completed: false,
    current_stage: '存在阻塞',
    overall_status: '存在阻塞',
    responsible_team: '研发一部',
    responsible_person: '赵六',
    progress_percentage: 30,
    subtask_count: 4,
    completed_subtask_count: 1,
    planned_completion_date: '2026-05-30',
    actual_completion_date: null,
    is_delayed: true,
    delay_days: 15,
    created_at: '2025-01-05T16:00:00Z',
    updated_at: '2025-01-15T11:45:00Z'
  }
])

// Load mock data into store
onMounted(() => {
  applicationStore.applications = mockApplications.value
  applicationStore.pagination.total = 3
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': '',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '全部完成': 'success',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || ''
}

const getProgressColor = (row: Application) => {
  if (row.is_delayed) return '#f56565'
  if (row.progress_percentage >= 80) return '#48bb78'
  if (row.progress_percentage >= 50) return '#ed8936'
  return '#667eea'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleSearch = () => {
  ElMessage.success('搜索功能将在连接后端API后生效')
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    department: '',
    target: ''
  })
  ElMessage.info('搜索条件已重置')
}

const handleSelectionChange = (selection: Application[]) => {
  selectedApplications.value = selection
}

const editApplication = (row: Application) => {
  ElMessage.info(`编辑应用：${row.app_name}`)
}

const viewSubTasks = (row: Application) => {
  router.push(`/subtasks/${row.id}`)
}

const handleCreate = () => {
  if (!createForm.l2_id || !createForm.app_name) {
    ElMessage.error('请填写必填字段')
    return
  }
  
  ElMessage.success('应用创建成功')
  showCreateDialog.value = false
  
  // Reset form
  Object.assign(createForm, {
    l2_id: '',
    app_name: '',
    supervision_year: 2026,
    transformation_target: '云原生',
    responsible_team: '',
    responsible_person: ''
  })
}

const exportExcel = () => {
  ElMessage.success('Excel导出功能将在连接后端API后生效')
}

const handleSizeChange = (size: number) => {
  applicationStore.pagination.pageSize = size
  // Fetch data with new page size
}

const handleCurrentChange = (page: number) => {
  applicationStore.pagination.page = page
  // Fetch data for new page
}
</script>

<style scoped>
.applications-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  color: #2d3748;
}

.actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  min-width: 35px;
}

.delay-warning {
  color: #f56565;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>