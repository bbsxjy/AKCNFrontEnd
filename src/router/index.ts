import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessRoute, type UserRole } from '@/utils/permissions'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '仪表盘', roles: ['admin', 'manager', 'editor', 'viewer'] }
        },
        {
          path: 'applications',
          name: 'Applications',
          component: () => import('@/views/ApplicationsView.vue'),
          meta: { title: '应用管理', roles: ['admin', 'manager', 'editor', 'viewer'] }
        },
        {
          path: 'my-tasks',
          name: 'MyTasks',
          component: () => import('@/views/MyTasksView.vue'),
          meta: { title: '我的任务', roles: ['admin', 'manager', 'editor'] }
        },
        {
          path: 'subtasks/:id',
          name: 'SubTasks',
          component: () => import('@/views/SubTasksView.vue'),
          meta: { title: '子任务管理', roles: ['admin', 'manager', 'editor'] }
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('@/views/AuditView.vue'),
          meta: { title: '审计日志', roles: ['admin'] }  // Only admin
        },
        {
          path: 'import',
          name: 'Import',
          component: () => import('@/views/ImportView.vue'),
          meta: { title: '批量导入', roles: ['admin', 'manager'] }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/ReportsView.vue'),
          meta: { title: '报表中心', roles: ['admin', 'manager', 'viewer'] }
        },
        {
          path: 'user-management',
          name: 'UserManagement',
          component: () => import('@/views/UserManagementView.vue'),
          meta: { title: '用户管理', roles: ['admin'] }  // Only admin
        },
        {
          path: 'announcements',
          name: 'Announcements',
          component: () => import('@/views/AnnouncementsView.vue'),
          meta: { title: '公告管理', roles: ['admin', 'manager'] }
        },
        {
          path: 'mcp-agent',
          name: 'MCPAgent',
          component: () => import('@/views/MCPAgentView.vue'),
          meta: { title: 'MCP助手', roles: ['admin', 'manager', 'editor', 'viewer'] }
        },
        {
          path: 'cloud-native',
          name: 'CloudNative',
          component: () => import('@/views/CloudNativeView.vue'),
          meta: { title: '云原生改造成果', roles: ['admin', 'manager', 'viewer'] }
        }
      ]
    }
  ]
})

// Navigation guard for role-based access control
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const userRole = authStore.userRole as UserRole

  // Check if route has role restrictions
  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as UserRole[]

    if (!allowedRoles.includes(userRole)) {
      ElMessage.warning('您没有权限访问此页面')
      // Redirect to dashboard
      next({ name: 'Dashboard' })
      return
    }
  }

  // Check using permission utility
  if (to.name && !canAccessRoute(userRole, to.name as string)) {
    ElMessage.warning('您没有权限访问此页面')
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router