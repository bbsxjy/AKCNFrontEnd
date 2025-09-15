/**
 * 格式化日期
 */
export const formatDate = (date: string | Date | null, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'

  const dateObj = date instanceof Date ? date : new Date(date)

  if (format === 'YYYY-MM-DD') {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}

/**
 * 获取状态标签类型
 */
export const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    '待启动': '',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '全部完成': 'success',
    '已完成': 'success',
    '存在阻塞': 'danger',
    '阻塞中': 'danger'
  }
  return statusMap[status] || 'info'
}

/**
 * 获取进度条颜色
 */
export const getProgressColor = (progress: number, isDelayed = false, isBlocked = false): string => {
  if (isBlocked) return '#f56565'
  if (isDelayed) return '#f56565'
  if (progress >= 80) return '#48bb78'
  if (progress >= 50) return '#ed8936'
  return '#667eea'
}

/**
 * 计算延期天数
 */
export const calculateDelayDays = (plannedDate: string, currentDate = new Date()): number => {
  const planned = new Date(plannedDate)
  const current = new Date(currentDate)
  const diffTime = current.getTime() - planned.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}