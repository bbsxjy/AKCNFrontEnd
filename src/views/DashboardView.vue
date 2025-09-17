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

    <!-- 总体进度统计 -->
    <el-card class="overall-progress-card">
      <template #header>
        <div class="section-header">
          <span class="section-title">📊 总体进度</span>
          <span class="section-subtitle">所有应用改造进度统计</span>
        </div>
      </template>

      <div class="overall-stats">
        <!-- 主要统计指标 -->
        <div class="main-stats">
          <div class="stat-item total">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">应用总数</div>
            </div>
          </div>

          <div class="stat-item active">
            <div class="stat-icon">🚀</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>

          <div class="stat-item completed">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>

          <div class="stat-item blocked">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.blocked }}</div>
              <div class="stat-label">阻塞中</div>
            </div>
          </div>
        </div>

        <!-- 详细状态分布 -->
        <div class="detailed-status">
          <div class="status-title">详细状态分布</div>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-dot not-started"></span>
              <span class="status-label">未启动</span>
              <span class="status-count">{{ stats.notStarted }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot in-dev"></span>
              <span class="status-label">研发中</span>
              <span class="status-count">{{ stats.inDevelopment }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot in-test"></span>
              <span class="status-label">上线中</span>
              <span class="status-count">{{ stats.inTesting }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot online"></span>
              <span class="status-label">已上线</span>
              <span class="status-count">{{ stats.online }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot offline"></span>
              <span class="status-label">已下线</span>
              <span class="status-count">{{ stats.offline }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
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
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门进度分布</span>
            </div>
          </template>
          <div ref="departmentChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Todo Items -->
    <el-card class="todo-card">
      <template #header>
        <div class="card-header">
          <span>待办事项</span>
          <el-button type="text" @click="refreshTodos">刷新</el-button>
        </div>
      </template>

      <div class="todo-list" v-loading="loading">
        <div 
          v-for="task in myTasks" 
          :key="task.id"
          :class="['todo-item', { 'urgent': task.isUrgent }]"
        >
          <div class="todo-content">
            <div class="todo-title">
              <strong>{{ task.title }}</strong>
            </div>
            <div :class="['todo-detail', { 'danger': task.isUrgent }]">
              {{ task.isUrgent ? '⏰ ' : '' }}计划完成日期：{{ task.plannedDate }}
              <span v-if="task.isUrgent">（紧急）</span>
            </div>
          </div>
          <el-button 
            :type="task.isUrgent ? 'primary' : 'default'" 
            @click="task.isUrgent ? handleTask(task) : viewDetails(task)"
          >
            {{ task.isUrgent ? '立即处理' : '查看详情' }}
          </el-button>
        </div>
        
        <el-empty v-if="!loading && myTasks.length === 0" description="暂无待办任务" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DashboardAPI } from '@/api/dashboard'
import { useChart, getMonthlyCompletionOptions, getDepartmentPieOptions } from '@/composables/useCharts'

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

// Chart refs
const progressChartRef = ref<HTMLElement | null>(null)
const departmentChartRef = ref<HTMLElement | null>(null)

// Chart data from API
const chartData = ref({
  progressTrend: [] as any[],
  monthlyCompletion: [] as any[],
  departmentDistribution: [] as any[]
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

const departmentChartOptions = computed(() => {
  if (chartData.value.departmentDistribution.length === 0) {
    // 如果还没有数据，显示空图表
    return getDepartmentPieOptions([])
  }

  return getDepartmentPieOptions(
    chartData.value.departmentDistribution.map(dept => ({
      name: dept.name,
      value: dept.value
    }))
  )
})

// Load dashboard data
const loadDashboardData = async () => {
  try {
    loading.value = true

    // 获取统计数据和任务
    const [statsData, tasks, deptData] = await Promise.all([
      DashboardAPI.getDashboardStats(),
      DashboardAPI.getMyTasks(5),
      DashboardAPI.getDepartmentDistribution()
    ])

    stats.value = statsData
    myTasks.value = tasks
    chartData.value.departmentDistribution = deptData

    // 加载月度完成数据
    await loadMonthlyData()

    // 刷新图表
    setTimeout(() => {
      refreshProgressChart()
      refreshDepartmentChart()
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

// 备用数据加载方法（如果主API失败）
const loadDataFallback = async () => {
  try {
    // 并行加载各个数据
    const [statsData, tasks, monthlyData, deptData] = await Promise.all([
      DashboardAPI.getDashboardStats(),
      DashboardAPI.getMyTasks(5),
      DashboardAPI.getMonthlyCompletionTrend(trendType.value),
      DashboardAPI.getDepartmentDistribution()
    ])

    stats.value = statsData
    myTasks.value = tasks
    chartData.value.monthlyCompletion = monthlyData
    chartData.value.departmentDistribution = deptData

    // 刷新图表
    setTimeout(() => {
      refreshProgressChart()
      refreshDepartmentChart()
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

// Initialize WebSocket connection (disabled for testing)
const initializeWebSocket = async () => {
  // WebSocket disabled for testing since backend is not running
  console.log('WebSocket disabled for testing mode')
}

// 定期刷新数据（每30秒）
const startAutoRefresh = () => {
  setInterval(async () => {
    try {
      // 静默刷新统计数据
      const newStats = await DashboardAPI.getDashboardStats()
      stats.value = newStats
    } catch (error) {
      console.error('Auto refresh failed:', error)
    }
  }, 30000)
}

// Initialize charts
const { refresh: refreshProgressChart } = useChart(progressChartRef, progressChartOptions)
const { refresh: refreshDepartmentChart } = useChart(departmentChartRef, departmentChartOptions)

onMounted(async () => {
  await loadDashboardData()
  await initializeWebSocket()
  startAutoRefresh()

  // Refresh charts on window resize
  window.addEventListener('resize', () => {
    refreshProgressChart()
    refreshDepartmentChart()
  })
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

/* Overall Progress Card */
.overall-progress-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.section-subtitle {
  font-size: 14px;
  color: #718096;
}

.overall-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Main Stats */
.main-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-item:hover {
  background: #edf2f7;
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-item.total .stat-value {
  color: #4a5568;
}

.stat-item.active .stat-value {
  color: #3182ce;
}

.stat-item.completed .stat-value {
  color: #38a169;
}

.stat-item.blocked .stat-value {
  color: #e53e3e;
}

.stat-label {
  font-size: 13px;
  color: #718096;
}

/* Detailed Status */
.detailed-status {
  padding: 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 8px;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.not-started {
  background: #cbd5e0;
}

.status-dot.in-dev {
  background: #3182ce;
}

.status-dot.in-test {
  background: #ed8936;
}

.status-dot.online {
  background: #38a169;
}

.status-dot.offline {
  background: #e53e3e;
}

.status-label {
  font-size: 12px;
  color: #4a5568;
  flex: 1;
}

.status-count {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
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
  background: #fef5e7;
  border-left: 4px solid #f39c12;
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 16px;
  margin-bottom: 8px;
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

  /* 总体进度响应式 */
  .overall-progress-card .el-card__body {
    padding: 16px;
  }

  .main-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-icon {
    font-size: 24px;
  }

  .stat-value {
    font-size: 24px;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .detailed-status {
    padding: 16px;
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

  /* 总体进度响应式 - 小屏幕 */
  .overall-progress-card .el-card__body {
    padding: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .section-title {
    font-size: 16px;
  }

  .section-subtitle {
    font-size: 12px;
  }

  .main-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-item {
    padding: 10px;
    gap: 8px;
  }

  .stat-icon {
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  .status-grid {
    grid-template-columns: repeat(1, 1fr);
    gap: 8px;
  }

  .detailed-status {
    padding: 12px;
  }

  .status-title {
    font-size: 13px;
  }

}
</style>