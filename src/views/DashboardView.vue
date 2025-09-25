<template>
  <div class="dashboard">
    <!-- 第一行：AK改造和云原生改造（核心指标） -->
    <el-row :gutter="20" class="stats-row primary-row">
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <el-card class="transformation-card ak-card">
          <div class="transformation-header">
            <div class="transformation-badge ak">
              <span class="badge-text">AK</span>
            </div>
            <div class="transformation-title">AK改造</div>
            <div class="completion-rate">
              <span class="rate-number">{{ Math.round(stats.akCompleted / stats.akTotal * 100) || 0 }}</span>
              <span class="rate-symbol">%</span>
            </div>
          </div>

          <div class="transformation-body">
            <div class="metrics-grid">
              <div class="metric-card primary">
                <div class="metric-number">{{ stats.akCompleted }}</div>
                <div class="metric-text">已完成</div>
              </div>
              <div class="metric-card">
                <div class="metric-number">{{ stats.akTotal }}</div>
                <div class="metric-text">总数</div>
              </div>
              <div class="metric-card">
                <div class="metric-number highlight">{{ stats.akInProgress }}</div>
                <div class="metric-text">进行中</div>
              </div>
              <div class="metric-card">
                <div class="metric-number">{{ stats.akTotal - stats.akCompleted - stats.akInProgress }}</div>
                <div class="metric-text">待启动</div>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-bar">
                <div
                  class="progress-fill ak-progress"
                  :style="{ width: (stats.akCompleted / stats.akTotal * 100) + '%' }"
                ></div>
              </div>
              <div class="progress-labels">
                <span>0</span>
                <span>进度</span>
                <span>{{ stats.akTotal }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <el-card class="transformation-card cloud-card">
          <div class="transformation-header">
            <div class="transformation-badge cloud">
              <span class="badge-text">☁️</span>
            </div>
            <div class="transformation-title">云原生改造</div>
            <div class="completion-rate">
              <span class="rate-number">{{ Math.round(stats.cloudNativeCompleted / stats.cloudNativeTotal * 100) || 0 }}</span>
              <span class="rate-symbol">%</span>
            </div>
          </div>

          <div class="transformation-body">
            <div class="metrics-grid">
              <div class="metric-card primary">
                <div class="metric-number">{{ stats.cloudNativeCompleted }}</div>
                <div class="metric-text">已完成</div>
              </div>
              <div class="metric-card">
                <div class="metric-number">{{ stats.cloudNativeTotal }}</div>
                <div class="metric-text">总数</div>
              </div>
              <div class="metric-card">
                <div class="metric-number highlight">{{ stats.cloudNativeInProgress }}</div>
                <div class="metric-text">进行中</div>
              </div>
              <div class="metric-card">
                <div class="metric-number">{{ stats.cloudNativeTotal - stats.cloudNativeCompleted - stats.cloudNativeInProgress }}</div>
                <div class="metric-text">待启动</div>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-bar">
                <div
                  class="progress-fill cloud-progress"
                  :style="{ width: (stats.cloudNativeCompleted / stats.cloudNativeTotal * 100) + '%' }"
                ></div>
              </div>
              <div class="progress-labels">
                <span>0</span>
                <span>进度</span>
                <span>{{ stats.cloudNativeTotal }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 总体统计 -->
    <div class="overall-summary">
      <div class="summary-header">
        <span class="summary-title">总体统计</span>
        <div class="summary-pills">
          <span class="pill total">
            <span class="pill-label">总数</span>
            <span class="pill-value">{{ stats.total }}</span>
          </span>
          <span class="pill active">
            <span class="pill-label">进行中</span>
            <span class="pill-value">{{ stats.active }}</span>
          </span>
          <span class="pill completed">
            <span class="pill-label">已完成</span>
            <span class="pill-value">{{ stats.completed }}</span>
          </span>
          <span class="pill blocked">
            <span class="pill-label">阻塞</span>
            <span class="pill-value">{{ stats.blocked }}</span>
          </span>
        </div>
      </div>

      <div class="status-bar-container">
        <div class="status-bar-track">
          <div
            class="status-segment not-started"
            :style="{ width: ((stats.notStarted / stats.total) * 100) + '%' }"
            :title="`未启动: ${stats.notStarted}`"
          ></div>
          <div
            class="status-segment in-dev"
            :style="{ width: ((stats.inDevelopment / stats.total) * 100) + '%' }"
            :title="`研发中: ${stats.inDevelopment}`"
          ></div>
          <div
            class="status-segment in-test"
            :style="{ width: ((stats.inTesting / stats.total) * 100) + '%' }"
            :title="`上线中: ${stats.inTesting}`"
          ></div>
          <div
            class="status-segment online"
            :style="{ width: ((stats.online / stats.total) * 100) + '%' }"
            :title="`已上线: ${stats.online}`"
          ></div>
          <div
            class="status-segment offline"
            :style="{ width: ((stats.offline / stats.total) * 100) + '%' }"
            :title="`已下线: ${stats.offline}`"
          ></div>
        </div>
        <div class="status-legend">
          <span class="legend-item">
            <span class="legend-dot not-started"></span>
            <span class="legend-text">未启动 {{ stats.notStarted }}</span>
          </span>
          <span class="legend-item">
            <span class="legend-dot in-dev"></span>
            <span class="legend-text">研发中 {{ stats.inDevelopment }}</span>
          </span>
          <span class="legend-item">
            <span class="legend-dot in-test"></span>
            <span class="legend-text">上线中 {{ stats.inTesting }}</span>
          </span>
          <span class="legend-item">
            <span class="legend-dot online"></span>
            <span class="legend-text">已上线 {{ stats.online }}</span>
          </span>
          <span class="legend-item">
            <span class="legend-dot offline"></span>
            <span class="legend-text">已下线 {{ stats.offline }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Project Statistics Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>项目统计</span>
                <span class="header-subtitle">各项目应用改造进度</span>
              </div>
              <div class="header-filters">
                <el-select
                  v-model="projectTimeType"
                  size="small"
                  style="width: 80px; margin-right: 8px"
                  @change="updateProjectChart"
                >
                  <el-option value="all" label="全部" />
                  <el-option value="year" label="按年" />
                  <el-option value="month" label="按月" />
                </el-select>
                <el-date-picker
                  v-if="projectTimeType === 'year'"
                  v-model="projectSelectedYear"
                  type="year"
                  placeholder="选择年"
                  size="small"
                  format="YYYY"
                  value-format="YYYY"
                  style="width: 120px"
                  @change="updateProjectChart"
                />
                <el-date-picker
                  v-if="projectTimeType === 'month'"
                  v-model="projectSelectedMonth"
                  type="month"
                  placeholder="选择月"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM"
                  style="width: 120px"
                  @change="updateProjectChart"
                />
              </div>
            </div>
          </template>
          <div ref="projectChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span>应用优先级分布</span>
              </div>
              <div class="header-filters">
                <el-select
                  v-model="priorityTimeType"
                  size="small"
                  style="width: 80px; margin-right: 8px"
                  @change="updatePriorityChart"
                >
                  <el-option value="all" label="全部" />
                  <el-option value="year" label="按年" />
                  <el-option value="month" label="按月" />
                </el-select>
                <el-date-picker
                  v-if="priorityTimeType === 'year'"
                  v-model="prioritySelectedYear"
                  type="year"
                  placeholder="选择年"
                  size="small"
                  format="YYYY"
                  value-format="YYYY"
                  style="width: 100px; margin-right: 8px"
                  @change="updatePriorityChart"
                />
                <el-date-picker
                  v-if="priorityTimeType === 'month'"
                  v-model="prioritySelectedMonth"
                  type="month"
                  placeholder="选择月"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM"
                  style="width: 120px; margin-right: 8px"
                  @change="updatePriorityChart"
                />
                <el-radio-group v-model="priorityType" size="small" @change="updatePriorityChart">
                  <el-radio-button value="all">全部</el-radio-button>
                  <el-radio-button value="AK">AK</el-radio-button>
                  <el-radio-button value="cloud">云原生</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="priorityChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>月度完成趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="updateProgressChart">
                <el-radio-button value="actual">实际完成</el-radio-button>
                <el-radio-button value="planned">计划完成</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="progressChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>月度问题统计</span>
              <el-radio-group v-model="statisticsType" size="small" @change="updateStatisticsChart">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="app">应用</el-radio-button>
                <el-radio-button value="task">子任务</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="statisticsChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Todo Items -->
    <el-card class="todo-card">
      <template #header>
        <div class="card-header">
          <div class="header-title-with-badge">
            <span>待办事项</span>
            <el-badge
              v-if="urgentTasksCount > 0"
              :value="urgentTasksCount"
              class="header-badge"
              type="danger"
            />
            <el-badge
              v-else-if="totalTasksCount > 0"
              :value="totalTasksCount"
              class="header-badge"
              type="primary"
            />
          </div>
          <div class="header-actions">
            <el-button type="text" @click="viewAllTasks">查看全部</el-button>
            <el-button type="text" @click="refreshTodos">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="todo-list" v-loading="loading">
        <div
          v-for="task in displayedTasks"
          :key="task.id"
          :class="['todo-item', { 'urgent': task.isUrgent, 'overdue': task.isOverdue }]"
        >
          <div class="todo-content">
            <div class="todo-header">
              <el-tag size="small" type="info">{{ task.appId }}</el-tag>
              <el-tag
                size="small"
                :type="getTaskStatusType(task.status)"
              >
                {{ task.status }}
              </el-tag>
              <el-tag
                v-if="task.isOverdue"
                size="small"
                type="danger"
              >
                逾期 {{ Math.abs(task.daysRemaining) }} 天
              </el-tag>
              <el-tag
                v-else-if="task.daysRemaining <= 3"
                size="small"
                type="warning"
              >
                剩余 {{ task.daysRemaining }} 天
              </el-tag>
            </div>
            <div class="todo-title">
              <strong>{{ task.appName }}</strong>
              <span class="task-name">{{ task.taskName }}</span>
            </div>
            <div class="todo-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                计划完成：{{ formatDate(task.plannedDate) }}
              </span>
              <span class="meta-item">
                <el-progress
                  :percentage="task.progress"
                  :stroke-width="4"
                  :color="getProgressColor(task.progress)"
                  style="width: 100px"
                />
              </span>
            </div>
          </div>
          <div class="todo-actions">
            <el-button
              size="small"
              :type="task.isUrgent ? 'danger' : 'primary'"
              @click="handleTask(task)"
            >
              {{ task.isOverdue ? '立即处理' : task.isUrgent ? '优先处理' : '查看详情' }}
            </el-button>
          </div>
        </div>

        <el-empty v-if="!loading && myTasks.length === 0" description="暂无进行中的任务">
          <div style="margin-top: 10px; color: #718096; font-size: 13px;">
            只有"研发进行中"、"业务上线中"或"存在阻塞"的任务会显示在这里
          </div>
          <el-button type="primary" size="small" @click="goToApplications" style="margin-top: 15px;">去查看应用列表</el-button>
        </el-empty>

        <div v-if="myTasks.length > 5" class="todo-footer">
          <el-button type="text" @click="viewAllTasks">
            查看全部 {{ myTasks.length }} 个任务
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, ArrowRight } from '@element-plus/icons-vue'
import { DashboardAPI } from '@/api/dashboard'
import { ApplicationsAPI } from '@/api/applications'
import { useChart, getMonthlyCompletionOptions, getMonthlyStatisticsOptions, getProjectStatisticsOptions, getPriorityDistributionOptions } from '@/composables/useCharts'

const router = useRouter()

// Stats data
const stats = ref({
  total: 0,
  active: 0,
  completed: 0,
  blocked: 0,
  averageProgress: 0,
  // 按改造目标分类
  akTotal: 0,
  akCompleted: 0,
  akInProgress: 0,
  cloudNativeTotal: 0,
  cloudNativeCompleted: 0,
  cloudNativeInProgress: 0,
  // 按详细状态分类
  notStarted: 0,  // 未启动
  inDevelopment: 0,  // 研发进行中
  inTesting: 0,  // 业务上线中（测试）
  online: 0,  // 已上线（完成）
  offline: 0  // 已下线（存在阻塞）
})

// My tasks data
const myTasks = ref<any[]>([])
const loading = ref(false)

// Chart toggle
const trendType = ref<'actual' | 'planned'>('actual')
const statisticsType = ref<'all' | 'app' | 'task'>('all')
const priorityType = ref<'all' | 'AK' | 'cloud'>('all')

// Time dimension filters
const projectTimeType = ref<'all' | 'year' | 'month'>('all')
const projectSelectedYear = ref(new Date().getFullYear().toString())
const projectSelectedMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

const priorityTimeType = ref<'all' | 'year' | 'month'>('all')
const prioritySelectedYear = ref(new Date().getFullYear().toString())
const prioritySelectedMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

// Chart refs
const progressChartRef = ref<HTMLElement | null>(null)
const statisticsChartRef = ref<HTMLElement | null>(null)
const projectChartRef = ref<HTMLElement | null>(null)
const priorityChartRef = ref<HTMLElement | null>(null)

// Chart data from API
const chartData = ref({
  progressTrend: [] as any[],
  monthlyCompletion: [] as any[],
  monthlyStatistics: [] as any[],
  projectStatistics: [] as any[],
  priorityDistribution: [] as any[]
})

// Computed properties for task counts
const urgentTasksCount = computed(() => {
  return myTasks.value.filter(task => task.isUrgent).length
})

const totalTasksCount = computed(() => {
  return myTasks.value.length
})

const displayedTasks = computed(() => {
  // Display top 5 tasks
  return myTasks.value.slice(0, 5)
})

// Chart data
const progressChartOptions = computed(() => {
  if (chartData.value.monthlyCompletion.length === 0) {
    // 如果还没有数据，显示空图表
    return getMonthlyCompletionOptions({
      months: [],
      requirement: [],
      release: [],
      techOnline: [],
      bizOnline: []
    })
  }

  const months = chartData.value.monthlyCompletion.map(item => {
    const date = new Date(item.month + '-01')
    return date.toLocaleDateString('zh-CN', { year: '2-digit', month: 'short' })
  })
  const requirement = chartData.value.monthlyCompletion.map(item => item.requirement)
  const release = chartData.value.monthlyCompletion.map(item => item.release)
  const techOnline = chartData.value.monthlyCompletion.map(item => item.techOnline)
  const bizOnline = chartData.value.monthlyCompletion.map(item => item.bizOnline)

  return getMonthlyCompletionOptions({ months, requirement, release, techOnline, bizOnline })
})

const statisticsChartOptions = computed(() => {
  if (chartData.value.monthlyStatistics.length === 0) {
    // 如果还没有数据，显示空图表
    return getMonthlyStatisticsOptions({
      months: [],
      delayed: [],
      blocked: [],
      newApps: [],
      newTasks: []
    }, statisticsType.value)
  }

  const months = chartData.value.monthlyStatistics.map(item => {
    const date = new Date(item.month + '-01')
    return date.toLocaleDateString('zh-CN', { year: '2-digit', month: 'short' })
  })

  const delayed = chartData.value.monthlyStatistics.map(item => item.delayed || 0)
  const blocked = chartData.value.monthlyStatistics.map(item => item.blocked || 0)
  const newApps = chartData.value.monthlyStatistics.map(item => item.newApps || 0)
  const newTasks = chartData.value.monthlyStatistics.map(item => item.newTasks || 0)

  return getMonthlyStatisticsOptions({ months, delayed, blocked, newApps, newTasks }, statisticsType.value)
})

const projectChartOptions = computed(() => {
  const filteredData = filterProjectDataByTime(chartData.value.projectStatistics)
  if (filteredData.length === 0) {
    return getProjectStatisticsOptions([])
  }
  return getProjectStatisticsOptions(filteredData)
})

const priorityChartOptions = computed(() => {
  const filteredData = filterPriorityDataByTime(chartData.value.priorityDistribution)
  if (filteredData.length === 0) {
    return getPriorityDistributionOptions([], priorityType.value)
  }
  return getPriorityDistributionOptions(filteredData, priorityType.value)
})

// Load dashboard data
const loadDashboardData = async () => {
  try {
    loading.value = true

    // 获取统计数据和任务
    const [statsData, tasks, monthlyStats, projectStats, priorityData] = await Promise.all([
      DashboardAPI.getDashboardStats(),
      DashboardAPI.getMyTasks(5),
      DashboardAPI.getMonthlyStatistics(),
      DashboardAPI.getProjectStatistics(),
      DashboardAPI.getPriorityDistribution()
    ])
    stats.value = statsData
    myTasks.value = tasks
    chartData.value.monthlyStatistics = monthlyStats
    chartData.value.projectStatistics = projectStats
    chartData.value.priorityDistribution = priorityData

    // 加载月度完成数据
    await loadMonthlyData()

    // 刷新图表
    setTimeout(() => {
      refreshProgressChart()
      refreshStatisticsChart()
      refreshProjectChart()
      refreshPriorityChart()
    }, 100)

  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    // 如果API失败，尝试单独加载各个数据
    await loadDataFallback()
  } finally {
    loading.value = false
  }
}

// 加载月度完成数据
const loadMonthlyData = async () => {
  try {
    const monthlyData = await DashboardAPI.getMonthlyCompletionTrend(trendType.value)
    chartData.value.monthlyCompletion = monthlyData
    console.log('Monthly completion data loaded:', monthlyData)
  } catch (error) {
    console.error('Failed to load monthly data:', error)
  }
}

// 更新进度图表（切换计划/实际）
const updateProgressChart = async () => {
  await loadMonthlyData()
  refreshProgressChart()
}

// 更新统计图表（切换显示类型）
const updateStatisticsChart = () => {
  refreshStatisticsChart()
}

// 更新优先级图表（切换改造类型）
const updatePriorityChart = async () => {
  // 如果切换到年或月视图，重新加载数据
  if (priorityTimeType.value !== 'all') {
    await loadFilteredPriorityData()
  }
  refreshPriorityChart()
}

// 更新项目统计图表
const updateProjectChart = async () => {
  // 如果切换到年或月视图，重新加载数据
  if (projectTimeType.value !== 'all') {
    await loadFilteredProjectData()
  }
  refreshProjectChart()
}

// 过滤项目数据by时间
const filterProjectDataByTime = (data: any[]) => {
  // 如果是全部，直接返回数据
  if (projectTimeType.value === 'all') {
    return data
  }
  // 年月过滤已在加载时完成，直接返回
  return data
}

// 过滤优先级数据by时间
const filterPriorityDataByTime = (data: any[]) => {
  // 如果是全部，直接返回数据
  if (priorityTimeType.value === 'all') {
    return data
  }
  // 年月过滤已在加载时完成，直接返回
  return data
}

// 加载过滤后的项目数据
const loadFilteredProjectData = async () => {
  try {
    // 获取所有应用数据
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    // 根据选择的时间范围过滤
    let filteredApps = applications.items || []

    if (projectTimeType.value === 'year') {
      const year = parseInt(projectSelectedYear.value)
      filteredApps = filteredApps.filter((app: any) => {
        // 检查任何实际完成日期是否在指定年份
        const dates = [
          app.actual_biz_online_date,
          app.actual_tech_online_date,
          app.actual_release_date,
          app.actual_requirement_date
        ].filter(d => d)

        if (dates.length === 0 && app.created_at) {
          // 对于未完成的，检查创建时间
          return new Date(app.created_at).getFullYear() === year
        }

        return dates.some(dateStr => {
          return new Date(dateStr).getFullYear() === year
        })
      })
    } else if (projectTimeType.value === 'month') {
      const [year, month] = projectSelectedMonth.value.split('-').map(Number)
      filteredApps = filteredApps.filter((app: any) => {
        // 检查任何实际完成日期是否在指定月份
        const dates = [
          app.actual_biz_online_date,
          app.actual_tech_online_date,
          app.actual_release_date,
          app.actual_requirement_date
        ].filter(d => d)

        if (dates.length === 0 && app.created_at) {
          // 对于未完成的，检查创建时间
          const createdDate = new Date(app.created_at)
          return createdDate.getFullYear() === year && createdDate.getMonth() + 1 === month
        }

        return dates.some(dateStr => {
          const date = new Date(dateStr)
          return date.getFullYear() === year && date.getMonth() + 1 === month
        })
      })
    }

    // 计算项目统计
    const projectMap = new Map<string, { total: number; completed: number; inProgress: number; notStarted: number }>()

    filteredApps.forEach((app: any) => {
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

    chartData.value.projectStatistics = Array.from(projectMap.entries())
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

  } catch (error) {
    console.error('Failed to load filtered project data:', error)
  }
}

// 加载过滤后的优先级数据
const loadFilteredPriorityData = async () => {
  try {
    // 获取所有应用数据
    const applications = await ApplicationsAPI.getApplications({ limit: 1000 })

    // 根据选择的时间范围过滤
    let filteredApps = applications.items || []

    if (priorityTimeType.value === 'year') {
      const year = parseInt(prioritySelectedYear.value)
      filteredApps = filteredApps.filter((app: any) => {
        // 检查任何实际完成日期是否在指定年份
        const dates = [
          app.actual_biz_online_date,
          app.actual_tech_online_date,
          app.actual_release_date,
          app.actual_requirement_date
        ].filter(d => d)

        if (dates.length === 0 && app.created_at) {
          // 对于未完成的，检查创建时间
          return new Date(app.created_at).getFullYear() === year
        }

        return dates.some(dateStr => {
          return new Date(dateStr).getFullYear() === year
        })
      })
    } else if (priorityTimeType.value === 'month') {
      const [year, month] = prioritySelectedMonth.value.split('-').map(Number)
      filteredApps = filteredApps.filter((app: any) => {
        // 检查任何实际完成日期是否在指定月份
        const dates = [
          app.actual_biz_online_date,
          app.actual_tech_online_date,
          app.actual_release_date,
          app.actual_requirement_date
        ].filter(d => d)

        if (dates.length === 0 && app.created_at) {
          // 对于未完成的，检查创建时间
          const createdDate = new Date(app.created_at)
          return createdDate.getFullYear() === year && createdDate.getMonth() + 1 === month
        }

        return dates.some(dateStr => {
          const date = new Date(dateStr)
          return date.getFullYear() === year && date.getMonth() + 1 === month
        })
      })
    }

    // 计算优先级分布
    const priorityData = [
      { name: '第一级', value: 0, akCount: 0, cloudCount: 0 },
      { name: '第二级', value: 0, akCount: 0, cloudCount: 0 },
      { name: '第三级', value: 0, akCount: 0, cloudCount: 0 },
      { name: '第四级', value: 0, akCount: 0, cloudCount: 0 },
      { name: '第五级', value: 0, akCount: 0, cloudCount: 0 }
    ]

    filteredApps.forEach((app: any) => {
      let priority = 3 // 默认第三级

      if (app.ak_supervision_acceptance_year) {
        const yearValue = parseInt(app.ak_supervision_acceptance_year)
        const currentYear = new Date().getFullYear()
        if (yearValue <= currentYear) {
          priority = 1
        } else if (yearValue === currentYear + 1) {
          priority = 2
        } else if (yearValue === currentYear + 2) {
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

    chartData.value.priorityDistribution = priorityData

  } catch (error) {
    console.error('Failed to load filtered priority data:', error)
  }
}

// 备用数据加载方法（如果主API失败）
const loadDataFallback = async () => {
  try {
    // 并行加载各个数据
    const [statsData, tasks, monthlyData, monthlyStats, projectStats, priorityData] = await Promise.all([
      DashboardAPI.getDashboardStats(),
      DashboardAPI.getMyTasks(5),
      DashboardAPI.getMonthlyCompletionTrend(trendType.value),
      DashboardAPI.getMonthlyStatistics(),
      DashboardAPI.getProjectStatistics(),
      DashboardAPI.getPriorityDistribution()
    ])

    stats.value = statsData
    myTasks.value = tasks
    chartData.value.monthlyCompletion = monthlyData
    chartData.value.monthlyStatistics = monthlyStats
    chartData.value.projectStatistics = projectStats
    chartData.value.priorityDistribution = priorityData

    // 刷新图表
    setTimeout(() => {
      refreshProgressChart()
      refreshStatisticsChart()
      refreshProjectChart()
      refreshPriorityChart()
    }, 100)

  } catch (error) {
    console.error('Fallback data loading also failed:', error)
    ElMessage.error('加载仪表板数据失败，请检查网络连接')
  }
}

const refreshTodos = async () => {
  try {
    loading.value = true
    // 只刷新待办任务
    myTasks.value = await DashboardAPI.getMyTasks(5)
    ElMessage.success('待办事项已刷新')
  } catch (error) {
    console.error('Failed to refresh todos:', error)
    ElMessage.error('刷新待办事项失败')
  } finally {
    loading.value = false
  }
}

const handleTask = (_task: any) => {
  router.push('/my-tasks')
}

const viewDetails = (task: any) => {
  if (task.applicationId) {
    router.push(`/subtasks/${task.applicationId}`)
  }
}

// Helper functions for todo items
const viewAllTasks = () => {
  router.push('/my-tasks')
}

const goToApplications = () => {
  router.push('/applications')
}

const getTaskStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    // Format as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return '-'
  }
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#48bb78'
  if (progress >= 50) return '#3182ce'
  if (progress >= 30) return '#ed8936'
  return '#a0aec0'
}

// Initialize WebSocket connection (disabled for testing)
const initializeWebSocket = async () => {
  // WebSocket disabled for testing since backend is not running
  console.log('WebSocket disabled for testing mode')
}

// 存储定时器ID
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

// 定期刷新数据（每30秒）
const startAutoRefresh = () => {
  autoRefreshInterval = setInterval(async () => {
    try {
      // 静默刷新统计数据
      const newStats = await DashboardAPI.getDashboardStats()
      stats.value = newStats
    } catch (error) {
      console.error('Auto refresh failed:', error)
    }
  }, 30000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

// Initialize charts
const { refresh: refreshProgressChart } = useChart(progressChartRef, progressChartOptions)
const { refresh: refreshStatisticsChart } = useChart(statisticsChartRef, statisticsChartOptions)
const { refresh: refreshProjectChart } = useChart(projectChartRef, projectChartOptions)
const { refresh: refreshPriorityChart } = useChart(priorityChartRef, priorityChartOptions)

// Resize handler for cleanup
const handleResize = () => {
  refreshProgressChart()
  refreshStatisticsChart()
}

onMounted(async () => {
  await loadDashboardData()
  await initializeWebSocket()
  startAutoRefresh()

  // Refresh charts on window resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Clean up auto refresh
  stopAutoRefresh()
  
  // Clean up resize listener
  window.removeEventListener('resize', handleResize)
  
  // Clean up WebSocket if needed
  if ((window as any).dashboardWs) {
    (window as any).dashboardWs.close()
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.primary-row {
  margin-bottom: 30px;
}

/* Transformation Cards (AK and Cloud-Native) - Redesigned */
.transformation-card {
  height: 240px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.transformation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.transformation-card .el-card__body {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.transformation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.transformation-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.transformation-badge.ak {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
}

.transformation-badge.cloud {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  font-size: 20px;
}

.badge-text {
  font-weight: 700;
}

.transformation-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-left: 12px;
}

.completion-rate {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.rate-number {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
}

.rate-symbol {
  font-size: 18px;
  font-weight: 600;
  color: #718096;
}

.transformation-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  transition: all 0.2s;
}

.metric-card:hover {
  background: #edf2f7;
}

.metric-card.primary {
  background: linear-gradient(135deg, #edf2ff 0%, #e9ecff 100%);
}

.metric-card.primary .metric-number {
  color: #667eea;
  font-size: 28px;
}

.metric-number {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  line-height: 1.2;
}

.metric-number.highlight {
  color: #3182ce;
}

.metric-text {
  font-size: 11px;
  color: #718096;
  margin-top: 4px;
}

.progress-section {
  margin-top: auto;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.ak-progress {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.cloud-progress {
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: #a0aec0;
}

/* Overall Summary - Minimalist Style */
.overall-summary {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.summary-title {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-pills {
  display: flex;
  gap: 12px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f7fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.pill:hover {
  background: #edf2f7;
}

.pill-label {
  font-size: 11px;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pill-value {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
}

.pill.total .pill-value {
  color: #4a5568;
}

.pill.active .pill-value {
  color: #3182ce;
}

.pill.completed .pill-value {
  color: #38a169;
}

.pill.blocked .pill-value {
  color: #e53e3e;
}

/* Status Bar */
.status-bar-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-bar-track {
  height: 6px;
  background: #f7fafc;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
}

.status-segment {
  transition: all 0.3s;
  cursor: pointer;
}

.status-segment:hover {
  opacity: 0.8;
}

.status-segment.not-started {
  background: #cbd5e0;
}

.status-segment.in-dev {
  background: #3182ce;
}

.status-segment.in-test {
  background: #ed8936;
}

.status-segment.online {
  background: #38a169;
}

.status-segment.offline {
  background: #e53e3e;
}

.status-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-dot.not-started {
  background: #cbd5e0;
}

.legend-dot.in-dev {
  background: #3182ce;
}

.legend-dot.in-test {
  background: #ed8936;
}

.legend-dot.online {
  background: #38a169;
}

.legend-dot.offline {
  background: #e53e3e;
}

.legend-text {
  font-size: 11px;
  color: #718096;
}


.charts-row {
  margin-bottom: 20px;
}

.chart-placeholder {
  height: 350px;
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

.todo-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  flex-wrap: wrap;
  gap: 10px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-subtitle {
  font-size: 12px;
  color: #718096;
  font-weight: normal;
}

.header-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-title-with-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-badge {
  margin-left: 0;
  vertical-align: middle;
  margin-top: 10px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.todo-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.todo-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.todo-item.urgent {
  border-left: 4px solid #f39c12;
}

.todo-item.overdue {
  border-left: 4px solid #e53e3e;
}

.todo-content {
  flex: 1;
}

.todo-header {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.todo-title {
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.todo-title strong {
  color: #2d3748;
  font-size: 15px;
}

.task-name {
  color: #4a5568;
  font-size: 13px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}

.meta-item .el-icon {
  font-size: 14px;
  color: #a0aec0;
}

.todo-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
}

.todo-detail {
  font-size: 14px;
  color: #718096;
}

.todo-detail.danger {
  color: #e53e3e;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .stats-row {
    margin-bottom: 15px;
  }
  
  .stat-card .el-card__body {
    padding: 20px 15px;
  }
  
  .charts-row {
    margin-bottom: 15px;
  }
  
  .chart-placeholder {
    height: 250px;
    font-size: 14px;
  }
  
  .mobile-chart {
    height: 200px;
    margin-top: 15px;
  }
  
  .todo-item {
    padding: 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .todo-title {
    font-size: 15px;
  }
  
  .todo-detail {
    font-size: 13px;
  }

  /* 总体统计响应式 */
  .overall-summary {
    padding: 12px 15px;
  }

  .summary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .summary-pills {
    flex-wrap: wrap;
    gap: 8px;
  }

  .pill {
    padding: 3px 8px;
  }

  .status-legend {
    gap: 10px;
  }

}

@media (max-width: 480px) {
  .dashboard {
    padding: 8px;
  }

  .stat-card .el-card__body {
    padding: 15px 10px;
  }
  
  .chart-placeholder {
    height: 200px;
    font-size: 13px;
  }
  
  .mobile-chart {
    height: 180px;
  }
  
  .todo-item {
    padding: 12px;
  }
  
  .todo-title {
    font-size: 14px;
  }
  
  .todo-detail {
    font-size: 12px;
  }
  
  .el-button {
    font-size: 12px;
    padding: 8px 16px;
  }

  /* 总体统计响应式 - 小屏幕 */
  .overall-summary {
    padding: 10px 12px;
  }

  .summary-title {
    font-size: 12px;
  }

  .summary-pills {
    gap: 6px;
  }

  .pill {
    padding: 2px 6px;
  }

  .pill-label {
    font-size: 10px;
  }

  .pill-value {
    font-size: 12px;
  }

  .status-legend {
    gap: 8px;
  }

  .legend-text {
    font-size: 10px;
  }

}
</style>