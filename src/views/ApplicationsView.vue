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
    <el-dialog v-model="showImportDialog" title="批量导入" width="600px">
      <el-upload
        class="upload-area"
        drag
        :action="'#'"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls,.csv"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将Excel文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 Excel/CSV 文件，且大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :disabled="!importFile" :loading="loading">
          开始导入
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

    const response = await ExcelAPI.exportApplications({
      filters,
      columns
    })

    // Download the file
    if (response.file_url) {
      window.open(response.file_url, '_blank')
      ElMessage.success(`成功导出 ${response.rows_exported} 条应用数据`)
    } else {
      throw new Error('No file URL returned')
    }
  } catch (error) {
    console.error('Failed to export Excel:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

const handleFileChange = (file: any) => {
  importFile.value = file.raw
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.error('请选择要导入的文件')
    return
  }

  try {
    loading.value = true

    const params = {
      file: importFile.value,
      update_existing: true,
      validate_only: false
    }

    const response = await ExcelAPI.importApplications(params)

    if (response.status === 'success') {
      ElMessage.success(`成功导入 ${response.imported} 条，更新 ${response.updated} 条，跳过 ${response.skipped} 条`)

      // Show errors if any
      if (response.errors && response.errors.length > 0) {
        const errorMsg = response.errors.map(e => `第${e.row}行: ${e.error}`).join('\n')
        ElMessage.warning(`导入完成但有错误:\n${errorMsg}`)
      }

      showImportDialog.value = false
      importFile.value = null
      loadApplications()
    } else {
      throw new Error('Import failed')
    }
  } catch (error) {
    console.error('Failed to import:', error)
    ElMessage.error('导入失败，请检查文件格式')
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