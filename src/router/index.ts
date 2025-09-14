import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

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
          meta: { title: '仪表盘' }
        },
        {
          path: 'applications',
          name: 'Applications',
          component: () => import('@/views/ApplicationsView.vue'),
          meta: { title: '应用管理' }
        },
        {
          path: 'my-tasks',
          name: 'MyTasks',
          component: () => import('@/views/MyTasksView.vue'),
          meta: { title: '我的任务' }
        },
        {
          path: 'subtasks/:id',
          name: 'SubTasks',
          component: () => import('@/views/SubTasksView.vue'),
          meta: { title: '子任务管理' }
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('@/views/AuditView.vue'),
          meta: { title: '审计日志' }
        },
        {
          path: 'import',
          name: 'Import',
          component: () => import('@/views/ImportView.vue'),
          meta: { title: '批量导入' }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/ReportsView.vue'),
          meta: { title: '报表中心' }
        }
      ]
    }
  ]
})

export default router