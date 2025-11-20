<template>
  <div class="cloud-native-dashboard">
    <!-- Header with title and filters -->
    <div class="dashboard-header">
      <div class="title-section">
        <h1>云原生改造成果展示</h1>
        <p class="subtitle">数据更新时间：{{ updateTime }}</p>
      </div>

      <div class="filter-section">
        <el-select v-model="selectedApp" placeholder="选择应用" style="width: 200px; margin-right: 12px;">
          <el-option
            v-for="app in appOptions"
            :key="app"
            :label="app"
            :value="app"
          />
        </el-select>

        <el-select v-model="timeRange" placeholder="选择时间范围" style="width: 120px; margin-right: 12px;">
          <el-option
            v-for="time in timeOptions"
            :key="time"
            :label="time"
            :value="time"
          />
        </el-select>

        <el-button type="primary" @click="exportDashboard" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- Main Dashboard Grid - 2x2 Layout -->
    <el-row :gutter="20" class="dashboard-grid">
      <!-- Quadrant 1: Overall Transformation Summary -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <h3>改造总体概况</h3>
          </template>

          <!-- Trend Chart -->
          <div class="chart-wrapper">
            <h4 class="chart-subtitle">云原生改造效果趋势</h4>
            <div ref="trendChartRef" class="chart-container"></div>
          </div>

          <!-- Statistics Summary -->
          <div class="stats-summary">
            <h4 class="chart-subtitle">改造进度统计</h4>
            <el-row :gutter="12" class="stats-grid">
              <el-col :span="8">
                <div class="stat-card completed">
                  <div class="stat-value">43</div>
                  <div class="stat-label">已完成改造</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card total">
                  <div class="stat-value">258</div>
                  <div class="stat-label">计划总数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card rate">
                  <div class="stat-value">18%</div>
                  <div class="stat-label">完成率</div>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="12" class="stats-grid">
              <el-col :span="12">
                <div class="stat-card critical">
                  <div class="stat-value">16</div>
                  <div class="stat-label">关键业务应用</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-card ongoing">
                  <div class="stat-value">3</div>
                  <div class="stat-label">进行中</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- Quadrant 2: Top Performers -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <h3>优秀表现应用</h3>
          </template>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="info-alert"
          >
            <template #title>
              <span style="font-size: 13px;">下列应用根据云原生成熟度评分和性能提升幅度综合排名。CPU和内存利用率显示<strong>提升百分点</strong>，部署时间显示<strong>降低百分比</strong>。</span>
            </template>
          </el-alert>

          <!-- Top Performers List -->
          <div class="top-performers">
            <div
              v-for="app in topPerformers.slice(0, 4)"
              :key="app.id"
              class="performer-card"
            >
              <div class="performer-header">
                <div>
                  <el-tag type="primary" size="small">#{app.id}</el-tag>
                  <span class="performer-name">{{ app.name }}</span>
                </div>
                <el-tag type="success" size="small">{{ app.score }}分</el-tag>
              </div>
              <div class="performer-metrics">
                <div class="metric cpu">
                  <div class="metric-label">CPU利用率</div>
                  <div class="metric-value">↑{{ app.cpuImprovement }}%</div>
                  <el-progress :percentage="app.cpuImprovement" :show-text="false" color="#52c41a" />
                </div>
                <div class="metric memory">
                  <div class="metric-label">内存利用率</div>
                  <div class="metric-value">↑{{ app.memoryImprovement }}%</div>
                  <el-progress :percentage="app.memoryImprovement" :show-text="false" color="#1890ff" />
                </div>
                <div class="metric deployment">
                  <div class="metric-label">部署时间</div>
                  <div class="metric-value">↓{{ app.deploymentReduction }}%</div>
                  <el-progress :percentage="app.deploymentReduction" :show-text="false" color="#faad14" />
                </div>
              </div>
            </div>
          </div>

          <!-- Maturity Scores Chart -->
          <div class="chart-wrapper" style="margin-top: 16px;">
            <div ref="maturityChartRef" class="chart-container-small"></div>
          </div>
        </el-card>
      </el-col>

      <!-- Quadrant 3: Improvement Overview -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <h3>改造前后提升百分比</h3>
          </template>
          <div ref="improvementChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- Quadrant 4: Cost Efficiency -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <h3>成本效益分析</h3>
          </template>
          <div class="cost-analysis">
            <div class="cost-circle">
              <div class="cost-value">42%</div>
              <div class="cost-label">总体成本降低</div>
            </div>
            <el-row :gutter="16" style="margin-top: 24px;">
              <el-col :span="12">
                <div class="cost-card hardware">
                  <div class="cost-percent">65%</div>
                  <div class="cost-desc">硬件成本降低</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="cost-card operation">
                  <div class="cost-percent">38%</div>
                  <div class="cost-desc">运维成本降低</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Resource Utilization Comparison -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <h3>资源利用率对比</h3>
          </template>
          <el-row :gutter="20">
            <el-col :xs="24" :lg="12">
              <h4 class="chart-subtitle">CPU利用率对比</h4>
              <div ref="cpuChartRef" class="chart-container"></div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <h4 class="chart-subtitle">内存利用率对比</h4>
              <div ref="memoryChartRef" class="chart-container"></div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- Elastic Scaling and Deployment Time -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <h3>弹性伸缩与部署时间优化</h3>
          </template>
          <el-row :gutter="20">
            <el-col :xs="24" :lg="12">
              <h4 class="chart-subtitle">弹性伸缩能力</h4>
              <div ref="elasticChartRef" class="chart-container"></div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <h4 class="chart-subtitle">部署时间优化</h4>
              <div ref="deploymentChartRef" class="chart-container"></div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- Additional Metrics -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="8">
        <el-card class="dashboard-card">
          <template #header>
            <h3>部署频率对比</h3>
          </template>
          <div ref="frequencyChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card class="dashboard-card">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3>实时资源监控</h3>
              <el-tag type="success" effect="dark" size="small">
                {{ selectedApp === '全部应用' ? '监控所有应用' : selectedApp }} (每2秒更新)
              </el-tag>
            </div>
          </template>
          <div ref="realtimeChartRef" class="chart-container"></div>

          <!-- Realtime Stats Grid -->
          <el-row :gutter="8" style="margin-top: 12px;">
            <el-col
              v-for="(app, index) in realtimeData"
              :key="index"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="4"
            >
              <div
                class="realtime-stat"
                :class="{
                  warning: app.cpu > 45 || app.memory > 45,
                  normal: app.cpu <= 45 && app.memory <= 45,
                  dimmed: selectedApp !== '全部应用' && app.name !== selectedApp
                }"
              >
                <div class="realtime-name">{{ app.name }}</div>
                <div class="realtime-values">
                  <span>CPU: {{ app.cpu.toFixed(1) }}%</span>
                  <span>内存: {{ app.memory.toFixed(1) }}%</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'

// Types
interface TopPerformer {
  id: number
  name: string
  score: number
  cpuImprovement: number
  memoryImprovement: number
  deploymentReduction: number
}

interface UtilizationData {
  name: string
  before: number
  after: number
}

interface RealtimeData {
  name: string
  cpu: number
  memory: number
  network: number
  requests: number
  responseTime: number
}

// Refs
const selectedApp = ref('全部应用')
const timeRange = ref('月')
const updateTime = ref('2025-05-08 08:30')
const exporting = ref(false)

// Chart refs
const trendChartRef = ref<HTMLDivElement>()
const maturityChartRef = ref<HTMLDivElement>()
const improvementChartRef = ref<HTMLDivElement>()
const cpuChartRef = ref<HTMLDivElement>()
const memoryChartRef = ref<HTMLDivElement>()
const elasticChartRef = ref<HTMLDivElement>()
const deploymentChartRef = ref<HTMLDivElement>()
const frequencyChartRef = ref<HTMLDivElement>()
const realtimeChartRef = ref<HTMLDivElement>()

// Chart instances
let trendChart: ECharts | null = null
let maturityChart: ECharts | null = null
let improvementChart: ECharts | null = null
let cpuChart: ECharts | null = null
let memoryChart: ECharts | null = null
let elasticChart: ECharts | null = null
let deploymentChart: ECharts | null = null
let frequencyChart: ECharts | null = null
let realtimeChart: ECharts | null = null

// Data
const appOptions = ref(['全部应用', '交易核心平台', '客户管理系统', '支付网关系统', '风控引擎平台', '数据分析平台'])
const timeOptions = ref(['日', '周', '月', '季', '年'])

const topPerformers = ref<TopPerformer[]>([
  { id: 1, name: '交易核心平台', score: 92, cpuImprovement: 45, memoryImprovement: 48, deploymentReduction: 85 },
  { id: 2, name: '客户管理系统', score: 89, cpuImprovement: 42, memoryImprovement: 46, deploymentReduction: 79 },
  { id: 3, name: '支付网关系统', score: 86, cpuImprovement: 44, memoryImprovement: 43, deploymentReduction: 73 },
  { id: 4, name: '风控引擎平台', score: 84, cpuImprovement: 40, memoryImprovement: 44, deploymentReduction: 81 },
])

const cpuUtilizationData = ref<UtilizationData[]>([
  { name: '交易核心平台', before: 8, after: 53 },
  { name: '客户管理系统', before: 7, after: 49 },
  { name: '支付网关系统', before: 6, after: 50 },
  { name: '风控引擎平台', before: 5, after: 45 },
  { name: '数据分析平台', before: 6, after: 49 },
])

const memoryUtilizationData = ref<UtilizationData[]>([
  { name: '交易核心平台', before: 9, after: 57 },
  { name: '客户管理系统', before: 8, after: 54 },
  { name: '支付网关系统', before: 7, after: 50 },
  { name: '风控引擎平台', before: 6, after: 50 },
  { name: '数据分析平台', before: 8, after: 49 },
])

const realtimeData = ref<RealtimeData[]>([])

// Generate realtime data
const generateRealtimeData = () => {
  return [
    {
      name: '交易核心平台',
      cpu: 20 + Math.random() * 15,
      memory: 25 + Math.random() * 15,
      network: 30 + Math.random() * 20,
      requests: 200 + Math.floor(Math.random() * 100),
      responseTime: 50 + Math.floor(Math.random() * 30)
    },
    {
      name: '客户管理系统',
      cpu: 30 + Math.random() * 12,
      memory: 32 + Math.random() * 10,
      network: 28 + Math.random() * 15,
      requests: 150 + Math.floor(Math.random() * 80),
      responseTime: 65 + Math.floor(Math.random() * 25)
    },
    {
      name: '支付网关系统',
      cpu: 25 + Math.random() * 10,
      memory: 30 + Math.random() * 12,
      network: 35 + Math.random() * 10,
      requests: 180 + Math.floor(Math.random() * 90),
      responseTime: 40 + Math.floor(Math.random() * 35)
    },
    {
      name: '风控引擎平台',
      cpu: 28 + Math.random() * 15,
      memory: 35 + Math.random() * 10,
      network: 25 + Math.random() * 12,
      requests: 120 + Math.floor(Math.random() * 70),
      responseTime: 55 + Math.floor(Math.random() * 40)
    },
    {
      name: '数据分析平台',
      cpu: 35 + Math.random() * 15,
      memory: 30 + Math.random() * 15,
      network: 40 + Math.random() * 15,
      requests: 90 + Math.floor(Math.random() * 60),
      responseTime: 70 + Math.floor(Math.random() * 30)
    }
  ]
}

// Initialize realtime data
realtimeData.value = generateRealtimeData()

// Realtime update interval
let realtimeInterval: number | null = null

// Initialize trend chart
const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['CPU利用率 👍', '内存利用率 👍', '部署时间 👇'],
      top: '0%',
      left: 'center',
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: [
      {
        type: 'value',
        name: '资源利用率 (%)',
        max: 70
      },
      {
        type: 'value',
        name: '部署时间 (分钟)',
        max: 600
      }
    ],
    series: [
      {
        name: 'CPU利用率 👍',
        type: 'line',
        yAxisIndex: 0,
        data: [10, 18, 25, 38, 48, 52],
        smooth: true,
        itemStyle: { color: '#0088FE' }
      },
      {
        name: '内存利用率 👍',
        type: 'line',
        yAxisIndex: 0,
        data: [12, 21, 30, 42, 51, 55],
        smooth: true,
        itemStyle: { color: '#00C49F' }
      },
      {
        name: '部署时间 👇',
        type: 'line',
        yAxisIndex: 1,
        data: [580, 450, 320, 210, 120, 45],
        smooth: true,
        itemStyle: { color: '#FF8042' }
      }
    ]
  }

  trendChart.setOption(option)
}

// Initialize maturity chart
const initMaturityChart = () => {
  if (!maturityChartRef.value) return

  maturityChart = echarts.init(maturityChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '容器化程度', max: 5 },
        { name: '微服务拆分', max: 5 },
        { name: 'DevOps流程', max: 5 },
        { name: '弹性设计', max: 5 },
        { name: '可观测性', max: 5 },
        { name: '安全合规', max: 5 }
      ]
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [4.2, 3.8, 4.5, 4.0, 3.9, 4.1],
            name: '云原生成熟度评分'
          }
        ],
        areaStyle: {
          color: 'rgba(0, 136, 254, 0.3)'
        },
        itemStyle: {
          color: '#0088FE'
        }
      }
    ]
  }

  maturityChart.setOption(option)
}

// Initialize improvement chart
const initImprovementChart = () => {
  if (!improvementChartRef.value) return

  improvementChart = echarts.init(improvementChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      left: 'center',
      type: 'scroll',
      pageButtonPosition: 'end'
    },
    grid: {
      bottom: '15%'
    },
    series: [
      {
        type: 'pie',
        radius: '65%',
        data: [
          { value: 46, name: 'CPU利用率' },
          { value: 51, name: '内存利用率' },
          { value: 92, name: '弹性伸缩响应' },
          { value: 70, name: '开发部署时间' },
          { value: 65, name: '故障恢复时间' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  improvementChart.setOption(option)
}

// Initialize CPU chart
const initCpuChart = () => {
  if (!cpuChartRef.value) return

  cpuChart = echarts.init(cpuChartRef.value)

  const data = cpuUtilizationData.value
  const filteredData = selectedApp.value !== '全部应用'
    ? data.filter(item => item.name === selectedApp.value)
    : data

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['改造前', '改造后'],
      top: '0%',
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: filteredData.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      name: '利用率 (%)'
    },
    series: [
      {
        name: '改造前',
        type: 'bar',
        data: filteredData.map(item => item.before),
        itemStyle: { color: '#8884d8' }
      },
      {
        name: '改造后',
        type: 'bar',
        data: filteredData.map(item => item.after),
        itemStyle: { color: '#82ca9d' }
      }
    ]
  }

  cpuChart.setOption(option)
}

// Initialize memory chart
const initMemoryChart = () => {
  if (!memoryChartRef.value) return

  memoryChart = echarts.init(memoryChartRef.value)

  const data = memoryUtilizationData.value
  const filteredData = selectedApp.value !== '全部应用'
    ? data.filter(item => item.name === selectedApp.value)
    : data

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['改造前', '改造后'],
      top: '0%',
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: filteredData.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      name: '利用率 (%)'
    },
    series: [
      {
        name: '改造前',
        type: 'bar',
        data: filteredData.map(item => item.before),
        itemStyle: { color: '#8884d8' }
      },
      {
        name: '改造后',
        type: 'bar',
        data: filteredData.map(item => item.after),
        itemStyle: { color: '#82ca9d' }
      }
    ]
  }

  memoryChart.setOption(option)
}

// Initialize elastic scaling chart
const initElasticChart = () => {
  if (!elasticChartRef.value) return

  elasticChart = echarts.init(elasticChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['实际负载', '改造前固定配置', '改造后弹性配置'],
      top: '0%',
      left: 'center',
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    },
    yAxis: {
      type: 'value',
      name: '资源负载 (RPS)'
    },
    series: [
      {
        name: '改造前固定配置',
        type: 'line',
        data: [600, 600, 600, 600, 600, 600, 600, 600],
        areaStyle: { color: 'rgba(136, 132, 216, 0.3)' },
        itemStyle: { color: '#8884d8' }
      },
      {
        name: '改造后弹性配置',
        type: 'line',
        step: 'end',
        data: [350, 260, 330, 600, 680, 750, 650, 510],
        areaStyle: { color: 'rgba(130, 202, 157, 0.3)' },
        itemStyle: { color: '#82ca9d' }
      },
      {
        name: '实际负载',
        type: 'line',
        data: [320, 240, 310, 580, 650, 720, 630, 490],
        itemStyle: { color: '#ff7300' }
      }
    ]
  }

  elasticChart.setOption(option)
}

// Initialize deployment time chart
const initDeploymentChart = () => {
  if (!deploymentChartRef.value) return

  deploymentChart = echarts.init(deploymentChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['改造前', '改造后'],
      top: '0%',
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间 (分钟)'
    },
    yAxis: {
      type: 'category',
      data: ['规划', '编码', '测试', '部署']
    },
    series: [
      {
        name: '改造前',
        type: 'bar',
        data: [120, 240, 180, 90],
        itemStyle: { color: '#8884d8' }
      },
      {
        name: '改造后',
        type: 'bar',
        data: [40, 180, 60, 10],
        itemStyle: { color: '#82ca9d' }
      }
    ]
  }

  deploymentChart.setOption(option)
}

// Initialize frequency chart
const initFrequencyChart = () => {
  if (!frequencyChartRef.value) return

  frequencyChart = echarts.init(frequencyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['改造前', '改造后'],
      top: '0%',
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '部署次数'
    },
    series: [
      {
        name: '改造前',
        type: 'bar',
        data: [2, 3, 2, 3, 4, 3],
        itemStyle: { color: '#8884d8' }
      },
      {
        name: '改造后',
        type: 'bar',
        data: [6, 8, 12, 15, 21, 24],
        itemStyle: { color: '#82ca9d' }
      }
    ]
  }

  frequencyChart.setOption(option)
}

// Initialize realtime chart
const initRealtimeChart = () => {
  if (!realtimeChartRef.value) return

  realtimeChart = echarts.init(realtimeChartRef.value)
  updateRealtimeChart()
}

// Update realtime chart
const updateRealtimeChart = () => {
  if (!realtimeChart) return

  const filteredData = selectedApp.value !== '全部应用'
    ? realtimeData.value.filter(item => item.name === selectedApp.value)
    : realtimeData.value

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  const series = filteredData.map((app, index) => ({
    name: app.name,
    type: 'scatter',
    symbolSize: (val: number[]) => Math.sqrt(val[2]) / 2,
    data: [[app.cpu, app.memory, app.requests]],
    itemStyle: { color: colors[index % colors.length] }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const dataIndex = realtimeData.value.findIndex(item => item.name === params.seriesName)
        if (dataIndex === -1) return ''
        const data = realtimeData.value[dataIndex]
        return `
          <strong>${data.name}</strong><br/>
          CPU: ${data.cpu.toFixed(1)}%<br/>
          内存: ${data.memory.toFixed(1)}%<br/>
          请求量: ${data.requests}/分钟<br/>
          响应时间: ${data.responseTime}ms<br/>
          状态: ${data.cpu > 45 || data.memory > 45 ? '需要关注' : '正常'}
        `
      }
    },
    legend: {
      data: filteredData.map(item => item.name),
      bottom: '0%',
      left: 'center',
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'CPU利用率 (%)',
      max: 60,
      splitLine: { show: true }
    },
    yAxis: {
      type: 'value',
      name: '内存利用率 (%)',
      max: 60,
      splitLine: { show: true }
    },
    series: series
  }

  realtimeChart.setOption(option)
}

// Export dashboard
const exportDashboard = async () => {
  exporting.value = true
  try {
    const element = document.querySelector('.cloud-native-dashboard') as HTMLElement
    if (!element) return

    const canvas = await html2canvas(element, {
      backgroundColor: '#f5f5f5',
      scale: 2
    })

    const link = document.createElement('a')
    link.download = `云原生改造成果展示_${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// Watch for filter changes
watch([selectedApp, timeRange], () => {
  nextTick(() => {
    initCpuChart()
    initMemoryChart()
    updateRealtimeChart()
  })
})

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initMaturityChart()
    initImprovementChart()
    initCpuChart()
    initMemoryChart()
    initElasticChart()
    initDeploymentChart()
    initFrequencyChart()
    initRealtimeChart()

    // Start realtime updates
    realtimeInterval = window.setInterval(() => {
      realtimeData.value = generateRealtimeData()
      updateRealtimeChart()
    }, 2000)

    // Handle window resize
    const handleResize = () => {
      trendChart?.resize()
      maturityChart?.resize()
      improvementChart?.resize()
      cpuChart?.resize()
      memoryChart?.resize()
      elasticChart?.resize()
      deploymentChart?.resize()
      frequencyChart?.resize()
      realtimeChart?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })
})

onUnmounted(() => {
  if (realtimeInterval) {
    clearInterval(realtimeInterval)
  }

  trendChart?.dispose()
  maturityChart?.dispose()
  improvementChart?.dispose()
  cpuChart?.dispose()
  memoryChart?.dispose()
  elasticChart?.dispose()
  deploymentChart?.dispose()
  frequencyChart?.dispose()
  realtimeChart?.dispose()
})
</script>

<style scoped lang="scss">
.cloud-native-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section {
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 4px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dashboard-grid {
  margin-bottom: 20px;
}

.dashboard-card {
  margin-bottom: 0;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.chart-wrapper {
  margin-bottom: 20px;
}

.chart-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 12px 0;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container-small {
  width: 100%;
  height: 220px;
}

.stats-summary {
  margin-top: 20px;
}

.stats-grid {
  margin-bottom: 12px;
}

.stat-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    color: #606266;
  }

  &.completed .stat-value {
    color: #52c41a;
  }

  &.total .stat-value {
    color: #722ed1;
  }

  &.rate .stat-value {
    color: #13c2c2;
  }

  &.critical .stat-value {
    color: #faad14;
  }

  &.ongoing .stat-value {
    color: #f5222d;
  }
}

.info-alert {
  margin-bottom: 16px;
}

.top-performers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.performer-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.performer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .performer-name {
    margin-left: 8px;
    font-weight: 500;
    color: #303133;
  }
}

.performer-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.metric {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 8px;

  .metric-label {
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
  }

  .metric-value {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  &.cpu .metric-value {
    color: #52c41a;
  }

  &.memory .metric-value {
    color: #1890ff;
  }

  &.deployment .metric-value {
    color: #faad14;
  }
}

.cost-analysis {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.cost-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;

  .cost-value {
    font-size: 48px;
    font-weight: 700;
  }

  .cost-label {
    font-size: 14px;
    margin-top: 8px;
  }
}

.cost-card {
  text-align: center;
  padding: 16px;
  border-radius: 8px;

  .cost-percent {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .cost-desc {
    font-size: 12px;
  }

  &.hardware {
    background: #f6ffed;
    border: 1px solid #b7eb8f;

    .cost-percent {
      color: #52c41a;
    }
  }

  &.operation {
    background: #f9f0ff;
    border: 1px solid #d3adf7;

    .cost-percent {
      color: #722ed1;
    }
  }
}

.realtime-stat {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;

  &.warning {
    background: #fff2e8;
    border-color: #ffbb96;

    .realtime-name {
      color: #fa541c;
    }
  }

  &.normal {
    background: #f6ffed;
    border-color: #b7eb8f;

    .realtime-name {
      color: #52c41a;
    }
  }

  &.dimmed {
    opacity: 0.5;
  }

  .realtime-name {
    font-weight: 500;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .realtime-values {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #606266;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
  }

  .filter-section {
    width: 100%;

    .el-select {
      flex: 1;
    }
  }

  .top-performers {
    grid-template-columns: 1fr;
  }
}
</style>
