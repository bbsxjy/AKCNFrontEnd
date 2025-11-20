<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <el-button
          v-if="isMobile"
          :icon="Menu"
          class="mobile-menu-btn"
          @click="toggleSidebar"
        />
        <h1 class="title">
          <span v-if="!isMobile">项目协同管理应用</span>
          <span v-else>项目协同管理</span>
        </h1>
      </div>
      <div class="header-right">
        <el-button v-if="!isMobile" class="date-btn" type="info" plain>
          📅 {{ currentDate }}
        </el-button>
        <el-dropdown @command="handleNotificationCommand" trigger="click">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-button type="primary" :size="isMobile ? 'small' : 'default'">
              🔔 <span v-if="!isMobile">通知</span>
            </el-button>
          </el-badge>
          <template #dropdown>
            <el-dropdown-menu style="width: 350px;">
              <div v-if="!notifications || notifications.length === 0" style="padding: 20px; text-align: center; color: #909399;">
                暂无新通知
              </div>
              <el-dropdown-item v-for="notification in (notifications || []).slice(0, 5)" :key="notification.id" :command="`view_${notification.id}`">
                <div style="padding: 8px 0;">
                  <div style="font-weight: bold; margin-bottom: 4px;">{{ notification.title }}</div>
                  <div style="color: #606266; font-size: 12px;">{{ notification.message }}</div>
                  <div style="color: #909399; font-size: 11px; margin-top: 4px;">{{ formatTime(notification.created_at) }}</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item v-if="notifications && notifications.length > 0" divided command="mark_all_read">
                <div style="text-align: center; color: #409EFF;">标记全部已读</div>
              </el-dropdown-item>
              <el-dropdown-item command="view_all">
                <div style="text-align: center; color: #409EFF;">查看全部通知</div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="handleUserCommand">
          <el-button type="text" class="user-dropdown" :size="isMobile ? 'small' : 'default'">
            {{ isMobile ? authStore.user?.full_name?.slice(0, 2) || '用户' : authStore.user?.full_name }}
            <el-icon><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside 
        :width="isMobile ? '200px' : '240px'" 
        class="sidebar" 
        :class="{ 
          'sidebar-collapsed': isMobile && !sidebarVisible,
          'sidebar-mobile': isMobile,
          'sidebar-overlay': isMobile && sidebarVisible
        }"
      >
        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
          :collapse="isMobile && !sidebarVisible"
        >
          <!-- 动态菜单：优先使用后端返回的菜单权限 -->
          <template v-if="authStore.menuGroups && authStore.menuGroups.length > 0">
            <el-menu-item-group
              v-for="group in authStore.menuGroups"
              :key="group.id"
              :title="group.title"
            >
              <el-menu-item
                v-for="item in group.items"
                :key="item.id"
                :index="item.path"
                :disabled="!item.enabled"
              >
                <el-icon><component :is="getIconComponent(item.icon)" /></el-icon>
                <span>{{ item.title }}</span>
                <el-badge
                  v-if="item.badge"
                  :value="item.badge"
                  :type="item.badge_type || 'primary'"
                  style="margin-left: 8px;"
                />
              </el-menu-item>
            </el-menu-item-group>
          </template>

          <!-- Fallback：使用前端权限判断（后端API未实现时） -->
          <template v-else>
            <!-- 常用功能 -->
            <el-menu-item-group title="常用功能">
              <el-menu-item v-if="canViewRoute('Dashboard')" index="/dashboard">
                <el-icon><odometer /></el-icon>
                <span>仪表盘</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('Applications')" index="/applications">
                <el-icon><document /></el-icon>
                <span>应用管理</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('MyTasks')" index="/my-tasks">
                <el-icon><user /></el-icon>
                <span>我的任务</span>
              </el-menu-item>
            </el-menu-item-group>

            <!-- 数据管理 (Admin, Manager) -->
            <el-menu-item-group v-if="canViewRoute('Import') || canViewRoute('Reports') || canViewRoute('CloudNative')" title="数据管理">
              <el-menu-item v-if="canViewRoute('Import')" index="/import">
                <el-icon><upload /></el-icon>
                <span>批量导入</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('Reports')" index="/reports">
                <el-icon><pie-chart /></el-icon>
                <span>报表中心</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('CloudNative')" index="/cloud-native">
                <el-icon><trend-charts /></el-icon>
                <span>云原生改造成果</span>
              </el-menu-item>
            </el-menu-item-group>

            <!-- 系统管理 (Admin, Manager) -->
            <el-menu-item-group v-if="canViewRoute('UserManagement') || canViewRoute('Announcements') || canViewRoute('Audit')" title="系统管理">
              <el-menu-item v-if="canViewRoute('UserManagement')" index="/user-management">
                <el-icon><setting /></el-icon>
                <span>用户管理</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('Announcements')" index="/announcements">
                <el-icon><bell-filled /></el-icon>
                <span>公告管理</span>
              </el-menu-item>

              <el-menu-item v-if="canViewRoute('Audit')" index="/audit">
                <el-icon><search /></el-icon>
                <span>审计日志</span>
              </el-menu-item>
            </el-menu-item-group>

            <!-- 辅助工具 -->
            <el-menu-item-group title="辅助工具">
              <el-menu-item v-if="canViewRoute('MCPAgent')" index="/mcp-agent">
                <el-icon><chat-dot-round /></el-icon>
                <span>智能助手</span>
              </el-menu-item>
            </el-menu-item-group>
          </template>
        </el-menu>
      </el-aside>

      <!-- 移动端遮罩层 -->
      <div 
        v-if="isMobile && sidebarVisible" 
        class="sidebar-mask"
        @click="closeSidebar"
      />

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
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { ArrowDown, Odometer, Document, User, Search, Upload, PieChart, Menu, Setting, ChatDotRound, BellFilled, TrendCharts } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElNotification } from 'element-plus'
import { NotificationsAPI } from '@/api/notifications'
import { canAccessRoute, type UserRole } from '@/utils/permissions'
import { getIconComponent } from '@/utils/iconMap'

const router = useRouter()
const authStore = useAuthStore()

// 响应式变量
const isMobile = ref(false)
const sidebarVisible = ref(false)
const notificationCount = ref(0)
const notifications = ref<any[]>([])
const showNotifications = ref(false)

// 计算属性
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// 移动端检测
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    sidebarVisible.value = true
  } else {
    sidebarVisible.value = false
  }
}

// 侧边栏控制
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const closeSidebar = () => {
  sidebarVisible.value = false
}

// 监听路由变化，移动端下自动关闭侧边栏
router.afterEach(() => {
  if (isMobile.value) {
    sidebarVisible.value = false
  }
})

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'logout':
      ElMessage.info('测试模式下无需登出')
      break
    default:
      break
  }
}

const handleNotificationCommand = async (command: string) => {
  if (command === 'mark_all_read') {
    try {
      await NotificationsAPI.markAllAsRead()
      notifications.value = []
      notificationCount.value = 0
      ElMessage.success('已标记全部为已读')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  } else if (command === 'view_all') {
    router.push('/notifications')
  } else if (command.startsWith('view_')) {
    const notificationId = parseInt(command.replace('view_', ''))
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      await NotificationsAPI.markAsRead(notificationId)
      notification.is_read = true
      notificationCount.value = Math.max(0, notificationCount.value - 1)
      ElNotification({
        title: notification.title,
        message: notification.message,
        type: getSeverityType(notification.severity),
        duration: 5000
      })
    }
  }
}

const getSeverityType = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    default:
      return 'info'
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// Check if user can view a specific route
const canViewRoute = (routeName: string) => {
  const userRole = authStore.userRole as UserRole
  return canAccessRoute(userRole, routeName)
}

const loadNotifications = async () => {
  try {
    const response = await NotificationsAPI.getNotifications({ unread_only: true, limit: 10 })
    notifications.value = response.items || []
    notificationCount.value = response.unread_count || 0
  } catch (error) {
    console.error('Failed to load notifications:', error)
    // No fallback - show empty state
    notifications.value = []
    notificationCount.value = 0
  }
}

onMounted(async () => {
  // 初始化移动端检测
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Initialize auth store
  await authStore.initializeAuth()
  
  // Load notifications
  await loadNotifications()
  
  // Refresh notifications every 30 seconds
  const notificationInterval = setInterval(loadNotifications, 30000)
  
  // Store interval for cleanup
  onUnmounted(() => {
    clearInterval(notificationInterval)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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
  position: relative;
  z-index: 1001;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.mobile-menu-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  margin-right: 10px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info {
  font-size: 14px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
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
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1000;
}

.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 60px;
  height: calc(100vh - 60px);
  z-index: 1000;
}

.sidebar-collapsed {
  transform: translateX(-100%);
}

.sidebar-overlay {
  transform: translateX(0);
}

.sidebar-mask {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item-group__title) {
  padding: 12px 0 8px 20px;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sidebar-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background: #f7fafc;
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0;
}

.sidebar-menu .el-menu-item.is-active .el-icon {
  color: white;
}

.sidebar-menu :deep(.el-menu-item-group) {
  margin-bottom: 10px;
}

.main-content {
  background: #f7fafc;
  padding: 20px;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 15px;
    height: 60px;
  }
  
  .header-left {
    gap: 10px;
  }
  
  .title {
    font-size: 18px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .main-content {
    padding: 15px 10px;
  }
  
  .sidebar {
    width: 200px !important;
  }

  .sidebar-menu .el-menu-item {
    height: 50px;
    line-height: 50px;
    font-size: 14px;
  }

  .sidebar-menu :deep(.el-menu-item-group__title) {
    padding: 10px 0 6px 15px;
    font-size: 11px;
  }

  .user-info {
    display: none;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 10px;
  }
  
  .title {
    font-size: 16px;
  }
  
  .header-right {
    gap: 5px;
  }
  
  .main-content {
    padding: 10px 8px;
  }
  
  .sidebar {
    width: 180px !important;
  }
}
</style>