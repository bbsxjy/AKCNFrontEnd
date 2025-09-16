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

      <!-- Data Table -->
      <el-table
        :data="applications"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="application_id" label="应用ID" min-width="130">
          <template #default="{ row }">
            <strong>{{ row.application_id }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="application_name" label="应用名称" min-width="200" />
        <el-table-column prop="business_domain" label="业务域" min-width="120" />
        <el-table-column prop="status" label="当前状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" min-width="160">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress_percentage || 0"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(row)"
              />
              <span class="progress-text">{{ row.progress_percentage || 0 }}%</span>
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
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
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
          <el-input v-model="createForm.application_id" placeholder="如：L2_APP_001" />
        </el-form-item>
        <el-form-item label="应用名称" required>
          <el-input v-model="createForm.application_name" />
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
        <el-form-item label="业务域" required>
          <el-input v-model="editForm.business_domain" />
        </el-form-item>
        <el-form-item label="业务子域">
          <el-input v-model="editForm.business_subdomain" />
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
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="loading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Import Dialog -->
    <el-dialog v-model="showImportDialog" title="批量导入" width="700px" :close-on-click-modal="false">
      <el-steps :active="importStep" align-center style="margin-bottom: 30px">
        <el-step title="选择文件" />
        <el-step title="验证数据" />
        <el-step title="导入中" />
        <el-step title="完成" />
      </el-steps>

      <!-- Step 1: File Upload -->
      <div v-if="importStep === 0">
        <el-upload
          class="upload-area"
          drag
          :action="'#'"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept=".xlsx,.xls"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将Excel文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              <p>只能上传 Excel 文件（.xlsx, .xls），且大小不超过 10MB</p>
              <p>
                <el-button type="text" size="small" @click.stop="downloadTemplate">
                  下载导入模板
                </el-button>
              </p>
            </div>
          </template>
        </el-upload>

        <el-form style="margin-top: 20px">
          <el-form-item label="导入选项">
            <el-checkbox v-model="importOptions.update_existing">
              更新已存在的记录
            </el-checkbox>
            <el-checkbox v-model="importOptions.validate_only" style="margin-left: 20px">
              仅验证数据（不实际导入）
            </el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 2: Validation Results -->
      <div v-if="importStep === 1">
        <el-alert
          v-if="validationResult.errors.length === 0"
          title="数据验证通过"
          type="success"
          :closable="false"
          show-icon
        >
          <p>文件包含 {{ validationResult.total }} 条记录，全部验证通过</p>
        </el-alert>
        <el-alert
          v-else
          title="发现数据问题"
          type="warning"
          :closable="false"
          show-icon
        >
          <p>文件包含 {{ validationResult.total }} 条记录，其中 {{ validationResult.errors.length }} 条存在问题</p>
        </el-alert>

        <div v-if="validationResult.errors.length > 0" style="margin-top: 20px">
          <h4>错误详情：</h4>
          <el-table :data="validationResult.errors" max-height="300">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="error" label="错误描述" />
            <el-table-column prop="value" label="错误值" width="150" />
          </el-table>
        </div>
      </div>

      <!-- Step 3: Import Progress -->
      <div v-if="importStep === 2">
        <el-progress :percentage="importProgress" :status="importProgressStatus" />
        <p style="text-align: center; margin-top: 20px">{{ importProgressText }}</p>
      </div>

      <!-- Step 4: Import Results -->
      <div v-if="importStep === 3">
        <el-result
          :icon="importResult.status === 'success' ? 'success' : 'warning'"
          :title="importResult.status === 'success' ? '导入成功' : '导入完成（部分失败）'"
        >
          <template #sub-title>
            <div style="margin-top: 10px">
              <p>成功导入: {{ importResult.imported }} 条</p>
              <p>更新记录: {{ importResult.updated }} 条</p>
              <p>跳过记录: {{ importResult.skipped }} 条</p>
              <p v-if="importResult.failed > 0" style="color: #f56c6c">失败记录: {{ importResult.failed }} 条</p>
            </div>
          </template>
          <template #extra v-if="importResult.errors.length > 0">
            <el-button type="text" @click="showImportErrors = !showImportErrors">
              {{ showImportErrors ? '隐藏' : '查看' }}错误详情
            </el-button>
            <el-collapse-transition>
              <div v-show="showImportErrors" style="margin-top: 20px">
                <el-table :data="importResult.errors" max-height="200">
                  <el-table-column prop="row" label="行号" width="80" />
                  <el-table-column prop="error" label="错误描述" />
                </el-table>
              </div>
            </el-collapse-transition>
          </template>
        </el-result>
      </div>

      <template #footer>
        <el-button v-if="importStep === 0" @click="closeImportDialog">取消</el-button>
        <el-button v-if="importStep === 0" type="primary" @click="validateImport" :disabled="!importFile" :loading="loading">
          下一步：验证数据
        </el-button>

        <el-button v-if="importStep === 1" @click="importStep = 0">上一步</el-button>
        <el-button v-if="importStep === 1 && validationResult.errors.length > 0" @click="closeImportDialog">取消</el-button>
        <el-button v-if="importStep === 1" type="primary" @click="handleImport" :loading="loading"
          :disabled="importOptions.validate_only">
          {{ validationResult.errors.length > 0 ? '忽略错误并导入' : '开始导入' }}
        </el-button>

        <el-button v-if="importStep === 3" type="primary" @click="closeImportDialog">
          完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApplicationsAPI, type Application, type CreateApplicationRequest } from '@/api/applications'
import { ExcelAPI } from '@/api/reports'

const router = useRouter()

const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const showEditDialog = ref(false)
const selectedApplications = ref<Application[]>([])
const importFile = ref<File | null>(null)
const editingId = ref<number | null>(null)

// Import related states
const importStep = ref(0)
const importOptions = reactive({
  update_existing: true,
  validate_only: false
})
const validationResult = reactive({
  total: 0,
  errors: [] as Array<{row: number, field: string, error: string, value: any}>
})
const importProgress = ref(0)
const importProgressStatus = ref<'success' | 'exception' | 'warning' | ''>()
const importProgressText = ref('准备导入...')
const importResult = reactive({
  status: 'success' as 'success' | 'warning' | 'error',
  imported: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  errors: [] as Array<{row: number, error: string}>
})
const showImportErrors = ref(false)

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
  business_domain: '',
  business_subdomain: '',
  responsible_person: '',
  responsible_team: '',
  status: 'active',
  priority: 'medium',
  kpi_classification: 'P1',
  service_tier: 'Tier 1',
  traffic: 0,
  size: 'medium',
  public_cloud_vendor: 'AWS',
  supervision_year: 2025,
  transformation_target: 'AK'
})

const editForm = reactive({
  application_id: '',
  application_name: '',
  business_domain: '',
  business_subdomain: '',
  responsible_person: '',
  responsible_team: '',
  status: 'active',
  priority: 'medium',
  kpi_classification: 'P1',
  service_tier: 'Tier 1',
  traffic: 0,
  size: 'medium',
  public_cloud_vendor: 'AWS'
})

// 前端筛选后的数据
const filteredApplications = computed(() => {
  let result = [...allApplications.value]

  // 关键词搜索（使用防抖后的值）
  if (debouncedKeyword.value) {
    const keyword = debouncedKeyword.value.toLowerCase()
    result = result.filter(app =>
      app.application_id.toLowerCase().includes(keyword) ||
      app.application_name.toLowerCase().includes(keyword)
    )
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

// Initialize data
onMounted(() => {
  loadApplications()
})

// 监听筛选条件变化，重置页码
const watchSearchForm = () => {
  currentPage.value = 1
}

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
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
    application_id: row.application_id,
    application_name: row.application_name,
    business_domain: row.business_domain,
    business_subdomain: row.business_subdomain,
    responsible_person: row.responsible_person,
    responsible_team: row.responsible_team,
    status: row.status,
    priority: row.priority || 'medium',
    kpi_classification: row.kpi_classification || 'P1',
    service_tier: row.service_tier || 'Tier 1',
    traffic: row.traffic || 0,
    size: row.size || 'medium',
    public_cloud_vendor: row.public_cloud_vendor || 'AWS'
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
      business_domain: '',
      business_subdomain: '',
      responsible_person: '',
      responsible_team: '',
      status: 'active',
      priority: 'medium',
      kpi_classification: 'P1',
      service_tier: 'Tier 1',
      traffic: 0,
      size: 'medium',
      public_cloud_vendor: 'AWS'
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

const handleFileChange = (file: any) => {
  const fileSize = file.size / 1024 / 1024 // Convert to MB
  if (fileSize > 10) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }

  const fileType = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(fileType || '')) {
    ElMessage.error('只支持 Excel 文件格式（.xlsx, .xls）')
    return false
  }

  importFile.value = file.raw
  return true
}

const handleFileRemove = () => {
  importFile.value = null
}

const downloadTemplate = async () => {
  try {
    await ExcelAPI.downloadTemplate('applications')
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('Failed to download template:', error)
    ElMessage.error('模板下载失败，请稍后重试')
  }
}

const validateImport = async () => {
  if (!importFile.value) {
    ElMessage.error('请选择要导入的文件')
    return
  }

  try {
    loading.value = true

    // First, validate the file
    const params = {
      file: importFile.value,
      update_existing: importOptions.update_existing,
      validate_only: true // Always validate first
    }

    const response = await ExcelAPI.importApplications(params)

    // Parse validation results
    validationResult.total = (response.imported || 0) + (response.updated || 0) + (response.skipped || 0)
    validationResult.errors = response.errors?.map((e: any) => ({
      row: e.row,
      field: e.field || '未知字段',
      error: e.error,
      value: e.data?.invalid_value || ''
    })) || []

    importStep.value = 1

    if (validationResult.errors.length === 0) {
      ElMessage.success('数据验证通过')
    } else {
      ElMessage.warning(`发现 ${validationResult.errors.length} 个数据问题`)
    }
  } catch (error: any) {
    console.error('Failed to validate import:', error)
    ElMessage.error(error.response?.data?.detail || '验证失败，请检查文件格式')
  } finally {
    loading.value = false
  }
}

const closeImportDialog = () => {
  showImportDialog.value = false
  // Reset all states
  importStep.value = 0
  importFile.value = null
  importOptions.update_existing = true
  importOptions.validate_only = false
  validationResult.total = 0
  validationResult.errors = []
  importProgress.value = 0
  importProgressStatus.value = ''
  importProgressText.value = '准备导入...'
  importResult.status = 'success'
  importResult.imported = 0
  importResult.updated = 0
  importResult.skipped = 0
  importResult.failed = 0
  importResult.errors = []
  showImportErrors.value = false
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.error('请选择要导入的文件')
    return
  }

  try {
    loading.value = true
    importStep.value = 2
    importProgress.value = 0
    importProgressStatus.value = ''
    importProgressText.value = '正在上传文件...'

    // Simulate progress for better UX
    const progressTimer = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += Math.random() * 10
        if (importProgress.value < 30) {
          importProgressText.value = '正在上传文件...'
        } else if (importProgress.value < 60) {
          importProgressText.value = '正在解析数据...'
        } else {
          importProgressText.value = '正在导入数据...'
        }
      }
    }, 500)

    const params = {
      file: importFile.value,
      update_existing: importOptions.update_existing,
      validate_only: false
    }

    const response = await ExcelAPI.importApplications(params)

    clearInterval(progressTimer)
    importProgress.value = 100
    importProgressStatus.value = 'success'
    importProgressText.value = '导入完成！'

    // Parse import results
    importResult.status = response.status === 'success' ? 'success' : 'warning'
    importResult.imported = response.imported || 0
    importResult.updated = response.updated || 0
    importResult.skipped = response.skipped || 0
    importResult.failed = response.errors?.length || 0
    importResult.errors = response.errors?.map((e: any) => ({
      row: e.row,
      error: e.error
    })) || []

    // Wait a moment to show 100% progress
    await new Promise(resolve => setTimeout(resolve, 500))

    importStep.value = 3

    if (response.status === 'success' && importResult.failed === 0) {
      ElMessage.success(`成功导入 ${response.imported} 条，更新 ${response.updated} 条`)
    } else if (importResult.failed > 0) {
      ElMessage.warning(`导入完成，但有 ${importResult.failed} 条记录失败`)
    }

    // Reload applications data after successful import
    if (importResult.imported > 0 || importResult.updated > 0) {
      await loadApplications()
    }
  } catch (error: any) {
    console.error('Failed to import:', error)

    // Handle specific error cases
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '文件格式错误，请检查文件内容')
    } else if (error.response?.status === 413) {
      ElMessage.error('文件太大，请确保文件不超过 10MB')
    } else if (error.response?.status === 422) {
      ElMessage.error('数据验证失败，请检查数据格式')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      ElMessage.error('无法连接到服务器，请检查后端服务是否已启动')
    } else {
      ElMessage.error(error.response?.data?.detail || error.message || '导入失败，请检查文件格式')
    }

    // Reset to file selection step on error
    importStep.value = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
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