<template>
  <el-dialog v-model="visible" title="计划调整历史" width="900px" @close="handleClose">
    <div style="min-height: 400px;">
      <!-- Loading Skeleton -->
      <div v-if="loading">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else>
        <!-- 调整统计 -->
        <div class="adjustment-summary">
          <el-alert type="warning" :closable="false">
            <template #title>
              <div class="summary-content">
                <span>该应用计划已调整 <strong>{{ data.planHistory.length }}</strong> 次</span>
                <span v-if="data.currentPlanAdjustment" class="latest-adjustment">
                  最近调整：{{ formatDate(data.currentPlanAdjustment.adjusted_at) }}
                </span>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 时间线对比视图 -->
        <div class="timeline-comparison" v-if="data.planHistory.length > 0">
          <h3>计划时间线对比</h3>
          <div class="timeline-chart">
            <div class="timeline-row" v-for="(history, index) in data.planHistory" :key="index">
              <div class="timeline-label">
                <div class="version-label">
                  <el-tag v-if="index === 0" type="success" size="small">当前</el-tag>
                  <el-tag v-else size="small">第{{ data.planHistory.length - index }}次</el-tag>
                </div>
                <div class="adjust-info">
                  <div class="adjust-date">{{ formatDate(history.adjusted_at) }}</div>
                  <div class="adjust-user">{{ history.adjusted_by }}</div>
                </div>
              </div>
              <div class="timeline-content">
                <div class="timeline-bar">
                  <div class="phase-block requirement" :style="getPhaseStyle(history, 'requirement')">
                    <span>需求</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_requirement_date) }}</span>
                  </div>
                  <div class="phase-block release" :style="getPhaseStyle(history, 'release')">
                    <span>发版</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_release_date) }}</span>
                  </div>
                  <div class="phase-block tech" :style="getPhaseStyle(history, 'tech')">
                    <span>技术上线</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_tech_online_date) }}</span>
                  </div>
                  <div class="phase-block biz" :style="getPhaseStyle(history, 'biz')">
                    <span>业务上线</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_biz_online_date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 调整明细 -->
        <div class="adjustment-details" v-if="data.adjustmentDetails.length > 0">
          <h3>调整明细</h3>
          <el-table :data="data.adjustmentDetails" border>
            <el-table-column prop="adjusted_at" label="调整时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.adjusted_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="adjusted_by" label="调整人" width="100" />
            <el-table-column prop="field" label="调整项" width="120">
              <template #default="{ row }">
                {{ getAdjustmentFieldLabel(row.field) }}
              </template>
            </el-table-column>
            <el-table-column prop="old_date" label="原计划" width="100">
              <template #default="{ row }">
                <span class="old-date">{{ formatYearMonth(row.old_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="new_date" label="新计划" width="100">
              <template #default="{ row }">
                <span class="new-date">{{ formatYearMonth(row.new_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="delay_days" label="延期月数" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.delay_days > 0" type="danger" size="small">
                  +{{ row.delay_days }}月
                </el-tag>
                <el-tag v-else-if="row.delay_days < 0" type="success" size="small">
                  {{ row.delay_days }}月
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="调整原因" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 无调整记录 -->
        <div v-if="data.planHistory.length === 0" class="no-adjustment-history">
          <el-empty description="该应用暂无计划调整记录" />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/applications/useFormatters'

interface PlanHistoryItem {
  adjusted_at: string
  adjusted_by: string
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  is_current?: boolean
}

interface AdjustmentDetail {
  adjusted_at: string
  adjusted_by: string
  field: string
  old_date: string
  new_date: string
  delay_days: number
  reason: string
}

interface PlanHistoryData {
  planHistory: PlanHistoryItem[]
  adjustmentDetails: AdjustmentDetail[]
  currentPlanAdjustment?: PlanHistoryItem
}

const props = defineProps<{
  modelValue: boolean
  data: PlanHistoryData
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const {
  formatDate,
  formatYearMonth,
  getAdjustmentFieldLabel
} = useFormatters()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
  visible.value = false
}

// Get phase style for timeline chart
const getPhaseStyle = (history: PlanHistoryItem, phase: string) => {
  const fieldMap: Record<string, string> = {
    'requirement': 'planned_requirement_date',
    'release': 'planned_release_date',
    'tech': 'planned_tech_online_date',
    'biz': 'planned_biz_online_date'
  }

  const date = (history as any)[fieldMap[phase]]
  if (!date) return { visibility: 'hidden' }

  // Calculate position based on date
  // This is simplified - in production you'd calculate actual positions
  return {}
}
</script>

<style scoped>
.adjustment-summary {
  margin-bottom: 20px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.latest-adjustment {
  font-size: 12px;
  color: #718096;
  margin-left: 20px;
}

/* 时间线对比视图 */
.timeline-comparison {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.timeline-comparison h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 16px;
}

.timeline-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timeline-label {
  width: 150px;
  flex-shrink: 0;
}

.version-label {
  margin-bottom: 5px;
}

.adjust-info {
  font-size: 12px;
  color: #718096;
}

.adjust-date {
  margin-bottom: 2px;
}

.adjust-user {
  color: #4a5568;
}

.timeline-content {
  flex: 1;
  overflow-x: auto;
}

.timeline-bar {
  display: flex;
  gap: 10px;
  min-width: 600px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 4px;
  position: relative;
}

.phase-block {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-block.requirement {
  border-left: 3px solid #667eea;
}

.phase-block.release {
  border-left: 3px solid #48bb78;
}

.phase-block.tech {
  border-left: 3px solid #ed8936;
}

.phase-block.biz {
  border-left: 3px solid #f56565;
}

.phase-date {
  font-weight: 600;
  color: #2d3748;
}

/* 调整明细表格 */
.adjustment-details {
  margin-top: 30px;
}

.adjustment-details h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.old-date {
  color: #a0aec0;
  text-decoration: line-through;
}

.new-date {
  color: #48bb78;
  font-weight: 600;
}

.no-adjustment-history {
  padding: 40px;
  text-align: center;
}
</style>
