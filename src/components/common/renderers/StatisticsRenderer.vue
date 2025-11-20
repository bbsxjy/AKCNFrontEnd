<template>
  <el-card shadow="hover" class="renderer-card">
    <template #header>
      <div class="result-header">
        <el-icon :size="18"><data-analysis /></el-icon>
        <span class="header-title">{{ metadata.title || '统计分析结果' }}</span>
      </div>
    </template>

    <!-- 对象形式的统计数据 -->
    <div v-if="!Array.isArray(data)" class="statistics-cards">
      <el-row :gutter="16">
        <el-col
          v-for="(value, key) in statisticsData"
          :key="key"
          :xs="24" :sm="24" :md="12" :lg="8"
        >
          <el-card shadow="hover" class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-title">{{ formatKey(String(key)) }}</span>
            </div>
            
            <!-- 嵌套对象统计 -->
            <div v-if="value && typeof value === 'object' && !Array.isArray(value)" class="stat-details">
              <div v-for="(subValue, subKey) in value" :key="subKey" class="stat-item">
                <span class="stat-label">{{ formatKey(String(subKey)) }}:</span>
                <strong v-if="typeof subValue === 'number'" class="stat-value">
                  {{ formatNumber(subValue) }}
                </strong>
                <div v-else-if="subValue && typeof subValue === 'object' && !Array.isArray(subValue)" class="stat-nested">
                  <div v-for="(nestedValue, nestedKey) in subValue" :key="nestedKey">
                    <el-tag v-if="nestedValue != null" size="small" effect="plain">
                      {{ formatKey(String(nestedKey)) }}: {{ typeof nestedValue === 'number' ? formatNumber(nestedValue) : nestedValue }}
                    </el-tag>
                  </div>
                </div>
                <div v-else-if="Array.isArray(subValue)" class="stat-array">
                  <el-tag
                    v-for="(item, idx) in subValue"
                    :key="idx"
                    size="small"
                    effect="plain"
                    style="margin: 2px;"
                  >
                    {{ typeof item === 'object' ? JSON.stringify(item) : item }}
                  </el-tag>
                </div>
                <span v-else-if="subValue != null">{{ subValue }}</span>
                <span v-else class="stat-null">-</span>
              </div>
            </div>

            <!-- 数组值 -->
            <div v-else-if="Array.isArray(value)" class="stat-array-value">
              <el-tag
                v-for="(item, idx) in value.slice(0, 10)"
                :key="idx"
                size="small"
                effect="plain"
                style="margin: 2px 4px 2px 0;"
              >
                {{ typeof item === 'object' ? `${formatKey(Object.keys(item)[0])}: ${Object.values(item)[0]}` : item }}
              </el-tag>
              <span v-if="value.length > 10" class="more-items">
                ...还有 {{ value.length - 10 }} 项
              </span>
            </div>

            <!-- 简单值 -->
            <div v-else class="stat-simple-value">
              <strong class="stat-value-large">{{ formatNumber(value) }}</strong>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数组形式的统计数据 -->
    <el-table v-else :data="data" border stripe>
      <el-table-column
        v-for="(_, key) in data[0]"
        :key="key"
        :prop="key"
        :label="key"
        :width="isNumberField(String(key)) ? 120 : undefined"
        :align="isNumberField(String(key)) ? 'center' : 'left'"
      >
        <template #default="{ row }">
          <strong v-if="isNumberField(String(key))" style="color: #667eea; font-size: 16px;">
            {{ formatNumber(row[key]) }}
          </strong>
          <span v-else>{{ row[key] }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'
import { formatNumber as formatNum, isNumberField } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

const props = defineProps<Props>()

const statisticsData = computed(() => {
  if (!props.data || typeof props.data !== 'object' || Array.isArray(props.data)) {
    return {}
  }
  const data: Record<string, any> = {}

  // 如果数据中有 applications/Applications 字段，只显示这个
  const applicationsKey = Object.keys(props.data).find(key =>
    key.toLowerCase() === 'applications'
  )

  if (applicationsKey && props.data[applicationsKey]) {
    // 只显示 applications 的内容
    return { [applicationsKey]: props.data[applicationsKey] }
  }

  // 否则过滤并返回所有数据（排除 metadata、team 等）
  Object.entries(props.data).forEach(([key, value]) => {
    // 过滤掉不需要的字段
    if (key !== 'metadata' &&
        key !== 'team' &&
        key !== 'teams' &&
        key !== 'by_team' &&
        key !== 'ak' &&  // 不显示重复的 AK 列
        key !== 'AK' &&
        key !== 'cloud_native' &&  // 不显示重复的云原生列
        key !== 'cloudNative' &&
        key !== '云原生' &&
        !key.toLowerCase().includes('team') &&
        value != null) {
      data[key] = value
    }
  })
  return data
})

const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    // 顶层分组
    'applications': '📱 应用统计',
    'Applications': '📱 应用统计',
    'ak': 'AK改造',
    'AK': 'AK改造',
    'cloud_native': '云原生改造',
    'cloudNative': '云原生改造',
    '云原生': '云原生改造',

    // CMDB相关
    'l2_applications': 'L2应用',
    'l1_156_systems': '156L1系统',
    'l1_87_systems': '87L1系统',

    // 汇总统计
    'summary': '📊 汇总统计',
    'total_applications': '应用总数',
    'total': '总计',
    'average_progress': '平均进度',
    'avg_progress': '平均进度',
    'delayed_count': '延期数量',
    'delayed': '延期',
    'on_track_count': '按计划进行',
    'on_track': '按计划',
    'ak_completion_rate': 'AK完成率 (%)',
    'cloud_native_completion_rate': '云原生完成率 (%)',
    'completion_rate': '完成率 (%)',

    // 状态统计
    'by_status': '📈 按状态统计',
    'status': '状态',
    'not_started': '未启动',
    'pending': '待启动',
    'in_progress': '进行中',
    'ongoing': '进行中',
    'completed': '已完成',
    'done': '已完成',
    'blocked': '阻塞中',

    // 改造目标
    'by_target': '🎯 按改造目标',
    'target': '目标',
    'transformation_target': '改造目标',

    // 进度统计
    'progress_distribution': '📊 进度分布',
    'progress': '进度',
    '0-25': '0-25%',
    '25-50': '25-50%',
    '50-75': '50-75%',
    '75-100': '75-100%',
    '0_25': '0-25%',
    '25_50': '25-50%',
    '50_75': '50-75%',
    '75_100': '75-100%',

    // 时间相关
    'by_year': '📅 按年度',
    'by_month': '📅 按月份',
    'acceptance_year': '验收年份',
    'year': '年份',
    '2024': '2024年',
    '2025': '2025年',
    '2026': '2026年',
    '2027': '2027年',

    // 管理级别
    'by_management_level': '📋 按管理级别',
    'management_level': '管理级别',
    'group_level': '集团级',
    'l1_department_level': '156一级部门级',
    'l2_department_level': '二级部门级',

    // 部门相关（如果需要显示）
    'by_department': '按部门',
    'department': '部门',

    // 通用字段
    'count': '数量',
    'avg': '平均值',
    'average': '平均值',
    'percentage': '百分比',
    'rate': '比率',
    'name': '名称',
    'value': '值',
    'description': '描述',
    'details': '详情',
    'data': '数据',
    'result': '结果',
    'results': '结果'
  }

  // 如果有映射则返回中文，否则处理下划线转空格
  if (keyMap[key]) {
    return keyMap[key]
  }

  // 尝试匹配部分关键词
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('application')) return '应用'
  if (lowerKey.includes('progress')) return '进度'
  if (lowerKey.includes('status')) return '状态'
  if (lowerKey.includes('count')) return '数量'
  if (lowerKey.includes('rate')) return '比率'
  if (lowerKey.includes('percentage')) return '百分比'
  if (lowerKey.includes('total')) return '总计'
  if (lowerKey.includes('average') || lowerKey.includes('avg')) return '平均'
  if (lowerKey.includes('delay')) return '延期'
  if (lowerKey.includes('complete')) return '完成'
  if (lowerKey.includes('block')) return '阻塞'

  // 默认：下划线转空格，首字母大写
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatNumber = formatNum
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

.statistics-cards {
  .stat-card {
    height: 100%;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .stat-card-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f2f5;

      .stat-card-title {
        font-size: 15px;
        font-weight: 600;
        color: #2d3748;
      }
    }

    .stat-details {
      .stat-item {
        margin-bottom: 12px;
        display: flex;
        align-items: flex-start;
        gap: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .stat-label {
          font-size: 13px;
          color: #718096;
          min-width: 80px;
        }

        .stat-value {
          font-size: 20px;
          color: #667eea;
          font-weight: 600;
        }

        .stat-nested,
        .stat-array {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stat-null {
          color: #a0aec0;
          font-style: italic;
        }
      }
    }

    .stat-array-value {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0;

      .more-items {
        color: #718096;
        font-size: 13px;
        font-style: italic;
      }
    }

    .stat-simple-value {
      text-align: center;
      padding: 20px 0;

      .stat-value-large {
        font-size: 32px;
        color: #667eea;
        font-weight: 700;
      }
    }
  }
}
</style>
