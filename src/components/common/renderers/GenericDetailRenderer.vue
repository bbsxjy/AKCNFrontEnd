<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><info-filled /></el-icon>
        <span class="header-title">{{ metadata.title || '详细信息' }}</span>
      </div>
    </template>

    <el-descriptions :column="2" border>
      <el-descriptions-item
        v-for="(value, key) in data"
        :key="key"
        :label="String(key)"
      >
        {{ formatValue(value) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

defineProps<Props>()

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
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
}
</style>
