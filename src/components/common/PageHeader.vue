<template>
  <div class="page-header">
    <div class="header-left">
      <h1 v-if="title" class="header-title">{{ title }}</h1>
      <div v-if="subtitle" class="header-subtitle">{{ subtitle }}</div>
    </div>
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  flex: 1;
}

.header-title {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 24px;
  font-weight: 600;
}

.header-subtitle {
  color: #718096;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>