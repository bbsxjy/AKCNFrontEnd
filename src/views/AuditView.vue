<template>
  <div class="audit-view">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h2>审计日志</h2>
            <div class="unlimited-notice">
              ✅ 突破Excel 1000条限制，所有操作永久保存
            </div>
          </div>
          <div class="actions">
            <el-button>导出日志</el-button>
          </div>
        </div>
      </template>

      <!-- Search Filters -->
      <div class="search-bar">
        <el-form :model="filters" inline>
          <el-form-item>
            <el-select v-model="filters.table_name" placeholder="全部表" clearable>
              <el-option label="全部表" value="" />
              <el-option label="应用表" value="applications" />
              <el-option label="子任务表" value="sub_tasks" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filters.operation" placeholder="全部操作" clearable>
              <el-option label="全部操作" value="" />
              <el-option label="新增" value="INSERT" />
              <el-option label="更新" value="UPDATE" />
              <el-option label="删除" value="DELETE" />
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
            <el-button type="primary" @click="searchLogs">搜索</el-button>
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
      <div class="logs-container">
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
                <strong>{{ log.user.full_name }}</strong> {{ getOperationText(log.operation) }} <strong>{{ getTableText(log.table_name) }}</strong>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { AuditLog } from '@/types'

const filters = reactive({
  table_name: '',
  operation: '',
  user: '',
  start_date: null as Date | null,
  end_date: null as Date | null
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 15432
})

const totalLogs = ref(15432)
const todayOperations = ref(128)
const lastOperationTime = ref('2分钟前')

const auditLogs = ref<AuditLog[]>([
  {
    id: 10001,
    table_name: 'sub_tasks',
    record_id: 101,
    operation: 'UPDATE',
    old_values: {
      task_status: '待启动',
      progress_percentage: 0
    },
    new_values: {
      task_status: '研发进行中',
      progress_percentage: 30
    },
    changed_fields: ['task_status', 'progress_percentage'],
    user: {
      id: 15,
      sso_user_id: 'SSO_002',
      username: 'lisi',
      full_name: '李四',
      email: 'lisi@company.com',
      department: '研发一部',
      role: 'editor',
      permissions: []
    },
    user_ip: '192.168.1.100',
    created_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 10002,
    table_name: 'applications',
    record_id: 4,
    operation: 'INSERT',
    old_values: null,
    new_values: {
      l2_id: 'L2_APP_004',
      app_name: '财务管理系统',
      transformation_target: '云原生'
    },
    changed_fields: [],
    user: {
      id: 10,
      sso_user_id: 'SSO_001',
      username: 'zhangsan',
      full_name: '张三',
      email: 'zhangsan@company.com',
      department: '研发一部',
      role: 'manager',
      permissions: []
    },
    user_ip: '192.168.1.101',
    created_at: '2025-01-15T10:15:00Z'
  },
  {
    id: 10003,
    table_name: 'sub_tasks',
    record_id: 99,
    operation: 'DELETE',
    old_values: {
      module_name: '测试模块',
      task_status: '待启动'
    },
    new_values: {},
    changed_fields: [],
    user: {
      id: 20,
      sso_user_id: 'SSO_003',
      username: 'wangwu',
      full_name: '王五',
      email: 'wangwu@company.com',
      department: '研发二部',
      role: 'editor',
      permissions: []
    },
    user_ip: '192.168.1.102',
    created_at: '2025-01-15T09:45:00Z'
  }
])

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

const searchLogs = () => {
  ElMessage.success('搜索功能将在连接后端API后生效')
}

const viewDetails = (log: AuditLog) => {
  ElMessage.info(`查看详情：记录ID ${log.id}`)
}

const rollback = (log: AuditLog) => {
  ElMessage.warning(`回滚功能：将记录ID ${log.record_id} 回滚到操作 ${log.id} 之前的状态`)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  // Fetch new data
}
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
</style>