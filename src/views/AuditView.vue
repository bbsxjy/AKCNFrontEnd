<template>
  <div class="audit-view">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h2>审计日志</h2>
          </div>
          <div class="actions">
            <el-dropdown split-button type="primary" @click="exportLogs('excel')">
              导出Excel
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="exportLogs('csv')">导出CSV</el-dropdown-item>
                  <el-dropdown-item @click="exportLogs('json')">导出JSON</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- Search Filters -->
      <div class="search-bar">
        <el-form :model="filters" inline>
          <el-form-item>
            <el-select
              v-model="filters.table_name"
              placeholder="全部表"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in tableOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="filters.operation"
              placeholder="全部操作"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in operationOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="filters.user" placeholder="操作人" style="width: 150px" />
          </el-form-item>
          <el-form-item>
            <el-date-picker v-model="filters.start_date" type="date" placeholder="开始日期" />
          </el-form-item>
          <el-form-item>
            <el-date-picker v-model="filters.end_date" type="date" placeholder="结束日期" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchLogs" :loading="loading">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Statistics -->
      <el-alert
        :closable="false"
        type="success"
        class="stats-alert"
      >
        <template #title>
          📊 日志统计：
          共 <strong>{{ totalLogs }}</strong> 条记录 | 
          今日操作 <strong>{{ todayOperations }}</strong> 次 | 
          最近操作：<strong>{{ lastOperationTime }}</strong>
        </template>
      </el-alert>

      <!-- Audit Logs List -->
      <div class="logs-container" v-loading="loading">
        <el-empty v-if="!loading && auditLogs.length === 0" description="暂无审计日志数据" />
        <div
          v-for="log in auditLogs"
          :key="log.id"
          class="audit-item"
        >
          <div :class="['audit-icon', log.operation.toLowerCase()]">
            {{ getOperationIcon(log.operation) }}
          </div>
          <div class="audit-content">
            <div class="audit-header">
              <div>
                <strong>{{ log.user?.full_name || log.user_full_name || '未知用户' }}</strong> {{ getOperationText(log.operation) }} <strong>{{ getTableText(log.table_name) }}</strong>
                <span class="time">{{ formatTime(log.created_at) }}</span>
              </div>
              <el-button size="small" @click="viewDetails(log)">查看详情</el-button>
            </div>
            <div class="audit-meta">
              表：{{ log.table_name }} | 记录ID：{{ log.record_id }} | IP：{{ log.user_ip }}
            </div>
            <div v-if="log.operation === 'UPDATE'" class="diff-view">
              <div class="diff-old">
                <strong>修改前：</strong><br>
                <div v-for="field in log.changed_fields" :key="`old_${field}`">
                  {{ field }}：{{ log.old_values?.[field] || '-' }}
                </div>
              </div>
              <div class="diff-new">
                <strong>修改后：</strong><br>
                <div v-for="field in log.changed_fields" :key="`new_${field}`">
                  {{ field }}：{{ log.new_values[field] }}
                </div>
              </div>
            </div>
            <div v-if="log.operation === 'UPDATE'" class="rollback-section">
              <el-button size="small" type="warning" @click="rollback(log)">
                ↶ 回滚到此版本
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, jumper, total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="审计日志详情"
      width="800px"
    >
      <div v-if="selectedLog" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatTime(selectedLog.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedLog.user?.full_name || selectedLog.user_full_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作IP">{{ selectedLog.user_ip }}</el-descriptions-item>
          <el-descriptions-item label="表名">{{ selectedLog.table_name }}</el-descriptions-item>
          <el-descriptions-item label="记录ID">{{ selectedLog.record_id }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="selectedLog.operation === 'DELETE' ? 'danger' : selectedLog.operation === 'INSERT' ? 'success' : 'primary'">
              {{ getOperationText(selectedLog.operation) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求ID">{{ selectedLog.request_id || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedLog.operation === 'UPDATE'" class="detail-changes">
          <h4>变更详情</h4>
          <el-table :data="getChangedFieldsData(selectedLog)" border>
            <el-table-column prop="field" label="字段名" width="200" />
            <el-table-column prop="oldValue" label="修改前">
              <template #default="scope">
                <span class="old-value">{{ scope.row.oldValue || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="newValue" label="修改后">
              <template #default="scope">
                <span class="new-value">{{ scope.row.newValue || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else-if="selectedLog.operation === 'INSERT'" class="detail-values">
          <h4>创建的数据</h4>
          <el-table :data="getNewValuesData(selectedLog)" border>
            <el-table-column prop="field" label="字段名" width="200" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </div>

        <div v-else-if="selectedLog.operation === 'DELETE'" class="detail-values">
          <h4>删除的数据</h4>
          <el-table :data="getOldValuesData(selectedLog)" border>
            <el-table-column prop="field" label="字段名" width="200" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="selectedLog?.operation === 'UPDATE'"
          type="warning"
          @click="rollback(selectedLog)"
        >
          回滚此操作
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { AuditLog } from '@/types'
import { AuditAPI } from '@/api/audit'
import { formatDate } from '@/utils'

const filters = reactive({
  table_name: undefined as string | undefined,
  operation: undefined as 'INSERT' | 'UPDATE' | 'DELETE' | undefined,
  user: '',
  user_id: undefined as number | undefined,
  start_date: null as Date | null,
  end_date: null as Date | null
})

const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedLog = ref<AuditLog | null>(null)

// 下拉选项
const tableOptions = [
  { label: '应用表', value: 'applications' },
  { label: '子任务表', value: 'sub_tasks' }
]

const operationOptions = [
  { label: '新增', value: 'INSERT' },
  { label: '更新', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' }
]

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const totalLogs = ref(0)
const todayOperations = ref(0)
const lastOperationTime = ref('暂无')

const auditLogs = ref<AuditLog[]>([])

// Load audit logs from API
const loadAuditLogs = async () => {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      table_name: filters.table_name,
      operation: filters.operation,
      user_name: filters.user || undefined,  // Use user name for search
      start_date: filters.start_date ? formatDate(filters.start_date, 'YYYY-MM-DD') : undefined,
      end_date: filters.end_date ? formatDate(filters.end_date, 'YYYY-MM-DD') : undefined
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    console.log('🔍 Audit API Request params:', params)
    const response = await AuditAPI.getAuditLogs(params)
    console.log('📊 Audit API Response:', response)
    console.log('📝 Items count:', response?.items?.length || 0)

    auditLogs.value = response.items.map(item => ({
      ...item,
      user: {
        id: item.user_id,
        sso_user_id: '',
        username: '',
        full_name: item.user_full_name,
        email: '',
        department: '',
        role: 'viewer',
        permissions: []
      }
    }))
    pagination.total = response.total
    totalLogs.value = response.total

    console.log('✅ Processed audit logs:', auditLogs.value.length)

    // Calculate today's operations
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = response.items.filter(log =>
      log.created_at.startsWith(today)
    )
    todayOperations.value = todayLogs.length

    // Get last operation time
    if (response.items.length > 0 && response.items[0].created_at) {
      lastOperationTime.value = formatTime(response.items[0].created_at)
    }
  } catch (error: any) {
    console.error('❌ Audit logs API failed:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method
    })

    ElMessage.error(`加载审计日志失败: ${error?.response?.status || error?.message || '未知错误'}`)
    // No fallback - show empty state
    auditLogs.value = []
    pagination.total = 0
    totalLogs.value = 0
    todayOperations.value = 0
  } finally {
    loading.value = false
  }
}

const getOperationIcon = (operation: string) => {
  const iconMap: Record<string, string> = {
    'UPDATE': '✏️',
    'INSERT': '➕',
    'DELETE': '🗑️'
  }
  return iconMap[operation] || '📝'
}

const getOperationText = (operation: string) => {
  const textMap: Record<string, string> = {
    'UPDATE': '更新了',
    'INSERT': '创建了',
    'DELETE': '删除了'
  }
  return textMap[operation] || '操作了'
}

const getTableText = (tableName: string) => {
  const tableMap: Record<string, string> = {
    'applications': '应用',
    'sub_tasks': '子任务'
  }
  return tableMap[tableName] || tableName
}

const formatTime = (timeString: string) => {
  const now = new Date()
  const time = new Date(timeString)
  const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)}小时前`
  } else {
    return time.toLocaleString('zh-CN')
  }
}

// Helper functions for detail dialog
const getChangedFieldsData = (log: AuditLog) => {
  return log.changed_fields.map(field => ({
    field,
    oldValue: log.old_values?.[field],
    newValue: log.new_values?.[field]
  }))
}

const getNewValuesData = (log: AuditLog) => {
  return Object.entries(log.new_values || {}).map(([field, value]) => ({
    field,
    value: value?.toString() || '-'
  }))
}

const getOldValuesData = (log: AuditLog) => {
  return Object.entries(log.old_values || {}).map(([field, value]) => ({
    field,
    value: value?.toString() || '-'
  }))
}

const searchLogs = () => {
  pagination.page = 1
  loadAuditLogs()
}

const resetFilters = () => {
  filters.table_name = undefined
  filters.operation = undefined
  filters.user = ''
  filters.user_id = undefined
  filters.start_date = null
  filters.end_date = null
  pagination.page = 1
  loadAuditLogs()
}

const viewDetails = (log: AuditLog) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

const rollback = async (log: AuditLog) => {
  try {
    const result = await ElMessageBox.prompt(
      `确定要将 ${getTableText(log.table_name)} (ID: ${log.record_id}) 回滚到此操作之前的状态吗？\n请输入回滚原因（可选）：`,
      '确认回滚',
      {
        confirmButtonText: '确定回滚',
        cancelButtonText: '取消',
        type: 'warning',
        inputPlaceholder: '输入回滚原因...'
      }
    )

    const loadingInstance = ElLoading.service({
      text: '正在执行回滚...'
    })

    try {
      const response = await AuditAPI.rollbackAuditLog(log.id, {
        confirm: true,
        reason: result.value && result.value.trim() ? result.value : undefined
      })

      ElMessage.success(`回滚成功：${response.message}`)
      // Reload audit logs to show the new rollback entry
      await loadAuditLogs()
    } finally {
      loadingInstance.close()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Rollback failed:', error)
      if (error?.response?.status === 403) {
        ElMessage.error('权限不足：仅管理员和经理可以执行回滚操作')
      } else if (error?.response?.data?.detail) {
        const detail = error.response.data.detail
        ElMessage.error(`回滚失败：${detail}`)
      } else {
        ElMessage.error('回滚操作失败，请稍后重试')
      }
    }
  }
}

const exportLogs = async (format: 'excel' | 'csv' | 'json' = 'excel') => {
  const loadingInstance = ElLoading.service({
    text: '正在导出日志...'
  })

  try {
    const params: any = {
      format,
      table_name: filters.table_name,
      operation: filters.operation,
      start_date: filters.start_date ? formatDate(filters.start_date, 'YYYY-MM-DD') : undefined,
      end_date: filters.end_date ? formatDate(filters.end_date, 'YYYY-MM-DD') : undefined
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await AuditAPI.exportAuditLogs(params)

    if (format === 'json') {
      // For JSON, response is structured data
      const jsonData = JSON.stringify(response, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      ElMessage.success('成功导出审计日志（JSON格式）')
    } else {
      // For CSV and Excel, response is a blob
      const blob = response as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      ElMessage.success(`成功导出审计日志（${format.toUpperCase()}格式）`)
    }
  } catch (error: any) {
    console.error('Export failed:', error)
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail
      ElMessage.error(`导出失败：${detail}`)
    } else {
      ElMessage.error('导出审计日志失败')
    }
  } finally {
    loadingInstance.close()
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadAuditLogs()
}

// Initialize on component mount
onMounted(() => {
  loadAuditLogs()
})
</script>

<style scoped>
.audit-view {
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

.unlimited-notice {
  color: #48bb78;
  font-size: 14px;
  font-weight: 600;
}

.search-bar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-alert {
  margin-bottom: 20px;
}

.logs-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.audit-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.audit-item:last-child {
  border-bottom: none;
}

.audit-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.audit-icon.update {
  background: #bee3f8;
  color: #2c5282;
}

.audit-icon.insert {
  background: #c6f6d5;
  color: #22543d;
}

.audit-icon.delete {
  background: #fed7d7;
  color: #742a2a;
}

.audit-content {
  flex: 1;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time {
  color: #718096;
  margin-left: 10px;
  font-size: 14px;
}

.audit-meta {
  color: #718096;
  font-size: 14px;
  margin-bottom: 15px;
}

.diff-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.diff-old {
  background: #fff5f5;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #feb2b2;
  font-size: 14px;
}

.diff-new {
  background: #f0fff4;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #9ae6b4;
  font-size: 14px;
}

.rollback-section {
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
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

/* Detail dialog styles */
.detail-content {
  padding: 10px;
}

.detail-changes,
.detail-values {
  margin-top: 20px;
}

.detail-changes h4,
.detail-values h4 {
  margin-bottom: 10px;
  color: #2d3748;
}

.old-value {
  color: #e53e3e;
}

.new-value {
  color: #38a169;
}
</style>