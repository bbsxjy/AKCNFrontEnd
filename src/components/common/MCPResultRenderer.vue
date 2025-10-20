<template>
  <div class="mcp-result-renderer">
    <!-- CMDB L2应用详情 (如CI000088398) -->
    <div v-if="isCMDBL2DetailResult" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><document /></el-icon>
            <span class="header-title">{{ resultData.data.l2_id }} - {{ resultData.data.cmdb_info?.short_name }}</span>
            <div class="header-actions">
              <el-button
                size="small"
                type="primary"
                @click="navigateToApplication(resultData.data.l2_id)"
              >
                <el-icon><right /></el-icon>
                在应用管理中查看
              </el-button>
            </div>
          </div>
        </template>

        <!-- CMDB基本信息 -->
        <div class="section">
          <h4 class="section-title">
            <el-icon><info-filled /></el-icon>
            CMDB基本信息
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="配置项ID">
              {{ resultData.data.cmdb_info?.config_id }}
            </el-descriptions-item>
            <el-descriptions-item label="规范名称">
              {{ resultData.data.cmdb_info?.short_name }}
            </el-descriptions-item>
            <el-descriptions-item label="英文名称">
              {{ resultData.data.cmdb_info?.english_name }}
            </el-descriptions-item>
            <el-descriptions-item label="系统状态">
              <el-tag :type="getSystemStatusType(resultData.data.cmdb_info?.system_status)">
                {{ resultData.data.cmdb_info?.system_status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="管理级别">
              <el-tag type="warning">
                {{ resultData.data.cmdb_info?.management_level }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="系统产权">
              {{ resultData.data.cmdb_info?.system_ownership }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 联系人信息 -->
        <div class="section">
          <h4 class="section-title">
            <el-icon><user /></el-icon>
            联系人信息
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="业务主管单位">
              {{ resultData.data.cmdb_info?.business_supervisor_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人">
              {{ resultData.data.cmdb_info?.contact_person }}
            </el-descriptions-item>
            <el-descriptions-item label="开发单位">
              {{ resultData.data.cmdb_info?.dev_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="开发接口人">
              <el-text type="primary">{{ resultData.data.cmdb_info?.dev_contact }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="运维单位">
              {{ resultData.data.cmdb_info?.ops_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="运维接口人">
              <el-text type="primary">{{ resultData.data.cmdb_info?.ops_contact }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 改造信息 -->
        <div class="section" v-if="resultData.data.transformation_info">
          <h4 class="section-title">
            <el-icon><odometer /></el-icon>
            改造进度
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="监管年份">
              {{ resultData.data.transformation_info.ak_supervision_acceptance_year }}年
            </el-descriptions-item>
            <el-descriptions-item label="改造目标">
              <el-tag :type="resultData.data.transformation_info.overall_transformation_target === 'AK' ? 'primary' : 'success'">
                {{ resultData.data.transformation_info.overall_transformation_target }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="AK改造状态">
              <el-tag :type="resultData.data.transformation_info.is_ak_completed ? 'success' : 'warning'">
                {{ resultData.data.transformation_info.is_ak_completed ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="云原生改造状态">
              <el-tag :type="resultData.data.transformation_info.is_cloud_native_completed ? 'success' : 'warning'">
                {{ resultData.data.transformation_info.is_cloud_native_completed ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              {{ resultData.data.transformation_info.current_status }}
            </el-descriptions-item>
            <el-descriptions-item label="应用等级">
              第{{ resultData.data.transformation_info.app_tier }}级
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 延期状态 -->
        <div class="section" v-if="resultData.data.cmdb_info">
          <h4 class="section-title">
            <el-icon><calendar /></el-icon>
            上线时间
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="计划业务上线">
              {{ formatDate(resultData.data.cmdb_info.planned_biz_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="实际业务上线">
              {{ formatDate(resultData.data.cmdb_info.actual_biz_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="延期状态">
              <el-tag :type="resultData.data.cmdb_info.is_delayed ? 'danger' : 'success'">
                {{ resultData.data.cmdb_info.is_delayed ? `延期${resultData.data.cmdb_info.delay_days}天` : '正常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="验收状态">
              <el-tag :type="getAcceptanceStatusType(resultData.data.cmdb_info.acceptance_status)">
                {{ resultData.data.cmdb_info.acceptance_status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- L1系统关联 -->
        <div class="section" v-if="resultData.data.l1_systems">
          <h4 class="section-title">
            <el-icon><connection /></el-icon>
            L1系统关联
          </h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>156L1系统（当前）</span>
                    <el-tag size="small" type="info">外部报送用</el-tag>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="系统名称">
                    {{ resultData.data.l1_systems.l1_156?.short_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="管理级别">
                    <el-tag type="warning">{{ resultData.data.l1_systems.l1_156?.management_level }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="所属域">
                    {{ resultData.data.l1_systems.l1_156?.belongs_to_domain }}
                  </el-descriptions-item>
                  <el-descriptions-item label="所属层">
                    {{ resultData.data.l1_systems.l1_156?.belongs_to_layer }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>87L1系统（目标）</span>
                    <el-tag size="small" type="success">2027过渡</el-tag>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="系统名称">
                    {{ resultData.data.l1_systems.l1_87?.short_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="管理级别">
                    <el-tag type="warning">{{ resultData.data.l1_systems.l1_87?.management_level }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="所属域">
                    {{ resultData.data.l1_systems.l1_87?.belongs_to_domain }}
                  </el-descriptions-item>
                  <el-descriptions-item label="关键系统">
                    <el-tag :type="resultData.data.l1_systems.l1_87?.is_critical_system ? 'danger' : 'info'" size="small">
                      {{ resultData.data.l1_systems.l1_87?.is_critical_system ? '是' : '否' }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 子任务列表 -->
        <div class="section" v-if="resultData.data.subtasks && resultData.data.subtasks.length > 0">
          <h4 class="section-title">
            <el-icon><list /></el-icon>
            子任务详情 ({{ resultData.data.subtasks.length }}个)
          </h4>
          <el-table :data="resultData.data.subtasks" border stripe>
            <el-table-column prop="sub_target" label="子目标" width="100" />
            <el-table-column prop="version_name" label="版本" width="120" />
            <el-table-column label="任务状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getTaskStatusType(row.task_status)" size="small">
                  {{ row.task_status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.progress_percentage" :status="row.progress_percentage >= 100 ? 'success' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="计划技术上线" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.planned_tech_online_date) }}
              </template>
            </el-table-column>
            <el-table-column label="实际技术上线" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.actual_tech_online_date) }}
              </template>
            </el-table-column>
            <el-table-column label="阻塞" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.is_blocked" type="danger" size="small">阻塞</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 备注信息 -->
        <div class="section" v-if="resultData.data.cmdb_info?.notes">
          <h4 class="section-title">
            <el-icon><warning /></el-icon>
            备注与风险提示
          </h4>
          <el-alert
            type="warning"
            :closable="false"
            show-icon
          >
            <pre class="notes-content">{{ resultData.data.cmdb_info.notes }}</pre>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- 应用列表结果 -->
    <div v-else-if="isApplicationListResult" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><list /></el-icon>
            <span class="header-title">查询到 {{ resultData.length }} 个应用</span>
            <div class="header-actions">
              <el-button size="small" type="primary" @click="navigateToApplications">
                <el-icon><right /></el-icon>
                在应用管理中查看全部
              </el-button>
            </div>
          </div>
        </template>

        <el-table :data="resultData" border stripe max-height="600">
          <el-table-column prop="l2_id" label="L2 ID" width="140" fixed />
          <el-table-column prop="app_name" label="应用名称" width="180" show-overflow-tooltip />
          <el-table-column label="改造目标" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.overall_transformation_target === 'AK' ? 'primary' : 'success'" size="small">
                {{ row.overall_transformation_target }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="current_status" label="当前状态" width="120" />
          <el-table-column label="进度" width="150" align="center">
            <template #default="{ row }">
              <el-progress :percentage="row.progress_percentage || 0" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="navigateToApplication(row.l2_id)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 统计分析结果 -->
    <div v-else-if="isStatisticsResult" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><data-analysis /></el-icon>
            <span class="header-title">统计分析结果</span>
          </div>
        </template>
        <el-table :data="resultData" border stripe>
          <el-table-column
            v-for="(value, key) in resultData[0]"
            :key="key"
            :prop="key"
            :label="formatColumnLabel(key)"
            :min-width="getColumnWidth(key)"
            :align="isNumberColumn(key) ? 'right' : 'left'"
          >
            <template #default="{ row }">
              <template v-if="isNumberColumn(key)">
                <el-text type="primary" style="font-weight: 600;">{{ formatNumber(row[key]) }}</el-text>
              </template>
              <template v-else>
                {{ row[key] }}
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 通用表格展示 -->
    <div v-else-if="isTableData" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><data-board /></el-icon>
            <span class="header-title">查询结果 ({{ resultData.length }} 条记录)</span>
          </div>
        </template>
        <el-table :data="resultData" border stripe max-height="600">
          <el-table-column
            v-for="(value, key) in resultData[0]"
            :key="key"
            :prop="key"
            :label="formatColumnLabel(key)"
            :min-width="getColumnWidth(key)"
            show-overflow-tooltip
          />
        </el-table>
      </el-card>
    </div>

    <!-- 通用对象展示 -->
    <div v-else-if="isObjectData" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><document /></el-icon>
            <span class="header-title">详细信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item
            v-for="(value, key) in resultData"
            :key="key"
            :label="formatColumnLabel(key)"
            :span="isLongValue(value) ? 2 : 1"
          >
            <template v-if="isDateField(key)">
              {{ formatDate(value) }}
            </template>
            <template v-else-if="isBooleanValue(value)">
              <el-tag :type="value ? 'success' : 'info'" size="small">
                {{ value ? '是' : '否' }}
              </el-tag>
            </template>
            <template v-else>
              {{ value }}
            </template>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- Fallback: 简洁的JSON展示 -->
    <div v-else class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><document /></el-icon>
            <span class="header-title">执行结果</span>
          </div>
        </template>
        <pre class="result-json">{{ JSON.stringify(resultData, null, 2) }}</pre>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  Right,
  InfoFilled,
  User,
  Odometer,
  Calendar,
  Connection,
  List,
  Warning,
  DataAnalysis,
  DataBoard
} from '@element-plus/icons-vue'

interface Props {
  result: any
}

const props = defineProps<Props>()
const router = useRouter()

// Extract actual data from result
const resultData = computed(() => {
  if (props.result?.data) return props.result.data
  if (props.result?.result) return props.result.result
  return props.result
})

// Type detection
const isCMDBL2DetailResult = computed(() => {
  const data = resultData.value
  return data?.l2_id && data?.cmdb_info && data?.transformation_info
})

const isApplicationListResult = computed(() => {
  return Array.isArray(resultData.value) &&
         resultData.value.length > 0 &&
         resultData.value[0]?.l2_id &&
         resultData.value[0]?.app_name
})

const isStatisticsResult = computed(() => {
  return Array.isArray(resultData.value) &&
         resultData.value.length > 0 &&
         Object.keys(resultData.value[0]).some(key =>
           key.includes('count') || key.includes('total') || key.includes('avg')
         )
})

const isTableData = computed(() => {
  return Array.isArray(resultData.value) && resultData.value.length > 0
})

const isObjectData = computed(() => {
  return typeof resultData.value === 'object' &&
         !Array.isArray(resultData.value) &&
         resultData.value !== null
})

// Navigation
const navigateToApplication = (l2Id: string) => {
  router.push({
    path: '/applications',
    query: { search: l2Id }
  })
}

const navigateToApplications = () => {
  router.push('/applications')
}

// Formatters
const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatColumnLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    'l2_id': 'L2 ID',
    'app_name': '应用名称',
    'overall_transformation_target': '改造目标',
    'current_status': '当前状态',
    'progress_percentage': '进度',
    'count': '数量',
    'total': '总计',
    'avg': '平均值'
  }
  return labelMap[key] || key
}

const formatNumber = (value: any) => {
  if (typeof value !== 'number') return value
  return value.toLocaleString('zh-CN')
}

const getColumnWidth = (key: string) => {
  if (key.includes('id')) return 140
  if (key.includes('name')) return 180
  if (key.includes('count') || key.includes('total')) return 100
  return 150
}

const isNumberColumn = (key: string) => {
  return key.includes('count') || key.includes('total') || key.includes('avg') || key.includes('percentage')
}

const isDateField = (key: string) => {
  return key.includes('date') || key.includes('time')
}

const isBooleanValue = (value: any) => {
  return typeof value === 'boolean'
}

const isLongValue = (value: any) => {
  if (typeof value === 'string' && value.length > 50) return true
  if (typeof value === 'object') return true
  return false
}

// Tag types
const getSystemStatusType = (status: string | undefined) => {
  if (!status) return 'info'
  if (status === '运行中') return 'success'
  if (status === '建设中') return 'warning'
  return 'info'
}

const getAcceptanceStatusType = (status: string | undefined) => {
  if (!status) return 'info'
  if (status === '已验收') return 'success'
  if (status === '待验收') return 'warning'
  return 'info'
}

const getTaskStatusType = (status: string | undefined) => {
  if (!status) return 'info'
  if (status === '子任务完成') return 'success'
  if (status.includes('进行中')) return 'primary'
  if (status.includes('阻塞')) return 'danger'
  return 'info'
}
</script>

<style scoped lang="scss">
.mcp-result-renderer {
  margin-top: 12px;
}

.result-container {
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

.section {
  margin-top: 20px;

  &:first-child {
    margin-top: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4e7ed;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.notes-content {
  margin: 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.result-json {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 400px;
  overflow: auto;
  margin: 0;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
  }
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
  background: #f5f7fa;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}
</style>
