<template>
  <GenericDetailRenderer :data="data" :metadata="metadata" />
</template>

<script setup lang="ts">
import GenericDetailRenderer from './GenericDetailRenderer.vue'
import type { MCPMetadata } from '@/utils/mcpRenderTypeDetector'

interface Props {
  data: any
  metadata: MCPMetadata
}

defineProps<Props>()
</script>
