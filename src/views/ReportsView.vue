<template>
  <div class="reports-view">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <h2>报表中心</h2>
          <div class="actions">
            <el-button type="primary" @click="generateReport" :loading="generating">
              {{ generating ? '生成中...' : '生成报表' }}
            </el-button>
            <el-dropdown split-button type="success" @click="showExportDialog" :loading="exporting">
              导出报表
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleExport('pdf')">📄 导出为PDF</el-dropdown-item>
                  <el-dropdown-item @click="handleExport('excel')">📥 导出为Excel</el-dropdown-item>
                  <el-dropdown-item @click="handleExport('html')">🌐 导出为HTML</el-dropdown-item>
                  <el-dropdown-item @click="handleExport('csv')">📊 导出为CSV</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- Report Type Tabs -->
      <el-tabs v-model="activeTab" class="report-tabs" @tab-change="handleTabChange">
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
        <el-button :type="timeRange === 'custom' ? 'primary' : 'default'" @click="showDatePicker = true">
          自定义
        </el-button>

        <!-- Custom Date Range Picker -->
        <el-dialog v-model="showDatePicker" title="选择日期范围" width="400px">
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
          <template #footer>
            <el-button @click="showDatePicker = false">取消</el-button>
            <el-button type="primary" @click="applyCustomDateRange">确定</el-button>
          </template>
        </el-dialog>
      </div>

      <!-- Charts Section -->
      <el-row :gutter="20" class="charts-section">
        <el-col :xs="24" :sm="24" :md="12">
          <el-card>
            <template #header>
              <h3>改造完成情况</h3>
            </template>
            <div ref="statusChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <el-card>
            <template #header>
              <h3>月度进度趋势</h3>
            </template>
            <div ref="progressChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Data Table -->
      <div class="data-section">
        <h3>{{ getTableTitle() }}</h3>

        <!-- Summary/Progress/Department Report Table -->
        <el-table v-if="activeTab !== 'delay'" :data="reportData" style="width: 100%">
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="total" label="应用总数" width="100" align="center" />
          <el-table-column prop="completed" label="已完成" width="90" align="center">
            <template #default="{ row }">
              <el-tag type="success">{{ row.completed }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="in_progress" label="进行中" width="90" align="center">
            <template #default="{ row }">
              <el-tag type="primary">{{ row.in_progress }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="not_started" label="未开始" width="90" align="center">
            <template #default="{ row }">
              <el-tag type="info">{{ row.not_started }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="blocked" label="阻塞中" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.blocked > 0" type="danger">{{ row.blocked }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="completion_rate" label="完成率" width="100" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="row.completion_rate"
                :color="getProgressColor(row.completion_rate)"
                :stroke-width="6"
                :format="(val) => `${val}%`"
              />
            </template>
          </el-table-column>
          <el-table-column prop="average_progress" label="平均进度" align="center">
            <template #default="{ row }">
              <strong :class="getCompletionRateClass(row.average_progress)">
                {{ row.average_progress }}%
              </strong>
            </template>
          </el-table-column>
        </el-table>

        <!-- Delay Report Table -->
        <el-table v-else :data="delayData" style="width: 100%">
          <el-table-column prop="application_id" label="应用ID" width="120" />
          <el-table-column prop="application_name" label="应用名称" min-width="200" />
          <el-table-column prop="responsible_team" label="负责团队" width="120" />
          <el-table-column prop="delay_days" label="延期天数" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDelayType(row.delay_days)">
                {{ row.delay_days }} 天
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="planned_end_date" label="计划完成日期" width="120" />
          <el-table-column prop="expected_end_date" label="预计完成日期" width="120" />
          <el-table-column prop="delay_reason" label="延期原因" min-width="200" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="text" @click="viewDelayDetails(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ReportsAPI, ExcelAPI, type ProgressSummaryResponse, type DelayedProjectsResponse } from '@/api/reports'
import { ApplicationsAPI } from '@/api/applications'
import { useChart, getStatusRingOptions, getMonthlyProgressOptions } from '@/composables/useCharts'

// State variables
const activeTab = ref('summary')
const timeRange = ref('month')
const loading = ref(false)
const generating = ref(false)
const exporting = ref(false)
const showDatePicker = ref(false)
const customDateRange = ref<[string, string]>(['', ''])

// Chart refs
const statusChartRef = ref<HTMLElement | null>(null)
const progressChartRef = ref<HTMLElement | null>(null)

// Data variables
const reportData = ref<any[]>([])
const delayData = ref<any[]>([])
const summaryData = ref<ProgressSummaryResponse | null>(null)
const delayedProjects = ref<DelayedProjectsResponse | null>(null)

const exportOptions = reactive({
  includeCharts: true,
  templateStyle: 'standard' as 'standard' | 'minimal' | 'detailed'
})

// Computed properties
const dateRange = computed(() => {
  const now = new Date()
  const start = new Date()
  const end = new Date()

  switch (timeRange.value) {
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
    case 'custom':
      if (customDateRange.value[0] && customDateRange.value[1]) {
        return {
          start: customDateRange.value[0],
          end: customDateRange.value[1]
        }
      }
      start.setMonth(now.getMonth() - 1)
      break
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
})

// Initialize charts
const { updateOptions: updateStatusChart } = useChart(statusChartRef, ref({}))
const { updateOptions: updateProgressChart } = useChart(progressChartRef, ref({}))

// Methods
const generateReport = async () => {
  generating.value = true
  try {
    await loadReportData()
    ElMessage.success('报表生成成功')
  } catch (error) {
    console.error('Failed to generate report:', error)
    ElMessage.error('报表生成失败')
  } finally {
    generating.value = false
  }
}

const loadReportData = async () => {
  loading.value = true
  try {
    switch (activeTab.value) {
      case 'summary':
        await loadSummaryReport()
        break
      case 'progress':
        await loadProgressReport()
        break
      case 'delay':
        await loadDelayReport()
        break
      case 'department':
        await loadDepartmentReport()
        break
    }
  } catch (error) {
    console.error('Failed to load report data:', error)
    ElMessage.error('加载报表数据失败')
  } finally {
    loading.value = false
  }
}

const loadSummaryReport = async () => {
  try {
    // Get progress summary from API
    const summary = await ReportsAPI.getProgressSummary({
      format: 'json',
      start_date: dateRange.value.start,
      end_date: dateRange.value.end
    })
    summaryData.value = summary

    // Get applications data for department breakdown
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    // Process data by department
    const departmentMap = new Map<string, any>()

    applications.items.forEach(app => {
      const dept = app.responsible_team || '未分配'
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          department: dept,
          total: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0,
          blocked: 0,
          total_progress: 0
        })
      }

      const deptData = departmentMap.get(dept)!
      deptData.total++
      deptData.total_progress += app.progress_percentage || 0

      // Count by status
      switch (app.status) {
        case '全部完成':
          deptData.completed++
          break
        case '研发进行中':
        case '业务上线中':
          deptData.in_progress++
          break
        case '待启动':
          deptData.not_started++
          break
        case '存在阻塞':
          deptData.blocked++
          break
      }
    })

    // Calculate rates
    reportData.value = Array.from(departmentMap.values()).map(dept => ({
      ...dept,
      completion_rate: dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0,
      average_progress: dept.total > 0 ? Math.round(dept.total_progress / dept.total) : 0
    }))

    // Update charts with actual data from applications
    let totalCompleted = 0
    let totalInProgress = 0
    let totalNotStarted = 0
    let totalBlocked = 0

    applications.items.forEach(app => {
      switch (app.overall_status || app.status) {
        case '全部完成':
        case 'completed':
          totalCompleted++
          break
        case '研发进行中':
        case '业务上线中':
        case 'in_progress':
          totalInProgress++
          break
        case '待启动':
        case 'not_started':
          totalNotStarted++
          break
        case '存在阻塞':
        case 'blocked':
          totalBlocked++
          break
      }
    })

    updateStatusChart(getStatusRingOptions({
      completed: totalCompleted,
      inProgress: totalInProgress,
      notStarted: totalNotStarted + totalBlocked
    }))

    // Generate monthly data for progress chart based on applications
    const monthlyData = generateMonthlyDataFromApplications(applications.items)
    updateProgressChart(getMonthlyProgressOptions(monthlyData))

  } catch (error) {
    console.error('Failed to load summary report:', error)
    throw error
  }
}

const loadProgressReport = async () => {
  await loadSummaryReport() // Reuse summary report data for progress view
}

const loadDelayReport = async () => {
  try {
    const delayed = await ReportsAPI.getDelayedProjects({
      format: 'json',
      threshold_days: 7
    })
    delayedProjects.value = delayed

    // Process delayed projects data
    delayData.value = delayed.data.map(project => ({
      application_id: project.application_id,
      application_name: project.application_name,
      delay_days: project.delay_days,
      responsible_team: project.delayed_subtasks[0]?.responsible_team || '未分配',
      planned_end_date: project.delayed_subtasks[0]?.planned_end_date || '-',
      expected_end_date: calculateExpectedDate(project.delayed_subtasks[0]?.planned_end_date, project.delay_days),
      delay_reason: project.delayed_subtasks[0]?.delay_reason || '待确认'
    }))

    // Update charts for delay analysis
    const delayDistribution = {
      completed: 0,
      inProgress: delayed.data.length,
      notStarted: 0
    }
    updateStatusChart(getStatusRingOptions(delayDistribution))

  } catch (error) {
    console.error('Failed to load delay report:', error)
    throw error
  }
}

const loadDepartmentReport = async () => {
  try {
    // Get team performance report
    const performance = await ReportsAPI.getTeamPerformance({
      format: 'json',
      period: timeRange.value === 'year' ? 'yearly' : timeRange.value === 'quarter' ? 'quarterly' : 'monthly'
    })

    // Process team performance data
    if (performance.metadata && performance.metadata.teams) {
      reportData.value = Object.entries(performance.metadata.teams).map(([team, data]: [string, any]) => ({
        department: team,
        total: data.total || 0,
        completed: data.completed || 0,
        in_progress: data.in_progress || 0,
        not_started: data.not_started || 0,
        blocked: data.blocked || 0,
        completion_rate: data.completion_rate || 0,
        average_progress: data.average_progress || 0
      }))
    }

  } catch (error) {
    console.error('Failed to load department report:', error)
    // Fallback to summary report data grouped by department
    await loadSummaryReport()
  }
}

const generateMonthlyData = () => {
  // 生成最近12个月的进度数据
  const months: string[] = []
  const values: number[] = []
  const today = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(date.getMonth() - i)

    // 格式化月份
    const month = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
    months.push(month)

    // 模拟进度数据（逐月增长）
    const baseProgress = 20
    const monthlyIncrease = 5
    const progress = Math.min(100, baseProgress + (11 - i) * monthlyIncrease)
    values.push(progress)
  }

  return { months, values }
}

const generateMonthlyDataFromApplications = (applications: any[]) => {
  // 基于应用数据生成月度进度
  const months: string[] = []
  const values: number[] = []
  const today = new Date()

  // 计算当前平均进度
  let currentAvgProgress = 0
  if (applications.length > 0) {
    const totalProgress = applications.reduce((sum, app) => sum + (app.progress_percentage || 0), 0)
    currentAvgProgress = Math.round(totalProgress / applications.length)
  }

  // 生成最近12个月的趋势
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(date.getMonth() - i)

    // 格式化月份
    const month = date.toLocaleDateString('zh-CN', { month: 'short' })
    months.push(month)

    // 模拟历史进度（从低到高）
    const historicalProgress = Math.max(0, currentAvgProgress - (i * 5))
    values.push(historicalProgress)
  }

  return { months, values }
}

const calculateExpectedDate = (plannedDate: string, delayDays: number) => {
  if (!plannedDate) return '-'
  const date = new Date(plannedDate)
  date.setDate(date.getDate() + delayDays)
  return date.toISOString().split('T')[0]
}

const handleTabChange = () => {
  loadReportData()
}

const setTimeRange = (range: string) => {
  timeRange.value = range
  if (range !== 'custom') {
    loadReportData()
    ElMessage.info(`已切换到${getTimeRangeText(range)}`)
  }
}

const applyCustomDateRange = () => {
  if (customDateRange.value[0] && customDateRange.value[1]) {
    timeRange.value = 'custom'
    showDatePicker.value = false
    loadReportData()
    ElMessage.success('已应用自定义日期范围')
  } else {
    ElMessage.warning('请选择日期范围')
  }
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

const getTableTitle = () => {
  const titles: Record<string, string> = {
    'summary': '部门汇总数据',
    'progress': '进度详细数据',
    'delay': '延期项目清单',
    'department': '部门对比数据'
  }
  return titles[activeTab.value] || '详细数据'
}

const getCompletionRateClass = (rate: number) => {
  if (rate >= 70) return 'success-rate'
  if (rate >= 40) return 'warning-rate'
  return 'danger-rate'
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return '#48bb78'
  if (percentage >= 40) return '#ed8936'
  return '#f56565'
}

const getDelayType = (days: number) => {
  if (days <= 7) return 'warning'
  if (days <= 14) return 'danger'
  return 'danger'
}

const viewDelayDetails = (row: any) => {
  ElMessageBox.alert(
    `项目: ${row.application_name}<br/>
    延期天数: ${row.delay_days} 天<br/>
    计划完成: ${row.planned_end_date}<br/>
    预计完成: ${row.expected_end_date}<br/>
    延期原因: ${row.delay_reason}`,
    '延期详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

// Get current report data for export
const getCurrentReportData = () => {
  const reportType = activeTab.value === 'summary' ? 'progress_summary' :
                    activeTab.value === 'delay' ? 'delayed_projects' :
                    activeTab.value === 'department' ? 'department_comparison' :
                    'progress_summary'

  let currentReportData: any = {}

  if (reportType === 'progress_summary' && summaryData.value) {
    currentReportData = {
      metadata: summaryData.value.metadata,
      department_data: reportData.value,
      time_range: dateRange.value
    }
  } else if (reportType === 'delayed_projects' && delayedProjects.value) {
    currentReportData = {
      delayed_projects: delayedProjects.value.data,
      total_delayed: delayedProjects.value.data.length,
      time_range: dateRange.value
    }
  } else if (reportType === 'department_comparison') {
    currentReportData = {
      department_data: reportData.value,
      time_range: dateRange.value
    }
  }

  return { reportType, reportData: currentReportData }
}

// Show export dialog (for split button main click)
const showExportDialog = () => {
  ElMessage.info('请选择导出格式')
}

// Unified export handler
const handleExport = async (format: 'pdf' | 'excel' | 'html' | 'csv') => {
  exporting.value = true
  try {
    const { reportType, reportData } = getCurrentReportData()

    console.log('🔍 [ReportsView] Starting export:', {
      format,
      reportType,
      reportData
    })

    const response = await ReportsAPI.exportReport({
      report_type: reportType as any,
      export_format: format,
      report_data: reportData,
      template_style: exportOptions.templateStyle,
      include_charts: format === 'excel' ? exportOptions.includeCharts : false
    })

    console.log('📊 [ReportsView] Export response:', response)

    if (response.success && response.download_url) {
      const fileExtension = format === 'excel' ? 'xlsx' : format
      const filename = `${response.file_name || `report_${activeTab.value}_${Date.now()}.${fileExtension}`}`

      await ReportsAPI.downloadFile(response.download_url, filename)
      ElMessage.success(`${format.toUpperCase()}导出成功`)
    } else {
      throw new Error('Export response missing download URL')
    }
  } catch (error: any) {
    console.error('❌ [ReportsView] Export failed:', error)
    if (error?.response?.status === 404) {
      ElMessage.error('导出功能暂不可用，请稍后重试')
    } else if (error?.response?.data?.detail) {
      ElMessage.error(`导出失败: ${error.response.data.detail}`)
    } else {
      ElMessage.error(`${format.toUpperCase()}导出失败: ${error?.message || '未知错误'}`)
    }
  } finally {
    exporting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadReportData()
})
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

</style>