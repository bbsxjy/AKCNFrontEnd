<template>
  <div class="application-data-renderer">
    <!-- Single Application Detail -->
    <div v-if="isSingleApplication" class="application-detail">
      <div class="detail-header">
        <h3>{{ application.app_name || '未命名应用' }}</h3>
        <el-tag :type="getStatusType(application.current_status)" size="large">
          {{ application.current_status || '未知状态' }}
        </el-tag>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">L2 ID</span>
          <span class="value highlight">{{ application.l2_id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">应用编号</span>
          <span class="value">{{ application.id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">验收年份</span>
          <span class="value">{{ application.ak_supervision_acceptance_year }}</span>
        </div>
        <div class="detail-item">
          <span class="label">改造目标</span>
          <span class="value">{{ application.overall_transformation_target }}</span>
        </div>
        <div class="detail-item">
          <span class="label">当前阶段</span>
          <span class="value">{{ application.current_transformation_phase }}</span>
        </div>
        <div class="detail-item">
          <span class="label">应用等级</span>
          <span class="value">Tier {{ application.app_tier }}</span>
        </div>
        <div class="detail-item">
          <span class="label">所属L1系统</span>
          <span class="value">{{ application.belonging_l1_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">所属项目</span>
          <span class="value">{{ application.belonging_projects || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">开发负责人</span>
          <span class="value">{{ application.dev_owner || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">运维负责人</span>
          <span class="value">{{ application.ops_owner || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">运维团队</span>
          <span class="value">{{ application.ops_team || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">验收状态</span>
          <span class="value">{{ application.acceptance_status || '-' }}</span>
        </div>
      </div>

      <!-- Progress Section -->
      <div v-if="hasProgressData" class="progress-section">
        <h4>进度信息</h4>
        <div class="progress-grid">
          <div class="progress-item">
            <span class="label">AK改造完成率</span>
            <el-progress
              :percentage="application.ak_completion_percentage || 0"
              :color="getProgressColor(application.ak_completion_percentage)"
            />
            <span class="status-text">{{ application.ak_status || '-' }}</span>
          </div>
          <div class="progress-item">
            <span class="label">云原生完成率</span>
            <el-progress
              :percentage="application.cloud_native_completion_percentage || 0"
              :color="getProgressColor(application.cloud_native_completion_percentage)"
            />
            <span class="status-text">{{ application.cloud_native_status || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Notes Section -->
      <div v-if="application.notes" class="notes-section">
        <h4>备注</h4>
        <p>{{ application.notes }}</p>
      </div>
    </div>

    <!-- Application List Table -->
    <div v-else-if="isApplicationList" class="application-table">
      <el-table :data="applications" stripe border style="width: 100%">
        <el-table-column prop="l2_id" label="L2 ID" width="130" fixed />
        <el-table-column prop="app_name" label="应用名称" width="200" />
        <el-table-column prop="current_status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.current_status)" size="small">
              {{ row.current_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overall_transformation_target" label="改造目标" width="100" />
        <el-table-column prop="current_transformation_phase" label="当前阶段" width="120" />
        <el-table-column prop="completion_rate" label="完成率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completion_rate || 0"
              :color="getProgressColor(row.completion_rate)"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="dev_owner" label="开发负责人" width="120" />
        <el-table-column prop="ops_owner" label="运维负责人" width="120" />
        <el-table-column prop="ops_team" label="运维团队" width="150" />
        <el-table-column prop="acceptance_status" label="验收状态" width="100" />
      </el-table>
    </div>

    <!-- Raw JSON Fallback -->
    <div v-else class="raw-json">
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: any
}

const props = defineProps<Props>()

// Check if data is a single application
const isSingleApplication = computed(() => {
  const d = props.data
  return d && typeof d === 'object' && !Array.isArray(d) && (d.l2_id || d.app_name)
})

// Check if data is an application list
const isApplicationList = computed(() => {
  return Array.isArray(props.data) && props.data.length > 0 && props.data[0]?.l2_id
})

// Extract single application data
const application = computed(() => {
  if (isSingleApplication.value) {
    return props.data
  }
  return {}
})

// Extract application list
const applications = computed(() => {
  if (isApplicationList.value) {
    return props.data
  }
  return []
})

// Check if application has progress data
const hasProgressData = computed(() => {
  const app = application.value
  return app && (
    app.ak_completion_percentage !== undefined ||
    app.cloud_native_completion_percentage !== undefined
  )
})

// Get status tag type
const getStatusType = (status: string) => {
  if (!status) return 'info'

  const statusMap: Record<string, string> = {
    '全部完成': 'success',
    '已完成': 'success',
    'COMPLETED': 'success',
    '进行中': 'primary',
    '研发进行中': 'primary',
    '业务上线中': 'primary',
    'IN_PROGRESS': 'primary',
    '待启动': 'info',
    'NOT_STARTED': 'info',
    '阻塞中': 'danger',
    'BLOCKED': 'danger'
  }

  return statusMap[status] || 'info'
}

// Get progress bar color
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#48bb78'
  if (percentage >= 70) return '#667eea'
  if (percentage >= 40) return '#ed8936'
  return '#f56565'
}
</script>

<style scoped lang="scss">
.application-data-renderer {
  margin-top: 12px;

  .application-detail {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          color: #2d3748;

          &.highlight {
            font-weight: 600;
            color: #667eea;
            font-size: 15px;
          }
        }
      }
    }

    .progress-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;

      h4 {
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
      }

      .progress-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;

        .progress-item {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .label {
            font-size: 13px;
            color: #4a5568;
            font-weight: 500;
          }

          .status-text {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
          }
        }
      }
    }

    .notes-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;

      h4 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #4a5568;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }
  }

  .application-table {
    margin-top: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-table) {
      font-size: 13px;

      .el-table__header th {
        background: #f7fafc;
        color: #2d3748;
        font-weight: 600;
      }
    }
  }

  .raw-json {
    margin-top: 12px;
    padding: 12px;
    background: #2d3748;
    border-radius: 6px;
    overflow-x: auto;

    pre {
      margin: 0;
      color: #e2e8f0;
      font-size: 13px;
      line-height: 1.5;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
  }
}
</style>
