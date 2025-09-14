<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <h1 class="title">AK云原生改造管理系统</h1>
        <div class="user-info">
          欢迎回来，{{ authStore.user?.full_name }} | {{ authStore.user?.department }}
        </div>
      </div>
      <div class="header-right">
        <el-button class="date-btn" type="info" plain>
          📅 {{ currentDate }}
        </el-button>
        <el-badge :value="3" class="notification-badge">
          <el-button type="primary">
            🔔 通知
          </el-button>
        </el-badge>
        <el-dropdown @command="handleUserCommand">
          <el-button type="text" class="user-dropdown">
            {{ authStore.user?.full_name }}
            <el-icon><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside width="240px" class="sidebar">
        <el-menu
          :default-active="$route.name as string"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="Dashboard">
            <el-icon><odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="Applications">
            <el-icon><document /></el-icon>
            <span>应用管理</span>
          </el-menu-item>
          <el-menu-item index="MyTasks">
            <el-icon><user /></el-icon>
            <span>我的任务</span>
          </el-menu-item>
          <el-menu-item index="Audit">
            <el-icon><search /></el-icon>
            <span>审计日志</span>
          </el-menu-item>
          <el-menu-item index="Import">
            <el-icon><upload /></el-icon>
            <span>批量导入</span>
          </el-menu-item>
          <el-menu-item index="Reports">
            <el-icon><pie-chart /></el-icon>
            <span>报表中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { ArrowDown, Odometer, Document, User, Search, Upload, PieChart } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'settings':
      ElMessage.info('设置功能开发中')
      break
    case 'logout':
      authStore.logout()
      router.push('/login')
      break
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    // For demo purposes, create a mock user
    authStore.user = {
      id: 1,
      sso_user_id: 'DEMO_001',
      username: 'zhangsan',
      full_name: '张三',
      email: 'zhangsan@company.com',
      department: '研发一部',
      role: 'editor',
      permissions: ['application:read', 'application:write', 'subtask:read', 'subtask:write']
    }
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.user-info {
  font-size: 14px;
  opacity: 0.9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.notification-badge {
  margin-right: 10px;
}

.user-dropdown {
  color: white;
  font-size: 16px;
}

.sidebar {
  background: white;
  border-right: 1px solid #e2e8f0;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
  font-size: 16px;
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.main-content {
  background: #f7fafc;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>