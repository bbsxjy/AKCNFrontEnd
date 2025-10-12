/**
 * Element Plus Icon Mapping
 * 将后端返回的图标名称字符串映射到 Element Plus 图标组件
 */

import {
  Odometer,
  Document,
  User,
  Search,
  Upload,
  PieChart,
  Setting,
  BellFilled,
  ChatDotRound
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

// 图标映射表
const iconMap: Record<string, Component> = {
  'odometer': Odometer,
  'document': Document,
  'user': User,
  'search': Search,
  'upload': Upload,
  'pie-chart': PieChart,
  'setting': Setting,
  'bell-filled': BellFilled,
  'chat-dot-round': ChatDotRound
}

/**
 * 根据图标名称获取对应的 Element Plus 图标组件
 * @param iconName 图标名称字符串
 * @returns Element Plus 图标组件，如果未找到则返回默认图标
 */
export function getIconComponent(iconName: string): Component {
  return iconMap[iconName] || Document // 默认使用 Document 图标
}

/**
 * 导出所有图标组件供外部使用
 */
export const Icons = {
  Odometer,
  Document,
  User,
  Search,
  Upload,
  PieChart,
  Setting,
  BellFilled,
  ChatDotRound
}
