<template>
  <div class="mcp-result-renderer">
    <!-- 应用列表结果 - 直接使用ApplicationsTable组件 -->
    <div v-if="isApplicationListResult" class="result-container">
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

        <!-- 直接复用ApplicationsTable组件 -->
        <ApplicationsTable
          :applications="resultData"
          :table-max-height="600"
          :has-date-adjustment="() => false"
          :get-delay-count="getDelayCount"
          @selection-change="() => {}"
          @toggle-favorite="() => {}"
          @show-detail="navigateToApplicationByRow"
          @view-subtasks="navigateToApplicationByRow"
          @show-delay-details="() => {}"
          @edit="navigateToApplicationByRow"
        />
      </el-card>
    </div>

    <!-- CMDB L2应用详情 (如CI000088398) -->
    <div v-else-if="isCMDBL2DetailResult" class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><document /></el-icon>
            <span class="header-title">{{ resultData.l2_id }} - {{ resultData.cmdb_info?.short_name }}</span>
            <div class="header-actions">
              <el-button
                size="small"
                type="primary"
                @click="navigateToApplication(resultData.l2_id)"
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
              {{ resultData.cmdb_info?.config_id }}
            </el-descriptions-item>
            <el-descriptions-item label="规范名称">
              {{ resultData.cmdb_info?.short_name }}
            </el-descriptions-item>
            <el-descriptions-item label="英文名称">
              {{ resultData.cmdb_info?.english_name }}
            </el-descriptions-item>
            <el-descriptions-item label="系统状态">
              <el-tag :type="getSystemStatusType(resultData.cmdb_info?.system_status)">
                {{ resultData.cmdb_info?.system_status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="管理级别">
              <el-tag type="warning">
                {{ resultData.cmdb_info?.management_level }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="系统产权">
              {{ resultData.cmdb_info?.system_ownership }}
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
              {{ resultData.cmdb_info?.business_supervisor_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人">
              {{ resultData.cmdb_info?.contact_person }}
            </el-descriptions-item>
            <el-descriptions-item label="开发单位">
              {{ resultData.cmdb_info?.dev_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="开发接口人">
              <el-text type="primary">{{ resultData.cmdb_info?.dev_contact }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="运维单位">
              {{ resultData.cmdb_info?.ops_unit }}
            </el-descriptions-item>
            <el-descriptions-item label="运维接口人">
              <el-text type="primary">{{ resultData.cmdb_info?.ops_contact }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 改造信息 -->
        <div class="section" v-if="resultData.transformation_info">
          <h4 class="section-title">
            <el-icon><odometer /></el-icon>
            改造进度
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="监管年份">
              {{ resultData.transformation_info.ak_supervision_acceptance_year }}年
            </el-descriptions-item>
            <el-descriptions-item label="改造目标">
              <el-tag :type="resultData.transformation_info.overall_transformation_target === 'AK' ? 'primary' : 'success'">
                {{ resultData.transformation_info.overall_transformation_target }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="AK改造状态">
              <el-tag :type="resultData.transformation_info.is_ak_completed ? 'success' : 'warning'">
                {{ resultData.transformation_info.is_ak_completed ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="云原生改造状态">
              <el-tag :type="resultData.transformation_info.is_cloud_native_completed ? 'success' : 'warning'">
                {{ resultData.transformation_info.is_cloud_native_completed ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              {{ resultData.transformation_info.current_status }}
            </el-descriptions-item>
            <el-descriptions-item label="应用等级">
              第{{ resultData.transformation_info.app_tier }}级
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 延期状态 -->
        <div class="section" v-if="resultData.cmdb_info">
          <h4 class="section-title">
            <el-icon><calendar /></el-icon>
            上线时间
          </h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="计划业务上线">
              {{ formatDate(resultData.cmdb_info.planned_biz_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="实际业务上线">
              {{ formatDate(resultData.cmdb_info.actual_biz_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="延期状态">
              <el-tag :type="resultData.cmdb_info.is_delayed ? 'danger' : 'success'">
                {{ resultData.cmdb_info.is_delayed ? `延期${resultData.cmdb_info.delay_days}天` : '正常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="验收状态">
              <el-tag :type="getAcceptanceStatusType(resultData.cmdb_info.acceptance_status)">
                {{ resultData.cmdb_info.acceptance_status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- L1系统关联 -->
        <div class="section" v-if="resultData.l1_systems">
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
                    {{ resultData.l1_systems.l1_156?.short_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="管理级别">
                    <el-tag type="warning">{{ resultData.l1_systems.l1_156?.management_level }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="所属域">
                    {{ resultData.l1_systems.l1_156?.belongs_to_domain }}
                  </el-descriptions-item>
                  <el-descriptions-item label="所属层">
                    {{ resultData.l1_systems.l1_156?.belongs_to_layer }}
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
                    {{ resultData.l1_systems.l1_87?.short_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="管理级别">
                    <el-tag type="warning">{{ resultData.l1_systems.l1_87?.management_level }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="所属域">
                    {{ resultData.l1_systems.l1_87?.belongs_to_domain }}
                  </el-descriptions-item>
                  <el-descriptions-item label="关键系统">
                    <el-tag :type="resultData.l1_systems.l1_87?.is_critical_system ? 'danger' : 'info'" size="small">
                      {{ resultData.l1_systems.l1_87?.is_critical_system ? '是' : '否' }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 子任务列表 -->
        <div class="section" v-if="resultData.subtasks && resultData.subtasks.length > 0">
          <h4 class="section-title">
            <el-icon><list /></el-icon>
            子任务详情 ({{ resultData.subtasks.length }}个)
          </h4>
          <el-table :data="resultData.subtasks" border stripe>
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
        <div class="section" v-if="resultData.cmdb_info?.notes">
          <h4 class="section-title">
            <el-icon><warning /></el-icon>
            备注与风险提示
          </h4>
          <el-alert
            type="warning"
            :closable="false"
            show-icon
          >
            <pre class="notes-content">{{ resultData.cmdb_info.notes }}</pre>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- 其他数据：显示调试信息 -->
    <div v-else class="result-container">
      <el-card shadow="hover">
        <template #header>
          <div class="result-header">
            <el-icon :size="18"><warning /></el-icon>
            <span class="header-title">数据格式待优化</span>
            <div class="header-actions">
              <el-button size="small" type="primary" @click="navigateToApplications">
                前往应用管理
              </el-button>
            </div>
          </div>
        </template>

        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          <template #title>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>此数据格式暂不支持可视化展示</span>
            </div>
          </template>
          <div style="margin-top: 8px; font-size: 13px; line-height: 1.6;">
            <p>检测到的数据类型：{{ getDataType() }}</p>
            <p v-if="Array.isArray(resultData)">数组长度：{{ resultData.length }}</p>
            <p v-if="resultData && typeof resultData === 'object' && !Array.isArray(resultData)">
              对象键：{{ Object.keys(resultData).slice(0, 10).join(', ') }}{{ Object.keys(resultData).length > 10 ? '...' : '' }}
            </p>
          </div>
        </el-alert>

        <!-- 简洁的数据预览 -->
        <el-collapse>
          <el-collapse-item title="查看原始数据（调试用）" name="1">
            <pre style="background: #f5f7fa; padding: 12px; border-radius: 4px; font-size: 12px; max-height: 400px; overflow: auto;">{{ JSON.stringify(resultData, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
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
  Warning
} from '@element-plus/icons-vue'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'
import type { Application } from '@/api/applications'

interface Props {
  result: any
}

const props = defineProps<Props>()
const router = useRouter()

// Extract actual data from result - 智能处理多层嵌套
const resultData = computed(() => {
  let data = props.result

  // 处理三层嵌套：{ success: true, result: { result: { success: true, data: {...} } } }
  if (data?.result?.result?.data) {
    return data.result.result.data
  }

  // 处理多层嵌套：{ result: { success: true, data: {...} } }
  if (data?.result?.data) {
    return data.result.data
  }

  // 处理标准嵌套：{ success: true, data: {...} }
  if (data?.data) {
    return data.data
  }

  // 处理单层嵌套：{ result: {...} }
  if (data?.result) {
    return data.result
  }

  // 直接返回原始数据
  return data
})

// Type detection
const isCMDBL2DetailResult = computed(() => {
  const data = resultData.value
  return !!(data?.l2_id && data?.cmdb_info && data?.transformation_info)
})

const isApplicationListResult = computed(() => {
  return Array.isArray(resultData.value) &&
         resultData.value.length > 0 &&
         resultData.value[0]?.l2_id &&
         resultData.value[0]?.app_name
})

// Navigation
const navigateToApplication = (l2Id: string) => {
  router.push({
    path: '/applications',
    query: { search: l2Id }
  })
}

const navigateToApplicationByRow = (app: Application) => {
  navigateToApplication(app.l2_id)
}

const navigateToApplications = () => {
  router.push('/applications')
}

// Helper for ApplicationsTable
const getDelayCount = (row: Application): number => {
  // 简单返回0，ApplicationsTable会自己计算
  return 0
}

// Helper for debugging
const getDataType = () => {
  const data = resultData.value
  if (data === null) return 'null'
  if (data === undefined) return 'undefined'
  if (Array.isArray(data)) return `数组 (${data.length}项)`
  if (typeof data === 'object') return `对象 (${Object.keys(data).length}个键)`
  return typeof data
}

// Formatters
const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
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
