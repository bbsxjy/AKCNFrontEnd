<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><circle-check /></el-icon>
        <span class="header-title">{{ metadata.title || '操作结果' }}</span>
      </div>
    </template>

    <!-- Excel下载结果 -->
    <div v-if="hasDownloadUrl" class="download-result">
      <div class="download-link-container">
        <el-icon class="success-icon" :size="20"><circle-check /></el-icon>
        <span class="success-text">{{ data.message || '报表生成成功' }}</span>
        <el-link
          type="primary"
          :underline="false"
          @click="handleDownload"
          class="download-link"
        >
          <el-icon class="link-icon"><download /></el-icon>
          点击下载
        </el-link>
      </div>
    </div>

    <!-- 普通操作结果 -->
    <el-result v-else icon="success" title="操作成功">
      <template #sub-title>
        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
          <p v-if="data.message">{{ data.message }}</p>
          <p v-if="data.updated_count !== undefined">
            更新了 <strong style="color: #667eea;">{{ data.updated_count }}</strong> 条记录
          </p>
          <p v-if="data.created_count !== undefined">
            创建了 <strong style="color: #667eea;">{{ data.created_count }}</strong> 条记录
          </p>
          <p v-if="data.deleted_count !== undefined">
            删除了 <strong style="color: #667eea;">{{ data.deleted_count }}</strong> 条记录
          </p>
        </div>
      </template>
    </el-result>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'
import api from '@/api'

interface Props {
  data: any
  metadata: MCPMetadata
}

const props = defineProps<Props>()

// 检查是否有下载链接
const hasDownloadUrl = computed(() => {
  return props.data?.download_url != null
})

// 格式化文件大小
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '未知'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 处理下载
const handleDownload = async () => {
  if (!props.data?.download_url) {
    ElMessage.error('下载链接不存在')
    return
  }

  try {
    // 使用axios下载文件，会自动携带token
    // 移除/api/v1前缀，因为axios的baseURL已经包含了/api/v1
    let downloadUrl = props.data.download_url
    if (downloadUrl.startsWith('/api/v1/')) {
      downloadUrl = downloadUrl.replace('/api/v1/', '/')
    }

    const response = await api.get(downloadUrl, {
      responseType: 'blob'
    })

    // 创建blob URL
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)

    // 创建隐藏的a标签触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = props.data.file_name || 'report.xlsx'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放blob URL
    window.URL.revokeObjectURL(url)

    ElMessage.success('开始下载...')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
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

.download-result {
  padding: 20px 0;

  .download-link-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    .success-icon {
      color: #67c23a;
    }

    .success-text {
      font-size: 15px;
      color: #303133;
    }

    .download-link {
      font-size: 15px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .link-icon {
        font-size: 16px;
      }

      &:hover {
        .link-icon {
          transform: translateY(2px);
          transition: transform 0.2s;
        }
      }
    }
  }
}
</style>
