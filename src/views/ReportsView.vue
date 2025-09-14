<template>
  <div class="reports-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>报表中心</h2>
          <div class="actions">
            <el-button type="primary">生成报表</el-button>
            <el-button type="warning">导出PDF</el-button>
          </div>
        </div>
      </template>

      <!-- Report Type Tabs -->
      <el-tabs v-model="activeTab" class="report-tabs">
        <el-tab-pane label="汇总报表" name="summary" />
        <el-tab-pane label="进度报表" name="progress" />
        <el-tab-pane label="延期分析" name="delay" />
        <el-tab-pane label="部门对比" name="department" />
      </el-tabs>

      <!-- Time Range Selection -->
      <div class="time-range">
        <el-button :type="timeRange === 'week' ? 'primary' : 'default'" @click="setTimeRange('week')">
          本周
        </el-button>
        <el-button :type="timeRange === 'month' ? 'primary' : 'default'" @click="setTimeRange('month')">
          本月
        </el-button>
        <el-button :type="timeRange === 'quarter' ? 'primary' : 'default'" @click="setTimeRange('quarter')">
          本季度
        </el-button>
        <el-button :type="timeRange === 'year' ? 'primary' : 'default'" @click="setTimeRange('year')">
          本年
        </el-button>
        <el-button :type="timeRange === 'custom' ? 'primary' : 'default'" @click="setTimeRange('custom')">
          自定义
        </el-button>
      </div>

      <!-- Charts Section -->
      <el-row :gutter="20" class="charts-section">
        <el-col :span="12">
          <el-card>
            <template #header>
              <h3>改造完成情况</h3>
            </template>
            <div class="chart-placeholder">
              环形图：已完成 vs 进行中 vs 未开始
              <div class="chart-note">
                图表将在连接后端API后显示真实数据
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <h3>月度进度趋势</h3>
            </template>
            <div class="chart-placeholder">
              柱状图：每月完成数量
              <div class="chart-note">
                图表将在连接后端API后显示真实数据
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Data Table -->
      <div class="data-section">
        <h3>详细数据</h3>
        <el-table :data="reportData" style="width: 100%">
          <el-table-column prop="department" label="部门" />
          <el-table-column prop="total" label="应用总数" />
          <el-table-column prop="completed" label="已完成" />
          <el-table-column prop="in_progress" label="进行中" />
          <el-table-column prop="not_started" label="未开始" />
          <el-table-column prop="completion_rate" label="完成率">
            <template #default="{ row }">
              <strong :class="getCompletionRateClass(row.completion_rate)">
                {{ row.completion_rate }}%
              </strong>
            </template>
          </el-table-column>
          <el-table-column prop="average_progress" label="平均进度">
            <template #default="{ row }">
              {{ row.average_progress }}%
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Export Options -->
      <el-card class="export-options">
        <template #header>
          <h4>导出选项</h4>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-checkbox v-model="exportOptions.includeCharts" label="包含图表" />
          </el-col>
          <el-col :span="8">
            <el-checkbox v-model="exportOptions.includeDetails" label="包含详细数据" />
          </el-col>
          <el-col :span="8">
            <el-checkbox v-model="exportOptions.includeRawData" label="包含原始数据" />
          </el-col>
        </el-row>
        <div class="export-actions">
          <el-button type="success" @click="exportExcel">
            📥 导出为Excel
          </el-button>
          <el-button type="primary" @click="exportPDF">
            📄 导出为PDF
          </el-button>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('summary')
const timeRange = ref('month')

const exportOptions = reactive({
  includeCharts: true,
  includeDetails: true,
  includeRawData: false
})

const reportData = ref([
  {
    department: '研发一部',
    total: 45,
    completed: 15,
    in_progress: 20,
    not_started: 10,
    completion_rate: 33.3,
    average_progress: 52
  },
  {
    department: '研发二部',
    total: 38,
    completed: 10,
    in_progress: 18,
    not_started: 10,
    completion_rate: 26.3,
    average_progress: 41
  },
  {
    department: '运维部',
    total: 25,
    completed: 8,
    in_progress: 12,
    not_started: 5,
    completion_rate: 32.0,
    average_progress: 48
  }
])

const setTimeRange = (range: string) => {
  timeRange.value = range
  ElMessage.info(`已切换到${getTimeRangeText(range)}`)
}

const getTimeRangeText = (range: string) => {
  const rangeMap: Record<string, string> = {
    'week': '本周',
    'month': '本月',
    'quarter': '本季度',
    'year': '本年',
    'custom': '自定义时间'
  }
  return rangeMap[range] || range
}

const getCompletionRateClass = (rate: number) => {
  if (rate >= 40) return 'success-rate'
  if (rate >= 30) return 'warning-rate'
  return 'danger-rate'
}

const exportExcel = () => {
  ElMessage.success('Excel导出功能将在连接后端API后生效')
}

const exportPDF = () => {
  ElMessage.success('PDF导出功能将在连接后端API后生效')
}
</script>

<style scoped>
.reports-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  color: #2d3748;
}

.report-tabs {
  margin-bottom: 20px;
}

.time-range {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-placeholder {
  height: 300px;
  background: linear-gradient(45deg, #f7fafc 25%, #e2e8f0 25%, #e2e8f0 50%, #f7fafc 50%, #f7fafc 75%, #e2e8f0 75%);
  background-size: 20px 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #718096;
  font-size: 16px;
  text-align: center;
}

.chart-note {
  color: #718096;
  margin-top: 10px;
  font-size: 14px;
}

.data-section {
  margin-bottom: 30px;
}

.data-section h3 {
  margin-bottom: 15px;
  color: #2d3748;
}

.success-rate {
  color: #48bb78;
}

.warning-rate {
  color: #ed8936;
}

.danger-rate {
  color: #e53e3e;
}

.export-options {
  margin-top: 30px;
}

.export-options h4 {
  margin: 0;
  color: #2d3748;
}

.export-actions {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}
</style>