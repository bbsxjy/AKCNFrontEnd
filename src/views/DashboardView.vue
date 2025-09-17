<template>
  <div class="dashboard">
    <!-- 第一行：AK改造和云原生改造（核心指标） -->
    <el-row :gutter="20" class="stats-row primary-row">
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <el-card class="transformation-card ak-card">
          <div class="transformation-header">
            <div class="transformation-icon">AK</div>
            <div class="transformation-title">AK改造</div>
          </div>
          <div class="transformation-body">
            <div class="transformation-main">
              <div class="main-value">{{ stats.akCompleted }}</div>
              <div class="main-label">已完成</div>
              <el-progress
                :percentage="Math.round(stats.akCompleted / stats.akTotal * 100) || 0"
                :stroke-width="8"
                color="#667eea"
                class="transformation-progress"
              />
            </div>
            <div class="transformation-details">
              <div class="detail-item">
                <span class="detail-value">{{ stats.akTotal }}</span>
                <span class="detail-label">总数</span>
              </div>
              <div class="detail-item">
                <span class="detail-value progress">{{ stats.akInProgress }}</span>
                <span class="detail-label">进行中</span>
              </div>
              <div class="detail-item">
                <span class="detail-value">{{ stats.akTotal - stats.akCompleted - stats.akInProgress }}</span>
                <span class="detail-label">待启动</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <el-card class="transformation-card cloud-card">
          <div class="transformation-header">
            <div class="transformation-icon cloud">☁️</div>
            <div class="transformation-title">云原生改造</div>
          </div>
          <div class="transformation-body">
            <div class="transformation-main">
              <div class="main-value">{{ stats.cloudNativeCompleted }}</div>
              <div class="main-label">已完成</div>
              <el-progress
                :percentage="Math.round(stats.cloudNativeCompleted / stats.cloudNativeTotal * 100) || 0"
                :stroke-width="8"
                color="#48bb78"
                class="transformation-progress"
              />
            </div>
            <div class="transformation-details">
              <div class="detail-item">
                <span class="detail-value">{{ stats.cloudNativeTotal }}</span>
                <span class="detail-label">总数</span>
              </div>
              <div class="detail-item">
                <span class="detail-value progress">{{ stats.cloudNativeInProgress }}</span>
                <span class="detail-label">进行中</span>
              </div>
              <div class="detail-item">
                <span class="detail-value">{{ stats.cloudNativeTotal - stats.cloudNativeCompleted - stats.cloudNativeInProgress }}</span>
                <span class="detail-label">待启动</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：整体统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">应用总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-value progress">{{ stats.active }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value success">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value danger">{{ stats.blocked }}</div>
          <div class="stat-label">阻塞</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：详细状态分布 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="24">
        <el-card class="status-distribution-card">
          <div class="status-distribution">
            <div class="status-item">
              <div class="status-icon">⏳</div>
              <div class="status-content">
                <span class="status-value">{{ stats.notStarted }}</span>
                <span class="status-label">未启动</span>
              </div>
            </div>
            <div class="status-divider"></div>
            <div class="status-item">
              <div class="status-icon">💻</div>
              <div class="status-content">
                <span class="status-value progress">{{ stats.inDevelopment }}</span>
                <span class="status-label">研发中</span>
              </div>
            </div>
            <div class="status-divider"></div>
            <div class="status-item">
              <div class="status-icon">🚀</div>
              <div class="status-content">
                <span class="status-value warning">{{ stats.inTesting }}</span>
                <span class="status-label">上线中</span>
              </div>
            </div>
            <div class="status-divider"></div>
            <div class="status-item">
              <div class="status-icon">🌐</div>
              <div class="status-content">
                <span class="status-value success">{{ stats.online }}</span>
                <span class="status-label">已上线</span>
              </div>
            </div>
            <div class="status-divider"></div>
            <div class="status-item">
              <div class="status-icon">📴</div>
              <div class="status-content">
                <span class="status-value danger">{{ stats.offline }}</span>
                <span class="status-label">已下线</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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

/* Transformation Cards (AK and Cloud-Native) */
.transformation-card {
  height: 200px;
  transition: all 0.3s;
}

.transformation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  margin-bottom: 20px;
}

.transformation-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 12px;
}

.transformation-icon.cloud {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  font-size: 24px;
}

.transformation-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.transformation-body {
  display: flex;
  flex: 1;
  gap: 20px;
}

.transformation-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-value {
  font-size: 36px;
  font-weight: bold;
  color: #2d3748;
  line-height: 1;
}

.main-label {
  color: #718096;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 12px;
}

.transformation-progress {
  width: 100%;
}

.transformation-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value {
  font-size: 20px;
  font-weight: 600;
  color: #4a5568;
}

.detail-value.progress {
  color: #3182ce;
}

.detail-label {
  color: #a0aec0;
  font-size: 12px;
}

/* Overall Stats Cards */
.stat-card {
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card .el-card__body {
  padding: 20px 15px;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-value.progress {
  color: #3182ce;
}

.stat-value.success {
  color: #38a169;
}

.stat-value.danger {
  color: #e53e3e;
}

.stat-value.warning {
  color: #ed8936;
}

.stat-label {
  color: #718096;
  margin-bottom: 10px;
  font-size: 14px;
}

.stat-progress {
  margin-bottom: 5px;
}

.stat-detail {
  font-size: 12px;
  color: #718096;
}

/* Status Distribution Card */
.status-distribution-card .el-card__body {
  padding: 20px;
}

.status-distribution {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 28px;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
}

.status-value.progress {
  color: #3182ce;
}

.status-value.success {
  color: #38a169;
}

.status-value.danger {
  color: #e53e3e;
}

.status-value.warning {
  color: #ed8936;
}

.status-label {
  color: #718096;
  font-size: 12px;
  margin-top: 2px;
}

.status-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}

.target-title {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 12px;
}

.target-items {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.target-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.target-value {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
  line-height: 1.2;
}

.target-value.success {
  color: #38a169;
}

.target-value.progress {
  color: #3182ce;
}

.target-label {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.target-divider {
  width: 1px;
  height: 50px;
  background: #e2e8f0;
  margin: 0 20px;
}

.status-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  line-height: 1.2;
}

.status-value.progress {
  color: #3182ce;
}

.status-value.success {
  color: #38a169;
}

.status-value.danger {
  color: #e53e3e;
}

.status-value.warning {
  color: #ed8936;
}

.status-label {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
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
  
  .stat-value {
    font-size: 2em;
  }
  
  .stat-label {
    font-size: 14px;
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

  /* 新增统计卡片响应式 */
  .stat-card-horizontal .el-card__body {
    padding: 12px;
  }

  .target-stats {
    flex-direction: column;
    gap: 15px;
  }

  .target-divider {
    width: 100%;
    height: 1px;
    margin: 15px 0;
  }

  .target-title {
    font-size: 14px;
  }

  .target-items {
    flex-wrap: wrap;
  }

  .target-value {
    font-size: 16px;
  }

  .target-label {
    font-size: 11px;
  }

  .status-stats {
    flex-wrap: wrap;
    gap: 10px;
  }

  .status-value {
    font-size: 20px;
  }

  .status-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 8px;
  }
  
  .stat-card .el-card__body {
    padding: 15px 10px;
  }
  
  .stat-value {
    font-size: 1.8em;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .stat-icon {
    font-size: 20px;
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

  /* 新增统计卡片响应式 - 小屏幕 */
  .stat-card-horizontal .el-card__body {
    padding: 10px 8px;
  }

  .target-stats {
    flex-direction: column;
    gap: 12px;
  }

  .target-section {
    width: 100%;
  }

  .target-divider {
    width: 100%;
    height: 1px;
    margin: 12px 0;
  }

  .target-title {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .target-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .target-value {
    font-size: 14px;
  }

  .target-label {
    font-size: 10px;
  }

  .status-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 8px 0;
  }

  .status-item {
    padding: 5px;
  }

  .status-value {
    font-size: 18px;
  }

  .status-label {
    font-size: 10px;
    margin-top: 2px;
  }
}
</style>