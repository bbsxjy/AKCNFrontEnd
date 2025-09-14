<template>
  <div class="dashboard">
    <!-- Statistics Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value">156</div>
          <div class="stat-label">应用总数</div>
          <el-progress :percentage="45" :show-text="false" class="stat-progress" />
          <div class="stat-detail">整体进度 45%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value progress">78</div>
          <div class="stat-label">进行中</div>
          <div class="stat-icon">📈</div>
          <div class="stat-detail">+12 本月新增</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value success">45</div>
          <div class="stat-label">已完成</div>
          <div class="stat-icon">✅</div>
          <div class="stat-detail">28.8% 完成率</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-value danger">12</div>
          <div class="stat-label">存在阻塞</div>
          <div class="stat-icon">⚠️</div>
          <div class="stat-detail">需要关注</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>改造进度趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            📊 折线图：显示每月完成的应用数量趋势
            <div style="color: #718096; margin-top: 10px;">
              图表将在连接后端API后显示真实数据
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门进度分布</span>
            </div>
          </template>
          <div class="chart-placeholder" style="height: 300px;">
            📈 饼图：各部门完成情况
            <div style="color: #718096; margin-top: 10px; font-size: 14px;">
              图表将在连接后端API后显示真实数据
            </div>
          </div>
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

      <div class="todo-list">
        <div class="todo-item urgent">
          <div class="todo-content">
            <div class="todo-title">
              <strong>用户管理系统 - 数据库迁移模块</strong>
            </div>
            <div class="todo-detail danger">
              ⏰ 计划完成日期：2025-01-20（剩余5天）
            </div>
          </div>
          <el-button type="primary" @click="handleTask">立即处理</el-button>
        </div>

        <div class="todo-item">
          <div class="todo-content">
            <div class="todo-title">
              <strong>订单系统 - 前端改造模块</strong>
            </div>
            <div class="todo-detail">
              计划完成日期：2025-02-01
            </div>
          </div>
          <el-button @click="viewDetails">查看详情</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const refreshTodos = () => {
  ElMessage.success('待办事项已刷新')
}

const handleTask = () => {
  ElMessage.info('跳转到任务详情页面')
}

const viewDetails = () => {
  ElMessage.info('查看任务详情')
}
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
</style>