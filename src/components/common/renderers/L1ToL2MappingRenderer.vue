<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><connection /></el-icon>
        <span class="header-title">{{ metadata.title || 'L1到L2映射关系' }}</span>
      </div>
    </template>

    <div class="section">
      <h4>L1系统: {{ data.l1_system_name }}</h4>
      <p>类型: {{ data.l1_type }}</p>
    </div>

    <div class="section" v-if="data.applications && data.applications.length > 0">
      <h4>关联的L2应用 ({{ data.applications.length }}个)</h4>
      <GenericListRenderer :data="data.applications" :metadata="{ renderType: 'generic_list', title: '' }" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue'
import GenericListRenderer from './GenericListRenderer.vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

defineProps<Props>()
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

.section {
  margin-bottom: 20px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
}
</style>
