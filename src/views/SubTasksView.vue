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
            <el-button type="primary">
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
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">子任务总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value success">{{ statistics.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value primary">{{ statistics.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value danger">{{ statistics.blocked }}</div>
            <div class="stat-label">阻塞中</div>
          </div>
        </el-col>
      </el-row>

      <!-- SubTasks Table -->
      <el-table :data="subTasks" style="width: 100%">
        <el-table-column prop="module_name" label="模块名称" width="150">
          <template #default="{ row }">
            <strong>{{ row.module_name }}</strong>
            <div v-if="row.is_blocked" class="block-warning">⚠️ 阻塞</div>
          </template>
        </el-table-column>
        <el-table-column prop="sub_target" label="子目标" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.sub_target === '云原生' ? 'primary' : 'warning'">
              {{ row.sub_target }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version_name" label="版本" width="80" />
        <el-table-column prop="task_status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.task_status)" size="small">
              {{ row.task_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress_percentage"
              :stroke-width="6"
              :color="getProgressColor(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="planned_dates" label="计划完成" width="120">
          <template #default="{ row }">
            {{ row.planned_dates?.release_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_dates" label="实际完成" width="120">
          <template #default="{ row }">
            <span v-if="row.actual_dates?.release_date" class="completed-date">
              {{ row.actual_dates.release_date }} ✓
            </span>
            <span v-else-if="row.task_status === '阻塞中'" class="blocked-text">延期中</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
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
        <el-button>批量更新状态</el-button>
        <el-button>批量修改日期</el-button>
        <el-button type="warning">导出子任务</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { SubTask } from '@/types'

const router = useRouter()
const route = useRoute()

const applicationName = ref('用户管理系统')
const l2Id = ref('L2_APP_001')
const responsiblePerson = ref('李四')

const statistics = reactive({
  total: 5,
  completed: 2,
  inProgress: 2,
  blocked: 1
})

const subTasks = ref<SubTask[]>([
  {
    id: 101,
    application_id: 1,
    module_name: '用户认证模块',
    sub_target: '云原生',
    version_name: 'v1.0',
    task_status: '已完成',
    progress_percentage: 100,
    is_blocked: false,
    block_reason: null,
    planned_dates: {
      requirement_date: '2025-01-05',
      release_date: '2025-01-10',
      tech_online_date: null,
      biz_online_date: null
    },
    actual_dates: {
      requirement_date: '2025-01-05',
      release_date: '2025-01-08',
      tech_online_date: null,
      biz_online_date: null
    },
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-08T15:30:00Z'
  },
  {
    id: 102,
    application_id: 1,
    module_name: '数据库迁移',
    sub_target: '云原生',
    version_name: 'v1.0',
    task_status: '阻塞中',
    progress_percentage: 30,
    is_blocked: true,
    block_reason: '数据库权限配置问题',
    planned_dates: {
      requirement_date: '2025-01-10',
      release_date: '2025-01-15',
      tech_online_date: null,
      biz_online_date: null
    },
    actual_dates: {
      requirement_date: null,
      release_date: null,
      tech_online_date: null,
      biz_online_date: null
    },
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-12T09:20:00Z'
  },
  {
    id: 103,
    application_id: 1,
    module_name: 'API接口改造',
    sub_target: '云原生',
    version_name: 'v2.0',
    task_status: '研发进行中',
    progress_percentage: 60,
    is_blocked: false,
    block_reason: null,
    planned_dates: {
      requirement_date: '2025-01-20',
      release_date: '2025-02-01',
      tech_online_date: null,
      biz_online_date: null
    },
    actual_dates: {
      requirement_date: null,
      release_date: null,
      tech_online_date: null,
      biz_online_date: null
    },
    created_at: '2025-01-10T14:00:00Z',
    updated_at: '2025-01-15T11:10:00Z'
  }
])

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': '',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '阻塞中': 'danger'
  }
  return statusMap[status] || ''
}

const getProgressColor = (row: SubTask) => {
  if (row.is_blocked) return '#f56565'
  if (row.progress_percentage >= 80) return '#48bb78'
  return '#667eea'
}

const goBack = () => {
  router.push('/applications')
}

const resolveBlock = (row: SubTask) => {
  ElMessage.info(`解决阻塞：${row.module_name}`)
}

const updateProgress = (row: SubTask) => {
  ElMessage.info(`更新进度：${row.module_name}`)
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
</style>