<template>
  <el-dialog v-model="visible" title="延期详情" width="900px" @close="handleClose">
    <div style="min-height: 400px;">
      <!-- Loading Skeleton -->
      <div v-if="loading">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else>
        <!-- 延期统计 -->
        <div class="delay-summary">
          <el-alert type="warning" :closable="false">
            <template #title>
              <div class="summary-content">
                <span>该应用已延期 <strong>{{ data.totalDelayCount }}</strong> 次</span>
                <span class="total-delay-days">累计延期 <strong>{{ data.totalDelayDays }}</strong> 月</span>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 延期历史时间线 -->
        <div class="delay-timeline" v-if="data.delayHistory && data.delayHistory.length > 0">
          <h3>延期历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in data.delayHistory"
              :key="index"
              :timestamp="formatDate(item.date)"
              :type="item.type || 'primary'"
              placement="top"
            >
              <div class="delay-record">
                <div class="delay-header">
                  <el-tag size="small" :type="getDelayType(item.delayDays)">
                    延期 {{ Math.abs(item.delayDays) }} {{ item.delayUnit || '月' }}
                  </el-tag>
                  <span class="delay-phase">{{ getDelayPhaseLabel(item.phase) }}</span>
                </div>
                <div class="delay-content">
                  <div class="delay-dates">
                    <span class="original-date">原计划：{{ formatYearMonth(item.originalDate) || '未设置' }}</span>
                    <span class="arrow">→</span>
                    <span class="new-date">调整为：{{ item.newDate ? formatYearMonth(item.newDate) : '待确定' }}</span>
                  </div>
                  <div class="delay-reason" v-if="item.reason">
                    <span class="reason-label">延期原因：</span>
                    <span class="reason-text">{{ item.reason }}</span>
                  </div>
                  <div class="delay-footer">
                    <span class="operator">操作人：{{ item.operator || '系统' }}</span>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 各阶段延期统计 -->
        <div class="delay-statistics" v-if="data.phaseStatistics">
          <h3>各阶段延期统计</h3>
          <el-table :data="data.phaseStatistics" border>
            <el-table-column prop="phase" label="阶段" width="120">
              <template #default="{ row }">
                {{ getDelayPhaseLabel(row.phase) }}
              </template>
            </el-table-column>
            <el-table-column prop="delayCount" label="延期次数" width="100" align="center">
              <template #default="{ row }">
                <el-badge :value="row.delayCount" type="warning" />
              </template>
            </el-table-column>
            <el-table-column prop="totalDelayDays" label="累计延期月数" width="120" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.totalDelayDays > 3 }">
                  {{ row.totalDelayDays }} 月
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="currentStatus" label="当前状态" min-width="150">
              <template #default="{ row }">
                <div v-if="row.currentPlannedDate">
                  计划：{{ formatYearMonth(row.currentPlannedDate) }}
                  <el-tag
                    v-if="row.isDelayed"
                    type="danger"
                    size="small"
                    style="margin-left: 10px;"
                  >
                    延期中
                  </el-tag>
                </div>
                <div v-else>-</div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 延期原因分析 -->
        <div class="delay-analysis" v-if="data.reasonAnalysis && data.reasonAnalysis.length > 0">
          <h3>延期原因分析</h3>
          <div class="reason-tags">
            <el-tag
              v-for="(reason, index) in data.reasonAnalysis"
              :key="index"
              size="medium"
              style="margin: 5px;"
            >
              {{ reason.reason }}（{{ reason.count }}次）
            </el-tag>
          </div>
        </div>

        <!-- 无延期记录 -->
        <div v-if="!data.delayHistory || data.delayHistory.length === 0" class="no-delay-history">
          <el-empty description="该应用暂无延期记录" />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFormatters } from '@/composables/applications/useFormatters'
import { useDelayCalculations } from '@/composables/applications/useDelayCalculations'

interface DelayHistoryItem {
  date: string
  phase: string
  originalDate: string | null
  newDate: string | null
  delayDays: number
  delayUnit?: string
  reason?: string
  operator?: string
  type?: string
  isDelay?: boolean
}

interface PhaseStatistics {
  phase: string
  delayCount: number
  totalDelayDays: number
  currentPlannedDate?: string
  isDelayed?: boolean
}

interface ReasonAnalysis {
  reason: string
  count: number
}

interface DelayDetailsData {
  applicationName?: string
  l2Id?: string
  totalDelayCount: number
  totalDelayDays: number
  delayHistory: DelayHistoryItem[]
  phaseStatistics?: PhaseStatistics[]
  reasonAnalysis?: ReasonAnalysis[]
  currentDelayStatus?: string
}

const props = defineProps<{
  modelValue: boolean
  data: DelayDetailsData
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const {
  formatDate,
  formatYearMonth,
  getDelayPhaseLabel
} = useFormatters()

const {
  getDelayType
} = useDelayCalculations()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.delay-summary {
  margin-bottom: 20px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-delay-days {
  color: #f56565;
  margin-left: 20px;
}

/* 延期历史时间线 */
.delay-timeline {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.delay-timeline h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 16px;
}

.delay-record {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.delay-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.delay-phase {
  color: #4a5568;
  font-weight: 500;
}

.delay-content {
  padding: 10px 0;
}

.delay-dates {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.original-date {
  color: #a0aec0;
}

.new-date {
  color: #f56565;
  font-weight: 600;
}

.arrow {
  color: #718096;
  font-weight: bold;
}

.delay-reason {
  margin: 8px 0;
  padding: 8px;
  background: #f7fafc;
  border-radius: 4px;
  font-size: 13px;
}

.reason-label {
  color: #4a5568;
  font-weight: 500;
  margin-right: 8px;
}

.reason-text {
  color: #2d3748;
}

.delay-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #718096;
}

/* 各阶段延期统计 */
.delay-statistics {
  margin: 30px 0;
}

.delay-statistics h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.text-danger {
  color: #f56565;
  font-weight: 600;
}

/* 延期原因分析 */
.delay-analysis {
  margin: 30px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.delay-analysis h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.reason-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-delay-history {
  padding: 60px;
  text-align: center;
}
</style>
