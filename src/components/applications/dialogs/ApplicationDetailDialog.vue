<template>
  <el-dialog v-model="visible" title="应用详情" width="900px" @close="handleClose">
    <el-tabs v-model="activeTab" type="card">
      <!-- 基础信息 -->
      <el-tab-pane label="基础信息" name="basic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="L2 ID" label-align="right">
            <strong>{{ data.l2_id }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="应用名称" label-align="right">
            {{ data.app_name }}
          </el-descriptions-item>
          <el-descriptions-item label="所属L1" label-align="right">
            {{ data.belonging_l1_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属项目" label-align="right">
            {{ data.belonging_projects || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属指标" label-align="right">
            {{ data.belonging_kpi || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="应用档位" label-align="right">
            {{ data.app_tier || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="监管验收年份" label-align="right">
            {{ data.ak_supervision_acceptance_year ? data.ak_supervision_acceptance_year + '年' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="改造目标" label-align="right">
            <el-tag :type="data.overall_transformation_target === 'AK' ? 'primary' : 'success'" size="small">
              {{ data.overall_transformation_target || 'AK' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前改造阶段" label-align="right">
            {{ data.current_transformation_phase || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="验收状态" label-align="right">
            <el-tag v-if="data.acceptance_status"
                   :type="data.acceptance_status === '已验收' ? 'success' : 'warning'"
                   size="small">
              {{ data.acceptance_status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 团队信息 -->
      <el-tab-pane label="团队信息" name="team">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="开发模式" label-align="right">
            {{ data.dev_mode || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="运维模式" label-align="right">
            {{ data.ops_mode || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="开发负责人" label-align="right">
            {{ data.dev_owner || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="开发团队" label-align="right">
            {{ data.dev_team || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="运维负责人" label-align="right">
            {{ data.ops_owner || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="运维团队" label-align="right">
            {{ data.ops_team || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 时间进度 -->
      <el-tab-pane label="时间进度" name="timeline">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="【计划】需求完成" label-align="right">
            {{ formatYearMonth(data.planned_requirement_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】需求到达" label-align="right">
            <span :style="{ color: data.actual_requirement_date ? '#48bb78' : '#999' }">
              {{ formatYearMonth(data.actual_requirement_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】发版时间" label-align="right">
            {{ formatYearMonth(data.planned_release_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】发版时间" label-align="right">
            <span :style="{ color: data.actual_release_date ? '#48bb78' : '#999' }">
              {{ formatYearMonth(data.actual_release_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】技术上线" label-align="right">
            {{ formatYearMonth(data.planned_tech_online_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】技术上线" label-align="right">
            <span :style="{ color: data.actual_tech_online_date ? '#48bb78' : '#999' }">
              {{ formatYearMonth(data.actual_tech_online_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】业务上线" label-align="right">
            {{ formatYearMonth(data.planned_biz_online_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】业务上线" label-align="right">
            <span :style="{ color: data.actual_biz_online_date ? '#48bb78' : '#999' }">
              {{ formatYearMonth(data.actual_biz_online_date) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 进度状态 -->
      <el-tab-pane label="进度状态" name="progress">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="整体进度" label-align="right">
            <el-progress :percentage="data.progress_percentage || 0" :color="getProgressColor(data)" style="width: 200px;" />
          </el-descriptions-item>
          <el-descriptions-item label="子任务统计" label-align="right">
            {{ data.completed_subtask_count || 0 }} / {{ data.subtask_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="延期状态" label-align="right">
            <el-tag v-if="data.is_delayed" type="danger" size="small">
              延期 {{ data.delay_days }} 月
            </el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态" label-align="right">
            <el-tag :type="getStatusType(data.current_status)" size="small">
              {{ data.current_status || '待启动' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="域AK改造" label-align="right">
            <el-tag :type="data.is_domain_transformation_completed ? 'success' : 'info'" size="small">
              {{ data.is_domain_transformation_completed ? '完成' : '未完成' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="DBPM改造" label-align="right">
            <el-tag :type="data.is_dbpm_transformation_completed ? 'success' : 'info'" size="small">
              {{ data.is_dbpm_transformation_completed ? '完成' : '未完成' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 其他信息 -->
      <el-tab-pane label="其他信息" name="other">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="创建时间" label-align="right">
            {{ formatDate(data.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" label-align="right">
            {{ formatDate(data.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" label-align="right" :span="2">
            {{ data.notes || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 操作记录 -->
      <el-tab-pane label="操作记录" name="audit" lazy>
        <div style="min-height: 300px;">
          <!-- Loading Skeleton -->
          <div v-if="auditLoading">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="auditRecords.length === 0" class="audit-empty">
            <el-empty description="暂无操作记录" />
          </div>
          <el-timeline v-else>
            <el-timeline-item
              v-for="(record, index) in auditRecords"
              :key="record?.id || `audit-${index}`"
              :timestamp="formatDate(record?.created_at)"
              placement="top"
            >
              <div class="audit-record">
                <div class="audit-header">
                  <span class="audit-user">{{ record?.user_full_name || '系统' }}</span>
                  <el-tag size="small" :type="getOperationType(record?.operation)">
                    {{ getOperationText(record?.operation) }}
                  </el-tag>
                </div>
                <div class="audit-changes" v-if="record?.changed_fields && record?.changed_fields.length > 0">
                  <div class="change-item" v-for="(field, fieldIndex) in record.changed_fields" :key="`${field}-${fieldIndex}`">
                    <span class="field-name">{{ getFieldLabel(field) }}:</span>
                    <span class="old-value" v-if="record?.old_values && record?.old_values[field] !== undefined">
                      {{ formatFieldValue(field, record?.old_values[field]) }}
                    </span>
                    <span class="arrow" v-if="record?.old_values && record?.old_values[field] !== undefined">→</span>
                    <span class="new-value" v-if="record?.new_values && record?.new_values[field] !== undefined">
                      {{ formatFieldValue(field, record?.new_values[field]) }}
                    </span>
                  </div>
                </div>
                <div class="audit-footer" v-if="canRollback(record)">
                  <el-button
                    v-if="record?.operation !== 'DELETE'"
                    size="small"
                    type="warning"
                    @click="$emit('rollback', record)"
                  >
                    回滚此操作
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Application } from '@/api/applications'
import type { AuditLog } from '@/api/audit'
import { useFormatters } from '@/composables/applications/useFormatters'
import { useStatusHelpers } from '@/composables/applications/useStatusHelpers'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  modelValue: boolean
  data: Partial<Application>
  auditRecords: AuditLog[]
  auditLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'rollback': [record: AuditLog]
  'loadAudit': [applicationId: number]
}>()

const {
  formatDate,
  formatYearMonth,
  formatFieldValue,
  getFieldLabel
} = useFormatters()

const {
  getStatusType,
  getProgressColor,
  getOperationType,
  getOperationText
} = useStatusHelpers()

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.hasRole('ADMIN'))

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('basic')

const canRollback = (record: AuditLog) => {
  if (!record || !record.id || !record.created_at || !isAdmin.value) return false

  // Only allow rollback of recent operations (within 7 days)
  const recordDate = new Date(record.created_at)
  const now = new Date()
  const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= 7
}

const handleClose = () => {
  visible.value = false
  activeTab.value = 'basic'
}

// Load audit records when switching to audit tab
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'audit' && props.data.id && props.auditRecords.length === 0) {
    emit('loadAudit', props.data.id)
  }
})
</script>

<style scoped>
.audit-empty {
  padding: 40px 0;
  text-align: center;
}

.audit-record {
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 10px;
}

.audit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.audit-user {
  font-weight: 600;
  color: #2d3748;
}

.audit-changes {
  padding: 8px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin: 10px 0;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.field-name {
  font-weight: 500;
  color: #4a5568;
  min-width: 100px;
}

.old-value {
  color: #a0aec0;
  text-decoration: line-through;
}

.arrow {
  color: #718096;
  font-weight: bold;
}

.new-value {
  color: #48bb78;
  font-weight: 500;
}

.audit-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}
</style>
