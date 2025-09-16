<template>
  <div class="dashboard">
    <!-- Statistics Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">应用总数</div>
          <el-progress :percentage="stats.averageProgress" :show-text="false" class="stat-progress" />
          <div class="stat-detail">整体进度 {{ stats.averageProgress }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value progress">{{ stats.active }}</div>
          <div class="stat-label">进行中</div>
          <div class="stat-icon">📈</div>
          <div class="stat-detail">{{ Math.round(stats.active / stats.total * 100) || 0 }}% 占比</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value success">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
          <div class="stat-icon">✅</div>
          <div class="stat-detail">{{ Math.round(stats.completed / stats.total * 100) || 0 }}% 完成率</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value danger">{{ stats.blocked }}</div>
          <div class="stat-label">存在阻塞</div>
          <div class="stat-icon">⚠️</div>
          <div class="stat-detail">需要关注</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>改造进度趋势</span>
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
import { useChart, getProgressTrendOptions, getDepartmentPieOptions } from '@/composables/useCharts'

const router = useRouter()

// Stats data
const stats = ref({
  total: 0,
  active: 0,
  completed: 0,
  blocked: 0,
  averageProgress: 0
})

// My tasks data
const myTasks = ref<any[]>([])
const loading = ref(false)

// Chart refs
const progressChartRef = ref<HTMLElement | null>(null)
const departmentChartRef = ref<HTMLElement | null>(null)

// Chart data from API
const chartData = ref({
  progressTrend: [] as any[],
  departmentDistribution: [] as any[]
})

// Chart data
const progressChartOptions = computed(() => {
  if (chartData.value.progressTrend.length === 0) {
    // 如果还没有数据，显示空图表
    return getProgressTrendOptions({ dates: [], values: [] })
  }

  const dates = chartData.value.progressTrend.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  })
  const values = chartData.value.progressTrend.map(item => item.value)

  return getProgressTrendOptions({ dates, values })
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

    // 使用 DashboardAPI 获取所有数据
    const dashboardData = await DashboardAPI.getDashboardData()

    // 更新统计数据
    stats.value = dashboardData.stats

    // 更新图表数据
    chartData.value = dashboardData.chartData
    console.log('Dashboard chart data loaded:', dashboardData.chartData)
    console.log('Progress trend data:', dashboardData.chartData.progressTrend)

    // 更新我的任务
    myTasks.value = dashboardData.myTasks

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

// 备用数据加载方法（如果主API失败）
const loadDataFallback = async () => {
  try {
    // 并行加载各个数据
    const [statsData, tasks, chartDataResult] = await Promise.all([
      DashboardAPI.getDashboardStats(),
      DashboardAPI.getMyTasks(5),
      DashboardAPI.getChartData()
    ])

    stats.value = statsData
    myTasks.value = tasks
    chartData.value = chartDataResult

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

.stat-card {
  text-align: center;
}

.stat-card .el-card__body {
  padding: 30px 20px;
}

.stat-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10px;
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

.stat-label {
  color: #718096;
  margin-bottom: 15px;
  font-size: 16px;
}

.stat-progress {
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stat-detail {
  font-size: 12px;
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
}
</style>