<template>
  <div class="announcements-management">
    <el-card>
      <template #header>
        <div class="header">
          <h2>公告管理</h2>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><plus /></el-icon>
            发布公告
          </el-button>
        </div>
      </template>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width: 150px"
          @change="loadAnnouncements"
        >
          <el-option label="全部状态" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="已归档" value="archived" />
        </el-select>

        <el-select
          v-model="filterPriority"
          placeholder="优先级"
          clearable
          style="width: 150px"
          @change="loadAnnouncements"
        >
          <el-option label="全部优先级" value="" />
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="紧急" value="urgent" />
        </el-select>

        <el-button @click="resetFilters">重置</el-button>
      </div>

      <!-- Announcements List -->
      <el-table
        :data="announcements"
        v-loading="loading"
        stripe
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column width="60">
          <template #default="{ row }">
            <el-icon v-if="row.is_pinned" color="#f39c12" size="20">
              <star-filled />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by_name" label="发布人" width="120" />
        <el-table-column label="发布日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.publish_date || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="过期日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.expire_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="showDetailDialog(row)"
            >
              查看
            </el-button>
            <el-button
              type="warning"
              size="small"
              link
              @click="showEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              :type="row.is_pinned ? 'info' : 'success'"
              size="small"
              link
              @click="togglePin(row)"
            >
              {{ row.is_pinned ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: center"
        @size-change="loadAnnouncements"
        @current-change="loadAnnouncements"
      />
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '发布公告' : '编辑公告'"
      width="700px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="选择优先级" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="置顶">
          <el-switch v-model="formData.is_pinned" />
        </el-form-item>

        <el-form-item label="发布日期">
          <el-date-picker
            v-model="formData.publish_date"
            type="datetime"
            placeholder="选择发布日期"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="过期日期">
          <el-date-picker
            v-model="formData.expire_date"
            type="datetime"
            placeholder="选择过期日期"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogMode === 'create' ? '发布' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="公告详情"
      width="700px"
    >
      <div v-if="selectedAnnouncement" class="announcement-detail">
        <div class="detail-header">
          <h2>{{ selectedAnnouncement.title }}</h2>
          <div class="detail-meta">
            <el-tag :type="getPriorityTagType(selectedAnnouncement.priority)">
              {{ getPriorityText(selectedAnnouncement.priority) }}
            </el-tag>
            <el-tag :type="getStatusTagType(selectedAnnouncement.status)">
              {{ getStatusText(selectedAnnouncement.status) }}
            </el-tag>
            <el-tag v-if="selectedAnnouncement.is_pinned" type="warning">
              <el-icon><star-filled /></el-icon> 置顶
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="detail-content">
          <p>{{ selectedAnnouncement.content }}</p>
        </div>

        <el-divider />

        <div class="detail-footer">
          <div class="footer-item">
            <span class="label">发布人：</span>
            <span>{{ selectedAnnouncement.created_by_name }}</span>
          </div>
          <div class="footer-item">
            <span class="label">发布时间：</span>
            <span>{{ formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at) }}</span>
          </div>
          <div class="footer-item" v-if="selectedAnnouncement.expire_date">
            <span class="label">过期时间：</span>
            <span>{{ formatDate(selectedAnnouncement.expire_date) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, StarFilled } from '@element-plus/icons-vue'
import { AnnouncementsAPI, type Announcement, type CreateAnnouncementRequest } from '@/api/announcements'

// Data
const announcements = ref<Announcement[]>([])
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Filters
const filterStatus = ref('')
const filterPriority = ref('')

// Dialog
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const formData = ref<CreateAnnouncementRequest & { id?: number }>({
  title: '',
  content: '',
  priority: 'medium',
  status: 'published',
  is_pinned: false,
  publish_date: undefined,
  expire_date: undefined
})

// Detail Dialog
const detailDialogVisible = ref(false)
const selectedAnnouncement = ref<Announcement | null>(null)

// Form validation rules
const formRules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// Methods
const loadAnnouncements = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      status: filterStatus.value || undefined,
      priority: filterPriority.value || undefined
    }

    console.log('Loading announcements with params:', params)
    const response = await AnnouncementsAPI.getAnnouncements(params)
    console.log('Announcements loaded:', response)

    // 兼容多种响应格式
    if (Array.isArray(response)) {
      // 直接返回数组: [...]
      announcements.value = response
      total.value = response.length
    } else if (response && response.items) {
      // 标准分页格式: { items: [...], total: 10 }
      announcements.value = response.items
      total.value = response.total || 0
    } else if (response && response.data) {
      // 包装格式: { data: { items: [...], total: 10 } }
      if (Array.isArray(response.data)) {
        announcements.value = response.data
        total.value = response.data.length
      } else {
        announcements.value = response.data.items || []
        total.value = response.data.total || 0
      }
    } else {
      announcements.value = []
      total.value = 0
    }

    console.log(`Loaded ${announcements.value.length} announcements, total: ${total.value}`)
  } catch (error: any) {
    console.error('Failed to load announcements:', error)

    // 清空数据
    announcements.value = []
    total.value = 0

    // 更详细的错误提示
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      ElMessage.warning('无法连接到服务器，公告功能需要后端API支持')
    } else if (error.response?.status === 404) {
      ElMessage.warning('后端公告API尚未实现 (/api/v1/announcements)')
    } else if (error.response?.status !== 401) {
      // 401错误不提示，因为可能是正常的未登录状态
      ElMessage.error(`加载公告失败: ${error.response?.data?.detail || error.message}`)
    }
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filterStatus.value = ''
  filterPriority.value = ''
  currentPage.value = 1
  loadAnnouncements()
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  formData.value = {
    title: '',
    content: '',
    priority: 'medium',
    status: 'published',
    is_pinned: false,
    publish_date: undefined,
    expire_date: undefined
  }
  dialogVisible.value = true
}

const showEditDialog = (announcement: Announcement) => {
  dialogMode.value = 'edit'
  formData.value = {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    status: announcement.status,
    is_pinned: announcement.is_pinned,
    publish_date: announcement.publish_date,
    expire_date: announcement.expire_date
  }
  dialogVisible.value = true
}

const showDetailDialog = (announcement: Announcement) => {
  selectedAnnouncement.value = announcement
  detailDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) {
    console.error('Form ref is not available')
    return
  }

  try {
    const isValid = await formRef.value.validate()
    if (!isValid) {
      ElMessage.warning('请填写所有必填项')
      return
    }
  } catch (error) {
    console.error('Form validation error:', error)
    ElMessage.warning('表单验证失败，请检查输入')
    return
  }

  try {
    submitting.value = true
    console.log('Submitting announcement:', formData.value)

    let result
    if (dialogMode.value === 'create') {
      result = await AnnouncementsAPI.createAnnouncement(formData.value)
      console.log('Create announcement result:', result)
      ElMessage.success('公告发布成功')
    } else {
      const { id, ...updateData } = formData.value
      if (id) {
        result = await AnnouncementsAPI.updateAnnouncement(id, updateData)
        console.log('Update announcement result:', result)
        ElMessage.success('公告更新成功')
      }
    }

    dialogVisible.value = false
    await loadAnnouncements()
  } catch (error: any) {
    console.error('Failed to save announcement:', error)

    // 更详细的错误提示
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      ElMessage.error('网络错误：无法连接到服务器，请检查后端服务是否启动')
    } else if (error.response?.status === 404) {
      ElMessage.error('API未实现：后端尚未实现公告管理接口')
    } else if (error.response?.status === 401) {
      ElMessage.error('认证失败：请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足：您没有权限执行此操作')
    } else if (error.response?.status === 422) {
      // 验证错误
      const detail = error.response?.data?.detail
      if (Array.isArray(detail)) {
        // FastAPI 验证错误格式
        const errors = detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join('; ')
        ElMessage.error(`验证失败: ${errors}`)
      } else {
        ElMessage.error(`验证失败: ${detail || '请检查输入数据'}`)
      }
    } else {
      const errorMsg = error.response?.data?.detail || error.message || '操作失败'
      ElMessage.error(`操作失败: ${errorMsg}`)
    }
  } finally {
    submitting.value = false
  }
}

const togglePin = async (announcement: Announcement) => {
  try {
    await AnnouncementsAPI.togglePin(announcement.id, !announcement.is_pinned)
    ElMessage.success(announcement.is_pinned ? '已取消置顶' : '已置顶')
    loadAnnouncements()
  } catch (error: any) {
    console.error('Failed to toggle pin:', error)
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (announcement: Announcement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除公告 "${announcement.title}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await AnnouncementsAPI.deleteAnnouncement(announcement.id)
    ElMessage.success('公告删除成功')
    loadAnnouncements()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('Failed to delete announcement:', error)
    ElMessage.error(error.response?.data?.detail || '删除失败')
  }
}

const getPriorityTagType = (priority: string) => {
  const priorityTypeMap: Record<string, string> = {
    low: 'info',
    medium: 'success',
    high: 'warning',
    urgent: 'danger'
  }
  return priorityTypeMap[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const priorityTextMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return priorityTextMap[priority] || priority
}

const getStatusTagType = (status: string) => {
  const statusTypeMap: Record<string, string> = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  }
  return statusTypeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusTextMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusTextMap[status] || status
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped lang="scss">
.announcements-management {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .filter-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.announcement-detail {
  .detail-header {
    h2 {
      margin: 0 0 10px 0;
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
    }

    .detail-meta {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .detail-content {
    padding: 20px 0;
    line-height: 1.8;
    font-size: 15px;
    color: #4a5568;
    white-space: pre-wrap;
  }

  .detail-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #718096;
    font-size: 14px;

    .footer-item {
      display: flex;
      gap: 8px;

      .label {
        font-weight: 600;
        color: #4a5568;
      }
    }
  }
}
</style>
