<template>
  <div class="template-fill-result">
    <div class="result-header">
      <el-icon class="success-icon" :size="24"><circle-check /></el-icon>
      <h4>模板填充完成</h4>
    </div>

    <div class="result-metrics">
      <div class="metric-item">
        <span class="metric-label">填充行数</span>
        <span class="metric-value highlight">{{ metadata.rowsFilled }}</span>
        <span class="metric-unit">行</span>
      </div>

      <div class="metric-item">
        <span class="metric-label">数据源</span>
        <span class="metric-value">{{ getDataSourceLabel(metadata.dataSource) }}</span>
      </div>

      <div class="metric-item">
        <span class="metric-label">处理时间</span>
        <span class="metric-value">{{ metadata.processingTimeMs }}</span>
        <span class="metric-unit">ms</span>
      </div>

      <div v-if="metadata.templateTitle" class="metric-item full-width">
        <span class="metric-label">模板标题</span>
        <span class="metric-value">{{ metadata.templateTitle }}</span>
      </div>
    </div>

    <div v-if="metadata.aiReasoning" class="ai-reasoning">
      <div class="reasoning-header">
        <el-icon><magic-stick /></el-icon>
        <span>AI 分析</span>
      </div>
      <p class="reasoning-text">{{ metadata.aiReasoning }}</p>
    </div>

    <div class="download-info">
      <el-icon><download /></el-icon>
      <span class="filename">{{ filename }}</span>
      <el-tag size="small" type="success">已下载</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, MagicStick, Download } from '@element-plus/icons-vue'

interface Props {
  filename: string
  metadata: {
    rowsFilled: number
    dataSource: string
    processingTimeMs: number
    templateTitle?: string
    aiReasoning?: string
  }
}

defineProps<Props>()

const getDataSourceLabel = (source: string) => {
  const sourceMap: Record<string, string> = {
    'applications': '应用数据',
    'sub_tasks': '子任务数据',
    'subtasks': '子任务数据',
    'custom_query': '自定义查询',
    'unknown': '未知来源'
  }
  return sourceMap[source] || source
}
</script>

<style scoped lang="scss">
.template-fill-result {
  margin-top: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  .result-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;

    .success-icon {
      color: #48bb78;
    }

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }
  }

  .result-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 16px;

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;

      &.full-width {
        grid-column: 1 / -1;
      }

      .metric-label {
        font-size: 12px;
        color: #718096;
        font-weight: 500;
      }

      .metric-value {
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;

        &.highlight {
          color: #667eea;
          font-size: 24px;
        }
      }

      .metric-unit {
        font-size: 12px;
        color: #a0aec0;
        margin-left: 4px;
      }
    }
  }

  .ai-reasoning {
    margin-bottom: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-left: 3px solid #667eea;
    border-radius: 4px;

    .reasoning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #667eea;

      .el-icon {
        font-size: 16px;
      }
    }

    .reasoning-text {
      margin: 0;
      font-size: 13px;
      color: #4a5568;
      line-height: 1.6;
    }
  }

  .download-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #f7fafc;
    border: 1px dashed #cbd5e0;
    border-radius: 6px;

    .el-icon {
      font-size: 18px;
      color: #48bb78;
    }

    .filename {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #2d3748;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
  }
}
</style>
