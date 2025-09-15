import { ElMessage } from 'element-plus'

export interface WebSocketMessage {
  type: 'notification' | 'progress_update' | 'status_change' | 'auth' | 'error'
  data?: any
  token?: string
}

export interface NotificationMessage {
  id: number
  title: string
  message: string
  severity: string
  type: string
}

export interface ProgressUpdateMessage {
  application_id: number
  progress_percentage: number
  resource_progress: number
  service_progress: number
  traffic_progress: number
}

export interface StatusChangeMessage {
  entity_type: 'application' | 'subtask'
  entity_id: number
  old_status: string
  new_status: string
}

export type WebSocketEventCallback = (data: any) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private eventHandlers: Map<string, WebSocketEventCallback[]> = new Map()
  private isConnecting = false

  constructor(private wsUrl: string = 'ws://localhost:8000/ws') {}

  // Connect to WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'))
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // Send authentication
          const token = localStorage.getItem('access_token')
          if (token) {
            this.send({
              type: 'auth',
              token
            })
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.isConnecting = false
          this.ws = null
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnection
  }

  // Send message to server
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  // Add event listener
  addEventListener(event: string, callback: WebSocketEventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(callback)
  }

  // Remove event listener
  removeEventListener(event: string, callback: WebSocketEventCallback): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(callback)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.data as NotificationMessage)
        break
      case 'progress_update':
        this.handleProgressUpdate(message.data as ProgressUpdateMessage)
        break
      case 'status_change':
        this.handleStatusChange(message.data as StatusChangeMessage)
        break
      case 'error':
        console.error('WebSocket error:', message.data)
        break
      default:
        console.log('Unknown message type:', message.type)
    }

    // Emit to registered event handlers
    const handlers = this.eventHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message.data))
    }
  }

  // Handle notification message
  private handleNotification(notification: NotificationMessage): void {
    const severityMap = {
      low: 'info',
      medium: 'warning',
      high: 'warning',
      critical: 'error'
    }

    const messageType = severityMap[notification.severity as keyof typeof severityMap] || 'info'
    
    ElMessage({
      type: messageType as any,
      title: notification.title,
      message: notification.message,
      duration: notification.severity === 'critical' ? 0 : 5000,
      showClose: true
    })
  }

  // Handle progress update
  private handleProgressUpdate(update: ProgressUpdateMessage): void {
    console.log('Progress update received:', update)
    // The UI components will listen to this event and update accordingly
  }

  // Handle status change
  private handleStatusChange(change: StatusChangeMessage): void {
    console.log('Status change received:', change)
    // The UI components will listen to this event and update accordingly
  }

  // Handle reconnection
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached')
      ElMessage.error('与服务器的连接已断开，请刷新页面重试')
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()