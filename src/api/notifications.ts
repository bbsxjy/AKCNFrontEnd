import api from './index'

export interface NotificationListParams {
  unread_only?: boolean
  skip?: number
  limit?: number
}

export interface NotificationListResponse {
  total: number
  unread_count: number
  items: Notification[]
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  created_at: string
  data: Record<string, any>
}

export interface SendNotificationRequest {
  type: string
  title: string
  message: string
  recipients: string[]
  channels: ('email' | 'in_app')[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SendNotificationResponse {
  sent_count: number
  failed_count: number
  notification_id: number
}

export interface MarkAsReadResponse {
  is_read: boolean
  read_at: string
}

export interface MarkAllAsReadResponse {
  updated_count: number
}

export class NotificationsAPI {
  // Get notifications list
  static async getNotifications(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.unread_only !== undefined) queryParams.append('unread_only', params.unread_only.toString())
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/notifications?${queryParams.toString()}`)
    return response.data
  }

  // Mark notification as read
  static async markAsRead(id: number): Promise<MarkAsReadResponse> {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const response = await api.post('/notifications/mark-all-read')
    return response.data
  }

  // Send custom notification
  static async sendNotification(data: SendNotificationRequest): Promise<SendNotificationResponse> {
    const response = await api.post('/notifications/send', data)
    return response.data
  }

  // Get unread count
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications({ unread_only: true, limit: 1 })
      return notifications.unread_count
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }
}