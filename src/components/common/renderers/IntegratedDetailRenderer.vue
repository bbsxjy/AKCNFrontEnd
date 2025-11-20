<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><document /></el-icon>
        <span class="header-title">{{ metadata.title || `${data.l2_id} - 完整关联数据` }}</span>
        <div class="header-actions">
          <el-button size="small" type="primary" @click="navigateToApplication">
            <el-icon><right /></el-icon>
            在应用管理中查看
          </el-button>
        </div>
      </div>
    </template>

    <!-- CMDB基本信息 -->
    <div class="section" v-if="data.cmdb_info">
      <h4 class="section-title">
        <el-icon><info-filled /></el-icon>
        CMDB基本信息
      </h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="配置项ID">{{ data.cmdb_info.config_id }}</el-descriptions-item>
        <el-descriptions-item label="规范名称">{{ data.cmdb_info.short_name }}</el-descriptions-item>
        <el-descriptions-item label="系统状态">
          <el-tag :type="getSystemStatusType(data.cmdb_info.system_status)">
            {{ data.cmdb_info.system_status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="管理级别">
          <el-tag type="warning">{{ data.cmdb_info.management_level }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 改造信息 -->
    <div class="section" v-if="data.transformation_info">
      <h4 class="section-title">
        <el-icon><odometer /></el-icon>
        改造进度
      </h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="改造目标">
          <el-tag :type="data.transformation_info.overall_transformation_target === 'AK' ? 'primary' : 'success'">
            {{ data.transformation_info.overall_transformation_target }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="应用档位">
          第{{ data.transformation_info.app_tier }}档
        </el-descriptions-item>
        <el-descriptions-item label="AK改造">
          <el-tag :type="data.transformation_info.is_ak_completed ? 'success' : 'warning'">
            {{ data.transformation_info.is_ak_completed ? '已完成' : '进行中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="云原生改造">
          <el-tag :type="data.transformation_info.is_cloud_native_completed ? 'success' : 'warning'">
            {{ data.transformation_info.is_cloud_native_completed ? '已完成' : '进行中' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- L1系统关联 -->
    <div class="section" v-if="data.l1_systems">
      <h4 class="section-title">
        <el-icon><connection /></el-icon>
        L1系统关联
      </h4>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>156L1系统（当前）</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">
                {{ data.l1_systems.l1_156?.short_name }}
              </el-descriptions-item>
              <el-descriptions-item label="管理级别">
                <el-tag type="warning">{{ data.l1_systems.l1_156?.management_level }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>87L1系统（目标）</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">
                {{ data.l1_systems.l1_87?.short_name }}
              </el-descriptions-item>
              <el-descriptions-item label="管理级别">
                <el-tag type="warning">{{ data.l1_systems.l1_87?.management_level }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 子任务列表 -->
    <div class="section" v-if="data.subtasks && data.subtasks.length > 0">
      <h4 class="section-title">
        <el-icon><list /></el-icon>
        子任务详情 ({{ data.subtasks.length }}个)
      </h4>
      <el-table :data="data.subtasks" border stripe>
        <el-table-column prop="sub_target" label="子目标" width="100" />
        <el-table-column prop="version_name" label="版本" width="120" />
        <el-table-column label="任务状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.task_status)" size="small">
              {{ row.task_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="120" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.progress_percentage || 0" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Document, Right, InfoFilled, Odometer, Connection, List } from '@element-plus/icons-vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

const props = defineProps<Props>()
const router = useRouter()

const navigateToApplication = () => {
  router.push({
    path: '/applications',
    query: { search: props.data.l2_id }
  })
}

const getSystemStatusType = (status: string | undefined) => {
  if (!status) return 'info'
  if (status === '运行中') return 'success'
  if (status === '建设中') return 'warning'
  return 'info'
}

const getTaskStatusType = (status: string | undefined) => {
  if (!status) return 'info'
  if (status === '子任务完成') return 'success'
  if (status.includes('进行中')) return 'primary'
  if (status.includes('阻塞')) return 'danger'
  return 'info'
}
</script>

<style scoped lang="scss">
.renderer-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.section {
  margin-top: 20px;

  &:first-child {
    margin-top: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4e7ed;
  }
}
</style>
