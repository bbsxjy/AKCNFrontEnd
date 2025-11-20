# 我的任务 - 派发通知显示功能

## 1. 在MyTasksView.vue导入部分添加（约第238行）

```typescript
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { SubTasksAPI } from '@/api/subtasks'
import { DashboardAPI } from '@/api/dashboard'
import { NotificationsAPI } from '@/api/notifications'  // 添加这一行
import { useAuthStore } from '@/stores/auth'
```

## 2. 添加通知相关状态（约第269行）

```typescript
const loading = ref(false)
const unreadNotifications = ref<any[]>([])  // 添加这一行
const showNotificationAlert = ref(true)     // 添加这一行
```

## 3. 添加加载通知函数（约第403行之后）

```typescript
const loadMyTasks = async () => {
  try {
    loading.value = true
    // ... 现有代码 ...
  } finally {
    loading.value = false
  }
}

// 添加加载派发通知函数
const loadDispatchNotifications = async () => {
  try {
    const notifications = await NotificationsAPI.getNotifications({
      unread_only: true,
      limit: 10
    })

    // 过滤出任务派发类型的通知
    unreadNotifications.value = notifications.items.filter(
      (notif: any) => notif.type === 'task_assignment'
    )
  } catch (error) {
    console.error('Failed to load notifications:', error)
    unreadNotifications.value = []
  }
}

// 标记通知为已读
const markNotificationAsRead = async (notificationId: number) => {
  try {
    await NotificationsAPI.markAsRead(notificationId)
    await loadDispatchNotifications()
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

// 关闭通知提示
const dismissNotifications = () => {
  showNotificationAlert.value = false
}
```

## 4. 在onMounted中加载通知（约第463行）

```typescript
onMounted(async () => {
  // Load initial data
  await loadMyTasks()
  await loadDispatchNotifications()  // 添加这一行

  // Auto-refresh tasks every 30 seconds (no notification for auto-refresh)
  refreshInterval = setInterval(() => refreshTasks(false), 30000)
})
```

## 5. 在template中添加通知提示区域（约第28行之后，filter-tabs之前）

```html
      </template>

      <!-- Dispatch Notifications Alert -->
      <el-alert
        v-if="unreadNotifications.length > 0 && showNotificationAlert"
        type="info"
        :title="`您有 ${unreadNotifications.length} 条新的任务派发通知`"
        :closable="true"
        show-icon
        class="notification-alert"
        @close="dismissNotifications"
      >
        <div class="notification-list">
          <div
            v-for="notif in unreadNotifications.slice(0, 3)"
            :key="notif.id"
            class="notification-item"
          >
            <div class="notification-content">
              <strong>{{ notif.title }}</strong>
              <p>{{ notif.message }}</p>
              <span class="notification-time">{{ formatDate(notif.created_at) }}</span>
            </div>
            <el-button
              size="small"
              type="primary"
              @click="markNotificationAsRead(notif.id)"
            >
              标记已读
            </el-button>
          </div>
          <div v-if="unreadNotifications.length > 3" class="more-notifications">
            还有 {{ unreadNotifications.length - 3 }} 条通知...
          </div>
        </div>
      </el-alert>

      <!-- Quick Filter Tabs - Loading Skeleton -->
```

## 6. 添加样式（在<style scoped>部分）

```css
.notification-alert {
  margin-bottom: 20px;
}

.notification-list {
  margin-top: 10px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.notification-item:last-child {
  margin-bottom: 0;
}

.notification-content {
  flex: 1;
  margin-right: 15px;
}

.notification-content strong {
  display: block;
  color: #2d3748;
  margin-bottom: 4px;
}

.notification-content p {
  margin: 0;
  color: #4a5568;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #718096;
}

.more-notifications {
  text-align: center;
  padding: 8px;
  color: #667eea;
  font-size: 13px;
}
```

## 完成后的效果

- ✅ 页面顶部显示派发通知提醒
- ✅ 显示最近3条未读派发通知
- ✅ 可以标记单条通知为已读
- ✅ 可以关闭整个通知区域
- ✅ 通知自动刷新（每30秒）
- ✅ 显示通知时间和详细内容

## 后续优化建议

1. 添加通知点击跳转到对应任务详情
2. 添加"全部标记为已读"按钮
3. 支持通知声音/桌面通知
4. 通知分类显示（派发/提醒/告警等）
