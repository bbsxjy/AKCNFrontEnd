<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><list /></el-icon>
        <span class="header-title">{{ metadata.title || `查询结果 (${data.length}条)` }}</span>
      </div>
    </template>

    <el-table :data="data" border stripe max-height="600">
      <el-table-column
        v-for="key in tableColumns"
        :key="key"
        :prop="key"
        :label="key"
        :min-width="120"
        show-overflow-tooltip
      />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { List } from '@element-plus/icons-vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any[]
  metadata: MCPMetadata
}

const props = defineProps<Props>()

const tableColumns = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) {
    return []
  }
  return Object.keys(props.data[0])
})
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
}
</style>
