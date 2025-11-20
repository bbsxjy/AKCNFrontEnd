<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><document /></el-icon>
        <span class="header-title">{{ metadata.title || `SQL查询结果 (${rowCount}行)` }}</span>
        <div class="header-actions">
          <el-button size="small" @click="exportToCSV">
            <el-icon><download /></el-icon>
            导出CSV
          </el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" border stripe max-height="600" :show-overflow-tooltip="true">
      <el-table-column
        v-for="column in columns"
        :key="column"
        :prop="column"
        :label="column"
        :min-width="120"
        :align="isNumberField(column) ? 'center' : 'left'"
      >
        <template #default="{ row, $index }">
          <!-- 数字字段高亮显示 -->
          <strong v-if="isNumberField(column)" style="color: #667eea; font-size: 14px;">
            {{ formatValue(row[column]) }}
          </strong>
          <!-- 日期字段格式化 -->
          <span v-else-if="isDateField(column)">
            {{ formatDate(row[column]) }}
          </span>
          <!-- 其他字段 -->
          <span v-else>{{ formatValue(row[column]) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'
import {
  isNumberField,
  isDateField,
  formatNumber,
  formatDate as formatDateUtil
} from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

const props = defineProps<Props>()

// 提取列名
const columns = computed(() => {
  if (props.metadata.columns) {
    return props.metadata.columns
  }
  if (props.data.columns) {
    return props.data.columns
  }
  // 从第一行数据推断
  if (props.data.rows && props.data.rows.length > 0) {
    return Object.keys(props.data.rows[0])
  }
  return []
})

// 提取行数
const rowCount = computed(() => {
  return props.metadata.rowCount ||
         props.data.row_count ||
         props.data.rows?.length ||
         0
})

// 转换为表格数据格式
const tableData = computed(() => {
  if (props.data.rows && Array.isArray(props.data.rows)) {
    // 如果是数组的数组格式 [["value1", "value2"], ...]
    if (props.data.rows.length > 0 && Array.isArray(props.data.rows[0])) {
      return props.data.rows.map((row: any[]) => {
        const obj: Record<string, any> = {}
        columns.value.forEach((col, index) => {
          obj[col] = row[index]
        })
        return obj
      })
    }
    // 如果已经是对象数组格式
    return props.data.rows
  }
  return []
})

// 格式化值
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') return formatNumber(value)
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

// 格式化日期
const formatDate = (value: any): string => {
  return formatDateUtil(value, 'full')
}

// 导出为CSV
const exportToCSV = () => {
  try {
    // 构建CSV内容
    const csvRows = []

    // 表头
    csvRows.push(columns.value.join(','))

    // 数据行
    tableData.value.forEach((row: any) => {
      const values = columns.value.map(col => {
        const value = row[col]
        // 处理包含逗号、换行的值
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      csvRows.push(values.join(','))
    })

    const csvContent = csvRows.join('\n')

    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sql_result_${new Date().getTime()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('CSV文件已导出')
  } catch (error) {
    console.error('Export CSV error:', error)
    ElMessage.error('导出失败')
  }
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

:deep(.el-table) {
  font-size: 13px;
}
</style>
