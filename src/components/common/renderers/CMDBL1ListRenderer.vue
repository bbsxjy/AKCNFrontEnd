<template>
  <GenericListRenderer :data="data" :metadata="metadata" />
</template>

<script setup lang="ts">
import GenericListRenderer from './GenericListRenderer.vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any[]
  metadata: MCPMetadata
}

defineProps<Props>()
</script>
