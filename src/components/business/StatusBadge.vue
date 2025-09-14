<template>
  <el-tag 
    :type="tagType" 
    :size="size"
    :class="['status-badge', `status-${status?.toLowerCase().replace(/\s+/g, '-')}`]"
  >
    {{ status }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small'
})

const tagType = computed(() => {
  const statusMap: Record<string, string> = {
    '待启动': '',
    '研发进行中': 'primary',
    '业务上线中': 'warning', 
    '全部完成': 'success',
    '已完成': 'success',
    '存在阻塞': 'danger',
    '阻塞中': 'danger'
  }
  return statusMap[props.status] || 'info'
})
</script>

<style scoped>
.status-badge {
  font-weight: 600;
}

.status-待启动 {
  background: #e2e8f0;
  color: #4a5568;
  border-color: #cbd5e0;
}

.status-研发进行中 {
  background: #bee3f8;
  color: #2c5282;
  border-color: #90cdf4;
}

.status-业务上线中 {
  background: #fef5e7;
  color: #c05621;
  border-color: #f6d55c;
}

.status-全部完成,
.status-已完成 {
  background: #c6f6d5;
  color: #22543d;
  border-color: #9ae6b4;
}

.status-存在阻塞,
.status-阻塞中 {
  background: #fed7d7;
  color: #742a2a;
  border-color: #fc8181;
}
</style>