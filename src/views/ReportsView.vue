<template>
  <div class="reports-view">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <h2>报表中心</h2>
          <div class="actions">
            <el-button type="primary" @click="generateReport" :loading="generating">
              {{ generating ? '生成中...' : '刷新报表' }}
            </el-button>
            <el-button type="success" @click="exportReport" :loading="exporting">
              导出报表
            </el-button>
          </div>
        </div>
      </template>

      <!-- Report Type Tabs (移除部门对比) -->
      <el-tabs v-model="activeTab" class="report-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="汇总报表" name="summary" />
        <el-tab-pane label="项目进度" name="progress" />
        <el-tab-pane label="延期分析" name="delay" />
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
        <el-button :type="timeRange === 'all' ? 'primary' : 'default'" @click="setTimeRange('all')">
          全部
        </el-button>
      </div>

      <!-- Summary Report -->
      <div v-if="activeTab === 'summary'">
        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-value">{{ summaryStats.total }}</div>
              <div class="stat-label">应用总数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card success">
              <div class="stat-value">{{ summaryStats.completed }}</div>
              <div class="stat-label">已完成</div>
              <div class="stat-percentage">{{ summaryStats.completionRate }}%</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card warning">
              <div class="stat-value">{{ summaryStats.inProgress }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card danger">
              <div class="stat-value">{{ summaryStats.delayed }}</div>
              <div class="stat-label">已延期</div>
            </div>
          </el-col>
        </el-row>

        <!-- Charts Section -->
        <el-row :gutter="20" class="charts-section">
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>改造类型分布</h3>
              </template>
              <div ref="typeChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>月度完成趋势</h3>
              </template>
              <div ref="trendChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 项目维度统计 -->
        <el-card class="project-stats">
          <template #header>
            <h3>项目完成情况</h3>
          </template>
          <div ref="projectChartRef" style="height: 400px;"></div>
        </el-card>
      </div>

      <!-- Progress Report -->
      <div v-if="activeTab === 'progress'">
        <!-- 进度分布饼图 -->
        <el-row :gutter="20" class="charts-section">
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>进度分布</h3>
              </template>
              <div ref="progressDistChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>阶段完成情况</h3>
              </template>
              <div ref="phaseChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Progress Table -->
        <el-table :data="progressData" style="width: 100%; margin-top: 20px;">
          <el-table-column prop="projectName" label="项目名称" min-width="200" />
          <el-table-column prop="totalApps" label="应用数" width="100" align="center" />
          <el-table-column prop="requirement" label="需求完成" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="info">{{ row.requirement }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="release" label="发版完成" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="warning">{{ row.release }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="techOnline" label="技术上线" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary">{{ row.techOnline }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bizOnline" label="业务上线" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="success">{{ row.bizOnline }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="averageProgress" label="平均进度" width="120" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="row.averageProgress"
                :color="getProgressColor(row.averageProgress)"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Delay Report -->
      <div v-if="activeTab === 'delay'">
        <!-- 延期统计 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :xs="24" :sm="8">
            <div class="stat-card danger">
              <div class="stat-value">{{ delayStats.totalDelayed }}</div>
              <div class="stat-label">延期应用数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="stat-card warning">
              <div class="stat-value">{{ delayStats.avgDelayDays }}</div>
              <div class="stat-label">平均延期天数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="stat-card">
              <div class="stat-value">{{ delayStats.maxDelayDays }}</div>
              <div class="stat-label">最长延期天数</div>
            </div>
          </el-col>
        </el-row>

        <!-- Delay Table -->
        <el-table :data="delayData" style="width: 100%; margin-top: 20px;">
          <el-table-column prop="l2Id" label="L2 ID" width="100" />
          <el-table-column prop="appName" label="应用名称" min-width="200" />
          <el-table-column prop="projectName" label="所属项目" min-width="200" />
          <el-table-column prop="currentPhase" label="当前阶段" width="120">
            <template #default="{ row }">
              <el-tag :type="getPhaseType(row.currentPhase)">{{ row.currentPhase }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="delayDays" label="延期天数" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDelayType(row.delayDays)">
                {{ row.delayDays }} 天
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="plannedDate" label="计划完成" width="110" />
          <el-table-column prop="expectedDate" label="预计完成" width="110" />
          <el-table-column prop="delayReason" label="延期原因" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ApplicationsAPI } from '@/api/applications'
import { SubTasksAPI } from '@/api/subtasks'
import { DashboardAPI } from '@/api/dashboard'
import { ExcelAPI } from '@/api/excel'
import { useChart } from '@/composables/useCharts'
import * as echarts from 'echarts'

// State variables
const activeTab = ref('summary')
const timeRange = ref('month')
const loading = ref(false)
const generating = ref(false)
const exporting = ref(false)

// Chart refs
const typeChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const projectChartRef = ref<HTMLElement | null>(null)
const progressDistChartRef = ref<HTMLElement | null>(null)
const phaseChartRef = ref<HTMLElement | null>(null)

// Initialize charts
const { refresh: refreshTypeChart } = useChart(typeChartRef, computed(() => getTypeChartOptions()))
const { refresh: refreshTrendChart } = useChart(trendChartRef, computed(() => getTrendChartOptions()))
const { refresh: refreshProjectChart } = useChart(projectChartRef, computed(() => getProjectChartOptions()))
const { refresh: refreshProgressDistChart } = useChart(progressDistChartRef, computed(() => getProgressDistChartOptions()))
const { refresh: refreshPhaseChart } = useChart(phaseChartRef, computed(() => getPhaseChartOptions()))

// Data
const summaryStats = reactive({
  total: 0,
  completed: 0,
  inProgress: 0,
  delayed: 0,
  completionRate: 0
})

const delayStats = reactive({
  totalDelayed: 0,
  avgDelayDays: 0,
  maxDelayDays: 0
})

const progressData = ref<any[]>([])
const delayData = ref<any[]>([])
const chartData = reactive({
  typeDistribution: [] as any[],
  monthlyTrend: [] as any[],
  projectStats: [] as any[],
  progressDistribution: [] as any[],
  phaseCompletion: [] as any[]
})

// Methods
const setTimeRange = (range: string) => {
  timeRange.value = range
  loadReportData()
}

const handleTabChange = () => {
  loadReportData()
}

const generateReport = async () => {
  generating.value = true
  try {
    await loadReportData()
    ElMessage.success('报表已刷新')
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
    // 获取应用和子任务数据
    const [applications, subtasks] = await Promise.all([
      ApplicationsAPI.getApplications({ limit: 1000 }),
      SubTasksAPI.getSubTasks({ limit: 1000 })
    ])

    // 根据时间范围过滤数据
    const filteredApps = filterByTimeRange(applications.items)
    const filteredTasks = filterByTimeRange(subtasks.items)

    // 根据当前标签加载对应数据
    switch (activeTab.value) {
      case 'summary':
        await loadSummaryData(filteredApps, filteredTasks)
        break
      case 'progress':
        await loadProgressData(filteredApps, filteredTasks)
        break
      case 'delay':
        await loadDelayData(filteredApps, filteredTasks)
        break
    }
  } catch (error) {
    console.error('Failed to load report data:', error)
    ElMessage.error('加载报表数据失败')
  } finally {
    loading.value = false
  }
}

const filterByTimeRange = (items: any[]) => {
  if (timeRange.value === 'all') return items

  const now = new Date()
  const startDate = new Date()

  switch (timeRange.value) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  return items.filter(item => {
    // 检查各种日期字段
    const dates = [
      item.created_at,
      item.updated_at,
      item.actual_biz_online_date,
      item.actual_tech_online_date,
      item.actual_release_date,
      item.actual_requirement_date
    ].filter(d => d)

    // 如果有任何日期在范围内，就包含该项
    return dates.some(dateStr => {
      const date = new Date(dateStr)
      return date >= startDate && date <= now
    })
  })
}

const loadSummaryData = async (apps: any[], tasks: any[]) => {
  // 计算汇总统计
  summaryStats.total = apps.length
  summaryStats.completed = apps.filter(app =>
    app.current_status === '全部完成' || app.current_status === 'completed'
  ).length
  summaryStats.inProgress = apps.filter(app =>
    app.current_status === '研发进行中' || app.current_status === '业务上线中'
  ).length

  // 计算延期数量
  const today = new Date()
  summaryStats.delayed = tasks.filter(task => {
    if (task.planned_biz_online_date && !task.actual_biz_online_date) {
      const plannedDate = new Date(task.planned_biz_online_date)
      return plannedDate < today && task.task_status !== '已完成'
    }
    return false
  }).length

  summaryStats.completionRate = summaryStats.total > 0
    ? Math.round((summaryStats.completed / summaryStats.total) * 100)
    : 0

  // 改造类型分布
  const akCount = apps.filter(app => app.overall_transformation_target === 'AK').length
  const cloudCount = apps.filter(app => app.overall_transformation_target === '云原生').length
  chartData.typeDistribution = [
    { name: 'AK改造', value: akCount },
    { name: '云原生改造', value: cloudCount }
  ]

  // 月度完成趋势
  await loadMonthlyTrend()

  // 项目统计
  const projectStats = await DashboardAPI.getProjectStatistics()
  chartData.projectStats = projectStats

  // 刷新图表
  setTimeout(() => {
    refreshTypeChart()
    refreshTrendChart()
    refreshProjectChart()
  }, 100)
}

const loadProgressData = async (apps: any[], tasks: any[]) => {
  // 进度分布
  const progressRanges = [
    { name: '0-25%', count: 0 },
    { name: '26-50%', count: 0 },
    { name: '51-75%', count: 0 },
    { name: '76-99%', count: 0 },
    { name: '100%', count: 0 }
  ]

  apps.forEach(app => {
    const progress = app.progress_percentage || 0
    if (progress === 100) progressRanges[4].count++
    else if (progress >= 76) progressRanges[3].count++
    else if (progress >= 51) progressRanges[2].count++
    else if (progress >= 26) progressRanges[1].count++
    else progressRanges[0].count++
  })

  chartData.progressDistribution = progressRanges.map(r => ({
    name: r.name,
    value: r.count
  }))

  // 阶段完成情况
  let requirementCount = 0
  let releaseCount = 0
  let techOnlineCount = 0
  let bizOnlineCount = 0

  tasks.forEach(task => {
    if (task.actual_requirement_date) requirementCount++
    if (task.actual_release_date) releaseCount++
    if (task.actual_tech_online_date) techOnlineCount++
    if (task.actual_biz_online_date) bizOnlineCount++
  })

  chartData.phaseCompletion = [
    { name: '需求完成', value: requirementCount },
    { name: '发版完成', value: releaseCount },
    { name: '技术上线', value: techOnlineCount },
    { name: '业务上线', value: bizOnlineCount }
  ]

  // 按项目统计进度
  const projectMap = new Map<string, any>()

  apps.forEach(app => {
    const projects = (app.belonging_projects || '未分配项目').split(/[,;，；]/).map(p => p.trim())

    projects.forEach(project => {
      if (!projectMap.has(project)) {
        projectMap.set(project, {
          projectName: project,
          totalApps: 0,
          requirement: 0,
          release: 0,
          techOnline: 0,
          bizOnline: 0,
          totalProgress: 0
        })
      }

      const stat = projectMap.get(project)
      stat.totalApps++
      stat.totalProgress += app.progress_percentage || 0

      // 统计各阶段完成数
      const appTasks = tasks.filter(t => t.l2_id === app.id)
      if (appTasks.some(t => t.actual_requirement_date)) stat.requirement++
      if (appTasks.some(t => t.actual_release_date)) stat.release++
      if (appTasks.some(t => t.actual_tech_online_date)) stat.techOnline++
      if (appTasks.some(t => t.actual_biz_online_date)) stat.bizOnline++
    })
  })

  progressData.value = Array.from(projectMap.values()).map(p => ({
    ...p,
    averageProgress: p.totalApps > 0 ? Math.round(p.totalProgress / p.totalApps) : 0
  }))

  // 刷新图表
  setTimeout(() => {
    refreshProgressDistChart()
    refreshPhaseChart()
  }, 100)
}

const loadDelayData = async (apps: any[], tasks: any[]) => {
  const today = new Date()
  const delayedItems: any[] = []

  apps.forEach(app => {
    const appTasks = tasks.filter(t => t.l2_id === app.id)

    // 检查延期的子任务
    const delayedTasks = appTasks.filter(task => {
      if (task.planned_biz_online_date && !task.actual_biz_online_date) {
        const plannedDate = new Date(task.planned_biz_online_date)
        return plannedDate < today && task.task_status !== '已完成'
      }
      return false
    })

    if (delayedTasks.length > 0) {
      const maxDelayTask = delayedTasks.reduce((max, task) => {
        const plannedDate = new Date(task.planned_biz_online_date)
        const delayDays = Math.ceil((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
        return delayDays > max.days ? { task, days: delayDays } : max
      }, { task: delayedTasks[0], days: 0 })

      delayedItems.push({
        l2Id: app.l2_id,
        appName: app.app_name,
        projectName: app.belonging_projects || '未分配项目',
        currentPhase: maxDelayTask.task.task_status || '研发进行中',
        delayDays: maxDelayTask.days,
        plannedDate: formatDate(maxDelayTask.task.planned_biz_online_date),
        expectedDate: '待定',
        delayReason: maxDelayTask.task.block_reason || '进度延迟'
      })
    }
  })

  delayData.value = delayedItems.sort((a, b) => b.delayDays - a.delayDays)

  // 计算延期统计
  delayStats.totalDelayed = delayedItems.length
  delayStats.avgDelayDays = delayedItems.length > 0
    ? Math.round(delayedItems.reduce((sum, item) => sum + item.delayDays, 0) / delayedItems.length)
    : 0
  delayStats.maxDelayDays = delayedItems.length > 0
    ? Math.max(...delayedItems.map(item => item.delayDays))
    : 0
}

const loadMonthlyTrend = async () => {
  const monthlyData = await DashboardAPI.getMonthlyCompletionTrend('actual')
  chartData.monthlyTrend = monthlyData.map(item => ({
    month: formatMonth(item.month),
    requirement: item.requirement,
    release: item.release,
    techOnline: item.techOnline,
    bizOnline: item.bizOnline
  }))
}

const exportReport = async () => {
  exporting.value = true
  try {
    // 准备导出数据
    const exportData = {
      summary: summaryStats,
      data: activeTab.value === 'delay' ? delayData.value : progressData.value,
      type: activeTab.value,
      generatedAt: new Date().toLocaleString('zh-CN')
    }

    // 调用导出API
    await ExcelAPI.exportApplications({
      format: 'xlsx',
      filters: { report_type: activeTab.value }
    })

    ElMessage.success('报表导出成功')
  } catch (error) {
    console.error('Failed to export report:', error)
    ElMessage.error('报表导出失败')
  } finally {
    exporting.value = false
  }
}

// Chart option getters
const getTypeChartOptions = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    bottom: 0
  },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: true,
      formatter: '{b}\n{c} ({d}%)'
    },
    data: chartData.typeDistribution
  }]
})

const getTrendChartOptions = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['需求完成', '发版完成', '技术上线', '业务上线'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: chartData.monthlyTrend.map(item => item.month)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '需求完成',
      type: 'line',
      smooth: true,
      data: chartData.monthlyTrend.map(item => item.requirement)
    },
    {
      name: '发版完成',
      type: 'line',
      smooth: true,
      data: chartData.monthlyTrend.map(item => item.release)
    },
    {
      name: '技术上线',
      type: 'line',
      smooth: true,
      data: chartData.monthlyTrend.map(item => item.techOnline)
    },
    {
      name: '业务上线',
      type: 'line',
      smooth: true,
      data: chartData.monthlyTrend.map(item => item.bizOnline)
    }
  ]
})

const getProjectChartOptions = (): echarts.EChartsOption => {
  const data = chartData.projectStats.slice(0, 10)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['已完成', '进行中', '未开始'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        data: data.map(item => item.completed)
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        data: data.map(item => item.inProgress)
      },
      {
        name: '未开始',
        type: 'bar',
        stack: 'total',
        data: data.map(item => item.notStarted)
      }
    ]
  }
}

const getProgressDistChartOptions = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    bottom: 0
  },
  series: [{
    type: 'pie',
    radius: '50%',
    data: chartData.progressDistribution
  }]
})

const getPhaseChartOptions = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: chartData.phaseCompletion.map(item => item.name)
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    type: 'bar',
    barWidth: '60%',
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#667eea' },
        { offset: 1, color: '#764ba2' }
      ])
    },
    data: chartData.phaseCompletion.map(item => item.value)
  }]
})

// Helper functions
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatMonth = (monthStr: string) => {
  const date = new Date(monthStr + '-01')
  return date.toLocaleDateString('zh-CN', { year: '2-digit', month: 'short' })
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#48bb78'
  if (progress >= 50) return '#3182ce'
  if (progress >= 30) return '#ed8936'
  return '#a0aec0'
}

const getDelayType = (days: number) => {
  if (days > 30) return 'danger'
  if (days > 15) return 'warning'
  return 'info'
}

const getPhaseType = (phase: string) => {
  const typeMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '存在阻塞': 'danger'
  }
  return typeMap[phase] || 'info'
}

// Initialize
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

.actions {
  display: flex;
  gap: 10px;
}

.report-tabs {
  margin-bottom: 20px;
}

.time-range {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.stat-card.success {
  border-left: 4px solid #48bb78;
}

.stat-card.warning {
  border-left: 4px solid #ed8936;
}

.stat-card.danger {
  border-left: 4px solid #f56565;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-top: 5px;
}

.stat-percentage {
  font-size: 18px;
  color: #48bb78;
  font-weight: 600;
  margin-top: 5px;
}

.charts-section {
  margin-bottom: 20px;
}

.project-stats {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .reports-view {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 10px;
  }

  .time-range {
    flex-wrap: wrap;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>