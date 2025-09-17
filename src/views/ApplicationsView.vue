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
            <el-button type="success" @click="goToImport">
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
            <el-select
              v-model="searchForm.status"
              placeholder="全部状态"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.department"
              placeholder="全部部门"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in departmentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.target"
              placeholder="改造目标"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in targetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetSearch">重置筛选</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="data-tabs">
        <el-tab-pane label="应用列表" name="applications">
          <!-- Applications Data Table -->
        </el-tab-pane>
        <el-tab-pane label="子任务状态" name="subtasks">
          <!-- SubTasks Data Table -->
        </el-tab-pane>
      </el-tabs>

      <!-- Applications Data Table -->
      <div v-show="activeTab === 'applications'">
      <el-table
        :data="applications"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="l2_id" label="L2 ID" min-width="130">
          <template #default="{ row }">
            <strong>{{ row.l2_id || row.application_id }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" min-width="200">
          <template #default="{ row }">
            {{ row.app_name || row.application_name }}
          </template>
        </el-table-column>
        <el-table-column prop="supervision_year" label="监管年份" width="100">
          <template #default="{ row }">
            {{ row.supervision_year || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="transformation_target" label="改造目标" min-width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.transformation_target === 'AK' ? 'primary' : 'success'">
              {{ row.transformation_target || 'AK' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_stage" label="当前阶段" min-width="100">
          <template #default="{ row }">
            {{ row.current_stage || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="overall_status" label="整体状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.overall_status || row.status)" size="small">
              {{ row.overall_status || row.status || '待启动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" min-width="160">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="Number(row.progress_percentage) || 0"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(row)"
              />
              <span class="progress-text">{{ Number(row.progress_percentage) || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_team" label="负责团队" min-width="120" />
        <el-table-column prop="responsible_person" label="负责人" min-width="100" />
        <el-table-column prop="updated_at" label="更新时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
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
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        </div>
      </div>

      <!-- SubTasks Data Table -->
      <div v-show="activeTab === 'subtasks'">
        <!-- SubTask Search Bar -->
        <div class="search-bar">
          <el-form :model="subtaskSearchForm" inline>
            <el-form-item>
              <el-input
                v-model="subtaskSearchForm.keyword"
                placeholder="搜索子任务名称或负责人..."
                style="width: 250px"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="subtaskSearchForm.status"
                placeholder="全部状态"
                clearable
                style="width: 150px"
              >
                <el-option label="待启动" value="待启动" />
                <el-option label="研发进行中" value="研发进行中" />
                <el-option label="业务上线中" value="业务上线中" />
                <el-option label="已完成" value="已完成" />
                <el-option label="存在阻塞" value="存在阻塞" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="subtaskSearchForm.application"
                placeholder="筛选应用"
                clearable
                style="width: 200px"
              >
                <el-option
                  v-for="app in allApplications"
                  :key="app.id"
                  :label="app.application_name"
                  :value="app.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="resetSubtaskSearch">重置筛选</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table
          :data="paginatedSubTasks"
          v-loading="subtaskLoading"
          style="width: 100%"
          @selection-change="handleSubTaskSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="L2 ID" width="100" fixed="left">
            <template #default="{ row }">
              <strong>{{ getApplicationL2Id(row.application_id) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="应用名称" min-width="120">
            <template #default="{ row }">
              {{ getApplicationName(row.application_id) }}
            </template>
          </el-table-column>
          <el-table-column prop="module_name" label="模块名称" min-width="150">
            <template #default="{ row }">
              <strong>{{ row.module_name || '默认模块' }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="sub_target" label="改造目标" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.sub_target === 'AK' ? 'primary' : 'success'">
                {{ row.sub_target || 'AK' }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- 负责人信息 -->
          <el-table-column label="开发负责人" width="90">
            <template #default="{ row }">
              {{ row.dev_owner || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="开发团队" width="90">
            <template #default="{ row }">
              {{ row.dev_team || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="运维负责人" width="90">
            <template #default="{ row }">
              {{ row.ops_owner || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="运维团队" width="90">
            <template #default="{ row }">
              {{ row.ops_team || '-' }}
            </template>
          </el-table-column>
          <!-- 状态和进度 -->
          <el-table-column prop="task_status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.task_status || row.status)" size="small">
                {{ row.task_status || row.status || '待启动' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress_percentage" label="进度" width="80">
            <template #default="{ row }">
              <el-progress
                :percentage="Number(row.progress_percentage) || 0"
                :stroke-width="6"
                :color="getSubTaskProgressColor(row)"
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
          <el-table-column label="计划技术上线" width="95">
            <template #default="{ row }">
              {{ formatShortDate(row.planned_tech_online_date) }}
            </template>
          </el-table-column>
          <el-table-column label="计划业务上线" width="95">
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
          <el-table-column label="实际技术上线" width="95">
            <template #default="{ row }">
              <span :class="{ 'completed-date': row.actual_tech_online_date }">
                {{ formatShortDate(row.actual_tech_online_date) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="实际业务上线" width="95">
            <template #default="{ row }">
              <span :class="{ 'completed-date': row.actual_biz_online_date }">
                {{ formatShortDate(row.actual_biz_online_date) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editSubTask(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- SubTasks Pagination -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="subtaskCurrentPage"
            v-model:page-size="subtaskPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredSubTasks.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSubTaskSizeChange"
            @current-change="handleSubTaskCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- Create Application Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增应用" width="600px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="L2 ID" required>
          <el-input v-model="createForm.application_id" placeholder="如：L2_APP_001" />
        </el-form-item>
        <el-form-item label="应用名称" required>
          <el-input v-model="createForm.application_name" />
        </el-form-item>
        <el-form-item label="改造目标" required>
          <el-radio-group v-model="createForm.transformation_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="监管年份">
          <el-select v-model="createForm.supervision_year" placeholder="请选择年份">
            <el-option :value="2025" label="2025年" />
            <el-option :value="2026" label="2026年" />
            <el-option :value="2027" label="2027年" />
          </el-select>
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
        <el-button type="primary" @click="handleCreate" :loading="loading">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Application Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑应用" width="600px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="L2 ID">
          <el-input v-model="editForm.application_id" disabled />
        </el-form-item>
        <el-form-item label="应用名称" required>
          <el-input v-model="editForm.application_name" />
        </el-form-item>
        <el-form-item label="改造目标">
          <el-radio-group v-model="editForm.transformation_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责团队" required>
          <el-select v-model="editForm.responsible_team" placeholder="请选择团队">
            <el-option value="研发一部" label="研发一部" />
            <el-option value="研发二部" label="研发二部" />
            <el-option value="运维部" label="运维部" />
            <el-option value="架构部" label="架构部" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editForm.responsible_person" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button type="danger" @click="deleteApplicationInEdit">删除应用</el-button>
          <div>
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="handleUpdate" :loading="loading">
              保存
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApplicationsAPI, type Application, type CreateApplicationRequest } from '@/api/applications'
import { SubTasksAPI, type SubTask } from '@/api/subtasks'
import { ExcelAPI } from '@/api/reports'

const router = useRouter()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const selectedApplications = ref<Application[]>([])
const editingId = ref<number | null>(null)

// Tab and SubTasks states
const activeTab = ref('applications')
const allSubTasks = ref<SubTask[]>([])
const subtaskLoading = ref(false)
const selectedSubTasks = ref<SubTask[]>([])
const subtaskCurrentPage = ref(1)
const subtaskPageSize = ref(10)

const subtaskSearchForm = reactive({
  keyword: '',
  status: undefined as string | undefined,
  application: undefined as number | undefined
})

// Data states
const allApplications = ref<Application[]>([]) // 存储所有原始数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: '',
  status: undefined as string | undefined,
  department: undefined as string | undefined,
  target: undefined as string | undefined
})

// 用于防抖的关键词
const debouncedKeyword = ref('')

// 下拉选项
const statusOptions = [
  { label: '待启动', value: '待启动' },
  { label: '研发进行中', value: '研发进行中' },
  { label: '业务上线中', value: '业务上线中' },
  { label: '全部完成', value: '全部完成' },
  { label: '存在阻塞', value: '存在阻塞' }
]

const departmentOptions = [
  { label: '研发一部', value: '研发一部' },
  { label: '研发二部', value: '研发二部' },
  { label: '运维部', value: '运维部' },
  { label: '架构部', value: '架构部' },
  { label: '测试部', value: '测试部' }
]

const targetOptions = [
  { label: 'AK', value: 'AK' },
  { label: '云原生', value: '云原生' }
]

const createForm = reactive({
  application_id: '',
  application_name: '',
  responsible_person: '',
  responsible_team: '',
  status: '待启动',
  supervision_year: 2025,
  transformation_target: 'AK'
})

const editForm = reactive({
  application_id: '',
  application_name: '',
  transformation_target: 'AK',
  responsible_person: '',
  responsible_team: '',
  status: '待启动',
  supervision_year: 2025
})

// 前端筛选后的数据
const filteredApplications = computed(() => {
  let result = [...allApplications.value]

  // 关键词搜索（使用防抖后的值）
  if (debouncedKeyword.value) {
    const keyword = debouncedKeyword.value.toLowerCase()
    result = result.filter(app => {
      const id = app.l2_id || app.application_id || ''
      const name = app.app_name || app.application_name || ''
      return id.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)
    })
  }

  // 状态筛选
  if (searchForm.status) {
    result = result.filter(app => app.status === searchForm.status)
  }

  // 部门筛选
  if (searchForm.department) {
    result = result.filter(app => app.responsible_team === searchForm.department)
  }

  // 改造目标筛选（假设数据中有此字段）
  if (searchForm.target) {
    result = result.filter(app => app.transformation_target === searchForm.target)
  }

  return result
})

// 分页后的数据
const applications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredApplications.value.slice(start, end)
})

// 总数
const total = computed(() => filteredApplications.value.length)

// SubTask 相关计算属性
const filteredSubTasks = computed(() => {
  let result = [...allSubTasks.value]

  // 关键词搜索
  if (subtaskSearchForm.keyword) {
    const keyword = subtaskSearchForm.keyword.toLowerCase()
    result = result.filter(task => {
      const name = task.version_name || task.subtask_name || ''
      const person = task.assigned_to || task.responsible_person || ''
      return name.toLowerCase().includes(keyword) || person.toLowerCase().includes(keyword)
    })
  }

  // 状态筛选
  if (subtaskSearchForm.status) {
    result = result.filter(task => task.status === subtaskSearchForm.status)
  }

  // 应用筛选
  if (subtaskSearchForm.application) {
    result = result.filter(task => task.application_id === subtaskSearchForm.application)
  }

  return result
})

// 分页后的子任务数据
const paginatedSubTasks = computed(() => {
  const start = (subtaskCurrentPage.value - 1) * subtaskPageSize.value
  const end = start + subtaskPageSize.value
  return filteredSubTasks.value.slice(start, end)
})

// Load all applications data
const loadApplications = async () => {
  try {
    loading.value = true
    // 一次性获取所有数据（或者较大数量）
    const response = await ApplicationsAPI.getApplications({
      skip: 0,
      limit: 1000 // 获取前1000条数据
    })
    allApplications.value = response.items || []
  } catch (error) {
    console.error('Failed to load applications:', error)
    ElMessage.error('加载应用列表失败，请检查网络连接')
    allApplications.value = []
  } finally {
    loading.value = false
  }
}

// Load all subtasks data
const loadSubTasks = async () => {
  try {
    subtaskLoading.value = true
    const response = await SubTasksAPI.getSubTasks({ limit: 1000 })
    allSubTasks.value = response.items || []
  } catch (error) {
    console.error('Failed to load subtasks:', error)
    ElMessage.error('加载子任务列表失败')
    allSubTasks.value = []
  } finally {
    subtaskLoading.value = false
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadApplications(),
    loadSubTasks()
  ])
})


// 防抖处理关键词搜索
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => searchForm.keyword, (newVal) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedKeyword.value = newVal
    currentPage.value = 1
  }, 300) // 300ms 防抖
})

// 监听其他筛选条件
watch([() => searchForm.status, () => searchForm.department, () => searchForm.target], () => {
  currentPage.value = 1
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '全部完成': 'success',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const getProgressColor = (row: Application) => {
  if (row.progress_percentage >= 80) return '#48bb78'
  if (row.progress_percentage >= 50) return '#ed8936'
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

// Removed handleSearch since we have watch

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  searchForm.department = undefined
  searchForm.target = undefined
  debouncedKeyword.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Application[]) => {
  selectedApplications.value = selection
}

const editApplication = (row: Application) => {
  editingId.value = row.id
  // Copy data to edit form
  Object.assign(editForm, {
    application_id: row.l2_id || row.application_id,
    application_name: row.app_name || row.application_name,
    transformation_target: row.transformation_target || 'AK',
    responsible_person: row.responsible_person,
    responsible_team: row.responsible_team,
    status: row.overall_status || row.status || '待启动',
    supervision_year: row.supervision_year || 2025
  })
  showEditDialog.value = true
}

const handleUpdate = async () => {
  if (!editForm.application_name || !editingId.value) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    const updatedApp = await ApplicationsAPI.updateApplication(editingId.value, editForm)
    ElMessage.success('应用更新成功')
    showEditDialog.value = false

    // 更新本地数据
    const index = allApplications.value.findIndex(app => app.id === editingId.value)
    if (index !== -1) {
      allApplications.value[index] = updatedApp
    }
  } catch (error) {
    console.error('Failed to update application:', error)
    ElMessage.error('更新应用失败')
  }
}

// Delete application from edit dialog
const deleteApplicationInEdit = async () => {
  if (!editingId.value) {
    ElMessage.error('没有选中的应用')
    return
  }

  const app = allApplications.value.find(app => app.id === editingId.value)
  if (!app) {
    ElMessage.error('应用不存在')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除应用"${app.application_name}"吗？此操作将同时删除所有相关子任务，且不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await ApplicationsAPI.deleteApplication(editingId.value)
    ElMessage.success('应用删除成功')
    showEditDialog.value = false

    // Remove from local data
    const index = allApplications.value.findIndex(app => app.id === editingId.value)
    if (index !== -1) {
      allApplications.value.splice(index, 1)
    }
  } catch (error: any) {
    if (error === 'cancel') {
      return // User cancelled
    }

    console.error('Failed to delete application:', error)
    if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误，请稍后重试')
    } else if (error.response?.status === 404) {
      ElMessage.error('应用不存在或已被删除')
    } else {
      ElMessage.error('删除应用失败')
    }
  }
}

const viewSubTasks = (row: Application) => {
  router.push(`/subtasks/${row.id}`)
}


const handleCreate = async () => {
  if (!createForm.application_id || !createForm.application_name) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    const newApp = await ApplicationsAPI.createApplication(createForm as CreateApplicationRequest)
    ElMessage.success('应用创建成功')
    showCreateDialog.value = false

    // 直接添加到本地数据
    allApplications.value.unshift(newApp)

    // Reset form
    Object.assign(createForm, {
      application_id: '',
      application_name: '',
      responsible_person: '',
      responsible_team: '',
      status: '待启动',
      supervision_year: 2025,
      transformation_target: 'AK'
    })
  } catch (error) {
    console.error('Failed to create application:', error)
    ElMessage.error('创建应用失败')
  }
}

const exportExcel = async () => {
  try {
    const filters = {
      ...(searchForm.status && { status: searchForm.status }),
      ...(searchForm.department && { team: searchForm.department })
    }

    const columns = [
      'application_id',
      'application_name',
      'business_domain',
      'business_subdomain',
      'responsible_person',
      'responsible_team',
      'status',
      'progress_percentage',
      'priority',
      'kpi_classification',
      'service_tier',
      'traffic',
      'size',
      'public_cloud_vendor'
    ]

    // Use the new direct download method
    await ExcelAPI.exportAndDownloadApplications({
      filters,
      columns
    })

    ElMessage.success(`Excel文件导出成功`)
  } catch (error) {
    console.error('Failed to export Excel:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// Navigate to import page
const goToImport = () => {
  router.push('/import')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// SubTask related functions
const getApplicationName = (applicationId: number) => {
  const app = allApplications.value.find(app => app.id === applicationId)
  return app ? (app.app_name || app.application_name) : '-'
}

const getApplicationL2Id = (applicationId: number) => {
  const app = allApplications.value.find(app => app.id === applicationId)
  return app ? (app.l2_id || app.application_id) : '-'
}

const getSubTaskProgressColor = (row: SubTask) => {
  if (row.status === '存在阻塞') return '#f56565'
  if (row.progress_percentage >= 80) return '#48bb78'
  return '#667eea'
}

const resetSubtaskSearch = () => {
  subtaskSearchForm.keyword = ''
  subtaskSearchForm.status = undefined
  subtaskSearchForm.application = undefined
  subtaskCurrentPage.value = 1
}

const handleSubTaskSelectionChange = (selection: SubTask[]) => {
  selectedSubTasks.value = selection
}

const editSubTask = (row: SubTask) => {
  router.push(`/subtasks/${row.application_id}`)
}


const handleSubTaskSizeChange = (size: number) => {
  subtaskPageSize.value = size
  subtaskCurrentPage.value = 1
}

const handleSubTaskCurrentChange = (page: number) => {
  subtaskCurrentPage.value = page
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

.data-tabs {
  margin-bottom: 20px;
}

.data-tabs .el-tabs__header {
  margin-bottom: 0;
}

.block-warning {
  color: #f56565;
  font-size: 12px;
  margin-top: 2px;
}

.completed-date {
  color: #48bb78;
}

.blocked-text {
  color: #f56565;
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

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .applications-view {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    text-align: center;
  }
  
  .header h2 {
    font-size: 20px;
  }
  
  .actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .actions .el-button {
    flex: 1;
    min-width: 80px;
    font-size: 12px;
  }
  
  .search-bar {
    padding: 15px;
  }
  
  .search-bar .el-row {
    gap: 10px;
  }
  
  .search-bar .el-button {
    width: 100%;
    margin-top: 10px;
  }
  
  /* 表格在移动端的处理 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-table__cell {
    padding: 8px 4px;
  }
  
  .el-table .cell {
    line-height: 1.2;
    word-break: break-word;
  }
  
  /* 隐藏一些在移动端不重要的列 */
  .el-table .el-table-column--selection {
    display: none;
  }
  
  .progress-cell {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  
  .progress-text {
    font-size: 10px;
  }
  
  .pagination {
    margin-top: 15px;
  }
  
  .pagination .el-pagination {
    justify-content: center;
  }
  
  .pagination .el-pagination__sizes,
  .pagination .el-pagination__jump {
    display: none;
  }
}

@media (max-width: 480px) {
  .applications-view {
    padding: 5px;
  }
  
  .header h2 {
    font-size: 18px;
  }
  
  .actions .el-button {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .search-bar {
    padding: 10px;
  }
  
  .el-table {
    font-size: 11px;
  }
  
  .el-table .el-table__cell {
    padding: 6px 2px;
  }
  
  /* 进一步简化表格显示 */
  .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .el-button--small {
    font-size: 10px;
    padding: 4px 8px;
  }
}

/* Fix for Element Plus select display issue */
.search-bar .el-select__placeholder.is-transparent {
  opacity: 1 !important;
  color: #c0c4cc !important;
}

.search-bar .el-select__selected-item:not(.el-select__placeholder) {
  opacity: 1 !important;
  color: #606266 !important;
}

/* Upload area styles */
.upload-area {
  width: 100%;
}

.upload-area .el-upload {
  width: 100%;
}

.upload-area .el-upload-dragger {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.el-icon--upload {
  font-size: 67px;
  color: #c0c4cc;
  margin-bottom: 16px;
}
</style>