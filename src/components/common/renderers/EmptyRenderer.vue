<template>
  <el-card shadow="hover" class="renderer-card">
    <el-empty :description="metadata.title || '无数据'" />
  </el-card>
</template>

<script setup lang="ts">
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  metadata: MCPMetadata
}

defineProps<Props>()
</script>

<style scoped lang="scss">
.renderer-card {
  :deep(.el-card__body) {
    padding: 40px 20px;
  }
}
</style>
