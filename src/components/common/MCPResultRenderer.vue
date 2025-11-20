<template>
  <div class="mcp-result-renderer">
    <!-- Debug Panel (Development Only) -->
    <el-alert
      v-if="showDebugPanel"
      type="info"
      :closable="true"
      @close="showDebugPanel = false"
      style="margin-bottom: 12px;"
    >
      <template #title>
        <strong>🔍 调试信息</strong>
      </template>
      <div style="font-size: 12px; font-family: monospace; line-height: 1.8;">
        <div><strong>检测到的renderType:</strong> <el-tag size="small">{{ renderType }}</el-tag></div>
        <div><strong>数据类型:</strong> {{ Array.isArray(data) ? `数组 (${data.length}项)` : typeof data }}</div>
        <div v-if="Array.isArray(data) && data.length > 0">
          <strong>第一项的字段:</strong> {{ Object.keys(data[0]).slice(0, 10).join(', ') }}
        </div>
        <div v-else-if="data && typeof data === 'object' && !Array.isArray(data)">
          <strong>对象字段:</strong> {{ Object.keys(data).slice(0, 10).join(', ') }}
        </div>
        <div><strong>后端metadata:</strong> {{ extractedData.metadata ? '✅ 有' : '❌ 无（使用自动检测）' }}</div>
        <div v-if="metadata.title"><strong>标题:</strong> {{ metadata.title }}</div>
        <el-button size="small" type="primary" style="margin-top: 8px;" @click="console.log('Full data:', props.result)">
          在Console查看完整数据
        </el-button>
      </div>
    </el-alert>

    <!-- Application List -->
    <ApplicationListRenderer
      v-if="renderType === 'application_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Subtask List -->
    <SubtaskListRenderer
      v-else-if="renderType === 'subtask_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- CMDB L2 List -->
    <CMDBL2ListRenderer
      v-else-if="renderType === 'cmdb_l2_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- CMDB L1 List -->
    <CMDBL1ListRenderer
      v-else-if="renderType === 'cmdb_l1_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Integrated Detail (L2 with CMDB + Transformation Info) -->
    <IntegratedDetailRenderer
      v-else-if="renderType === 'integrated_detail'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Application Detail -->
    <ApplicationDetailRenderer
      v-else-if="renderType === 'application_detail'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Statistics -->
    <StatisticsRenderer
      v-else-if="renderType === 'statistics'"
      :data="data"
      :metadata="metadata"
    />

    <!-- SQL Result -->
    <SQLResultRenderer
      v-else-if="renderType === 'sql_result'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Audit Log List -->
    <AuditLogListRenderer
      v-else-if="renderType === 'audit_log_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Schema Detail -->
    <SchemaDetailRenderer
      v-else-if="renderType === 'schema_detail' || renderType === 'schema_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Progress Trend -->
    <ProgressTrendRenderer
      v-else-if="renderType === 'progress_trend'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Operation Result -->
    <OperationResultRenderer
      v-else-if="renderType === 'operation_result'"
      :data="data"
      :metadata="metadata"
    />

    <!-- L1 to L2 Mapping -->
    <L1ToL2MappingRenderer
      v-else-if="renderType === 'cmdb_l1_to_l2_mapping'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Generic List (fallback for unknown list types) -->
    <GenericListRenderer
      v-else-if="renderType === 'generic_list'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Generic Detail (fallback for unknown detail types) -->
    <GenericDetailRenderer
      v-else-if="renderType === 'generic_detail'"
      :data="data"
      :metadata="metadata"
    />

    <!-- Empty State -->
    <EmptyRenderer
      v-else-if="renderType === 'empty'"
      :metadata="metadata"
    />

    <!-- Fallback: Unknown Type -->
    <UnknownTypeRenderer
      v-else
      :data="data"
      :metadata="metadata"
      :render-type="renderType"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { detectRenderType, type MCPResponse, type MCPMetadata } from '@/utils/mcpRenderTypeDetector'

// 导入所有渲染器组件
import ApplicationListRenderer from './renderers/ApplicationListRenderer.vue'
import SubtaskListRenderer from './renderers/SubtaskListRenderer.vue'
import CMDBL2ListRenderer from './renderers/CMDBL2ListRenderer.vue'
import CMDBL1ListRenderer from './renderers/CMDBL1ListRenderer.vue'
import IntegratedDetailRenderer from './renderers/IntegratedDetailRenderer.vue'
import ApplicationDetailRenderer from './renderers/ApplicationDetailRenderer.vue'
import StatisticsRenderer from './renderers/StatisticsRenderer.vue'
import SQLResultRenderer from './renderers/SQLResultRenderer.vue'
import AuditLogListRenderer from './renderers/AuditLogListRenderer.vue'
import SchemaDetailRenderer from './renderers/SchemaDetailRenderer.vue'
import ProgressTrendRenderer from './renderers/ProgressTrendRenderer.vue'
import OperationResultRenderer from './renderers/OperationResultRenderer.vue'
import L1ToL2MappingRenderer from './renderers/L1ToL2MappingRenderer.vue'
import GenericListRenderer from './renderers/GenericListRenderer.vue'
import GenericDetailRenderer from './renderers/GenericDetailRenderer.vue'
import EmptyRenderer from './renderers/EmptyRenderer.vue'
import UnknownTypeRenderer from './renderers/UnknownTypeRenderer.vue'

interface Props {
  result: any
}

const props = defineProps<Props>()

// 调试面板控制（默认隐藏，需要时可手动开启）
const showDebugPanel = ref(false)

// 暴露console给模板使用
const console = window.console

/**
 * 智能提取数据和metadata
 * 处理多层嵌套的响应结构
 *
 * MCP API返回格式：{ success: boolean, result: any, metadata?: any }
 */
const extractedData = computed(() => {
  let current = props.result
  const debugInfo: string[] = []

  // 空值保护：流式响应可能返回空数据
  if (!current) {
    if (import.meta.env.DEV) {
      console.log('[MCPResultRenderer] Received null/undefined result')
    }
    return {
      success: false,
      data: null,
      metadata: undefined,
      error: 'No data received'
    } as MCPResponse
  }

  debugInfo.push(`Initial type: ${typeof current}`)
  debugInfo.push(`Has success: ${current?.success !== undefined}`)
  debugInfo.push(`Has result: ${current?.result !== undefined}`)
  debugInfo.push(`Has data: ${current?.data !== undefined}`)
  debugInfo.push(`Has metadata: ${current?.metadata !== undefined}`)

  // 如果已经是标准格式（有success字段）
  if (current?.success !== undefined) {
    // MCP API uses "result" not "data"
    let actualData = current.result?.data || current.result || current.data
    let actualMetadata = current.metadata || current.result?.metadata

    debugInfo.push(`Initial actualData type: ${typeof actualData}`)
    debugInfo.push(`Initial actualData keys: ${actualData && typeof actualData === 'object' ? Object.keys(actualData).slice(0, 10).join(', ') : 'N/A'}`)

    // 处理可能的双层嵌套：如果 actualData 只包含一个 result 字段，继续深入
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      const keys = Object.keys(actualData)
      if (keys.length === 1 && keys[0] === 'result') {
        debugInfo.push('Found single result field, going deeper...')
        actualData = actualData.result
        // 空值检查：流式响应可能返回 null/undefined
        if (actualData && typeof actualData === 'object') {
          debugInfo.push(`After unwrapping: ${Object.keys(actualData).slice(0, 10).join(', ')}`)
        }
      }
    }

    // 重要：如果 actualData 是对象且包含 metadata 字段，需要提取出来
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData) && 'metadata' in actualData) {
      debugInfo.push('Found metadata inside data object, extracting...')
      actualMetadata = actualData.metadata
      // 从 data 中移除 metadata 字段
      const { metadata: _, ...dataWithoutMetadata } = actualData
      actualData = dataWithoutMetadata
    }

    // 如果提取 metadata 后还剩下一个对象，且只包含 data 字段，继续深入
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      const keys = Object.keys(actualData)
      if (keys.length === 1 && keys[0] === 'data') {
        debugInfo.push('Found single data field after metadata extraction, unwrapping...')
        actualData = actualData.data
      }
    }

    debugInfo.push(`Final data type: ${typeof actualData}`)
    debugInfo.push(`Final data is array: ${Array.isArray(actualData)}`)
    if (Array.isArray(actualData)) {
      debugInfo.push(`Array length: ${actualData.length}`)
    }
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      debugInfo.push(`Final object keys: ${Object.keys(actualData).slice(0, 10).join(', ')}`)
    }
    debugInfo.push(`Has metadata: ${!!actualMetadata}`)
    if (actualMetadata) {
      debugInfo.push(`Metadata renderType: ${actualMetadata.renderType}`)
    }

    // 开发环境输出调试信息
    if (import.meta.env.DEV) {
      console.log('[MCPResultRenderer] Debug info:', debugInfo.join(' | '))
      console.log('[MCPResultRenderer] Actual data:', actualData)
      console.log('[MCPResultRenderer] Metadata:', actualMetadata)
    }

    return {
      success: current.success,
      data: actualData,
      metadata: actualMetadata,
      error: current.error
    } as MCPResponse
  }

  // 如果不是标准格式，尝试深入提取
  let extractedMetadata: any = undefined
  let maxDepth = 10
  while (maxDepth-- > 0) {
    // 检查当前层是否有 metadata
    if (current?.metadata && !extractedMetadata) {
      debugInfo.push('Found metadata at this layer')
      extractedMetadata = current.metadata
    }

    // 尝试深入到result或data层
    if (current?.result) {
      debugInfo.push('Going into result layer')
      current = current.result
      continue
    }
    if (current?.data) {
      debugInfo.push('Going into data layer')
      current = current.data
      continue
    }
    break
  }

  // 再次检查最终层是否有 metadata
  if (current?.metadata && !extractedMetadata) {
    debugInfo.push('Found metadata at final layer')
    extractedMetadata = current.metadata
  }

  // 如果提取到了metadata，需要从data中移除它（避免重复显示）
  let finalData = current
  if (extractedMetadata && current && typeof current === 'object' && !Array.isArray(current)) {
    if ('metadata' in current) {
      debugInfo.push('Removing metadata from data object')
      // 创建一个新对象，排除metadata字段
      const { metadata: _, ...dataWithoutMetadata } = current
      finalData = dataWithoutMetadata
    }
  }

  // 开发环境输出调试信息
  if (import.meta.env.DEV) {
    console.log('[MCPResultRenderer] Debug info:', debugInfo.join(' | '))
    console.log('[MCPResultRenderer] Final extracted data:', finalData)
    console.log('[MCPResultRenderer] Extracted metadata:', extractedMetadata)
  }

  // 返回推测的格式
  return {
    success: true,
    data: finalData,
    metadata: extractedMetadata
  } as MCPResponse
})

/**
 * 使用检测工具自动识别renderType
 */
const detectedMetadata = computed((): MCPMetadata => {
  // 空值保护
  if (!extractedData.value || extractedData.value.data === null) {
    return { renderType: 'empty', title: '无数据' }
  }
  return detectRenderType(extractedData.value)
})

/**
 * 最终使用的metadata（优先后端提供的）
 */
const metadata = computed((): MCPMetadata => {
  return extractedData.value?.metadata || detectedMetadata.value
})

/**
 * 渲染类型
 */
const renderType = computed((): string => {
  return metadata.value?.renderType || 'unknown'
})

/**
 * 实际数据
 */
const data = computed(() => {
  return extractedData.value?.data
})
</script>

<style scoped lang="scss">
.mcp-result-renderer {
  margin-top: 12px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
