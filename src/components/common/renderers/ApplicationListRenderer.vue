<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><list /></el-icon>
        <span class="header-title">{{ metadata.title || `查询到 ${data.length} 个应用` }}</span>
        <div class="header-actions">
          <el-button size="small" type="primary" @click="navigateToApplications">
            <el-icon><right /></el-icon>
            在应用管理中查看全部
          </el-button>
        </div>
      </div>
    </template>

    <ApplicationsTable
      :applications="data"
      :table-max-height="600"
      :has-date-adjustment="() => false"
      :get-delay-count="() => 0"
      @selection-change="() => {}"
      @toggle-favorite="() => {}"
      @show-detail="handleShowDetail"
      @view-subtasks="handleShowDetail"
      @show-delay-details="() => {}"
      @edit="handleShowDetail"
    />
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { List, Right } from '@element-plus/icons-vue'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'
import type { Application } from '@/api/applications'

interface Props {
  data: any[]
  metadata: MCPMetadata
}

defineProps<Props>()

const router = useRouter()

const navigateToApplications = () => {
  router.push('/applications')
}

const handleShowDetail = (app: Application) => {
  router.push({
    path: '/applications',
    query: { search: app.l2_id }
  })
}
</script>

<style scoped lang="scss">
.renderer-card {
  :deep(.el-card__body) {
    padding: 16px;
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
</style>
