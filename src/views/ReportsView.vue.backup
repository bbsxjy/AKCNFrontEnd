<template>
  <div class="reports-view">
    <el-card>
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

      <!-- Loading Skeleton -->
      <div v-if="loading">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Summary Report -->
      <div v-else-if="activeTab === 'summary'">
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

        <!-- 项目统计和优先级分布 -->
        <el-row :gutter="20" class="charts-section">
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>项目完成情况</h3>
              </template>
              <div ref="projectChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-card>
              <template #header>
                <h3>应用档位分布</h3>
              </template>
              <div ref="priorityChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Progress Report -->
      <div v-else-if="activeTab === 'progress' && !loading">
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
      <div v-else-if="activeTab === 'delay' && !loading">
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
              <div class="stat-label">平均延期月数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="stat-card">
              <div class="stat-value">{{ delayStats.maxDelayDays }}</div>
              <div class="stat-label">最长延期月数</div>
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
          <el-table-column prop="delayDays" label="延期月数" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDelayType(row.delayDays)">
                {{ row.delayDays }} 月
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
import { ExcelAPI } from '@/api/reports'
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
const priorityChartRef = ref<HTMLElement | null>(null)
const progressDistChartRef = ref<HTMLElement | null>(null)
const phaseChartRef = ref<HTMLElement | null>(null)

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
  priorityDistribution: [] as any[],
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
    const filteredApps = filterByTimeRange(applications.items || [])
    const filteredTasks = filterByTimeRange(subtasks.items || [])

    // 调试输出
    console.log(`Time range: ${timeRange.value}`, {
      totalApps: applications.items?.length || 0,
      filteredApps: filteredApps.length,
      totalTasks: subtasks.items?.length || 0,
      filteredTasks: filteredTasks.length
    })

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
  let startDate = new Date()
  let endDate = new Date()

  switch (timeRange.value) {
    case 'week':
      // 本周（周一到周日）
      const currentDay = now.getDay()
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
      startDate = new Date(now)
      startDate.setDate(now.getDate() + daysToMonday)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'month':
      // 本月（1号到月末）
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    case 'quarter':
      // 本季度
      const currentQuarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
      endDate = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999)
      break
    case 'year':
      // 本年（1月1日到12月31日）
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
  }

  return items.filter(item => {
    // 只检查实际完成日期字段，不检查创建和更新时间
    const completionDates = [
      item.actual_biz_online_date,
      item.actual_tech_online_date,
      item.actual_release_date,
      item.actual_requirement_date
    ].filter(d => d)

    // 如果没有任何完成日期，检查是否在进行中
    if (completionDates.length === 0) {
      // 对于进行中的项目，检查创建时间是否在范围内
      if (item.created_at) {
        const createdDate = new Date(item.created_at)
        return createdDate >= startDate && createdDate <= endDate
      }
      return false
    }

    // 检查是否有任何完成日期在指定范围内
    return completionDates.some(dateStr => {
      const date = new Date(dateStr)
      return date >= startDate && date <= endDate
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

  // 项目统计 - 基于过滤后的数据
  const projectMap = new Map<string, { total: number; completed: number; inProgress: number; notStarted: number }>()

  apps.forEach((app: any) => {
    const projectsField = app.belonging_projects || '未分配项目'
    const projects = projectsField.split(/[,;，；]/).map((p: string) => p.trim()).filter((p: string) => p.length > 0)

    if (projects.length === 0) {
      projects.push('未分配项目')
    }

    projects.forEach((project: string) => {
      const existing = projectMap.get(project) || {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0
      }

      existing.total++

      const status = app.current_status
      if (status === '全部完成' || status === 'completed') {
        existing.completed++
      } else if (status === '研发进行中' || status === '业务上线中' || status === 'in_progress' || status === 'testing') {
        existing.inProgress++
      } else if (status === '待启动' || status === 'not_started') {
        existing.notStarted++
      } else if (status === '存在阻塞' || status === 'blocked') {
        existing.inProgress++
      }

      projectMap.set(project, existing)
    })
  })

  chartData.projectStats = Array.from(projectMap.entries())
    .map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      notStarted: data.notStarted,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  // 优先级分布 - 基于过滤后的数据
  const priorityData = [
    { name: '第一级', value: 0, akCount: 0, cloudCount: 0 },
    { name: '第二级', value: 0, akCount: 0, cloudCount: 0 },
    { name: '第三级', value: 0, akCount: 0, cloudCount: 0 },
    { name: '第四级', value: 0, akCount: 0, cloudCount: 0 },
    { name: '第五级', value: 0, akCount: 0, cloudCount: 0 }
  ]

  apps.forEach((app: any) => {
    let priority = 3 // 默认第三级

    if (app.ak_supervision_acceptance_year) {
      const year = parseInt(app.ak_supervision_acceptance_year)
      const currentYear = new Date().getFullYear()
      if (year <= currentYear) {
        priority = 1
      } else if (year === currentYear + 1) {
        priority = 2
      } else if (year === currentYear + 2) {
        priority = 3
      } else {
        priority = 4
      }
    }

    priority = Math.max(1, Math.min(5, priority))
    const index = priority - 1

    priorityData[index].value++

    const transformTarget = app.overall_transformation_target
    if (transformTarget === 'AK' || transformTarget === 'ak') {
      priorityData[index].akCount++
    } else if (transformTarget === '云原生' || transformTarget === 'cloud_native') {
      priorityData[index].cloudCount++
    } else {
      priorityData[index].akCount++
    }
  })

  chartData.priorityDistribution = priorityData

  // 刷新图表
  setTimeout(() => {
    refreshTypeChart()
    refreshTrendChart()
    refreshProjectChart()
    refreshPriorityChart()
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

  apps.forEach((app: any) => {
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

  apps.forEach((app: any) => {
    const projects = (app.belonging_projects || '未分配项目').split(/[,;，；]/).map((p: string) => p.trim())

    projects.forEach((project: string) => {
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
      const appTasks = tasks.filter((t: any) => t.l2_id === app.id)
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

  apps.forEach((app: any) => {
    const appTasks = tasks.filter((t: any) => t.l2_id === app.id)

    // 检查延期的子任务
    const delayedTasks = appTasks.filter((task: any) => {
      if (task.planned_biz_online_date && !task.actual_biz_online_date) {
        const plannedDate = new Date(task.planned_biz_online_date)
        return plannedDate < today && task.task_status !== '已完成'
      }
      return false
    })

    if (delayedTasks.length > 0) {
      const maxDelayTask = delayedTasks.reduce((max, task) => {
        const plannedDate = new Date(task.planned_biz_online_date)
        const yearDiff = today.getFullYear() - plannedDate.getFullYear()
        const monthDiff = today.getMonth() - plannedDate.getMonth()
        const delayMonths = Math.max(0, yearDiff * 12 + monthDiff)
        return delayMonths > max.days ? { task, days: delayMonths } : max
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
  // 获取所有应用和子任务数据
  const [applications, subtasks] = await Promise.all([
    ApplicationsAPI.getApplications({ limit: 1000 }),
    SubTasksAPI.getSubTasks({ limit: 1000 })
  ])

  // 根据时间范围过滤数据
  const filteredApps = filterByTimeRange(applications.items || [])
  const filteredTasks = filterByTimeRange(subtasks.items || [])

  // 生成月度数据
  const monthlyMap = new Map<string, { requirement: number, release: number, techOnline: number, bizOnline: number }>()

  // 根据时间范围决定要显示的月份
  const now = new Date()
  const months: string[] = []

  if (timeRange.value === 'week') {
    // 本周只显示当前月份
    months.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  } else if (timeRange.value === 'month') {
    // 本月只显示当前月份
    months.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  } else if (timeRange.value === 'quarter') {
    // 本季度显示3个月
    const currentQuarter = Math.floor(now.getMonth() / 3)
    for (let i = 0; i < 3; i++) {
      const monthIndex = currentQuarter * 3 + i
      if (monthIndex <= now.getMonth()) {
        months.push(`${now.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`)
      }
    }
  } else if (timeRange.value === 'year') {
    // 本年显示到当前月
    for (let i = 0; i <= now.getMonth(); i++) {
      months.push(`${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`)
    }
  } else {
    // 全部：显示最近12个月
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
  }

  // 初始化月度数据
  months.forEach(month => {
    monthlyMap.set(month, { requirement: 0, release: 0, techOnline: 0, bizOnline: 0 })
  })

  // 统计完成数据
  filteredTasks.forEach((task: any) => {
    if (task.actual_requirement_date) {
      const date = new Date(task.actual_requirement_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthlyMap.get(monthKey)
      if (data) data.requirement++
    }
    if (task.actual_release_date) {
      const date = new Date(task.actual_release_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthlyMap.get(monthKey)
      if (data) data.release++
    }
    if (task.actual_tech_online_date) {
      const date = new Date(task.actual_tech_online_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthlyMap.get(monthKey)
      if (data) data.techOnline++
    }
    if (task.actual_biz_online_date) {
      const date = new Date(task.actual_biz_online_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthlyMap.get(monthKey)
      if (data) data.bizOnline++
    }
  })

  // 转换为数组格式
  chartData.monthlyTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month: formatMonth(month),
    requirement: data.requirement,
    release: data.release,
    techOnline: data.techOnline,
    bizOnline: data.bizOnline
  }))
}

const exportReport = async () => {
  exporting.value = true
  try {
    let reportData: any = {}
    let filename = ''

    // Prepare data based on active tab
    switch (activeTab.value) {
      case 'summary':
        reportData = {
          type: 'summary',
          statistics: summaryStats,
          timeRange: timeRange.value
        }
        filename = `汇总报表_${new Date().toISOString().split('T')[0]}.xlsx`
        break
        
      case 'progress':
        reportData = {
          type: 'progress',
          data: progressData.value,
          timeRange: timeRange.value
        }
        filename = `项目进度报表_${new Date().toISOString().split('T')[0]}.xlsx`
        break
        
      case 'delay':
        reportData = {
          type: 'delay',
          data: delayData.value,
          timeRange: timeRange.value
        }
        filename = `延期分析报表_${new Date().toISOString().split('T')[0]}.xlsx`
        break
    }

    // Use Excel API to export
    await ExcelAPI.exportReport(reportData, filename)
    
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
  // 反转数据顺序，让最大的项目在最上面
  const reversedData = [...chartData.projectStats].reverse().slice(0, 10)
  const projects = reversedData.map(item => {
    // 截断过长的项目名称
    const maxLength = 25
    const name = item.name
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
  })
  const completed = reversedData.map(item => item.completed)
  const inProgress = reversedData.map(item => item.inProgress)
  const notStarted = reversedData.map(item => item.notStarted)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const projectData = reversedData[params[0].dataIndex]
        return `<div style="padding: 8px; max-width: 300px;">
          <strong style="word-wrap: break-word;">${projectData.name}</strong><br/>
          总数: ${projectData.total}<br/>
          已完成: ${projectData.completed} (${projectData.completionRate}%)<br/>
          进行中: ${projectData.inProgress}<br/>
          未开始: ${projectData.notStarted}
        </div>`
      }
    },
    legend: {
      data: ['已完成', '进行中', '未开始'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '15%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096'
      },
      splitLine: {
        lineStyle: {
          color: '#f7fafc'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: projects,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096',
        fontSize: 11
      }
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        itemStyle: { color: '#48bb78' },
        data: completed
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#3182ce' },
        data: inProgress
      },
      {
        name: '未开始',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#cbd5e0' },
        data: notStarted
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

const getPriorityChartOptions = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const total = chartData.priorityDistribution.reduce((sum, item) => sum + item.value, 0)
      const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
      return `${params.name}<br/>
              数量: ${params.value}<br/>
              占比: ${percentage}%`
    }
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '优先级分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['55%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c} ({d}%)'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      data: chartData.priorityDistribution.map(item => ({
        name: item.name,
        value: item.value
      }))
    }
  ]
})

// Initialize charts - MUST be after function definitions
const { refresh: refreshTypeChart } = useChart(typeChartRef, computed(() => getTypeChartOptions()))
const { refresh: refreshTrendChart } = useChart(trendChartRef, computed(() => getTrendChartOptions()))
const { refresh: refreshProjectChart } = useChart(projectChartRef, computed(() => getProjectChartOptions()))
const { refresh: refreshPriorityChart } = useChart(priorityChartRef, computed(() => getPriorityChartOptions()))
const { refresh: refreshProgressDistChart } = useChart(progressDistChartRef, computed(() => getProgressDistChartOptions()))
const { refresh: refreshPhaseChart } = useChart(phaseChartRef, computed(() => getPhaseChartOptions()))

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

const getDelayType = (months: number) => {
  if (months > 3) return 'danger'  // >3月为严重
  if (months > 1) return 'warning' // >1月为警告
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