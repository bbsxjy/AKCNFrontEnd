<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><warning /></el-icon>
        <span class="header-title">未知数据类型</span>
      </div>
    </template>

    <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>此数据类型暂不支持可视化展示</span>
        </div>
      </template>
      <div style="margin-top: 8px; font-size: 13px; line-height: 1.6;">
        <p>检测到的renderType: <el-tag>{{ renderType }}</el-tag></p>
        <p v-if="Array.isArray(data)">数据类型：数组 ({{ data.length }}项)</p>
        <p v-else-if="data && typeof data === 'object'">
          数据类型：对象 ({{ Object.keys(data).length }}个键)
        </p>
      </div>
    </el-alert>

    <el-collapse>
      <el-collapse-item title="查看原始数据（调试用）" name="1">
        <pre style="background: #f5f7fa; padding: 12px; border-radius: 4px; font-size: 12px; max-height: 400px; overflow: auto;">{{ JSON.stringify(data, null, 2) }}</pre>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
import { Warning } from '@element-plus/icons-vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
  renderType: string
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
</style>
